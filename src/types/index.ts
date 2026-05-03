export interface User {
  id: string;
  email: string;
  cafe_name: string;
  city: string;
  subscription_plan: 'free' | 'pro';
  created_at: string;
}

export interface CafeSettings {
  id: string;
  user_id: string;
  monthly_rent: number;
  staff_salary: number;
  utilities: number;
  other_costs: number;
  tax_percent: number;
  food_daily_qty: number;
  drink_daily_qty: number;
  working_days: number;
}

export interface Ingredient {
  id: string;
  user_id: string;
  library_id?: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  quantity: number;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  user_id: string;
  library_id?: string;
  name: string;
  type: 'food' | 'drink';
  selling_price: number;
  total_cost: number;
  profit_percent: number;
}

export interface MenuIngredient {
  id: string;
  menu_item_id: string;
  ingredient_id: string;
  amount: number;
  unit: string;
  cost: number;
  ingredient?: Ingredient;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface LibraryIngredient {
  id: string;
  name_fa: string;
  name_en: string;
  category: string;
  default_unit: string;
}

export interface LibraryMenuItem {
  id: string;
  name_fa: string;
  name_en: string;
  category: string;
  type: 'food' | 'drink';
  default_recipe: {
    ingredients: Array<{
      name_fa: string;
      amount: number;
      unit: string;
    }>;
  };
}

export type ProfitStatus = 'profitable' | 'average' | 'loss';

export interface MenuItemWithStatus extends MenuItem {
  status: ProfitStatus;
  ingredients?: MenuIngredient[];
}
