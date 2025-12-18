export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PendingLimitInfo {
  pendingAmountLimit: number;
  currentPending: number;
  remainingAllowed: number;
  role?: string;
}

export interface ProductWithBrand {
  id: string;
  title: string;
  // ... other product fields if needed, or extend existing Product type
  brand_id: string | null;
  brands?: Brand | null; // For joined queries
}
