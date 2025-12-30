import React from "react";
import { Trash2, X, CheckCircle, Copy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
    selectedCount: number;
    onClear: () => void;
    onDelete: () => void;
}

export function BulkActions({ selectedCount, onClear, onDelete }: Props) {
    return (
        <AnimatePresence>
            {selectedCount > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl"
                >
                    <div className="flex items-center gap-2 font-medium">
                        <div className="bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center text-xs">
                            {selectedCount}
                        </div>
                        <span>Selected</span>
                    </div>

                    <div className="h-4 w-px bg-gray-600" />

                    <button
                        onClick={onDelete}
                        className="flex items-center gap-1.5 hover:text-red-400 transition"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                    </button>

                    <div className="h-4 w-px bg-gray-600" />

                    <button
                        onClick={() => {
                            const status = prompt("Enter new status:");
                            if (status) {
                                console.log("Bulk update status:", status, selectedCount, "items");
                                // In real app: call bulk update API
                            }
                        }}
                        className="flex items-center gap-1.5 hover:text-blue-400 transition"
                    >
                        <CheckCircle className="w-4 h-4" />
                        <span>Update Status</span>
                    </button>

                    <div className="h-4 w-px bg-gray-600" />

                    <button
                        onClick={() => {
                            const data = selectedCount + " selected rows";
                            navigator.clipboard.writeText(data);
                            alert("Copied selection info to clipboard");
                        }}
                        className="flex items-center gap-1.5 hover:text-blue-400 transition"
                    >
                        <Copy className="w-4 h-4" />
                        <span>Copy Info</span>
                    </button>

                    <button
                        onClick={onClear}
                        className="ml-2 p-1 hover:bg-gray-700 rounded-full transition"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
