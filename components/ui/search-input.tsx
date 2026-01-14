"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface SearchInputProps {
  placeholder?: string;
  paramName?: string;
  className?: string;
  debounceMs?: number;
  onSearch?: (value: string) => void;
}

export function SearchInput({
  placeholder = "Search by name or email...",
  paramName = "search",
  className,
  debounceMs = 300,
  onSearch,
}: SearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const [value, setValue] = React.useState(
    searchParams.get(paramName) || ""
  );

  const updateURL = React.useCallback(
    (searchValue: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (searchValue) {
        params.set(paramName, searchValue);
      } else {
        params.delete(paramName);
      }

      const queryString = params.toString();
      const url = queryString ? `${pathname}?${queryString}` : pathname;

      router.push(url, { scroll: false });

      onSearch?.(searchValue);
    },
    [pathname, paramName, router, searchParams, onSearch]
  );

  const debouncedUpdateURL = React.useCallback(
    (searchValue: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        updateURL(searchValue);
      }, debounceMs);
    },
    [updateURL, debounceMs]
  );

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    debouncedUpdateURL(newValue);
  };

  const handleClear = () => {
    setValue("");
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    updateURL("");
  };

  return (
    <div className={cn("relative w-full border max-w-sm", className)}>
      <Search className="absolute  left-3 top-1/2 h-5 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        className="pl-9 py-5 pr-9 bg-bg-light"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-5 w-4" />
        </button>
      )}
    </div>
  );
}
