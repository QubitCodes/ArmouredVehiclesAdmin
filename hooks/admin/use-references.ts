import { useQuery } from "@tanstack/react-query";
import { referenceService } from "@/services/admin/reference.service";
import { brandService } from "@/services/admin/brand.service";

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


export const useBrands = () => {
  return useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const data = await brandService.getAll();
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
};
