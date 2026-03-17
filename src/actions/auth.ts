"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult, Profile, Role } from "@/lib/types";

export async function getCurrentProfile(): Promise<ActionResult<Profile>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Non authentifié" };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return { data: null, error: "Profil introuvable" };
  }

  return { data: profile as Profile, error: null };
}

export async function requireRole(
  allowedRoles: Role[]
): Promise<ActionResult<Profile>> {
  const result = await getCurrentProfile();
  if (result.error) return result;

  if (!allowedRoles.includes(result.data!.role)) {
    return { data: null, error: "Accès non autorisé" };
  }

  return result;
}

export async function createTranslator(
  email: string,
  fullName: string,
  password: string
): Promise<ActionResult<{ userId: string }>> {
  const profileResult = await requireRole(["superadmin", "admin"]);
  if (profileResult.error) return { data: null, error: profileResult.error };

  if (password.length < 6) {
    return { data: null, error: "Le mot de passe doit contenir au moins 6 caractères" };
  }

  const admin = createAdminClient();
  const currentProfile = profileResult.data!;

  const { data: authUser, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: "translator",
      },
    });

  if (createError) {
    if (createError.message.includes("already been registered")) {
      return { data: null, error: "Un compte avec cet email existe déjà" };
    }
    return { data: null, error: createError.message };
  }

  // Link translator to the admin who created them
  const { error: updateError } = await admin
    .from("profiles")
    .update({ owned_by: currentProfile.id })
    .eq("id", authUser.user.id);

  if (updateError) {
    return { data: null, error: updateError.message };
  }

  return { data: { userId: authUser.user.id }, error: null };
}

export async function deleteTranslator(
  userId: string
): Promise<ActionResult<null>> {
  const profileResult = await requireRole(["superadmin", "admin"]);
  if (profileResult.error) return { data: null, error: profileResult.error };

  const admin = createAdminClient();

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    return { data: null, error: error.message };
  }

  return { data: null, error: null };
}

export async function getMyTranslators(): Promise<ActionResult<Profile[]>> {
  const profileResult = await requireRole(["superadmin", "admin"]);
  if (profileResult.error) return { data: null, error: profileResult.error };

  const profile = profileResult.data!;
  const supabase = await createClient();

  let query = supabase
    .from("profiles")
    .select("*")
    .eq("role", "translator")
    .order("created_at", { ascending: false });

  // Admin sees only their own translators; superadmin sees all
  if (profile.role !== "superadmin") {
    query = query.eq("owned_by", profile.id);
  }

  const { data, error } = await query;

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Profile[], error: null };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
