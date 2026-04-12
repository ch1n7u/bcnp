const { supabaseAdmin } = require("../config/db");

async function findByEmail(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, name, email, role, password_hash, created_at")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

async function findById(id) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, name, email, role, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

async function createUser({ name, email, passwordHash, role = "citizen" }) {
  const normalizedEmail = email.trim().toLowerCase();

  const { data, error } = await supabaseAdmin
    .from("users")
    .insert({
      name: name.trim(),
      email: normalizedEmail,
      password_hash: passwordHash,
      role
    })
    .select("id, name, email, role, created_at")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

async function listUsers() {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, name, email, role, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

module.exports = {
  findByEmail,
  findById,
  createUser,
  listUsers
};
