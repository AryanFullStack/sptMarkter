
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/ANON_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySchema() {
    console.log("🔍 Verifying 'users' table schema...");

    // Try to select the 'approved' column from a random user
    // We use a query that forces the DB to look for the column
    const { data, error } = await supabase
        .from('users')
        .select('id, approved')
        .limit(1);

    if (error) {
        if (error.code === 'PGRST204' || error.message.includes('upto')) {
            console.error("\n❌ CRITICAL SCHEMA ERROR DETECTED:");
            console.error(`   The database says: "${error.message}"`);
            console.error("   This confirms that the 'approved' column is MISSING from your 'users' table.");
            console.error("\n   ➡ BECAUSE OF THIS, the 'Sign Up' code crashes before it can save your address.");
            console.error("   ➡ FIX: You MUST run the 'database/schema_full.sql' script in Supabase SQL Editor.");
        } else {
            console.error("Database Error:", error);
        }
    } else {
        console.log("✅ 'approved' column exists. The schema looks correct.");
    }
}

verifySchema();
