import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
const usernamePattern = /^[a-z0-9_]{3,24}$/;

const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" }
});

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return reply({ error: "Only POST is supported." }, 405);

  const authorization = request.headers.get("Authorization");
  const tokenMatch = authorization?.match(/^Bearer\s+(\S+)$/i);
  const token = tokenMatch?.[1];
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!token) return reply({ error: "A valid Authorization Bearer token is required." }, 401);
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return reply({ error: "Account service is not configured." }, 500);

  const authClient = createClient(supabaseUrl, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user) return reply({ error: "You must be signed in." }, 401);

  let body: { action?: string; username?: string; password?: string; target_user_id?: string };
  try { body = await request.json(); } catch { return reply({ error: "Invalid request body." }, 400); }
  if (body.action !== "update-self" && body.action !== "rename-user") return reply({ error: "Unknown account action." }, 400);
  if (body.action === "rename-user" && body.password !== undefined) return reply({ error: "Admin username changes cannot set another user's password." }, 403);
  const username = body.username?.trim().toLowerCase() || "";
  if (!usernamePattern.test(username)) return reply({ error: "Use 3-24 lowercase letters, numbers, or underscores." }, 400);
  if (body.password !== undefined && body.password.length < 8) return reply({ error: "Password must be at least 8 characters." }, 400);

  const { data: actor, error: actorError } = await admin.from("medify_profiles").select("id,username,initials,role,is_active").eq("id", authData.user.id).single();
  if (actorError || !actor || !actor.is_active) return reply({ error: "Your active profile could not be verified." }, 403);
  const isCreator = actor.initials === "JA" && actor.role === "creator";
  const targetId = body.action === "rename-user" ? body.target_user_id : authData.user.id;
  if (!targetId || (targetId !== authData.user.id && !isCreator)) return reply({ error: "You may only update your own account." }, 403);
  if (body.action === "rename-user" && targetId === authData.user.id) return reply({ error: "Use your own account form for this username." }, 400);

  const { data: target, error: targetError } = await admin.from("medify_profiles").select("id,username,initials,role,is_active").eq("id", targetId).single();
  if (targetError || !target) return reply({ error: "User account was not found." }, 404);
  const { data: duplicate, error: duplicateError } = await admin.from("medify_profiles").select("id").eq("username", username).neq("id", targetId).maybeSingle();
  if (duplicateError) return reply({ error: "Could not verify username availability." }, 500);
  if (duplicate) return reply({ error: "That username is already in use." }, 409);

  const usernameChanged = target.username !== username;
  if (!usernameChanged && body.password === undefined) return reply({ error: "Enter a new username or password." }, 400);
  if (usernameChanged) {
    const { error: profileUpdateError } = await admin.from("medify_profiles").update({ username }).eq("id", targetId);
    if (profileUpdateError) return reply({ error: profileUpdateError.message }, 409);
  }

  const authChanges: { email?: string; email_confirm?: boolean; password?: string } = {};
  if (usernameChanged) { authChanges.email = `${username}@medify.local`; authChanges.email_confirm = true; }
  if (body.password !== undefined) authChanges.password = body.password;
  const { error: authUpdateError } = await admin.auth.admin.updateUserById(targetId, authChanges);
  if (authUpdateError) {
    if (usernameChanged) await admin.from("medify_profiles").update({ username: target.username }).eq("id", targetId);
    return reply({ error: `Authentication update failed: ${authUpdateError.message}` }, 409);
  }

  const { data: updatedProfile, error: updatedProfileError } = await admin.from("medify_profiles").select("id,username,initials,role,is_active").eq("id", targetId).single();
  if (updatedProfileError || !updatedProfile) return reply({ error: "Account changed, but the updated profile could not be read." }, 500);
  return reply({ profile: updatedProfile });
});
