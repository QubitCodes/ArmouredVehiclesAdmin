import { Admin } from "@/services/admin/admin.service";

interface AdminTableProps {
  admins: Admin[];
}

export function AdminTable({ admins }: AdminTableProps) {
  if (admins.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-muted-foreground">
        No admins found.
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="w-full overflow-hidden rounded-lg mb-1">
        <div className="grid items-center grid-cols-[minmax(120px,1fr)_minmax(180px,1.5fr)_minmax(100px,1fr)_minmax(100px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)] gap-4 px-4 py-3 bg-transparent">
          <div className="min-w-[120px] text-sm font-semibold text-black">
            Name
          </div>
          <div className="min-w-[180px] text-sm font-semibold text-black">
            Email
          </div>
          <div className="min-w-[100px] text-sm font-semibold text-black">
            Role
          </div>
          <div className="min-w-[100px] text-sm font-semibold text-black">
            Status
          </div>
          <div className="min-w-[120px] hidden text-sm font-semibold text-black md:block">
            Email Verified
          </div>
          <div className="min-w-[120px] hidden text-sm font-semibold text-black lg:block">
            Created Date
          </div>
        </div>
      </div>

      <div className="w-full space-y-1">
        {admins.map((admin) => (
          <div
            key={admin.id}
            className="w-full overflow-hidden rounded-lg bg-bg-light transition-all hover:shadow-sm"
          >
            <div className="grid items-center grid-cols-[minmax(120px,1fr)_minmax(180px,1.5fr)_minmax(100px,1fr)_minmax(100px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)] gap-4 px-4 py-3">
              <div className="font-medium text-foreground">{admin.name}</div>
              <div className="text-foreground">{admin.email}</div>
              <div className="text-foreground">
                <span className="capitalize">{admin.userType}</span>
              </div>
              <div>
                <span
                  className={`text-sm font-medium ${
                    admin.isActive
                      ? "text-green-600 dark:text-green-500"
                      : "text-orange-600 dark:text-orange-500"
                  }`}
                >
                  {admin.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="hidden text-sm text-foreground md:block">
                {admin.emailVerified === true ? "Verified" : "Unverified"}
              </div>
              <div className="hidden text-sm text-foreground lg:block">
                {new Date(admin.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
