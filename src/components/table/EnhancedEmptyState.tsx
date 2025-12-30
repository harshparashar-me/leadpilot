// Enhanced Empty State Component
import React from "react";
import { Inbox, Filter, Search, Plus } from "lucide-react";

interface EnhancedEmptyStateProps {
    onClearFilters?: () => void;
    onAddNew?: () => void;
    hasFilters?: boolean;
    searchTerm?: string;
    message?: string;
    subMessage?: string;
}

export const EnhancedEmptyState: React.FC<EnhancedEmptyStateProps & { colSpan: number }> = ({
    onClearFilters,
    onAddNew,
    hasFilters = false,
    searchTerm = "",
    message = "No records found",
    subMessage,
    colSpan,
}) => {
    return (
        <tr>
            <td colSpan={colSpan} className="py-16 text-center">
                <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                        <Inbox className="w-8 h-8 text-gray-400" />
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-gray-900">{message}</h3>
                        <p className="text-sm text-gray-500">
                            {subMessage || (
                                hasFilters || searchTerm
                                    ? "Try adjusting your filters or search terms"
                                    : "Get started by adding your first record"
                            )}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        {(hasFilters || searchTerm) && onClearFilters && (
                            <button
                                onClick={onClearFilters}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <Filter className="w-4 h-4" />
                                Clear Filters
                            </button>
                        )}

                        {onAddNew && (
                            <button
                                onClick={onAddNew}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add New
                            </button>
                        )}
                    </div>

                    {searchTerm && (
                        <div className="text-xs text-gray-400 flex items-center gap-1">
                            <Search className="w-3 h-3" />
                            Searching for: <span className="font-medium">{searchTerm}</span>
                        </div>
                    )}
                </div>
            </td>
        </tr>
    );
};

