export type NutritionFactRow = {
  product_id: string;
  per_quantity: number;
  per_unit: "g" | "ml";
  energy_kcal: number | null;
  carbohydrates_g: number | null;
  sugars_g: number | null;
  proteins_g: number | null;
  fats_g: number | null;
  saturated_fats_g: number | null;
  salt_g: number | null;
  source: string;
  updated_at: string;
};
