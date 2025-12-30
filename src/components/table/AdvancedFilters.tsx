// Advanced Column Filters Component
import React from "react";
import { Filter, X } from "lucide-react";
import { Column } from "./registry";

interface AdvancedFiltersProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    columns: Column<Record<string, any>>[];
    filters: Record<string, string>;
    setFilters: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
    columns,
    filters,
    setFilters,
}) => {
    const hasActiveFilters = Object.keys(filters).length > 0;

    const clearAllFilters = () => {
        setFilters({});
    };

    return (
        <div className="p-3 border-b bg-gray-50/50">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span className="text-xs font-semibold text-gray-700">Advanced Filters</span>
                </div>
                {hasActiveFilters && (
                    <button
                        onClick={clearAllFilters}
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                        <X className="w-3 h-3" />
                        Clear All
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {columns
                    .filter(col => col.filterType === "select" || col.filterType === "text")
                    .map(col => (
                        <div key={col.key} className="flex flex-col gap-1">
                            <label className="text-[10px] font-medium text-gray-600 uppercase">
                                {col.label}
                            </label>
                            {col.filterType === "select" && col.filterOptions ? (
                                <select
                                    value={filters[col.key] || ""}
                                    onChange={(e) => {
                                        const newFilters = { ...filters };
                                        if (e.target.value) {
                                            newFilters[col.key] = e.target.value;
                                        } else {
                                            delete newFilters[col.key];
                                        }
                                        setFilters(newFilters);
                                    }}
                                    className="text-xs px-2 py-1.5 border rounded-md bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-200 outline-none"
                                >
                                    <option value="">All</option>
                                    {col.filterOptions.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    value={filters[col.key] || ""}
                                    onChange={(e) => {
                                        const newFilters = { ...filters };
                                        if (e.target.value) {
                                            newFilters[col.key] = e.target.value;
                                        } else {
                                            delete newFilters[col.key];
                                        }
                                        setFilters(newFilters);
                                    }}
                                    placeholder={`Filter by ${col.label.toLowerCase()}...`}
                                    className="text-xs px-2 py-1.5 border rounded-md bg-white focus:ring-2 focus:ring-blue-200 outline-none"
                                />
                            )}
                        </div>
                    ))}
            </div>
        </div>
    );
};
