"use server";

import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/actions/auth";
import type { ActionResult, LanguageCode } from "@/lib/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================================
// Language Detection
// ============================================================

export async function detectLanguage(
  text: string
): Promise<ActionResult<LanguageCode>> {
  if (!text.trim() || text.trim().length < 10) {
    return { data: "fr", error: null };
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            'You are a language detector. You ONLY respond with "fr" for French or "mg" for Malagasy. Nothing else.',
        },
        {
          role: "user",
          content: `Detect the language of this text:\n\n${text.slice(0, 500)}`,
        },
      ],
      max_tokens: 5,
      temperature: 0,
    });

    const result = response.choices[0]?.message?.content?.trim().toLowerCase();

    if (result === "mg" || result === "fr") {
      return { data: result, error: null };
    }

    return { data: "fr", error: null };
  } catch {
    return { data: "fr", error: null };
  }
}

// ============================================================
// Summary Generation
// ============================================================

export async function generateSummary(
  content: string,
  sourceLanguage: LanguageCode
): Promise<ActionResult<string>> {
  if (!content.trim() || content.trim().length < 20) {
    return { data: null, error: "Contenu trop court pour un résumé" };
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Tu es un assistant d'église qui résume des témoignages de foi.
Résume le témoignage suivant en 2-3 phrases courtes en français.
Garde le ton respectueux et fidèle au message original.
${sourceLanguage === "mg" ? "Le texte est en malgache, traduis le résumé en français." : ""}
Ne commence pas par "Ce témoignage..." ou "Le témoin...". Commence directement par le contenu.`,
        },
        {
          role: "user",
          content: content.slice(0, 2000),
        },
      ],
      max_tokens: 150,
      temperature: 0.3,
    });

    const summary = response.choices[0]?.message?.content?.trim();

    if (!summary) {
      return { data: null, error: "Impossible de générer le résumé" };
    }

    return { data: summary, error: null };
  } catch {
    return { data: null, error: "Erreur lors de la génération du résumé" };
  }
}

// ============================================================
// Semantic Search
// ============================================================

export async function semanticSearch(
  query: string
): Promise<ActionResult<string[]>> {
  const profileResult = await requireRole(["superadmin", "admin"]);
  if (profileResult.error) return { data: null, error: profileResult.error };

  const profile = profileResult.data!;
  const supabase = await createClient();

  // Fetch recent testimonies with content
  let dbQuery = supabase
    .from("testimonies")
    .select("id, content, witness:witnesses(full_name)")
    .not("content", "is", null)
    .order("created_at", { ascending: false })
    .limit(100);

  if (profile.role !== "superadmin") {
    dbQuery = dbQuery.eq("owned_by", profile.id);
  }

  const { data: testimonies, error: dbError } = await dbQuery;

  if (dbError || !testimonies || testimonies.length === 0) {
    return { data: [], error: null };
  }

  // Build context for AI
  const testimonyList = testimonies
    .map((t, i) => {
      const w = t.witness as { full_name: string }[] | { full_name: string } | null;
      const witnessName = Array.isArray(w)
        ? w[0]?.full_name ?? "Anonyme"
        : w?.full_name ?? "Anonyme";
      const content = (t.content ?? "").slice(0, 200);
      return `[${i}] ${witnessName}: ${content}`;
    })
    .join("\n");

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Tu es un assistant de recherche pour des témoignages d'église.
L'utilisateur cherche des témoignages correspondant à sa requête.
Renvoie UNIQUEMENT les numéros d'index des témoignages pertinents, séparés par des virgules.
Si aucun ne correspond, renvoie "AUCUN".
Maximum 10 résultats.`,
        },
        {
          role: "user",
          content: `Requête : "${query}"\n\nTémoignages :\n${testimonyList}`,
        },
      ],
      max_tokens: 100,
      temperature: 0,
    });

    const result = response.choices[0]?.message?.content?.trim();

    if (!result || result === "AUCUN") {
      return { data: [], error: null };
    }

    const indices = result
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n >= 0 && n < testimonies.length);

    const matchedIds = indices.map((i) => testimonies[i].id);

    return { data: matchedIds, error: null };
  } catch {
    return { data: null, error: "Erreur lors de la recherche intelligente" };
  }
}
