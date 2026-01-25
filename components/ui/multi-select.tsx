"use client";

import * as React from "react";
import { X, Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface MultiSelectProps {
    options: { value: string; label: string; color?: string }[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    creatable?: boolean;
}

export function MultiSelect({
    options,
    selected,
    onChange,
    placeholder = "Select options...",
    className,
    disabled = false,
    creatable = false,
}: MultiSelectProps) {
    const [open, setOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState("");

    const handleUnselect = (item: string) => {
        onChange(selected.filter((i) => i !== item));
    };

    const handleSelect = (value: string) => {
        // Toggle selection
        if (selected.includes(value)) {
            handleUnselect(value);
        } else {
            onChange([...selected, value]);
        }
    };

    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(inputValue.toLowerCase())
    );

    // Show create option if: 
    // 1. Creatable is true
    // 2. We have typed something
    // 3. What we typed isn't exactly already in the list
    // 4. What we typed isn't already selected
    const showCreateOption = creatable &&
        inputValue.length > 0 &&
        !options.some(o => o.label.toLowerCase() === inputValue.toLowerCase()) &&
        !selected.includes(inputValue);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div
                    aria-expanded={open}
                    className={cn(
                        "flex min-h-[40px] w-full flex-wrap items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground transition-all cursor-text",
                        disabled ? "cursor-not-allowed opacity-50" : "",
                        className
                    )}
                    onClick={() => !disabled && setOpen(true)}
                >
                    <div className="flex flex-wrap gap-1">
                        {selected.length > 0 ? (
                            selected.map((item) => {
                                const option = options.find((o) => o.value === item);
                                return (
                                    <Badge variant="secondary" key={item} className="mr-1 mb-1"
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent opening popover when clicking badge
                                        }}
                                    >
                                        {option?.color && (
                                            <div
                                                className="w-3 h-3 rounded-full mr-2 border border-border"
                                                style={{ backgroundColor: option.color }}
                                            />
                                        )}
                                        {option?.label || item}
                                        <button
                                            className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer hover:bg-muted"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    handleUnselect(item);
                                                }
                                            }}
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleUnselect(item);
                                            }}
                                        >
                                            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                        </button>
                                    </Badge>
                                );
                            })
                        ) : (
                            <span className="text-muted-foreground">{placeholder}</span>
                        )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Search..."
                        value={inputValue}
                        onValueChange={setInputValue}
                    />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                            {filteredOptions.map((option) => {
                                const isSelected = selected.includes(option.value);
                                return (
                                    <CommandItem
                                        key={option.value}
                                        value={option.value}
                                        onSelect={() => {
                                            handleSelect(option.value);
                                        }}
                                    >
                                        <div className={cn(
                                            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                            isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                                        )}>
                                            <Check className={cn("h-4 w-4")} />
                                        </div>
                                        {option.color && (
                                            <div
                                                className="w-4 h-4 rounded-full mr-2 border border-border"
                                                style={{ backgroundColor: option.color }}
                                            />
                                        )}
                                        {option.label}
                                    </CommandItem>
                                );
                            })}
                            {showCreateOption && (
                                <CommandItem
                                    value={inputValue}
                                    onSelect={() => {
                                        handleSelect(inputValue);
                                        setInputValue("");
                                    }}
                                    className="text-blue-600 dark:text-blue-400 font-medium"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create "{inputValue}"
                                </CommandItem>
                            )}
                        </CommandGroup>
                        {selected.length > 0 && (
                            <>
                                <CommandSeparator />
                                <CommandGroup>
                                    <CommandItem
                                        onSelect={() => onChange([])}
                                        className="justify-center text-center font-medium"
                                    >
                                        Clear filters
                                    </CommandItem>
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
