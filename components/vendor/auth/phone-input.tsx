"use client";

import { Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FormLabel, FormControl, FormItem, FormMessage } from "@/components/ui/form";

interface PhoneCode {
  value: string;
  code: string;
  flag: string;
  label: string;
}

interface PhoneInputProps {
  countryCode: string;
  phoneNumber: string;
  onCountryCodeChange: (value: string) => void;
  onPhoneNumberChange: (value: string) => void;
  phoneCodes: PhoneCode[];
  label: string;
  required?: boolean;
  countryCodeError?: string;
  phoneNumberError?: string;
}

export function PhoneInput({
  countryCode,
  phoneNumber,
  onCountryCodeChange,
  onPhoneNumberChange,
  phoneCodes,
  label,
  required = false,
  countryCodeError,
  phoneNumberError,
}: PhoneInputProps) {
  const selectedPhoneCode = phoneCodes.find((c) => c.value === countryCode);

  return (
    <div className="space-y-2">
      <FormLabel className="flex items-center gap-2 text-sm font-medium text-black">
        {label} {required && <span className="text-red-500">*</span>}
        <Info className="w-4 h-4 text-gray-400 cursor-help" />
      </FormLabel>
      <div className="flex gap-2">
        <FormItem className="w-[120px]">
          <FormControl>
            <div className="relative">
              <select
                value={countryCode}
                onChange={(e) => onCountryCodeChange(e.target.value)}
                className="w-full bg-bg-medium border border-gray-300 h-11 pl-10 pr-6 text-sm focus:border-secondary focus:ring-1 focus:ring-secondary outline-none appearance-none"
              >
                {phoneCodes.map((code) => (
                  <option key={code.value} value={code.value}>
                    {code.code}
                  </option>
                ))}
              </select>
              {selectedPhoneCode && (
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-2xl pointer-events-none z-10">
                  {selectedPhoneCode.flag}
                </span>
              )}
            </div>
          </FormControl>
          {countryCodeError && <FormMessage>{countryCodeError}</FormMessage>}
        </FormItem>
        <FormItem className="flex-1">
          <FormControl>
            <Input
              type="tel"
              value={phoneNumber}
              onChange={(e) => onPhoneNumberChange(e.target.value)}
              className="bg-bg-medium border border-gray-300 h-11 focus:border-secondary focus:ring-1 focus:ring-secondary"
            />
          </FormControl>
          {phoneNumberError && <FormMessage>{phoneNumberError}</FormMessage>}
        </FormItem>
      </div>
    </div>
  );
}




