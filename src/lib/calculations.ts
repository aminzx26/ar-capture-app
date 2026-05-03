import { CafeSettings, MenuIngredient } from '../types';

export function calcOverhead(settings: CafeSettings, type: 'food' | 'drink'): number {
  const totalFixed =
    settings.monthly_rent +
    settings.staff_salary +
    settings.utilities +
    settings.other_costs;

  const totalDailyPortions = settings.food_daily_qty + settings.drink_daily_qty;
  if (totalDailyPortions === 0 || settings.working_days === 0) return 0;

  return totalFixed / (totalDailyPortions * settings.working_days);
}

export function calcIngredientsCost(ingredients: MenuIngredient[]): number {
  return ingredients.reduce((sum, i) => sum + i.cost, 0);
}

export function calcTotalCost(
  ingredientsCost: number,
  overhead: number,
  taxPercent: number
): number {
  const preTax = ingredientsCost + overhead;
  return preTax * (1 + taxPercent / 100);
}

export function calcProfitPercent(sellingPrice: number, totalCost: number): number {
  if (sellingPrice === 0) return 0;
  return ((sellingPrice - totalCost) / sellingPrice) * 100;
}

export function getProfitStatus(profitPercent: number): 'profitable' | 'average' | 'loss' {
  if (profitPercent >= 30) return 'profitable';
  if (profitPercent >= 10) return 'average';
  return 'loss';
}
