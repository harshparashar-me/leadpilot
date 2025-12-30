// Quick Filter Chips Component
import React from "react";
import { X } from "lucide-react";

interface QuickFilter {
    key: string;
    label: string;
    value: string;
}

interface QuickFiltersProps {
    filters: Record<string, string>;
    columns: Array<{ key: string; label: string }>;
    onRemove: (key: string) => void;
    onClearAll: () => void;
}

export const QuickFilters: React.FC<QuickFiltersProps> = ({ filters, columns, onRemove, onClearAll }) => {
    const activeFilters: QuickFilter[] = Object.entries(filters)
        .filter(([, value]) => value)
        .map(([key, value]) => ({
            key,
            label: columns.find(col => col.key === key)?.label || key,
            value: String(value),
        }));

    if (activeFilters.length === 0) return null;

    return (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border-b border-blue-100 flex-wrap">
            <span className="text-xs font-medium text-blue-700">Active Filters:</span>
            {activeFilters.map(filter => (
                <button
                    key={filter.key}
                    onClick={() => onRemove(filter.key)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium hover:bg-blue-200 transition-colors group"
                >
                    <span className="font-semibold">{filter.label}:</span>
                    <span>{filter.value}</span>
                    <X className="w-3 h-3 opacity-70 group-hover:opacity-100" />
                </button>
            ))}
            {activeFilters.length > 1 && (
                <button
                    onClick={onClearAll}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 underline"
                >
                    Clear All
                </button>
            )}
        </div>
    );
};

