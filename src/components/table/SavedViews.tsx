// Saved Views Management
import React, { useState } from "react";
import { Save, Star, Trash2 } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

export interface SavedView {
    id: string;
    name: string;
    filters: Record<string, string>;
    columnVisibility: Record<string, boolean>;
    sort: { col: string; asc: boolean } | null;
    isDefault?: boolean;
}

interface SavedViewsProps {
    currentFilters: Record<string, string>;
    currentColumnVisibility: Record<string, boolean>;
    currentSort: { col: string; asc: boolean } | null;
    onApplyView: (view: SavedView) => void;
}

export const SavedViews: React.FC<SavedViewsProps> = ({
    currentFilters,
    currentColumnVisibility,
    currentSort,
    onApplyView,
}) => {
    const [views, setViews] = useState<SavedView[]>(() => {
        const saved = localStorage.getItem("table_saved_views");
        return saved ? JSON.parse(saved) : [];
    });
    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [viewName, setViewName] = useState("");

    const saveView = () => {
        if (!viewName.trim()) return;

        const newView: SavedView = {
            id: Date.now().toString(),
            name: viewName,
            filters: currentFilters,
            columnVisibility: currentColumnVisibility,
            sort: currentSort,
        };

        const updated = [...views, newView];
        setViews(updated);
        localStorage.setItem("table_saved_views", JSON.stringify(updated));
        setViewName("");
        setSaveModalOpen(false);
    };

    const deleteView = (id: string) => {
        const updated = views.filter(v => v.id !== id);
        setViews(updated);
        localStorage.setItem("table_saved_views", JSON.stringify(updated));
    };

    const setDefaultView = (id: string) => {
        const updated = views.map(v => ({
            ...v,
            isDefault: v.id === id,
        }));
        setViews(updated);
        localStorage.setItem("table_saved_views", JSON.stringify(updated));
    };

    return (
        <div className="flex items-center gap-2">
            {/* Saved Views Dropdown */}
            {views.length > 0 && (
                <div className="relative group">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border rounded-md text-gray-700 hover:bg-gray-50">
                        <Star className="w-3.5 h-3.5" />
                        Views ({views.length})
                    </button>

                    <div className="absolute left-0 top-full mt-1 w-64 bg-white border rounded-lg shadow-lg hidden group-hover:block z-50 p-2">
                        <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 border-b mb-1">
                            Saved Views
                        </div>
                        <div className="max-h-64 overflow-y-auto space-y-1">
                            {views.map(view => (
                                <div
                                    key={view.id}
                                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded group/item"
                                >
                                    <button
                                        onClick={() => onApplyView(view)}
                                        className="flex-1 text-left text-sm text-gray-700 flex items-center gap-1"
                                    >
                                        {view.isDefault && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                                        {view.name}
                                    </button>
                                    <button
                                        onClick={() => setDefaultView(view.id)}
                                        className="opacity-0 group-hover/item:opacity-100 p-1 hover:bg-gray-200 rounded"
                                        title="Set as default"
                                    >
                                        <Star className="w-3 h-3" />
                                    </button>
                                    <button
                                        onClick={() => deleteView(view.id)}
                                        className="opacity-0 group-hover/item:opacity-100 p-1 hover:bg-red-100 text-red-600 rounded"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Save Current View Button */}
            <button
                onClick={() => setSaveModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border rounded-md text-gray-700 hover:bg-gray-50"
            >
                <Save className="w-3.5 h-3.5" />
                Save View
            </button>

            {/* Save View Modal */}
            <Dialog.Root open={saveModalOpen} onOpenChange={setSaveModalOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] bg-white rounded-lg shadow-xl z-50 p-0 outline-none">
                        <div className="p-4 border-b">
                            <Dialog.Title className="text-sm font-semibold">Save Current View</Dialog.Title>
                            <p className="text-xs text-gray-500 mt-1">
                                Save your current filters, sort, and column visibility
                            </p>
                        </div>

                        <div className="p-4">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                View Name
                            </label>
                            <input
                                type="text"
                                value={viewName}
                                onChange={(e) => setViewName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && saveView()}
                                placeholder="e.g., My Hot Leads"
                                className="w-full text-sm px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-200 outline-none"
                                autoFocus
                            />
                        </div>

                        <div className="p-4 border-t flex justify-end gap-2">
                            <button
                                onClick={() => setSaveModalOpen(false)}
                                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-md"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveView}
                                disabled={!viewName.trim()}
                                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save className="w-3.5 h-3.5" />
                                Save View
                            </button>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    );
};
