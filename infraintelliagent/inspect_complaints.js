const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your .env file.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function inspectComplaints() {
  console.log("Fetching complaints from the database...");

  const { data, error } = await supabase
    .from("complaints")
    .select("*")
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error("Error fetching complaints:", error.message);
    process.exit(1);
  }

  if (data && data.length > 0) {
    console.log(`Found ${data.length} complaints. Here are their details:`);
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log("No complaints found in the database.");
  }
}

inspectComplaints();
