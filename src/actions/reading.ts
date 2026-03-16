"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/actions/auth";
import type { ActionResult, ReadingOccasion } from "@/lib/types";

// ---------------------------------------------------------------------------
// markAsRead — called when advancing to the next testimony in reunion mode
// ---------------------------------------------------------------------------

export async function markAsRead(
  testimonyId: string,
  serviceId: string,
  planId: string
): Promise<ActionResult> {
  const profileResult = await getCurrentProfile();
  if (profileResult.error) return { data: null, error: profileResult.error };

  const profile = profileResult.data!;
  const supabase = await createClient();

  // Insert reading occasion with status 'read'
  const { error: insertError } = await supabase
    .from("reading_occasions")
    .insert({
      testimony_id: testimonyId,
      service_id: serviceId,
      plan_id: planId,
      read_by: profile.id,
      status: "read",
    });

  if (insertError) {
    return { data: null, error: insertError.message };
  }

  // Update testimony status to 'read' if not already 'read'
  const { error: updateError } = await supabase
    .from("testimonies")
    .update({ status: "read" })
    .eq("id", testimonyId)
    .neq("status", "read");

  if (updateError) {
    // Non-critical: the reading occasion was still recorded
    console.error("Failed to update testimony status:", updateError.message);
  }

  return { data: undefined, error: null };
}

// ---------------------------------------------------------------------------
// markAsSkipped — called when skipping a testimony in reunion mode
// ---------------------------------------------------------------------------

export async function markAsSkipped(
  testimonyId: string,
  serviceId: string,
  planId: string
): Promise<ActionResult> {
  const profileResult = await getCurrentProfile();
  if (profileResult.error) return { data: null, error: profileResult.error };

  const profile = profileResult.data!;
  const supabase = await createClient();

  const { error } = await supabase.from("reading_occasions").insert({
    testimony_id: testimonyId,
    service_id: serviceId,
    plan_id: planId,
    read_by: profile.id,
    status: "skipped",
  });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: undefined, error: null };
}

// ---------------------------------------------------------------------------
// getReadingHistory — returns all reading occasions for a plan
// ---------------------------------------------------------------------------

export async function getReadingHistory(
  planId: string
): Promise<ActionResult<ReadingOccasion[]>> {
  const profileResult = await getCurrentProfile();
  if (profileResult.error) return { data: null, error: profileResult.error };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reading_occasions")
    .select("*")
    .eq("plan_id", planId)
    .order("read_at", { ascending: true });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as ReadingOccasion[], error: null };
}
