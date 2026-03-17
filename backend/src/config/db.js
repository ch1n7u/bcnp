const { createClient } = require("@supabase/supabase-js");
const env = require("./env");

const supabaseAdmin = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

module.exports = { supabaseAdmin };
