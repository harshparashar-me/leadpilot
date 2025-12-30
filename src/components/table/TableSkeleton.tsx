import React from "react";
import { TableConfig } from "./registry";

interface Props {
    columns: TableConfig["columns"];
    rowCount?: number;
    showActions?: boolean;
}

export function TableSkeleton({ columns, rowCount = 10, showActions }: Props) {
    return (
        <>
            {Array.from({ length: rowCount }).map((_, i) => (
                <tr key={i} className="animate-pulse border-b border-gray-100">
                    {/* Checkbox Skeleton */}
                    <td className="p-0 border-r w-10 sticky left-0 bg-white z-20">
                        <div className="h-9 flex items-center justify-center">
                            <div className="w-4 h-4 bg-gray-200 rounded" />
                        </div>
                    </td>

                    {columns.map((c) => (
                        <td key={c.key} className="px-3 py-3" style={{ width: c.width }}>
                            <div
                                className="h-4 bg-gray-200 rounded"
                                style={{ width: Math.min(c.width || 100, 100) + "%" }}
                            />
                        </td>
                    ))}

                    {/* Actions Skeleton */}
                    {showActions && (
                        <td className="px-3 py-2 text-center sticky right-0 bg-white border-l z-20">
                            <div className="flex justify-center gap-2">
                                <div className="w-6 h-6 bg-gray-200 rounded" />
                                <div className="w-6 h-6 bg-gray-200 rounded" />
                            </div>
                        </td>
                    )}
                </tr>
            ))}
        </>
    );
}
