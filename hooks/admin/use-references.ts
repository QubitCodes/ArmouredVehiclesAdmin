import { useQuery } from "@tanstack/react-query";
import { referenceService } from "@/services/admin/reference.service";

export interface ReferenceOption {
  value: string;
  label: string;
  color?: string;
  [key: string]: any;
}

export const useReferenceData = (type: string) => {
  return useQuery({
    queryKey: ["references", type],
    queryFn: async () => {
      const data = await referenceService.getData(type);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useProductColors = () => {
  return useQuery({
    queryKey: ["references", "product_colors"],
    queryFn: async () => {
      const data = await referenceService.getData("product_colors");
      return data.map((item: any) => ({
        value: item.name,
        label: item.name,
        color: item.hex_code || "#000000",
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
};
