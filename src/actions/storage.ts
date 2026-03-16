"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/actions/auth";
import type { ActionResult } from "@/lib/types";

export async function uploadAudio(
  formData: FormData
): Promise<ActionResult<{ url: string }>> {
  const profileResult = await requireRole(["superadmin", "admin"]);
  if (profileResult.error) return { data: null, error: profileResult.error };

  const file = formData.get("file") as File | null;
  if (!file) {
    return { data: null, error: "Aucun fichier sélectionné" };
  }

  const allowedTypes = [
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/webm",
    "audio/ogg",
    "audio/mp4",
    "audio/m4a",
    "audio/x-m4a",
  ];

  if (!allowedTypes.includes(file.type)) {
    return { data: null, error: "Format audio non supporté" };
  }

  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    return { data: null, error: "Le fichier est trop volumineux (max 50 Mo)" };
  }

  const supabase = await createClient();
  const profile = profileResult.data!;
  const ext = file.name.split(".").pop() || "mp3";
  const fileName = `${profile.id}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("audio")
    .upload(fileName, file);

  if (uploadError) {
    return { data: null, error: uploadError.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("audio").getPublicUrl(fileName);

  return { data: { url: publicUrl }, error: null };
}

export async function deleteAudio(url: string): Promise<ActionResult> {
  const profileResult = await requireRole(["superadmin", "admin"]);
  if (profileResult.error) return { data: null, error: profileResult.error };

  const supabase = await createClient();

  // Extract path from URL
  const urlObj = new URL(url);
  const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/audio\/(.+)/);
  if (!pathMatch) {
    return { data: null, error: "URL invalide" };
  }

  const { error } = await supabase.storage
    .from("audio")
    .remove([pathMatch[1]]);

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: undefined, error: null };
}
