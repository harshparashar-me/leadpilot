// Row Actions Menu Component
import React from "react";
import { MoreVertical, Edit, Trash2, Copy, Eye, ExternalLink } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

interface RowActionsMenuProps {
    row: Record<string, unknown>;
    onEdit?: (row: Record<string, unknown>) => void;
    onDelete?: (row: Record<string, unknown>) => void;
    onView?: (row: Record<string, unknown>) => void;
    onCopy?: (row: Record<string, unknown>) => void;
    customActions?: Array<{
        label: string;
        icon?: React.ReactNode;
        onClick: (row: Record<string, unknown>) => void;
        className?: string;
    }>;
}

export const RowActionsMenu: React.FC<RowActionsMenuProps> = ({
    row,
    onEdit,
    onDelete,
    onView,
    onCopy,
    customActions = [],
}) => {
    const handleCopyRow = () => {
        if (onCopy) {
            onCopy(row);
        } else {
            // Default: copy row ID or first field
            const rowId = row.id ? String(row.id) : JSON.stringify(row);
            navigator.clipboard.writeText(rowId);
        }
    };

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button
                    className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition"
                    onClick={(e) => e.stopPropagation()}
                >
                    <MoreVertical className="w-4 h-4" />
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    className="min-w-[180px] bg-white rounded-lg shadow-lg border border-gray-200 p-1 z-50"
                    align="end"
                    onClick={(e) => e.stopPropagation()}
                >
                    {onView && (
                        <DropdownMenu.Item
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer outline-none"
                            onSelect={(e) => {
                                e.preventDefault();
                                onView(row);
                            }}
                        >
                            <Eye className="w-4 h-4" />
                            View Details
                        </DropdownMenu.Item>
                    )}

                    {onEdit && (
                        <DropdownMenu.Item
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer outline-none"
                            onSelect={(e) => {
                                e.preventDefault();
                                onEdit(row);
                            }}
                        >
                            <Edit className="w-4 h-4" />
                            Edit
                        </DropdownMenu.Item>
                    )}

                    {onCopy && (
                        <DropdownMenu.Item
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer outline-none"
                            onSelect={(e) => {
                                e.preventDefault();
                                handleCopyRow();
                            }}
                        >
                            <Copy className="w-4 h-4" />
                            Copy
                        </DropdownMenu.Item>
                    )}

                    {customActions.map((action, idx) => (
                        <DropdownMenu.Item
                            key={idx}
                            className={`flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer outline-none ${action.className || ""}`}
                            onSelect={(e) => {
                                e.preventDefault();
                                action.onClick(row);
                            }}
                        >
                            {action.icon || <ExternalLink className="w-4 h-4" />}
                            {action.label}
                        </DropdownMenu.Item>
                    ))}

                    {onDelete && (
                        <>
                            <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />
                            <DropdownMenu.Item
                                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded cursor-pointer outline-none"
                                onSelect={(e) => {
                                    e.preventDefault();
                                    if (confirm("Are you sure you want to delete this record?")) {
                                        onDelete(row);
                                    }
                                }}
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </DropdownMenu.Item>
                        </>
                    )}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
};

