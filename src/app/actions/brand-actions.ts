"use server";

import { createAdminClient } from "@/supabase/admin";
import { revalidatePath } from "next/cache";

export async function getBrands() {
  const supabase = createAdminClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error fetching brands:", error);
    return [];
  }
  return data;
}

export async function createBrand(formData: FormData) {
  const supabase = createAdminClient();
  if (!supabase) return { error: "Server configuration error" };

  const name = formData.get("name")?.toString();
  const slug = formData.get("slug")?.toString(); // Or generate from name
  const logo_url = formData.get("logo_url")?.toString();
  const is_active = formData.get("is_active") === "on";

  if (!name || !slug) {
    return { error: "Name and Slug are required" };
  }

  const { error } = await supabase.from("brands").insert({
    name,
    slug,
    logo_url,
    is_active,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function updateBrand(id: string, formData: FormData) {
  const supabase = createAdminClient();
  if (!supabase) return { error: "Server configuration error" };

  const name = formData.get("name")?.toString();
  const slug = formData.get("slug")?.toString();
  const logo_url = formData.get("logo_url")?.toString();
  const is_active = formData.get("is_active") === "on";

  const { error } = await supabase
    .from("brands")
    .update({
      name,
      slug,
      logo_url,
      is_active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function deleteBrand(id: string) {
  const supabase = createAdminClient();
  if (!supabase) return { error: "Server configuration error" };

  // First, update all products that reference this brand to set brand_id to NULL
  const { error: productsError } = await supabase
    .from("products")
    .update({ brand_id: null })
    .eq("brand_id", id);

  if (productsError) {
    console.error("Error updating products:", productsError);
    return { error: `Failed to update products: ${productsError.message}` };
  }

  // Second, delete related salesman_brands entries to avoid RLS issues with cascade delete
  const { error: salesmanBrandsError } = await supabase
    .from("salesman_brands")
    .delete()
    .eq("brand_id", id);

  if (salesmanBrandsError) {
    console.error("Error deleting salesman_brands:", salesmanBrandsError);
    return { error: `Failed to remove brand assignments: ${salesmanBrandsError.message}` };
  }

  // Finally, delete the brand itself
  const { error } = await supabase.from("brands").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function toggleBrandStatus(id: string, currentStatus: boolean) {
  const supabase = createAdminClient();
  if (!supabase) return { error: "Server configuration error" };

  const { error } = await supabase
    .from("brands")
    .update({ is_active: !currentStatus })
    .eq("id", id);
    
  if (error) {
    return { error: error.message };
  }
  revalidatePath("/admin");
  return { success: true };
}
