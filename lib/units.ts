/**
 * Reusable unit options for product forms
 */

export type WeightUnit = "kg" | "g" | "lb";
export type DimensionUnit = "cm" | "m" | "inches" | "ft" | "mm";

export const WEIGHT_UNITS: { value: WeightUnit; label: string }[] = [
  { value: "kg", label: "Kg" },
  { value: "g", label: "g" },
  { value: "lb", label: "lb" },
];

export const DIMENSION_UNITS: { value: DimensionUnit; label: string }[] = [
  { value: "cm", label: "cm" },
  { value: "m", label: "m" },
  { value: "inches", label: "Inches" },
  { value: "ft", label: "ft" },
];

export const DIMENSION_UNITS_WITH_MM: { value: DimensionUnit; label: string }[] = [
  { value: "mm", label: "mm" },
  { value: "cm", label: "cm" },
  { value: "m", label: "m" },
  { value: "inches", label: "Inches" },
  { value: "ft", label: "ft" },
];

