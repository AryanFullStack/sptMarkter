
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function getEnvValue(key) {
    // Try process.env first (in case it's set in the shell)
    if (process.env[key]) return process.env[key];

    // Try reading .env.local
    try {
        const envLocal = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
        const match = envLocal.match(new RegExp(`^${key}=(.*)$`, 'm'));
        if (match) return match[1].trim().replace(/^["']|["']$/g, '');
    } catch (e) { }

    // Try reading .env
    try {
        const env = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
        const match = env.match(new RegExp(`^${key}=(.*)$`, 'm'));
        if (match) return match[1].trim().replace(/^["']|["']$/g, '');
    } catch (e) { }

    return null;
}

async function diagnose() {
    console.log("--- STARTING DIAGNOSIS ---");

    const url = getEnvValue('NEXT_PUBLIC_SUPABASE_URL');
    const key = getEnvValue('SUPABASE_SERVICE_ROLE_KEY') || getEnvValue('NEXT_PUBLIC_SUPABASE_ANON_KEY');

    if (!url || !key) {
        console.error("❌ CRTICAL ERROR: Could not find Supabase URL or Key in .env or .env.local");
        console.log("Please ensure you have a .env file with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
        return;
    }

    console.log(`✅ Found Supabase URL: ${url}`);
    console.log(`✅ Found Supabase Key: ${key.substring(0, 10)}...`);

    const supabase = createClient(url, key);

    // 1. Check if we can connect to Users
    console.log("\n--- Checking Connection & User Fetch ---");
    const { data: users, error: userError } = await supabase.from('users').select('id').limit(1);

    if (userError) {
        console.error("❌ Error fetching users:", userError);
        return;
    }

    if (!users || users.length === 0) {
        console.warn("⚠️ No users found in 'users' table. Creating a temporary user or skipping address test might be needed.");
        // We can't easily Insert a user without Auth ID usually, unless we disable RLS.
        // Let's assume there is at least one user if the app is being used.
        return;
    }

    const userId = users[0].id;
    console.log(`✅ Verification User ID: ${userId}`);

    // 2. Test Address Insert (Type: SHOP)
    console.log("\n--- Testing 'SHOP' Address Insert ---");
    const testAddress = {
        user_id: userId,
        name: "Test Shop Address",
        phone: "0000000000",
        address_line1: "Test Line 1",
        city: "Test City",
        state: "Test State",
        postal_code: "12345",
        country: "Pakistan",
        address_type: "shop", // <--- THE KEY TEST
        is_default: false
    };

    const { data: addrData, error: addrError } = await supabase.from('addresses').insert(testAddress).select();

    if (addrError) {
        console.error("❌ INSERT FAILED!");
        console.error("Error Message:", addrError.message);
        console.error("Error Code:", addrError.code);
        console.error("Error Details:", addrError.details);

        if (addrError.message && addrError.message.includes('check constraint')) {
            console.log("\n🔥 ROOT CAUSE TRACE:");
            console.log("The database REJECTED the 'shop' address type.");
            console.log("You MUST run the migration SQL command provided in 'FIX_DB_CONSTRAINT.md'!");
        }
    } else {
        console.log("✅ INSERT SUCCESSFUL! 'Shop' address type is accepted.");
        // Clean up
        if (addrData && addrData[0]) {
            await supabase.from('addresses').delete().eq('id', addrData[0].id);
            console.log("✅ Test data cleaned up.");
        }
    }

    console.log("\n--- DIAGNOSIS COMPLETE ---");
}

diagnose();
