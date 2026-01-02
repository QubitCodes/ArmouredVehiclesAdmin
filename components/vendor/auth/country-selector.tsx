"use client";

import { Info } from "lucide-react";
import { FormLabel, FormControl, FormItem, FormMessage } from "@/components/ui/form";

interface Country {
  value: string;
  label: string;
  flag: string;
}

interface CountrySelectorProps {
  value: string;
  onChange: (value: string) => void;
  countries: Country[];
  label: string;
  required?: boolean;
  error?: string;
}

export function CountrySelector({
  value,
  onChange,
  countries,
  label,
  required = false,
  error,
}: CountrySelectorProps) {
  const selectedCountry = countries.find((c) => c.value === value);

  return (
    <FormItem>
      <FormLabel className="flex items-center gap-2 text-sm font-medium text-black">
        {label} {required && <span className="text-red-500">*</span>}
        <Info className="w-4 h-4 text-gray-400 cursor-help" />
      </FormLabel>
      <FormControl>
        <div className="relative">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-bg-medium border border-gray-300 h-11 pl-12 pr-8 text-sm focus:border-secondary focus:ring-1 focus:ring-secondary outline-none appearance-none"
          >
            {countries.map((country) => (
              <option key={country.value} value={country.value}>
                {country.label}
              </option>
            ))}
          </select>
          {selectedCountry && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-2xl pointer-events-none z-10">
              {selectedCountry.flag}
            </span>
          )}
        </div>
      </FormControl>
      {error && <FormMessage>{error}</FormMessage>}
    </FormItem>
  );
}




