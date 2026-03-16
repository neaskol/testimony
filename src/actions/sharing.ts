"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/actions/auth";
import type { ActionResult, Profile, TestimonyShare } from "@/lib/types";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getAdminsForSharing(): Promise<ActionResult<Profile[]>> {
  const profileResult = await requireRole(["superadmin", "admin"]);
  if (profileResult.error) return { data: null, error: profileResult.error };

  const profile = profileResult.data!;
  const supabase = await createClient();

  // Get all admins except the current user
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .in("role", ["admin", "superadmin"])
    .neq("id", profile.id)
    .order("full_name", { ascending: true });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Profile[], error: null };
}

export async function getTestimonyShares(
  testimonyId: string
): Promise<ActionResult<(TestimonyShare & { shared_with_profile: Profile })[]>> {
  const profileResult = await requireRole(["superadmin", "admin"]);
  if (profileResult.error) return { data: null, error: profileResult.error };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("testimony_shares")
    .select("*, shared_with_profile:profiles!testimony_shares_shared_with_fkey(*)")
    .eq("testimony_id", testimonyId);

  if (error) {
    return { data: null, error: error.message };
  }

  return {
    data: data as (TestimonyShare & { shared_with_profile: Profile })[],
    error: null,
  };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function shareTestimony(
  testimonyId: string,
  targetAdminId: string
): Promise<ActionResult> {
  const profileResult = await requireRole(["superadmin", "admin"]);
  if (profileResult.error) return { data: null, error: profileResult.error };

  const profile = profileResult.data!;
  const supabase = await createClient();

  // Verify the testimony belongs to the current user (or superadmin)
  if (profile.role !== "superadmin") {
    const { data: testimony } = await supabase
      .from("testimonies")
      .select("id")
      .eq("id", testimonyId)
      .eq("owned_by", profile.id)
      .single();

    if (!testimony) {
      return { data: null, error: "Temoignage introuvable" };
    }
  }

  const { error } = await supabase.from("testimony_shares").insert({
    testimony_id: testimonyId,
    shared_by: profile.id,
    shared_with: targetAdminId,
  });

  if (error) {
    if (error.code === "23505") {
      return { data: null, error: "Ce temoignage est deja partage avec cet administrateur" };
    }
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/testimonies");
  revalidatePath(`/admin/testimonies/${testimonyId}`);
  return { data: undefined, error: null };
}

export async function unshareTestimony(
  testimonyId: string,
  targetAdminId: string
): Promise<ActionResult> {
  const profileResult = await requireRole(["superadmin", "admin"]);
  if (profileResult.error) return { data: null, error: profileResult.error };

  const profile = profileResult.data!;
  const supabase = await createClient();

  // Verify the testimony belongs to the current user (or superadmin)
  if (profile.role !== "superadmin") {
    const { data: testimony } = await supabase
      .from("testimonies")
      .select("id")
      .eq("id", testimonyId)
      .eq("owned_by", profile.id)
      .single();

    if (!testimony) {
      return { data: null, error: "Temoignage introuvable" };
    }
  }

  const { error } = await supabase
    .from("testimony_shares")
    .delete()
    .eq("testimony_id", testimonyId)
    .eq("shared_with", targetAdminId);

  if (error) {
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/testimonies");
  revalidatePath(`/admin/testimonies/${testimonyId}`);
  return { data: undefined, error: null };
}
