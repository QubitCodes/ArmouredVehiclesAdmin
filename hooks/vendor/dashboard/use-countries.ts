import { useQuery } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";

export interface Country {
  value: string; // ISO 3166-1 alpha-2 code (e.g., "ae", "us")
  label: string; // Country name
  flag: string; // Emoji flag
}

interface RestCountry {
  name: {
    common: string;
  };
  cca2: string; // ISO 3166-1 alpha-2 code
  flag: string; // Emoji flag
}

/**
 * React Query hook for fetching all countries from REST Countries API
 */
export function useCountries() {
  return useQuery<Country[], AxiosError>({
    queryKey: ["countries"],
    queryFn: async () => {
      const response = await axios.get<RestCountry[]>(
        "https://restcountries.com/v3.1/all?fields=name,cca2,flag"
      );
      
      // Map REST Countries API response to our Country format
      const countries = response.data
        .map((country) => ({
          value: country.cca2.toLowerCase(), // Convert to lowercase for consistency
          label: country.name.common,
          flag: country.flag,
        }))
        // Sort alphabetically by country name
        .sort((a, b) => a.label.localeCompare(b.label));

      return countries;
    },
    staleTime: 1000 * 60 * 60 * 24, // Cache for 24 hours (countries don't change often)
    cacheTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

