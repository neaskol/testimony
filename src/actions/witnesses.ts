"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/actions/auth";
import type { ActionResult, Witness } from "@/lib/types";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const witnessSchema = z.object({
  full_name: z
    .string()
    .min(1, "Le nom complet est requis")
    .max(200, "Le nom ne peut pas depasser 200 caracteres"),
  phone: z.string().max(30).optional().default(""),
  city: z.string().max(100).optional().default(""),
  language_preference: z.enum(["mg", "fr"], {
    error: "La langue doit etre mg ou fr",
  }),
  color_tag: z
    .enum(["blue", "green", "red", "yellow", "purple", ""])
    .optional()
    .default(""),
  label: z.string().max(100).optional().default(""),
  private_notes: z.string().max(5000).optional().default(""),
});

function parseFormData(formData: FormData) {
  return witnessSchema.safeParse({
    full_name: formData.get("full_name"),
    phone: formData.get("phone"),
    city: formData.get("city"),
    language_preference: formData.get("language_preference"),
    color_tag: formData.get("color_tag"),
    label: formData.get("label"),
    private_notes: formData.get("private_notes"),
  });
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function searchWitnessesByName(
  query: string
): Promise<ActionResult<Pick<Witness, "id" | "full_name">[]>> {
  const profileResult = await requireRole(["superadmin", "admin"]);
  if (profileResult.error) return { data: null, error: profileResult.error };

  if (!query.trim()) return { data: [], error: null };

  const profile = profileResult.data!;
  const supabase = await createClient();

  let dbQuery = supabase
    .from("witnesses")
    .select("id, full_name")
    .ilike("full_name", `%${query.trim()}%`)
    .order("full_name")
    .limit(8);

  if (profile.role !== "superadmin") {
    dbQuery = dbQuery.eq("created_by", profile.id);
  }

  const { data, error } = await dbQuery;

  if (error) return { data: null, error: error.message };

  return { data: data as Pick<Witness, "id" | "full_name">[], error: null };
}

export async function getWitnesses(): Promise<ActionResult<Witness[]>> {
  const profileResult = await requireRole(["superadmin", "admin"]);
  if (profileResult.error) return { data: null, error: profileResult.error };

  const profile = profileResult.data!;
  const supabase = await createClient();

  let query = supabase
    .from("witnesses")
    .select("*")
    .order("created_at", { ascending: false });

  // Non-superadmins only see their own witnesses
  if (profile.role !== "superadmin") {
    query = query.eq("created_by", profile.id);
  }

  const { data, error } = await query;

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Witness[], error: null };
}

export async function getWitness(id: string): Promise<ActionResult<Witness>> {
  const profileResult = await requireRole(["superadmin", "admin"]);
  if (profileResult.error) return { data: null, error: profileResult.error };

  const profile = profileResult.data!;
  const supabase = await createClient();

  let query = supabase.from("witnesses").select("*").eq("id", id);

  if (profile.role !== "superadmin") {
    query = query.eq("created_by", profile.id);
  }

  const { data, error } = await query.single();

  if (error) {
    return { data: null, error: "Temoin introuvable" };
  }

  return { data: data as Witness, error: null };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createWitness(
  formData: FormData
): Promise<ActionResult<Witness>> {
  const profileResult = await requireRole(["superadmin", "admin"]);
  if (profileResult.error) return { data: null, error: profileResult.error };

  const parsed = parseFormData(formData);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { data: null, error: firstIssue.message };
  }

  const profile = profileResult.data!;
  const supabase = await createClient();
  const values = parsed.data;

  const { data, error } = await supabase
    .from("witnesses")
    .insert({
      created_by: profile.id,
      full_name: values.full_name,
      phone: values.phone || null,
      city: values.city || null,
      language_preference: values.language_preference,
      color_tag: values.color_tag || null,
      label: values.label || null,
      private_notes: values.private_notes || null,
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Witness, error: null };
}

export async function updateWitness(
  id: string,
  formData: FormData
): Promise<ActionResult<Witness>> {
  const profileResult = await requireRole(["superadmin", "admin"]);
  if (profileResult.error) return { data: null, error: profileResult.error };

  const parsed = parseFormData(formData);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { data: null, error: firstIssue.message };
  }

  const profile = profileResult.data!;
  const supabase = await createClient();
  const values = parsed.data;

  let query = supabase
    .from("witnesses")
    .update({
      full_name: values.full_name,
      phone: values.phone || null,
      city: values.city || null,
      language_preference: values.language_preference,
      color_tag: values.color_tag || null,
      label: values.label || null,
      private_notes: values.private_notes || null,
    })
    .eq("id", id);

  if (profile.role !== "superadmin") {
    query = query.eq("created_by", profile.id);
  }

  const { data, error } = await query.select().single();

  if (error) {
    return { data: null, error: "Impossible de mettre a jour le temoin" };
  }

  return { data: data as Witness, error: null };
}

export async function deleteWitness(id: string): Promise<ActionResult> {
  const profileResult = await requireRole(["superadmin", "admin"]);
  if (profileResult.error) return { data: null, error: profileResult.error };

  const profile = profileResult.data!;
  const supabase = await createClient();

  let query = supabase.from("witnesses").delete().eq("id", id);

  if (profile.role !== "superadmin") {
    query = query.eq("created_by", profile.id);
  }

  const { error } = await query;

  if (error) {
    return { data: null, error: "Impossible de supprimer le temoin" };
  }

  return { data: undefined, error: null };
}
