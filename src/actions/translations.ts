"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/actions/auth";
import type {
  ActionResult,
  AssignmentWithTestimony,
  Translation,
  LanguageCode,
} from "@/lib/types";

// ============================================================
// Validation schemas
// ============================================================

const saveTranslationSchema = z.object({
  testimonyId: z.string().uuid("ID de temoignage invalide"),
  content: z.string(),
  targetLanguage: z.enum(["mg", "fr"]),
});

// ============================================================
// Server Actions
// ============================================================

/**
 * Get all assignments for the current translator, with testimony + witness info.
 */
export async function getMyAssignments(): Promise<
  ActionResult<AssignmentWithTestimony[]>
> {
  const profileResult = await requireRole([
    "translator",
    "superadmin",
    "admin",
  ]);
  if (profileResult.error) return { data: null, error: profileResult.error };

  const profile = profileResult.data!;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("assignments")
    .select(
      "*, testimony:testimonies(*, witness:witnesses(id, full_name, language_preference))"
    )
    .eq("translator_id", profile.id)
    .order("assigned_at", { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as AssignmentWithTestimony[], error: null };
}

/**
 * Get the translation for a specific testimony by this translator.
 */
export async function getTranslation(
  testimonyId: string
): Promise<ActionResult<Translation | null>> {
  const profileResult = await requireRole([
    "translator",
    "superadmin",
    "admin",
  ]);
  if (profileResult.error) return { data: null, error: profileResult.error };

  const profile = profileResult.data!;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("translations")
    .select("*")
    .eq("testimony_id", testimonyId)
    .eq("translator_id", profile.id)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: (data as Translation) ?? null, error: null };
}

/**
 * Upsert translation: create if not exists, update if exists.
 * Also update testimony status to 'in_translation' if currently 'received'.
 */
export async function saveTranslation(
  testimonyId: string,
  content: string,
  targetLanguage: string
): Promise<ActionResult<Translation>> {
  const profileResult = await requireRole([
    "translator",
    "superadmin",
    "admin",
  ]);
  if (profileResult.error) return { data: null, error: profileResult.error };

  const parsed = saveTranslationSchema.safeParse({
    testimonyId,
    content,
    targetLanguage,
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { data: null, error: firstError.message };
  }

  const profile = profileResult.data!;
  const supabase = await createClient();

  // Check that this translator is assigned to this testimony
  const { data: assignment } = await supabase
    .from("assignments")
    .select("id")
    .eq("testimony_id", testimonyId)
    .eq("translator_id", profile.id)
    .maybeSingle();

  if (!assignment) {
    return {
      data: null,
      error: "Vous n'etes pas assigne a ce temoignage",
    };
  }

  // Check if a translation already exists
  const { data: existing } = await supabase
    .from("translations")
    .select("id")
    .eq("testimony_id", testimonyId)
    .eq("translator_id", profile.id)
    .maybeSingle();

  let translation: Translation;

  if (existing) {
    // Update existing translation
    const { data, error } = await supabase
      .from("translations")
      .update({
        content,
        target_language: targetLanguage as LanguageCode,
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    translation = data as Translation;
  } else {
    // Create new translation
    const { data, error } = await supabase
      .from("translations")
      .insert({
        testimony_id: testimonyId,
        translator_id: profile.id,
        content,
        target_language: targetLanguage as LanguageCode,
      })
      .select("*")
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    translation = data as Translation;
  }

  // Update testimony status to 'in_translation' if currently 'received'
  const { data: testimony } = await supabase
    .from("testimonies")
    .select("status")
    .eq("id", testimonyId)
    .single();

  if (testimony && testimony.status === "received") {
    await supabase
      .from("testimonies")
      .update({ status: "in_translation" })
      .eq("id", testimonyId);
  }

  return { data: translation, error: null };
}

/**
 * Mark a testimony as translated (translation complete).
 */
export async function markTranslationComplete(
  testimonyId: string
): Promise<ActionResult> {
  const profileResult = await requireRole([
    "translator",
    "superadmin",
    "admin",
  ]);
  if (profileResult.error) return { data: null, error: profileResult.error };

  const profile = profileResult.data!;
  const supabase = await createClient();

  // Verify the translator is assigned
  const { data: assignment } = await supabase
    .from("assignments")
    .select("id")
    .eq("testimony_id", testimonyId)
    .eq("translator_id", profile.id)
    .maybeSingle();

  if (!assignment) {
    return {
      data: null,
      error: "Vous n'etes pas assigne a ce temoignage",
    };
  }

  // Verify a translation exists and has content
  const { data: translation } = await supabase
    .from("translations")
    .select("id, content")
    .eq("testimony_id", testimonyId)
    .eq("translator_id", profile.id)
    .maybeSingle();

  if (!translation || !translation.content?.trim()) {
    return {
      data: null,
      error: "La traduction est vide. Veuillez saisir du contenu avant de marquer comme traduit.",
    };
  }

  // Update testimony status to 'translated'
  const { error } = await supabase
    .from("testimonies")
    .update({ status: "translated" })
    .eq("id", testimonyId);

  if (error) {
    return { data: null, error: error.message };
  }

  revalidatePath("/translator/testimonies");
  revalidatePath(`/translator/testimonies/${testimonyId}`);
  revalidatePath("/translator/dashboard");
  return { data: undefined, error: null };
}
