import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (p: number) => void;
    onPageSizeChange: (s: number) => void;
}

export function TablePagination({
    page,
    pageSize,
    total,
    onPageChange,
    onPageSizeChange,
}: Props) {
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, total);
    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="flex items-center justify-between px-3 py-2 border-t bg-gray-50 text-sm text-gray-600">

            {/* Page Size Selector */}
            <div className="flex items-center gap-2">
                <span>Rows per page:</span>
                <select
                    value={pageSize}
                    onChange={(e) => onPageSizeChange(Number(e.target.value))}
                    className="bg-white border rounded px-1.5 py-1 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={30}>30</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                </select>
            </div>

            {/* Info & Navigation */}
            <div className="flex items-center gap-4">
                <span>
                    {total === 0 ? "0-0 of 0" : `${start}-${end} of ${total}`}
                </span>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onPageChange(page - 1)}
                        disabled={page <= 1}
                        className="p-1 rounded hover:bg-white hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onPageChange(page + 1)}
                        disabled={page >= totalPages}
                        className="p-1 rounded hover:bg-white hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
