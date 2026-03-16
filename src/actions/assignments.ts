"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/actions/auth";
import type { ActionResult, Assignment } from "@/lib/types";

// ============================================================
// Validation schemas
// ============================================================

const assignSchema = z.object({
  testimonyId: z.string().uuid("ID de temoignage invalide"),
  translatorId: z.string().uuid("ID de traducteur invalide"),
});

// ============================================================
// Server Actions
// ============================================================

/**
 * Assign a testimony to a translator.
 * Creates the assignment and updates the testimony status to 'in_translation'.
 */
export async function assignTestimony(
  testimonyId: string,
  translatorId: string
): Promise<ActionResult<Assignment>> {
  const profileResult = await requireRole(["superadmin", "admin"]);
  if (profileResult.error) return { data: null, error: profileResult.error };

  const parsed = assignSchema.safeParse({ testimonyId, translatorId });
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0].message };
  }

  const profile = profileResult.data!;
  const supabase = await createClient();

  // Verify the translator exists and belongs to this admin (if admin)
  const { data: translator } = await supabase
    .from("profiles")
    .select("id, role, owned_by")
    .eq("id", translatorId)
    .eq("role", "translator")
    .single();

  if (!translator) {
    return { data: null, error: "Traducteur introuvable" };
  }

  if (
    profile.role === "admin" &&
    translator.owned_by !== profile.id
  ) {
    return {
      data: null,
      error: "Ce traducteur ne vous appartient pas",
    };
  }

  // Verify the testimony exists and belongs to this admin (if admin)
  const { data: testimony } = await supabase
    .from("testimonies")
    .select("id, owned_by, status")
    .eq("id", testimonyId)
    .single();

  if (!testimony) {
    return { data: null, error: "Temoignage introuvable" };
  }

  if (profile.role === "admin" && testimony.owned_by !== profile.id) {
    return {
      data: null,
      error: "Ce temoignage ne vous appartient pas",
    };
  }

  // Create the assignment
  const { data, error } = await supabase
    .from("assignments")
    .insert({
      testimony_id: testimonyId,
      translator_id: translatorId,
      assigned_by: profile.id,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        data: null,
        error: "Ce traducteur est deja assigne a ce temoignage",
      };
    }
    return { data: null, error: error.message };
  }

  // Update testimony status to 'in_translation' if currently 'received'
  if (testimony.status === "received") {
    await supabase
      .from("testimonies")
      .update({ status: "in_translation" })
      .eq("id", testimonyId);
  }

  revalidatePath("/admin/testimonies");
  revalidatePath(`/admin/testimonies/${testimonyId}`);
  revalidatePath("/translator/testimonies");
  revalidatePath("/translator/dashboard");
  return { data: data as Assignment, error: null };
}

/**
 * Remove a testimony assignment from a translator.
 */
export async function unassignTestimony(
  testimonyId: string,
  translatorId: string
): Promise<ActionResult> {
  const profileResult = await requireRole(["superadmin", "admin"]);
  if (profileResult.error) return { data: null, error: profileResult.error };

  const parsed = assignSchema.safeParse({ testimonyId, translatorId });
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0].message };
  }

  const profile = profileResult.data!;
  const supabase = await createClient();

  // Build the delete query
  let query = supabase
    .from("assignments")
    .delete()
    .eq("testimony_id", testimonyId)
    .eq("translator_id", translatorId);

  // If admin (not superadmin), scope to own assignments
  if (profile.role === "admin") {
    query = query.eq("assigned_by", profile.id);
  }

  const { error } = await query;

  if (error) {
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/testimonies");
  revalidatePath(`/admin/testimonies/${testimonyId}`);
  revalidatePath("/translator/testimonies");
  revalidatePath("/translator/dashboard");
  return { data: undefined, error: null };
}

/**
 * List all assignments for a specific testimony.
 */
export async function getTestimonyAssignments(
  testimonyId: string
): Promise<ActionResult<(Assignment & { translator: { id: string; full_name: string; email: string } })[]>> {
  const profileResult = await requireRole(["superadmin", "admin"]);
  if (profileResult.error) return { data: null, error: profileResult.error };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("assignments")
    .select("*, translator:profiles!translator_id(id, full_name, email)")
    .eq("testimony_id", testimonyId)
    .order("assigned_at", { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as (Assignment & { translator: { id: string; full_name: string; email: string } })[], error: null };
}
