"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/actions/auth";
import type {
  ActionResult,
  LanguageCode,
  ReadingPlan,
  ReadingPlanWithService,
  TestimonyWithWitness,
  Profile,
} from "@/lib/types";

export interface TranslatorWithLanguage extends Profile {
  reading_language: LanguageCode;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const createPlanSchema = z.object({
  service_id: z.string().uuid("La reunion est requise"),
  testimony_ids: z.array(z.string().uuid()).min(1, "Au moins un temoignage est requis"),
});

// ---------------------------------------------------------------------------
// Admin queries
// ---------------------------------------------------------------------------

export async function getPlans(): Promise<ActionResult<ReadingPlanWithService[]>> {
  const profileResult = await requireRole(["superadmin", "admin"]);
  if (profileResult.error) return { data: null, error: profileResult.error };

  const profile = profileResult.data!;
  const supabase = await createClient();

  let query = supabase
    .from("reading_plans")
    .select("*, service:services(*)")
    .order("created_at", { ascending: false });

  if (profile.role !== "superadmin") {
    query = query.eq("created_by", profile.id);
  }

  const { data, error } = await query;

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as ReadingPlanWithService[], error: null };
}

export async function getPlan(id: string): Promise<
  ActionResult<{
    plan: ReadingPlanWithService;
    testimonies: TestimonyWithWitness[];
    translators: TranslatorWithLanguage[];
  }>
> {
  const profileResult = await requireRole(["superadmin", "admin"]);
  if (profileResult.error) return { data: null, error: profileResult.error };

  const profile = profileResult.data!;
  const supabase = await createClient();

  // Fetch the plan with service info
  let planQuery = supabase
    .from("reading_plans")
    .select("*, service:services(*)")
    .eq("id", id);

  if (profile.role !== "superadmin") {
    planQuery = planQuery.eq("created_by", profile.id);
  }

  const { data: plan, error: planError } = await planQuery.single();

  if (planError || !plan) {
    return { data: null, error: "Planning introuvable" };
  }

  // Fetch testimonies in plan order
  const typedPlan = plan as ReadingPlanWithService;
  let testimonies: TestimonyWithWitness[] = [];

  if (typedPlan.testimony_ids.length > 0) {
    const { data: testimonyData, error: testimonyError } = await supabase
      .from("testimonies")
      .select("*, witness:witnesses(id, full_name, language_preference)")
      .in("id", typedPlan.testimony_ids);

    if (!testimonyError && testimonyData) {
      // Sort by the order in testimony_ids
      const orderMap = new Map(
        typedPlan.testimony_ids.map((tid, idx) => [tid, idx])
      );
      testimonies = (testimonyData as TestimonyWithWitness[]).sort(
        (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0)
      );
    }
  }

  // Fetch assigned translators with their reading language
  const { data: assignments } = await supabase
    .from("reading_plan_assignments")
    .select("translator_id, reading_language")
    .eq("plan_id", id);

  let translators: TranslatorWithLanguage[] = [];
  if (assignments && assignments.length > 0) {
    const translatorIds = assignments.map((a) => a.translator_id);
    const { data: translatorData } = await supabase
      .from("profiles")
      .select("*")
      .in("id", translatorIds);

    if (translatorData) {
      const langMap = new Map(
        assignments.map((a) => [a.translator_id, a.reading_language as LanguageCode])
      );
      translators = (translatorData as Profile[]).map((t) => ({
        ...t,
        reading_language: langMap.get(t.id) ?? "mg",
      }));
    }
  }

  return {
    data: { plan: typedPlan, testimonies, translators },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// Admin mutations
// ---------------------------------------------------------------------------

export async function createPlan(
  formData: FormData
): Promise<ActionResult<ReadingPlan>> {
  const profileResult = await requireRole(["superadmin", "admin"]);
  if (profileResult.error) return { data: null, error: profileResult.error };

  const profile = profileResult.data!;

  const serviceId = formData.get("service_id") as string;
  const testimonyIdsRaw = formData.get("testimony_ids") as string;

  let testimonyIds: string[] = [];
  try {
    testimonyIds = JSON.parse(testimonyIdsRaw || "[]");
  } catch {
    return { data: null, error: "Format des temoignages invalide" };
  }

  const parsed = createPlanSchema.safeParse({
    service_id: serviceId,
    testimony_ids: testimonyIds,
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { data: null, error: firstError.message };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reading_plans")
    .insert({
      service_id: parsed.data.service_id,
      created_by: profile.id,
      testimony_ids: parsed.data.testimony_ids,
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  revalidatePath("/admin/plans");
  revalidatePath(`/admin/services/${parsed.data.service_id}`);
  return { data: data as ReadingPlan, error: null };
}

export async function updatePlanOrder(
  id: string,
  testimonyIds: string[]
): Promise<ActionResult> {
  const profileResult = await requireRole(["superadmin", "admin"]);
  if (profileResult.error) return { data: null, error: profileResult.error };

  const profile = profileResult.data!;
  const supabase = await createClient();

  let query = supabase
    .from("reading_plans")
    .update({ testimony_ids: testimonyIds })
    .eq("id", id);

  if (profile.role !== "superadmin") {
    query = query.eq("created_by", profile.id);
  }

  const { error } = await query;

  if (error) {
    return { data: null, error: "Mise a jour impossible" };
  }

  revalidatePath("/admin/plans");
  revalidatePath(`/admin/plans/${id}`);
  return { data: undefined, error: null };
}

export async function deletePlan(id: string): Promise<ActionResult> {
  const profileResult = await requireRole(["superadmin", "admin"]);
  if (profileResult.error) return { data: null, error: profileResult.error };

  const profile = profileResult.data!;
  const supabase = await createClient();

  let query = supabase.from("reading_plans").delete().eq("id", id);

  if (profile.role !== "superadmin") {
    query = query.eq("created_by", profile.id);
  }

  const { error } = await query;

  if (error) {
    return { data: null, error: "Suppression impossible" };
  }

  revalidatePath("/admin/plans");
  return { data: undefined, error: null };
}

export async function assignTranslatorToPlan(
  planId: string,
  translatorId: string,
  readingLanguage: LanguageCode = "mg"
): Promise<ActionResult> {
  const profileResult = await requireRole(["superadmin", "admin"]);
  if (profileResult.error) return { data: null, error: profileResult.error };

  const supabase = await createClient();

  const { error } = await supabase
    .from("reading_plan_assignments")
    .insert({ plan_id: planId, translator_id: translatorId, reading_language: readingLanguage });

  if (error) {
    if (error.code === "23505") {
      return { data: null, error: "Ce traducteur est deja assigne a ce planning" };
    }
    return { data: null, error: error.message };
  }

  revalidatePath(`/admin/plans/${planId}`);
  return { data: undefined, error: null };
}

export async function unassignTranslatorFromPlan(
  planId: string,
  translatorId: string
): Promise<ActionResult> {
  const profileResult = await requireRole(["superadmin", "admin"]);
  if (profileResult.error) return { data: null, error: profileResult.error };

  const supabase = await createClient();

  const { error } = await supabase
    .from("reading_plan_assignments")
    .delete()
    .eq("plan_id", planId)
    .eq("translator_id", translatorId);

  if (error) {
    return { data: null, error: error.message };
  }

  revalidatePath(`/admin/plans/${planId}`);
  return { data: undefined, error: null };
}

// ---------------------------------------------------------------------------
// Translator queries
// ---------------------------------------------------------------------------

export async function getTranslatorPlans(): Promise<
  ActionResult<ReadingPlanWithService[]>
> {
  const profileResult = await requireRole(["superadmin", "translator"]);
  if (profileResult.error) return { data: null, error: profileResult.error };

  const profile = profileResult.data!;
  const supabase = await createClient();

  // Find plans assigned to this translator
  const { data: assignments, error: assignError } = await supabase
    .from("reading_plan_assignments")
    .select("plan_id")
    .eq("translator_id", profile.id);

  if (assignError) {
    return { data: null, error: assignError.message };
  }

  if (!assignments || assignments.length === 0) {
    return { data: [], error: null };
  }

  const planIds = assignments.map((a) => a.plan_id);

  const { data: plans, error: plansError } = await supabase
    .from("reading_plans")
    .select("*, service:services(*)")
    .in("id", planIds)
    .order("created_at", { ascending: false });

  if (plansError) {
    return { data: null, error: plansError.message };
  }

  return { data: plans as ReadingPlanWithService[], error: null };
}

export async function getTranslatorPlan(id: string): Promise<
  ActionResult<{
    plan: ReadingPlanWithService;
    testimonies: TestimonyWithWitness[];
    readingLanguage: LanguageCode;
  }>
> {
  const profileResult = await requireRole(["superadmin", "translator"]);
  if (profileResult.error) return { data: null, error: profileResult.error };

  const profile = profileResult.data!;
  const supabase = await createClient();

  // Verify translator is assigned to this plan and get reading language
  let readingLanguage: LanguageCode = "mg";
  if (profile.role !== "superadmin") {
    const { data: assignment } = await supabase
      .from("reading_plan_assignments")
      .select("id, reading_language")
      .eq("plan_id", id)
      .eq("translator_id", profile.id)
      .single();

    if (!assignment) {
      return { data: null, error: "Acces non autorise" };
    }
    readingLanguage = (assignment.reading_language as LanguageCode) ?? "mg";
  }

  // Fetch plan with service
  const { data: plan, error: planError } = await supabase
    .from("reading_plans")
    .select("*, service:services(*)")
    .eq("id", id)
    .single();

  if (planError || !plan) {
    return { data: null, error: "Planning introuvable" };
  }

  const typedPlan = plan as ReadingPlanWithService;
  let testimonies: TestimonyWithWitness[] = [];

  if (typedPlan.testimony_ids.length > 0) {
    const { data: testimonyData } = await supabase
      .from("testimonies")
      .select("*, witness:witnesses(id, full_name, language_preference)")
      .in("id", typedPlan.testimony_ids);

    if (testimonyData) {
      const orderMap = new Map(
        typedPlan.testimony_ids.map((tid, idx) => [tid, idx])
      );
      testimonies = (testimonyData as TestimonyWithWitness[]).sort(
        (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0)
      );
    }
  }

  return {
    data: { plan: typedPlan, testimonies, readingLanguage },
    error: null,
  };
}
