import { getCountries, getCountryCallingCode } from "react-phone-number-input";
import en from "react-phone-number-input/locale/en";
import type { CountryCode } from "libphonenumber-js";

export interface CountryOption {
  value: string; // dialing code like "+1"
  label: string; // display label like "+1 United States"
  flag: string; // emoji flag like "🇺🇸"
  countryCode: CountryCode; // ISO code like "US"
  name: string; // country name like "United States"
}

// Convert ISO country code to flag emoji
function getFlagEmoji(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Generate the complete country list
function generateCountryList(): CountryOption[] {
  const countries = getCountries();
  const countryList: CountryOption[] = [];

  for (const countryCode of countries) {
    try {
      const callingCode = getCountryCallingCode(countryCode);
      const name = en[countryCode] || countryCode;
      const flag = getFlagEmoji(countryCode);

      countryList.push({
        value: `+${callingCode}`,
        label: `+${callingCode} ${name}`,
        flag,
        countryCode: countryCode as CountryCode,
        name,
      });
    } catch {
      // Skip countries that don't have calling codes
      continue;
    }
  }

  // Sort by country name
  countryList.sort((a, b) => a.name.localeCompare(b.name));

  return countryList;
}

// Cache the list since it's static
export const COUNTRY_LIST = generateCountryList();

// Map from dialing code to country options (for countries that share codes)
export const DIALING_CODE_TO_COUNTRIES = COUNTRY_LIST.reduce(
  (acc, country) => {
    if (!acc[country.value]) {
      acc[country.value] = [];
    }
    acc[country.value].push(country);
    return acc;
  },
  {} as Record<string, CountryOption[]>
);

// Get country by dialing code (returns first match for shared codes)
export function getCountryByDialingCode(dialingCode: string): CountryOption | undefined {
  return COUNTRY_LIST.find((c) => c.value === dialingCode);
}

// Get country by ISO country code
export function getCountryByCode(countryCode: CountryCode): CountryOption | undefined {
  return COUNTRY_LIST.find((c) => c.countryCode === countryCode);
}
