import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface AdminActionsProps {
  onAddAdmin: () => void;
}

export function AdminActions({ onAddAdmin }: AdminActionsProps) {
  return (
    <div className="flex justify-end">
      <Button onClick={onAddAdmin}>
        <Plus className="mr-2 h-4 w-4" />
        Add Admin
      </Button>
    </div>
  );
}

