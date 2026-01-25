import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Plus } from "lucide-react";
import { authService } from "@/services/admin/auth.service";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Select } from "@/components/ui/select";

interface AdminActionsProps {
  onAddAdmin: () => void;
}

export function AdminActions({ onAddAdmin }: AdminActionsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set("controlled", value);
    } else {
      params.delete("controlled");
    }
    // Reset page on filter change
    params.set("page", "1");

    router.push(`${pathname}?${params.toString()}`);
  };

  const controlledValue = searchParams.get("controlled") || "all";

  return (
    <div className="flex items-center gap-5 justify-end">
      <div className="w-[180px]">
        <Select
          value={controlledValue}
          onChange={handleFilterChange}
          placeholder="Filter by Controlled"
        >
          <option value="all">All Admins</option>
          <option value="true">Controlled: Yes</option>
          <option value="false">Controlled: No</option>
        </Select>
      </div>

      <SearchInput placeholder="Search by name or email..." />

      {authService.hasPermission("admin.manage") && (
        <Button onClick={onAddAdmin}>
          <Plus className="mr-2 h-4 w-4" />
          Add Admin
        </Button>
      )}
    </div>
  );
}
