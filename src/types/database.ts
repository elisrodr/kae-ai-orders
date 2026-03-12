export type UserRole = "restaurant" | "admin";

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  full_name: string | null;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OnboardingBasics {
  restaurant_name: string;
  address: string;
  phone: string;
  cuisine_type: string;
}

export interface OnboardingOrderingHabits {
  order_frequency: string;
  preferred_delivery_days: string[];
  preferred_delivery_times: string;
  min_order_amount: number | null;
  notes: string | null;
}

export interface VendorContact {
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  notes: string | null;
}

export interface RegularItem {
  name: string;
  vendor_name: string;
  quantity: string;
  frequency: string;
  notes: string | null;
}

export interface RestaurantProfile {
  id: string;
  user_id: string;
  onboarding_basics: OnboardingBasics | null;
  onboarding_ordering_habits: OnboardingOrderingHabits | null;
  created_at: string;
  updated_at: string;
}

export interface Vendor {
  id: string;
  restaurant_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RegularItemRow {
  id: string;
  restaurant_id: string;
  name: string;
  vendor_id: string;
  quantity: string;
  frequency: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
