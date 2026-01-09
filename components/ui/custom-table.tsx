"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Loader2 } from "lucide-react";

export interface Column<T> {
  header: string | ReactNode;
  accessorKey?: keyof T;
  render?: (item: T) => ReactNode;
  className?: string;
  headerClassName?: string;
}

interface CustomTableProps<T> {
  data: T[];
  columns: Column<T>[];
  gridCols?: string; // CSS grid-template-columns value, e.g., "minmax(150px, 1fr) 1fr 100px"
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function CustomTable<T extends { id?: string | number }>({
  data,
  columns,
  gridCols = "repeat(auto-fit, minmax(100px, 1fr))", // Default fallback
  onRowClick,
  isLoading = false,
  emptyMessage = "No data found.",
  className,
}: CustomTableProps<T>) {
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="border p-8 text-center text-muted-foreground bg-bg-light">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Header */}
      <div className="w-full overflow-hidden mb-1">
        <div 
            className="grid items-center gap-4 px-4 py-3 bg-transparent"
            style={{ gridTemplateColumns: gridCols }}
        >
          {columns.map((col, index) => (
            <div 
                key={index} 
                className={cn("text-sm font-semibold text-black", col.headerClassName)}
            >
              {col.header}
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="w-full space-y-1">
        {data.map((item, rowIndex) => (
          <div
            key={item.id || rowIndex}
            onClick={() => onRowClick && onRowClick(item)}
            className={cn(
                "w-full overflow-hidden bg-bg-light transition-all hover:shadow-sm",
                onRowClick ? "cursor-pointer" : ""
            )}
          >
            <div 
                className="grid items-center gap-4 px-4 py-3"
                style={{ gridTemplateColumns: gridCols }}
            >
              {columns.map((col, colIndex) => (
                <div key={colIndex} className={cn("text-foreground", col.className)}>
                  {col.render 
                    ? col.render(item) 
                    : col.accessorKey 
                        ? (item[col.accessorKey] as ReactNode) 
                        : null
                  }
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
