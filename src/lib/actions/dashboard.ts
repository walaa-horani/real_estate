"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { deletePropertyImage, uploadPropertyImage } from "@/lib/cloudinary";
import type { LeadStatus, PropertyType } from "@/lib/supabase/types";

export type ActionResult = { error: string } | { success: true };

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// --- Properties (admin only — RLS is the real enforcement, this just
// surfaces a clean error instead of a raw Postgres one) ---------------------

export async function addProperty(
  organizationId: string,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient();

  const title = String(formData.get("title") ?? "").trim();
  const addressLine = String(formData.get("addressLine") ?? "").trim();
  const price = Number(formData.get("price"));
  const propertyType = String(formData.get("propertyType") ?? "house") as PropertyType;
  const status = String(formData.get("status") ?? "published") as "draft" | "published";
  const images = formData
    .getAll("images")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (!title || !price) {
    return { error: "Title and price are required." };
  }

  const slug = `${slugify(title)}-${Date.now().toString(36)}`;

  const { data: property, error } = await supabase
    .from("properties")
    .insert({
      organization_id: organizationId,
      slug,
      title,
      address_line: addressLine || null,
      price,
      property_type: propertyType,
      status,
      published_at: status === "published" ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) {
    return {
      error: error.message.includes("plan_limit_exceeded")
        ? "Your plan's listing limit has been reached. Upgrade your plan to add more properties."
        : error.message,
    };
  }

  // Pre-check the plan's per-listing image cap before uploading anything to
  // Cloudinary. The DB trigger (enforce_image_limit) is still the real
  // enforcement and would reject the insert regardless, but without this a
  // batch of e.g. 20 files on a 15-image plan would upload all 20 to
  // Cloudinary first, only to have the last 5 inserts fail and need cleanup.
  const { data: orgPlan } = await supabase
    .from("organizations")
    .select("plan:plans(max_images_per_listing)")
    .eq("id", organizationId)
    .single();
  const maxImages = (orgPlan?.plan as unknown as { max_images_per_listing: number } | null)
    ?.max_images_per_listing;

  const uploadErrors: string[] = [];
  const allowedImages =
    typeof maxImages === "number" && images.length > maxImages
      ? images.slice(0, maxImages)
      : images;

  if (allowedImages.length < images.length) {
    uploadErrors.push(
      `Only the first ${maxImages} image(s) were uploaded — your plan's image limit for this listing.`
    );
  }

  // Property row exists — upload images against it. Best-effort: a failed
  // image upload doesn't roll back the property itself, just gets reported.
  for (let i = 0; i < allowedImages.length; i++) {
    const publicId = `real-estate/${organizationId}/${property.id}/${i}`;
    try {
      const uploaded = await uploadPropertyImage(allowedImages[i], publicId);
      const { error: imageError } = await supabase.from("property_images").insert({
        property_id: property.id,
        cloudinary_public_id: uploaded.public_id,
        url: uploaded.secure_url,
        cloudinary_version: uploaded.version,
        width: uploaded.width,
        height: uploaded.height,
        format: uploaded.format,
        sort_order: i,
      });
      if (imageError) {
        uploadErrors.push(
          imageError.message.includes("plan_limit_exceeded")
            ? "Your plan's image limit for this listing has been reached."
            : imageError.message
        );
      }
    } catch (err) {
      uploadErrors.push(err instanceof Error ? err.message : "Image upload failed");
    }
  }

  revalidatePath("/dashboard/properties");

  if (uploadErrors.length > 0) {
    return { error: `Property saved, but ${uploadErrors.length} image(s) failed to upload.` };
  }
  return { success: true };
}

export async function deleteProperty(propertyId: string): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient();

  const { data: images } = await supabase
    .from("property_images")
    .select("cloudinary_public_id")
    .eq("property_id", propertyId);

  const { error } = await supabase.from("properties").delete().eq("id", propertyId);
  if (error) return { error: error.message };

  // property_images rows are gone via ON DELETE CASCADE — clean up the
  // matching Cloudinary assets too so they don't pile up unreferenced.
  for (const img of images ?? []) {
    await deletePropertyImage(img.cloudinary_public_id).catch(() => {});
  }

  revalidatePath("/dashboard/properties");
  return { success: true };
}

// --- Leads (admin only) -----------------------------------------------------

export async function updateLeadStatus(
  leadId: string,
  status: LeadStatus
): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("leads").update({ status }).eq("id", leadId);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/leads");
  return { success: true };
}

// --- Team (admin only) ------------------------------------------------------

export async function removeMember(memberId: string): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("organization_members").delete().eq("id", memberId);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/team");
  return { success: true };
}
