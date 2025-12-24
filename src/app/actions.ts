"use server";

import { encodedRedirect } from "@/utils/utils";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "../supabase/server";
import { createAdminClient } from "../supabase/admin";
import { revalidateTag } from "next/cache";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const fullName = formData.get("full_name")?.toString() || '';
  const phone = formData.get("phone")?.toString() || '';
  const requestedRole = formData.get("role")?.toString() || 'local_customer';
  // FORCE DEFAULT ROLE: All new signups are Local Customers until approved/upgraded by Admin
  const role = 'local_customer'; 
  
  // Address fields
  const addressLine1 = formData.get("address_line1")?.toString();
  const city = formData.get("city")?.toString();
  const state = formData.get("state")?.toString(); // Optional, can be null
  const postalCode = formData.get("postal_code")?.toString();
  const addressType = formData.get("address_type")?.toString() || 'home';

  const supabase = await createClient();
  const origin = headers().get("origin");

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email and password are required",
    );
  }

  const { data: { user }, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        full_name: fullName,
        email: email,
        phone: phone,
        role: role, // Forced to local_customer
        requested_role: requestedRole, // Store what they wanted to be
      }
    },
  });

  console.log("=== Signup Process Started ===");
  console.log(`Email: ${email}, Role: ${role}`);

  if (error) {
    console.error("=== Signup Error ===", error.code, error.message);
    return encodedRedirect("error", "/sign-up", error.message);
  }

  if (!user) {
    console.error("=== Signup Failed: No user returned ===");
    return encodedRedirect("error", "/sign-up", "Failed to create account");
  }

  console.log(`=== User Created: ${user.id} ===`);

  // Use admin client to bypass RLS during signup
  const adminClient = createAdminClient();
  
  if (!adminClient) {
    console.error("FATAL: SUPABASE_SERVICE_ROLE_KEY is missing. Profile and address creation will fail.");
    return encodedRedirect(
      "error", 
      "/sign-up", 
      "Server configuration error. Please contact support."
    );
  }

  try {
    // 1. Create User Profile (UPSERT to handle existing records from failed signups)
    console.log("=== Creating User Profile ===");
    const { error: profileError } = await adminClient
      .from('users')
      .upsert({
        id: user.id,
        full_name: fullName,
        email: email,
        phone: phone,
        role: role,
        approved: role === 'local_customer' ? true : false,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'id'  // Update if user already exists
      });

    if (profileError) {
      console.error('=== CRITICAL: Profile Creation Failed ===', profileError);
      return encodedRedirect(
        "error",
        "/sign-up",
        `Failed to create user profile: ${profileError.message}`
      );
    }

    console.log("✓ User profile created successfully");

    // 2. Save Address (if all required fields are provided)
    if (addressLine1 && city && postalCode) {
      console.log(`=== Saving Initial Address (Type: ${addressType}) ===`);
      
      // Validate address type
      const validAddressTypes = ['home', 'office', 'shop', 'beauty_parlor'];
      if (!validAddressTypes.includes(addressType)) {
        console.error(`Invalid address_type: ${addressType}`);
        return encodedRedirect(
          "error",
          "/sign-up",
          `Invalid address type. Must be one of: ${validAddressTypes.join(', ')}`
        );
      }

      const addressPayload = {
        user_id: user.id,
        name: fullName, // Map to 'name' field in addresses table
        phone: phone,
        address_line1: addressLine1,
        city: city,
        state: state || null, // Optional field, can be null
        postal_code: postalCode,
        country: 'Pakistan',
        address_type: addressType,
        is_default: true
      };

      console.log("Address payload:", JSON.stringify(addressPayload, null, 2));

      const { data: addressData, error: addressError } = await adminClient
        .from('addresses')
        .insert(addressPayload)
        .select()
        .single();

      if (addressError) {
        console.error('=== Address Save Failed ===', addressError);
        console.error('Error code:', addressError.code);
        console.error('Error details:', addressError.details);
        console.error('Error hint:', addressError.hint);
        
        // Provide specific error messages based on error code
        let errorMessage = "Failed to save address. ";
        if (addressError.code === '23514') {
          errorMessage += "Invalid address type selected.";
        } else if (addressError.code === '23503') {
          errorMessage += "User reference error.";
        } else {
          errorMessage += addressError.message;
        }
        
        return encodedRedirect("error", "/sign-up", errorMessage);
      }

      console.log("✓ Initial address saved successfully:", addressData?.id);
    } else {
      console.warn("⚠ Skipping address save. Missing required fields:");
      console.warn(`  - address_line1: ${addressLine1 ? '✓' : '✗'}`);
      console.warn(`  - city: ${city ? '✓' : '✗'}`);
      console.warn(`  - postal_code: ${postalCode ? '✓' : '✗'}`);
    }

    console.log("=== Signup Process Complete ===");

  } catch (err: any) {
    console.error('=== Unexpected Error in Signup ===', err);
    return encodedRedirect(
      "error",
      "/sign-up",
      `An unexpected error occurred: ${err.message || 'Please try again'}`
    );
  }

  return encodedRedirect(
    "success",
    "/sign-up",
    role === 'local_customer' 
      ? "Thanks for signing up! Please check your email for a verification link."
      : "Thanks for signing up! Your account will be reviewed by our team. Please check your email for a verification link.",
  );
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  // Get user role to redirect appropriately
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    
    const role = userData?.role;
    
    // Redirect based on role - separate dashboards for admin and sub-admin
    if (role === "admin") {
      return redirect("/admin");
    } else if (role === "sub_admin") {
      return redirect("/sub-admin");
    }
  }

  return redirect("/dashboard");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = headers().get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password",
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    return encodedRedirect(
      "error",
      "/protected/reset-password",
      "Passwords do not match",
    );
  }

  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return encodedRedirect(
      "error",
      "/protected/reset-password",
      "Session expired. Please request a new reset link.",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    return encodedRedirect(
      "error",
      "/protected/reset-password",
      `Password update failed: ${error.message}`,
    );
  }

  return encodedRedirect("success", "/protected/reset-password", "Password updated successfully");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/");
};

export const placeOrderAction = async (orderPayload: any, items: any[], initialPaymentAmount?: number) => {
  try {
    const supabase = createAdminClient();
    
    if (!supabase) {
      console.error("Server Action: Admin client failed to initialize");
      return { error: "Server configuration error: Unable to process order securely." };
    }

    // Extract non-column fields
    const { payment_method, ...orderData } = orderPayload;

    // Handle Credit Payment Validation
    if (payment_method === 'credit_balance') {
        const { data: credit } = await supabase
            .from('user_credits')
            .select('*')
            .eq('user_id', orderData.user_id)
            .single();
        
        if (!credit || Number(credit.balance) < Number(orderData.total_amount)) {
            return { error: "Insufficient credit balance for this transaction" };
        }
    }
    
    // Handle flexible payment split if specified
    let finalOrderData = { ...orderData };
    
    if (typeof initialPaymentAmount === 'number') {
      // Validate initial payment amount
      if (initialPaymentAmount < 0 || initialPaymentAmount > Number(orderData.total_amount)) {
        return { error: "Initial payment amount must be between 0 and total amount" };
      }
      
      // Set payment split fields
      finalOrderData = {
        ...finalOrderData,
        initial_payment_required: initialPaymentAmount,
        initial_payment_status: 'not_collected',
        created_via: 'self_order',
        paid_amount: 0,
        pending_amount: orderData.total_amount
      };
    }
    
    // 1. Insert Order
    console.log("ServerAction: Inserting order...", finalOrderData.order_number);
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert(finalOrderData)
      .select()
      .single();

    if (orderError) {
      console.error("Server Action: Order Insert Error:", orderError);
      return { error: orderError.message };
    }

    // 2. Insert Items
    const orderItemsPayload = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price
    }));

    console.log(`ServerAction: Inserting ${orderItemsPayload.length} items...`);
    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItemsPayload);

    if (itemsError) {
        console.error("Server Action: Items Insert Error:", itemsError);
        return { error: "Order placed but items failed: " + itemsError.message, orderId: order.id };
    }

    // 3. Update Inventory
    console.log(`ServerAction: Updating inventory for ${items.length} items...`);
    for (const item of items) {
        try {
            // Fetch current stock
            const { data: product, error: fetchError } = await supabase
                .from("products")
                .select("stock_quantity")
                .eq("id", item.product_id)
                .single();

            if (fetchError) {
                console.error(`Error fetching stock for product ${item.product_id}:`, fetchError);
                continue;
            }

            const previousQuantity = product.stock_quantity || 0;
            const newQuantity = Math.max(0, previousQuantity - item.quantity);

            // Update stock
            const { error: updateError } = await supabase
                .from("products")
                .update({ stock_quantity: newQuantity })
                .eq("id", item.product_id);

            if (updateError) {
                console.error(`Error updating stock for product ${item.product_id}:`, updateError);
                continue;
            }

            // Log inventory change
            await supabase.from("inventory_logs").insert({
                product_id: item.product_id,
                previous_quantity: previousQuantity,
                new_quantity: newQuantity,
                quantity_change: -item.quantity,
                reason: `Order #${order.order_number}`,
                created_by: orderData.user_id,
            });
        } catch (itemErr) {
            console.error(`Unexpected error updating inventory for product ${item.product_id}:`, itemErr);
        }
    }

    // 4. Process Credit Deduction if applicable
    if (payment_method === 'credit_balance') {
        const { data: credit } = await supabase
            .from('user_credits')
            .select('*')
            .eq('user_id', orderData.user_id)
            .single();

        if (credit) {
            const newBalance = Number(credit.balance) - Number(orderData.total_amount);
            const newUsed = Number(credit.used_credit) + Number(orderData.total_amount);

            const { error: creditError } = await supabase
                .from('user_credits')
                .update({ balance: newBalance, used_credit: newUsed, updated_at: new Date().toISOString() })
                .eq('user_id', orderData.user_id);
            
            if (!creditError) {
                await supabase.from('credit_transactions').insert({
                    user_id: orderData.user_id,
                    amount: orderData.total_amount,
                    type: 'usage',
                    description: `Order Payment for #${orderData.order_number}`,
                    performed_by: orderData.user_id
                });
            } else {
                console.error("CRITICAL: Failed to deduct credit for order " + order.id, creditError);
                // Note: In real app, we might want to flag the order or retry
            }
        }
    }

    revalidateTag("orders");
    revalidateTag("dashboard");
    return { success: true, orderId: order.id };
  } catch (err: any) {
    console.error("Server Action: Unexpected error:", err);
    return { error: "Unexpected server error: " + err.message };
  }
};

export const cancelOrderAction = async (orderId: string) => {
  const supabase = createAdminClient();
  const authClient = await createClient(); // For getting current user
  
  if (!supabase) return { error: "Server Configuration Error" };

  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Verify ownership and status
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("user_id, status")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) return { error: "Order not found" };
  
  if (order.user_id !== user.id) return { error: "Unauthorized access to order" };
  if (order.status !== "pending") return { error: "Cannot cancel order that is already processing or shipped" };

  // Perform Cancellation
  const { error: updateError } = await supabase
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", orderId);

  if (updateError) return { error: updateError.message };
  
  return { success: true };
};