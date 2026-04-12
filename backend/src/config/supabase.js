const { createClient } = require("@supabase/supabase-js");
const env = require("./env");

let supabase = null;

if (env.supabaseUrl && env.supabaseServiceRoleKey) {
  supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey);
}

module.exports = supabase;
