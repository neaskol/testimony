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

export async function inviteTranslator(
  email: string,
  fullName: string
): Promise<ActionResult<{ userId: string }>> {
  const profileResult = await requireRole(["superadmin", "admin"]);
  if (profileResult.error) return { data: null, error: profileResult.error };

  const admin = createAdminClient();
  const currentProfile = profileResult.data!;

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const { data: authUser, error: createError } =
    await admin.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: fullName,
        role: "translator",
      },
      redirectTo: `${siteUrl}/auth/confirm`,
    });

  if (createError) {
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

export async function resendInvitation(
  userId: string
): Promise<ActionResult<null>> {
  const profileResult = await requireRole(["superadmin", "admin"]);
  if (profileResult.error) return { data: null, error: profileResult.error };

  const admin = createAdminClient();
  const currentProfile = profileResult.data!;

  // Get the user to find their email and metadata
  const { data: userData, error: getUserError } =
    await admin.auth.admin.getUserById(userId);

  if (getUserError || !userData.user) {
    return { data: null, error: "Utilisateur introuvable" };
  }

  const email = userData.user.email!;
  const fullName = userData.user.user_metadata?.full_name || "";

  // Delete the existing auth user (profile will cascade-delete)
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    return { data: null, error: deleteError.message };
  }

  // Re-invite with the correct redirect URL
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const { data: authUser, error: inviteError } =
    await admin.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: fullName,
        role: "translator",
      },
      redirectTo: `${siteUrl}/auth/confirm`,
    });

  if (inviteError) {
    return { data: null, error: inviteError.message };
  }

  // Re-link translator to the admin
  const { error: updateError } = await admin
    .from("profiles")
    .update({ owned_by: currentProfile.id })
    .eq("id", authUser.user.id);

  if (updateError) {
    return { data: null, error: updateError.message };
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
