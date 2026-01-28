"use client";

import * as React from "react";
import { Select } from "./select";
import { Input } from "./input";
import { cn } from "@/lib/utils";

interface DateSelectorProps {
  value?: { day?: number; month?: number; year?: number };
  onChange?: (value: { day?: number; month?: number; year?: number }) => void;
  className?: string;
  selectClassName?: string;
  dayPlaceholder?: string;
  monthPlaceholder?: string;
  yearPlaceholder?: string;
  includeFutureYears?: boolean;
  futureYearsCount?: number;
}

const DateSelector = React.forwardRef<HTMLDivElement, DateSelectorProps>(
  (
    {
      value,
      onChange,
      className,
      selectClassName,
      dayPlaceholder = "Day",
      monthPlaceholder = "Month",
      yearPlaceholder = "Year",
      includeFutureYears = false,
      futureYearsCount = 20,
      ...props
    },
    ref
  ) => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const currentYear = new Date().getFullYear();
    let years: number[];
    if (includeFutureYears) {
      // Generate years from (currentYear + futureYearsCount) down to (currentYear - 100)
      const startYear = currentYear + futureYearsCount;
      const endYear = currentYear - 100;
      years = Array.from({ length: startYear - endYear + 1 }, (_, i) => startYear - i);
    } else {
      years = Array.from({ length: 100 }, (_, i) => currentYear - i);
    }

    const handleDayChange = (day: string) => {
      onChange?.({
        ...value,
        day: day ? parseInt(day) : undefined,
      });
    };

    const handleMonthChange = (month: string) => {
      onChange?.({
        ...value,
        month: month ? parseInt(month) : undefined,
      });
    };

    const handleYearChange = (year: string) => {
      onChange?.({
        ...value,
        year: year ? parseInt(year) : undefined,
      });
    };

    return (
      <div
        ref={ref}
        className={cn("flex gap-2", className)}
        {...props}
      >
        <Input
          type="number"
          min={1}
          max={31}
          placeholder={dayPlaceholder}
          value={value?.day?.toString() || ""}
          onChange={(e) => {
            const val = e.target.value;
            // Allow empty string to clear field
            if (val === "") {
              handleDayChange("");
              return;
            }
            // Enforce limits strictly if needed, or just standard form validation
            const num = parseInt(val);
            if (!isNaN(num) && num >= 1 && num <= 31) {
              handleDayChange(val);
            } else if (!isNaN(num) && num > 31) {
              handleDayChange(val);
            }
          }}
          className={cn(
            "flex-1 min-w-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
            selectClassName
          )}
        />

        <div className="flex-1 min-w-0">
          <Select
            placeholder={monthPlaceholder}
            value={value?.month?.toString() || ""}
            onChange={(e) => handleMonthChange(e.target.value)}
            className={cn("w-full", selectClassName)}
          >
            <option value="" disabled>
              {monthPlaceholder}
            </option>
            {months.map((month, index) => (
              <option key={index + 1} value={index + 1}>
                {month}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex-1 min-w-0">
          <Select
            placeholder={yearPlaceholder}
            value={value?.year?.toString() || ""}
            onChange={(e) => handleYearChange(e.target.value)}
            className={cn("w-full", selectClassName)}
          >
            <option value="" disabled>
              {yearPlaceholder}
            </option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </Select>
        </div>
      </div>
    );
  }
);
DateSelector.displayName = "DateSelector";

export { DateSelector };

