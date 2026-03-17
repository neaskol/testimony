import { redirect, notFound } from "next/navigation";
import { getCurrentProfile } from "@/actions/auth";
import { getPlan } from "@/actions/plans";
import { getReadingHistory } from "@/actions/reading";
import { createClient } from "@/lib/supabase/server";
import { ReunionView } from "@/components/reunion/reunion-view";
import type { ReunionTestimony, Translation } from "@/lib/types";

interface AdminReunionPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminReunionPage({
  params,
}: AdminReunionPageProps) {
  const { id } = await params;

  // Verify authentication (admin or superadmin)
  const { data: profile, error: profileError } = await getCurrentProfile();
  if (profileError || !profile) redirect("/login");

  if (profile.role !== "admin" && profile.role !== "superadmin") {
    redirect("/login");
  }

  // Fetch plan data (getPlan already checks admin ownership)
  const { data, error } = await getPlan(id);
  if (error || !data) notFound();

  const { plan, testimonies } = data;

  // Fetch FR translations for MG testimonies
  const supabase = await createClient();
  const testimonyIds = testimonies.map((t) => t.id);

  const frTranslationsMap = new Map<string, string>();

  if (testimonyIds.length > 0) {
    const { data: translations } = await supabase
      .from("translations")
      .select("*")
      .in("testimony_id", testimonyIds)
      .eq("target_language", "fr");

    if (translations) {
      for (const t of translations as Translation[]) {
        if (!frTranslationsMap.has(t.testimony_id)) {
          frTranslationsMap.set(t.testimony_id, t.content);
        }
      }
    }
  }

  // Fetch existing reading history to pre-populate statuses
  const { data: readingHistory } = await getReadingHistory(id);
  const readStatusMap = new Map<string, "read" | "skipped">();
  if (readingHistory) {
    for (const occasion of readingHistory) {
      readStatusMap.set(occasion.testimony_id, occasion.status);
    }
  }

  // Build ReunionTestimony array — pasteur reads in FR
  const reunionTestimonies: ReunionTestimony[] = testimonies.map((testimony) => {
    const sourceLanguage = testimony.source_language;

    if (sourceLanguage === "fr") {
      // Original is FR — pasteur reads it directly
      return {
        id: testimony.id,
        witnessName: testimony.witness?.full_name ?? "Temoin anonyme",
        content: testimony.content ?? "",
        sourceLanguage,
        status: readStatusMap.get(testimony.id) ?? "pending",
      };
    }

    // Original is MG — use FR translation if available
    const frTranslation = frTranslationsMap.get(testimony.id);
    if (frTranslation) {
      return {
        id: testimony.id,
        witnessName: testimony.witness?.full_name ?? "Temoin anonyme",
        content: frTranslation,
        originalContent: testimony.content ?? undefined,
        sourceLanguage,
        status: readStatusMap.get(testimony.id) ?? "pending",
      };
    }

    // No FR translation — show MG original (pasteur can still see it)
    return {
      id: testimony.id,
      witnessName: testimony.witness?.full_name ?? "Temoin anonyme",
      content: testimony.content ?? "",
      sourceLanguage,
      status: readStatusMap.get(testimony.id) ?? "pending",
    };
  });

  return (
    <ReunionView
      planId={plan.id}
      serviceId={plan.service.id}
      service={plan.service}
      initialTestimonies={reunionTestimonies}
      backUrl={`/admin/plans/${id}`}
      showOriginalToggle
    />
  );
}
