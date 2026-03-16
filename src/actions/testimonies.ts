"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/actions/auth";
import type {
  ActionResult,
  TestimonyStatus,
  TestimonyWithWitness,
  TestimonyWithTranslation,
} from "@/lib/types";

// ============================================================
// Validation schemas
// ============================================================

const createTestimonySchema = z.object({
  witness_id: z.string().uuid().optional(),
  witness_name: z.string().optional(),
  content: z.string().min(1, "Le contenu est requis"),
  source_language: z.enum(["mg", "fr"]),
  received_at: z.string().optional(),
  tags: z.string().optional(),
  private_notes: z.string().optional(),
});

const updateTestimonySchema = z.object({
  witness_id: z.string().uuid().optional(),
  witness_name: z.string().optional(),
  content: z.string().min(1, "Le contenu est requis"),
  source_language: z.enum(["mg", "fr"]),
  tags: z.string().optional(),
  private_notes: z.string().optional(),
});

// ============================================================
// Server Actions
// ============================================================

export async function getTestimonies(filters?: {
  status?: TestimonyStatus;
  witnessId?: string;
  search?: string;
}): Promise<ActionResult<TestimonyWithWitness[]>> {
  const profileResult = await requireRole(["superadmin", "admin"]);
  if (profileResult.error) return { data: null, error: profileResult.error };

  const profile = profileResult.data!;
  const supabase = await createClient();

  let query = supabase
    .from("testimonies")
    .select("*, witness:witnesses(id, full_name, language_preference)")
    .order("created_at", { ascending: false });

  // For non-superadmin, scope to own testimonies
  if (profile.role !== "superadmin") {
    query = query.eq("owned_by", profile.id);
  }

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.witnessId) {
    query = query.eq("witness_id", filters.witnessId);
  }

  if (filters?.search) {
    query = query.ilike("content", `%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as TestimonyWithWitness[], error: null };
}

export async function getTestimony(
  id: string
): Promise<ActionResult<TestimonyWithTranslation>> {
  const profileResult = await requireRole(["superadmin", "admin"]);
  if (profileResult.error) return { data: null, error: profileResult.error };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("testimonies")
    .select(
      "*, witness:witnesses(id, full_name, language_preference), translations(*)"
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return { data: null, error: error?.message ?? "Témoignage introuvable" };
  }

  return { data: data as TestimonyWithTranslation, error: null };
}

export async function createTestimony(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const profileResult = await requireRole(["superadmin", "admin"]);
  if (profileResult.error) return { data: null, error: profileResult.error };

  const profile = profileResult.data!;

  const raw = {
    witness_id: formData.get("witness_id") as string | null,
    witness_name: formData.get("witness_name") as string | null,
    content: formData.get("content") as string,
    source_language: formData.get("source_language") as string,
    received_at: formData.get("received_at") as string | null,
    tags: formData.get("tags") as string | null,
    private_notes: formData.get("private_notes") as string | null,
  };

  const parsed = createTestimonySchema.safeParse({
    ...raw,
    witness_id: raw.witness_id || undefined,
    witness_name: raw.witness_name || undefined,
    received_at: raw.received_at || undefined,
    tags: raw.tags || undefined,
    private_notes: raw.private_notes || undefined,
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { data: null, error: firstError.message };
  }

  const {
    witness_id,
    witness_name,
    content,
    source_language,
    received_at,
    tags,
    private_notes,
  } = parsed.data;

  const supabase = await createClient();

  // Resolve witness: use existing ID, or auto-create from name
  let resolvedWitnessId: string | null = witness_id ?? null;

  if (!resolvedWitnessId && witness_name?.trim()) {
    const trimmedName = witness_name.trim();

    // Check if a witness with this exact name already exists
    let findQuery = supabase
      .from("witnesses")
      .select("id")
      .ilike("full_name", trimmedName)
      .limit(1);

    if (profile.role !== "superadmin") {
      findQuery = findQuery.eq("created_by", profile.id);
    }

    const { data: existing } = await findQuery;

    if (existing && existing.length > 0) {
      resolvedWitnessId = existing[0].id;
    } else {
      // Auto-create witness
      const { data: newWitness, error: witnessError } = await supabase
        .from("witnesses")
        .insert({
          created_by: profile.id,
          full_name: trimmedName,
          language_preference: source_language,
        })
        .select("id")
        .single();

      if (witnessError) {
        return { data: null, error: `Impossible de créer le témoin : ${witnessError.message}` };
      }
      resolvedWitnessId = newWitness.id;
    }
  }

  const tagsArray = tags
    ? tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const insertData: Record<string, unknown> = {
    owned_by: profile.id,
    witness_id: resolvedWitnessId,
    content,
    source_language,
    tags: tagsArray,
    private_notes: private_notes ?? null,
    status: "received",
  };

  // If a received_at date is provided, use it as created_at
  if (received_at) {
    insertData.created_at = new Date(received_at).toISOString();
  }

  const { data, error } = await supabase
    .from("testimonies")
    .insert(insertData)
    .select("id")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/testimonies");
  revalidatePath("/admin/witnesses");
  return { data: { id: data.id }, error: null };
}

export async function updateTestimony(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const profileResult = await requireRole(["superadmin", "admin"]);
  if (profileResult.error) return { data: null, error: profileResult.error };

  const profile = profileResult.data!;

  const raw = {
    witness_id: formData.get("witness_id") as string | null,
    witness_name: formData.get("witness_name") as string | null,
    content: formData.get("content") as string,
    source_language: formData.get("source_language") as string,
    tags: formData.get("tags") as string | null,
    private_notes: formData.get("private_notes") as string | null,
  };

  const parsed = updateTestimonySchema.safeParse({
    ...raw,
    witness_id: raw.witness_id || undefined,
    witness_name: raw.witness_name || undefined,
    tags: raw.tags || undefined,
    private_notes: raw.private_notes || undefined,
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { data: null, error: firstError.message };
  }

  const { witness_id, witness_name, content, source_language, tags, private_notes } =
    parsed.data;

  const supabase = await createClient();

  // Resolve witness: use existing ID, or search/create from name
  let resolvedWitnessId: string | null = witness_id ?? null;

  if (!resolvedWitnessId && witness_name?.trim()) {
    const trimmedName = witness_name.trim();

    let findQuery = supabase
      .from("witnesses")
      .select("id")
      .ilike("full_name", trimmedName)
      .limit(1);

    if (profile.role !== "superadmin") {
      findQuery = findQuery.eq("created_by", profile.id);
    }

    const { data: existing } = await findQuery;

    if (existing && existing.length > 0) {
      resolvedWitnessId = existing[0].id;
    } else {
      const { data: newWitness, error: witnessError } = await supabase
        .from("witnesses")
        .insert({
          created_by: profile.id,
          full_name: trimmedName,
          language_preference: source_language,
        })
        .select("id")
        .single();

      if (witnessError) {
        return { data: null, error: `Impossible de créer le témoin : ${witnessError.message}` };
      }
      resolvedWitnessId = newWitness.id;
    }
  }

  const tagsArray = tags
    ? tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const { error } = await supabase
    .from("testimonies")
    .update({
      witness_id: resolvedWitnessId,
      content,
      source_language,
      tags: tagsArray,
      private_notes: private_notes ?? null,
    })
    .eq("id", id);

  if (error) {
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/testimonies");
  revalidatePath(`/admin/testimonies/${id}`);
  revalidatePath("/admin/witnesses");
  return { data: undefined, error: null };
}

export async function deleteTestimony(id: string): Promise<ActionResult> {
  const profileResult = await requireRole(["superadmin", "admin"]);
  if (profileResult.error) return { data: null, error: profileResult.error };

  const supabase = await createClient();

  const { error } = await supabase.from("testimonies").delete().eq("id", id);

  if (error) {
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/testimonies");
  return { data: undefined, error: null };
}

export async function updateTestimonyStatus(
  id: string,
  status: TestimonyStatus
): Promise<ActionResult> {
  const profileResult = await requireRole(["superadmin", "admin"]);
  if (profileResult.error) return { data: null, error: profileResult.error };

  const validStatuses: TestimonyStatus[] = [
    "received",
    "in_translation",
    "translated",
    "planned",
    "read",
  ];

  if (!validStatuses.includes(status)) {
    return { data: null, error: "Statut invalide" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("testimonies")
    .update({ status })
    .eq("id", id);

  if (error) {
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/testimonies");
  revalidatePath(`/admin/testimonies/${id}`);
  return { data: undefined, error: null };
}
