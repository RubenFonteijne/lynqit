import { createServerClient } from "./supabase-server";

export interface DiscountCode {
  id: string;
  code: string;
  discountType: "first_payment" | "recurring";
  discountValue: number;
  isPercentage: boolean;
  validFrom: string;
  validUntil?: string;
  maxUses?: number;
  usedCount: number;
  active: boolean;
  applicablePlans: ("start" | "pro")[];
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDiscountCodeInput {
  code: string;
  discountType: "first_payment" | "recurring";
  discountValue: number;
  isPercentage: boolean;
  validFrom?: string;
  validUntil?: string;
  maxUses?: number;
  applicablePlans?: ("start" | "pro")[];
  description?: string;
  active?: boolean;
}

export interface UpdateDiscountCodeInput {
  code?: string;
  discountType?: "first_payment" | "recurring";
  discountValue?: number;
  isPercentage?: boolean;
  validFrom?: string;
  validUntil?: string;
  maxUses?: number;
  usedCount?: number;
  applicablePlans?: ("start" | "pro")[];
  description?: string;
  active?: boolean;
}

function mapDbDiscountCodeToDiscountCode(dbCode: any): DiscountCode {
  return {
    id: dbCode.id,
    code: dbCode.code,
    discountType: dbCode.discount_type,
    discountValue: parseFloat(dbCode.discount_value),
    isPercentage: dbCode.is_percentage,
    validFrom: dbCode.valid_from,
    validUntil: dbCode.valid_until || undefined,
    maxUses: dbCode.max_uses || undefined,
    usedCount: dbCode.used_count || 0,
    active: dbCode.active,
    applicablePlans: dbCode.applicable_plans || ["start", "pro"],
    description: dbCode.description || undefined,
    createdAt: dbCode.created_at,
    updatedAt: dbCode.updated_at,
  };
}

export async function getAllDiscountCodes(): Promise<DiscountCode[]> {
  const supabase = createServerClient();
  
  const { data, error } = await supabase
    .from("discount_codes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching discount codes:", error);
    throw new Error("Failed to fetch discount codes");
  }

  return (data || []).map(mapDbDiscountCodeToDiscountCode);
}

export async function getDiscountCodeById(id: string): Promise<DiscountCode | null> {
  const supabase = createServerClient();
  
  const { data, error } = await supabase
    .from("discount_codes")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("Error fetching discount code:", error);
    throw new Error("Failed to fetch discount code");
  }

  return data ? mapDbDiscountCodeToDiscountCode(data) : null;
}

export async function getDiscountCodeByCode(code: string): Promise<DiscountCode | null> {
  const supabase = createServerClient();
  
  const { data, error } = await supabase
    .from("discount_codes")
    .select("*")
    .eq("code", code.toUpperCase())
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("Error fetching discount code:", error);
    throw new Error("Failed to fetch discount code");
  }

  return data ? mapDbDiscountCodeToDiscountCode(data) : null;
}

export async function validateDiscountCode(
  code: string,
  plan: "start" | "pro"
): Promise<{ valid: boolean; discountCode?: DiscountCode; error?: string }> {
  const discountCode = await getDiscountCodeByCode(code);

  if (!discountCode) {
    return { valid: false, error: "Kortingscode niet gevonden" };
  }

  if (!discountCode.active) {
    return { valid: false, error: "Kortingscode is niet actief" };
  }

  const now = new Date();
  const validFrom = new Date(discountCode.validFrom);
  const validUntil = discountCode.validUntil ? new Date(discountCode.validUntil) : null;

  if (now < validFrom) {
    return { valid: false, error: "Kortingscode is nog niet geldig" };
  }

  if (validUntil && now > validUntil) {
    return { valid: false, error: "Kortingscode is verlopen" };
  }

  if (discountCode.maxUses && discountCode.usedCount >= discountCode.maxUses) {
    return { valid: false, error: "Kortingscode is al het maximum aantal keer gebruikt" };
  }

  if (!discountCode.applicablePlans.includes(plan)) {
    return { valid: false, error: "Kortingscode is niet geldig voor dit abonnement" };
  }

  return { valid: true, discountCode };
}

export async function createDiscountCode(input: CreateDiscountCodeInput): Promise<DiscountCode> {
  const supabase = createServerClient();
  
  const insertData: any = {
    code: input.code.toUpperCase(),
    discount_type: input.discountType,
    discount_value: input.discountValue,
    is_percentage: input.isPercentage,
    valid_from: input.validFrom || new Date().toISOString(),
    valid_until: input.validUntil || null,
    max_uses: input.maxUses || null,
    applicable_plans: input.applicablePlans || ["start", "pro"],
    description: input.description || null,
    active: input.active !== undefined ? input.active : true,
  };

  const { data, error } = await supabase
    .from("discount_codes")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error("Error creating discount code:", error);
    if (error.code === "23505") {
      throw new Error("Kortingscode bestaat al");
    }
    throw new Error("Failed to create discount code");
  }

  return mapDbDiscountCodeToDiscountCode(data);
}

export async function updateDiscountCode(
  id: string,
  input: UpdateDiscountCodeInput
): Promise<DiscountCode> {
  const supabase = createServerClient();
  
  const updateData: any = {};
  
  if (input.code !== undefined) updateData.code = input.code.toUpperCase();
  if (input.discountType !== undefined) updateData.discount_type = input.discountType;
  if (input.discountValue !== undefined) updateData.discount_value = input.discountValue;
  if (input.isPercentage !== undefined) updateData.is_percentage = input.isPercentage;
  if (input.validFrom !== undefined) updateData.valid_from = input.validFrom;
  if (input.validUntil !== undefined) updateData.valid_until = input.validUntil || null;
  if (input.maxUses !== undefined) updateData.max_uses = input.maxUses || null;
  if (input.usedCount !== undefined) updateData.used_count = input.usedCount;
  if (input.applicablePlans !== undefined) updateData.applicable_plans = input.applicablePlans;
  if (input.description !== undefined) updateData.description = input.description || null;
  if (input.active !== undefined) updateData.active = input.active;

  const { data, error } = await supabase
    .from("discount_codes")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating discount code:", error);
    if (error.code === "23505") {
      throw new Error("Kortingscode bestaat al");
    }
    throw new Error("Failed to update discount code");
  }

  return mapDbDiscountCodeToDiscountCode(data);
}

export async function deleteDiscountCode(id: string): Promise<void> {
  const supabase = createServerClient();
  
  const { error } = await supabase
    .from("discount_codes")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting discount code:", error);
    throw new Error("Failed to delete discount code");
  }
}

export async function incrementDiscountCodeUsage(id: string): Promise<void> {
  // Get current code and increment used_count
  const code = await getDiscountCodeById(id);
  if (code) {
    await updateDiscountCode(id, {
      usedCount: code.usedCount + 1,
    });
  }
}

