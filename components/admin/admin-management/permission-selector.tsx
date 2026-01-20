'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { adminService } from '@/services/admin/admin.service';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Permission {
    name: string;
    label?: string;
    comment: string;
}

interface PermissionSelectorProps {
    selectedPermissions: string[];
    onChange: (permissions: string[]) => void;
    disabled?: boolean;
}

export function PermissionSelector({
    selectedPermissions,
    onChange,
    disabled = false,
}: PermissionSelectorProps) {
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPermissions = async () => {
            try {
                const res: any = await adminService.getPermissions();
                if (res.status === true || res.success === true) {
                    setPermissions(res.data || []);
                } else if (Array.isArray(res)) {
                    setPermissions(res);
                }
            } catch (err) {
                console.error('Failed to load permissions', err);
            } finally {
                setLoading(false);
            }
        };
        fetchPermissions();
    }, []);

    const handleToggle = (permissionName: string) => {
        if (selectedPermissions.includes(permissionName)) {
            onChange(selectedPermissions.filter((id) => id !== permissionName));
        } else {
            onChange([...selectedPermissions, permissionName]);
        }
    };

    const handleGroupToggle = (groupPermissions: Permission[]) => {
        const allNames = groupPermissions.map(p => p.name);
        const allSelected = allNames.every(name => selectedPermissions.includes(name));

        if (allSelected) {
            // Deselect all
            onChange(selectedPermissions.filter(name => !allNames.includes(name)));
        } else {
            // Select all (merge unique)
            const newSelection = [...new Set([...selectedPermissions, ...allNames])];
            onChange(newSelection);
        }
    };

    const handleMarkAll = () => {
        const allNames = permissions.map(p => p.name);
        onChange(allNames);
    };

    const handleViewOnly = () => {
        const viewPermNames = permissions
            .filter(p => p.name.endsWith('.view'))
            .map(p => p.name);
        onChange(viewPermNames);
    };

    const handleRevoke = () => {
        onChange([]);
    };

    if (loading) {
        return (
            <div className="flex justify-center p-4">
                <Loader2 className="w-6 h-6 animate-spin" />
            </div>
        );
    }

    // Group permissions by prefix (e.g. "admin", "order", "product")
    const groupedPermissions: Record<string, Permission[]> = {};
    permissions.forEach((perm) => {
        const prefix = perm.name.split('.')[0];
        // Format group name: audit_log -> Audit Log
        const formatGroup = (str: string) =>
            str.split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');

        const groupName = formatGroup(prefix);

        if (!groupedPermissions[groupName]) {
            groupedPermissions[groupName] = [];
        }
        groupedPermissions[groupName].push(perm);
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium text-foreground">Permissions</h3>
                    <p className="text-sm text-muted-foreground">Manage user access to different modules.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleMarkAll}
                        disabled={disabled}
                    >
                        Mark All
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleViewOnly}
                        disabled={disabled}
                    >
                        View Only
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRevoke}
                        disabled={disabled}
                        className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                        Revoke
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(groupedPermissions).map(([group, groupPerms]) => {
                    const allGroupSelected = groupPerms.every(p => selectedPermissions.includes(p.name));
                    const someGroupSelected = groupPerms.some(p => selectedPermissions.includes(p.name)) && !allGroupSelected;

                    return (
                        <div key={group} className="border border-border/60 rounded-lg p-4 bg-muted/20 text-card-foreground shadow-sm">
                            <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/60">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        checked={allGroupSelected || (someGroupSelected ? "indeterminate" : false)}
                                        onCheckedChange={() => handleGroupToggle(groupPerms)}
                                        disabled={disabled}
                                        id={`group-${group}`}
                                        className="border-2 border-stone-400 data-[state=checked]:bg-primary data-[state=checked]:border-primary h-4 w-4"
                                    />
                                    <Label htmlFor={`group-${group}`} className="font-bold cursor-pointer text-sm">{group} Management</Label>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${allGroupSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                    {groupPerms.filter(p => selectedPermissions.includes(p.name)).length}/{groupPerms.length}
                                </span>
                            </div>

                            <div className="space-y-3">
                                {groupPerms.map((perm) => (
                                    <div key={perm.name} className="flex items-start gap-2 p-1 hover:bg-muted/30 rounded transition-colors">
                                        <Checkbox
                                            id={perm.name}
                                            checked={selectedPermissions.includes(perm.name)}
                                            onCheckedChange={() => handleToggle(perm.name)}
                                            disabled={disabled}
                                            className="border-2 border-stone-400 mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary h-4 w-4"
                                        />
                                        <div className="grid gap-1 leading-none">
                                            <Label htmlFor={perm.name} className="text-sm font-medium leading-none cursor-pointer">
                                                {perm.label || perm.name}
                                            </Label>
                                            <p className="text-[11px] text-muted-foreground">
                                                {perm.comment}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
