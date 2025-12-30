import React, { useState } from "react";
import { Search, Filter, SlidersHorizontal, Download, FileDown } from "lucide-react";
import { Column } from "./registry";
import * as Dialog from "@radix-ui/react-dialog";
import { SavedViews, SavedView } from "./SavedViews";
import { ViewDensity, DensityMode } from "./ViewDensity";

interface Props {
    query: string;
    setQuery: (q: string) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    columns: Column<Record<string, any>>[];
    columnVisibility: Record<string, boolean>;
    setColumnVisibility: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    filters: Record<string, string>;
    setFilters: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    onRefresh: () => void;
    onExport: (selectedColumns: string[]) => void;
    sort: { col: string; asc: boolean } | null;
    density: DensityMode;
    setDensity: (density: DensityMode) => void;
    onApplyView?: (view: SavedView) => void;
}

export function TableToolbar({
    query,
    setQuery,
    columns,
    columnVisibility,
    setColumnVisibility,
    filters,
    setFilters,
    onRefresh,
    onExport,
    sort,
    density,
    setDensity,
    onApplyView,
}: Props) {
    const [exportModalOpen, setExportModalOpen] = useState(false);
    const [exportColumns, setExportColumns] = useState<Record<string, boolean>>(() =>
        columns.reduce((acc, col) => ({ ...acc, [col.key]: true }), {})
    );

    // Filterable columns
    const filterColumns = columns.filter((c) => c.filterType === "select");

    const handleExport = () => {
        const selectedCols = Object.entries(exportColumns)
            .filter(([, selected]) => selected)
            .map(([key]) => key);
        onExport(selectedCols);
        setExportModalOpen(false);
    };

    return (
        <div className="flex items-center gap-2 p-3 border-b border-gray-200 bg-white flex-wrap">
            {/* Search Bar */}
            <div className="flex items-center gap-1 px-2 py-1.5 bg-white border rounded-md flex-1 max-w-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search records..."
                    className="outline-none text-sm w-full placeholder:text-gray-400"
                />
            </div>

            {/* Filters */}
            {filterColumns.map((col) => (
                <div key={col.key} className="relative group">
                    <select
                        className="appearance-none pl-2 pr-8 py-1.5 text-xs font-medium border rounded-md bg-white hover:bg-gray-50 cursor-pointer outline-none focus:border-blue-500 text-gray-700"
                        value={filters[col.key] || ""}
                        onChange={(e) => {
                            const newFilters = { ...filters };
                            if (e.target.value) newFilters[col.key] = e.target.value;
                            else delete newFilters[col.key];
                            setFilters(newFilters);
                        }}
                    >
                        <option value="">{col.label}: All</option>
                        {col.filterOptions?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                    <Filter className="w-3 h-3 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
            ))}

            <div className="flex-1" />

            {/* Saved Views */}
            {onApplyView && (
                <SavedViews
                    currentFilters={filters}
                    currentColumnVisibility={columnVisibility}
                    currentSort={sort}
                    onApplyView={onApplyView}
                />
            )}

            {/* View Density */}
            <ViewDensity density={density} setDensity={setDensity} />

            {/* Column Visibility */}
            <div className="relative group">
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border rounded-md text-gray-700 hover:bg-gray-50">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    View
                </button>

                <div className="absolute right-0 top-full mt-1 w-48 bg-white border rounded-lg shadow-lg hidden group-hover:block z-50 p-1">
                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">Toggle Columns</div>
                    {columns.map(col => (
                        <label key={col.key} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
                            <input
                                type="checkbox"
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                checked={columnVisibility[col.key] !== false}
                                onChange={(e) => setColumnVisibility(prev => ({
                                    ...prev,
                                    [col.key]: e.target.checked
                                }))}
                            />
                            <span className="text-sm text-gray-700">{col.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Export Button */}
            <button
                onClick={() => setExportModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border rounded-md text-gray-700 hover:bg-gray-50"
            >
                <FileDown className="w-3.5 h-3.5" />
                Export
            </button>

            {/* Export Modal */}
            <Dialog.Root open={exportModalOpen} onOpenChange={setExportModalOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] bg-white rounded-lg shadow-xl z-50 p-0 outline-none">
                        <div className="p-4 border-b">
                            <Dialog.Title className="text-sm font-semibold">Export Data</Dialog.Title>
                            <p className="text-xs text-gray-500 mt-1">Select columns to include in export</p>
                        </div>

                        <div className="p-4 max-h-96 overflow-y-auto">
                            <div className="space-y-2">
                                {columns.map(col => (
                                    <label key={col.key} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            checked={exportColumns[col.key] !== false}
                                            onChange={(e) => setExportColumns(prev => ({
                                                ...prev,
                                                [col.key]: e.target.checked
                                            }))}
                                        />
                                        <span className="text-sm text-gray-700">{col.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 border-t flex justify-end gap-2">
                            <button
                                onClick={() => setExportModalOpen(false)}
                                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-md"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleExport}
                                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-1.5"
                            >
                                <Download className="w-3.5 h-3.5" />
                                Export to CSV
                            </button>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    );
}
