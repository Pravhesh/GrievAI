import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the .env file.");
  Deno.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

console.log("Fetching complaints from the database...");

const { data, error } = await supabase
  .from("complaints")
  .select("id, status, auto_status, ai_score, created_at")
  .limit(20);

if (error) {
  console.error("Error fetching complaints:", error.message);
  Deno.exit(1);
}

if (data && data.length > 0) {
  console.log(`Found ${data.length} complaints. Here are their details:`);
  console.table(data);
} else {
  console.log("No complaints found in the database.");
}
