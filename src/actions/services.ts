"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/actions/auth";
import type { ActionResult, Service, ReadingPlan } from "@/lib/types";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const serviceSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  service_date: z.string().min(1, "La date de la reunion est requise"),
  subject: z.string().optional(),
  inspiration: z.string().optional(),
  scriptures: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getServices(): Promise<ActionResult<Service[]>> {
  const profileResult = await requireRole(["superadmin", "admin"]);
  if (profileResult.error) return { data: null, error: profileResult.error };

  const profile = profileResult.data!;
  const supabase = await createClient();

  let query = supabase
    .from("services")
    .select("*")
    .order("service_date", { ascending: false });

  // Superadmin sees all, admin sees only their own
  if (profile.role !== "superadmin") {
    query = query.eq("created_by", profile.id);
  }

  const { data, error } = await query;

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Service[], error: null };
}

export async function getService(
  id: string
): Promise<ActionResult<Service>> {
  const profileResult = await requireRole(["superadmin", "admin"]);
  if (profileResult.error) return { data: null, error: profileResult.error };

  const profile = profileResult.data!;
  const supabase = await createClient();

  let query = supabase.from("services").select("*").eq("id", id);

  if (profile.role !== "superadmin") {
    query = query.eq("created_by", profile.id);
  }

  const { data, error } = await query.single();

  if (error) {
    return { data: null, error: "Fiche reunion introuvable" };
  }

  return { data: data as Service, error: null };
}

export async function getServicePlans(
  serviceId: string
): Promise<ActionResult<ReadingPlan[]>> {
  const profileResult = await requireRole(["superadmin", "admin"]);
  if (profileResult.error) return { data: null, error: profileResult.error };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reading_plans")
    .select("*")
    .eq("service_id", serviceId)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as ReadingPlan[], error: null };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createService(
  formData: FormData
): Promise<ActionResult<Service>> {
  const profileResult = await requireRole(["superadmin", "admin"]);
  if (profileResult.error) return { data: null, error: profileResult.error };

  const profile = profileResult.data!;

  const raw = {
    title: formData.get("title") as string,
    service_date: formData.get("service_date") as string,
    subject: formData.get("subject") as string,
    inspiration: formData.get("inspiration") as string,
    scriptures: formData.get("scriptures") as string,
  };

  const parsed = serviceSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { data: null, error: firstError.message };
  }

  const { title, service_date, subject, inspiration, scriptures } = parsed.data;

  const scripturesArray = scriptures
    ? scriptures
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("services")
    .insert({
      title,
      service_date,
      subject: subject || null,
      inspiration: inspiration || null,
      scriptures: scripturesArray,
      created_by: profile.id,
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/services");
  return { data: data as Service, error: null };
}

export async function updateService(
  id: string,
  formData: FormData
): Promise<ActionResult<Service>> {
  const profileResult = await requireRole(["superadmin", "admin"]);
  if (profileResult.error) return { data: null, error: profileResult.error };

  const profile = profileResult.data!;

  const raw = {
    title: formData.get("title") as string,
    service_date: formData.get("service_date") as string,
    subject: formData.get("subject") as string,
    inspiration: formData.get("inspiration") as string,
    scriptures: formData.get("scriptures") as string,
  };

  const parsed = serviceSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { data: null, error: firstError.message };
  }

  const { title, service_date, subject, inspiration, scriptures } = parsed.data;

  const scripturesArray = scriptures
    ? scriptures
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const supabase = await createClient();

  let query = supabase
    .from("services")
    .update({
      title,
      service_date,
      subject: subject || null,
      inspiration: inspiration || null,
      scriptures: scripturesArray,
    })
    .eq("id", id);

  if (profile.role !== "superadmin") {
    query = query.eq("created_by", profile.id);
  }

  const { data, error } = await query.select().single();

  if (error) {
    return { data: null, error: "Mise à jour impossible" };
  }

  revalidatePath("/admin/services");
  revalidatePath(`/admin/services/${id}`);
  return { data: data as Service, error: null };
}

export async function deleteService(
  id: string
): Promise<ActionResult> {
  const profileResult = await requireRole(["superadmin", "admin"]);
  if (profileResult.error) return { data: null, error: profileResult.error };

  const profile = profileResult.data!;
  const supabase = await createClient();

  let query = supabase.from("services").delete().eq("id", id);

  if (profile.role !== "superadmin") {
    query = query.eq("created_by", profile.id);
  }

  const { error } = await query;

  if (error) {
    return { data: null, error: "Suppression impossible" };
  }

  revalidatePath("/admin/services");
  return { data: undefined, error: null };
}
