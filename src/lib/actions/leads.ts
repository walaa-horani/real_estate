"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/adminClient";
import type { ActionResult } from "@/lib/actions/dashboard";

export async function submitPropertyInquiry(data: {
  organizationId: string;
  propertyId: string;
  name: string;
  phone: string;
  email?: string;
  message?: string;
}): Promise<ActionResult> {
  if (!data.name || !data.phone || !data.organizationId) {
    return { error: "Name, phone number, and organization ID are required." };
  }

  const adminClient = createAdminClient();

  const { error } = await adminClient.from("leads").insert({
    organization_id: data.organizationId,
    property_id: data.propertyId,
    name: data.name.trim(),
    phone: data.phone.trim(),
    email: data.email?.trim() || null,
    message: data.message?.trim() || null,
    status: "new",
    source: "Property Storefront Inquiry",
  });

  if (error) {
    console.error("Failed to insert lead from storefront:", error);
    return { error: "Could not send inquiry at this time. Please try again later." };
  }

  revalidatePath("/dashboard/leads");
  return { success: true };
}
