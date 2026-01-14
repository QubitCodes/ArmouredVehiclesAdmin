import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Plus } from "lucide-react";

interface AdminActionsProps {
  onAddAdmin: () => void;
}

export function AdminActions({ onAddAdmin }: AdminActionsProps) {
  return (
    <div className="flex items-center gap-5 justify-end">
      <SearchInput placeholder="Search by name or email..."  />

      <Button onClick={onAddAdmin}>
        <Plus className="mr-2 h-4 w-4" />
        Add Admin
      </Button>
    </div>
  );
}
