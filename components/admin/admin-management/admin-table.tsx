import { Admin } from "@/services/admin/admin.service";

interface AdminTableProps {
  admins: Admin[];
}

export function AdminTable({ admins }: AdminTableProps) {
  if (admins.length === 0) {
    return (
      <div className="border p-8 text-center text-muted-foreground">
        No admins found.
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="w-full overflow-hidden mb-1">
        <div className="grid items-center grid-cols-[minmax(120px,1fr)_minmax(180px,1.5fr)_minmax(150px,1fr)_minmax(100px,1fr)] gap-4 px-4 py-3 bg-transparent">
          <div className="min-w-[120px] text-sm font-semibold text-black">
            Name
          </div>
          <div className="min-w-[180px] text-sm font-semibold text-black">
            Email
          </div>
          <div className="min-w-[150px] text-sm font-semibold text-black">
            Phone
          </div>
          <div className="min-w-[100px] text-sm font-semibold text-black">
            User Type
          </div>
        </div>
      </div>

      <div className="w-full space-y-1">
        {admins.map((admin) => (
          <div
            key={admin.id}
            className="w-full overflow-hidden bg-bg-light transition-all hover:shadow-sm"
          >
            <div className="grid items-center grid-cols-[minmax(120px,1fr)_minmax(180px,1.5fr)_minmax(150px,1fr)_minmax(100px,1fr)] gap-4 px-4 py-3">
              <div className="font-medium text-foreground">{admin.name}</div>
              <div className="text-foreground">{admin.email}</div>
              <div className="text-foreground">
                {admin.country_code && admin.phone
                  ? `${admin.country_code} ${admin.phone}`
                  : admin.phone || "-"}
              </div>
              <div className="text-foreground">
                <span className="capitalize">{admin.user_type}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
