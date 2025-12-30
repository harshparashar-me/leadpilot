import React, { useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Plus, UserPlus, Briefcase, CheckSquare, FileText } from "lucide-react";
import AddLeadModal from "../modules/leads/AddLeadModal";

// NOTE: We'll need access to other modals eventually, 
// for now we'll stub them or reuse existing ones if exportable.

export const GlobalQuickAdd: React.FC = () => {
    const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);

    // Placeholder states for other modals
    // const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);

    return (
        <>
            <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                    <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500">
                        <Plus size={16} />
                        <span className="hidden sm:inline">Quick Add</span>
                    </button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                    <DropdownMenu.Content
                        className="min-w-[220px] bg-white rounded-lg shadow-xl p-2 border border-gray-100 animate-in fade-in zoom-in-95 duration-200 z-50 mr-4 mt-2 origin-top-right"
                        align="end"
                        sideOffset={5}
                    >
                        <DropdownMenu.Label className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 py-1.5 mb-1">
                            Create New
                        </DropdownMenu.Label>

                        <DropdownMenu.Item
                            onSelect={() => setIsAddLeadOpen(true)}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 rounded-md hover:bg-blue-50 hover:text-blue-700 cursor-pointer outline-none transition-colors"
                        >
                            <UserPlus size={16} />
                            <span className="font-medium">Lead</span>
                            <span className="ml-auto text-[10px] text-gray-400 font-mono tracking-tighter border px-1 rounded bg-gray-50">L</span>
                        </DropdownMenu.Item>

                        <DropdownMenu.Item
                            onClick={() => alert("Task modal coming next!")}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 rounded-md hover:bg-blue-50 hover:text-blue-700 cursor-pointer outline-none transition-colors"
                        >
                            <CheckSquare size={16} />
                            <span className="font-medium">Task</span>
                            <span className="ml-auto text-[10px] text-gray-400 font-mono tracking-tighter border px-1 rounded bg-gray-50">T</span>
                        </DropdownMenu.Item>

                        <DropdownMenu.Item
                            onClick={() => alert("Deal modal coming next!")}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 rounded-md hover:bg-blue-50 hover:text-blue-700 cursor-pointer outline-none transition-colors"
                        >
                            <Briefcase size={16} />
                            <span className="font-medium">Deal</span>
                        </DropdownMenu.Item>

                        <DropdownMenu.Separator className="h-px bg-gray-100 my-1" />

                        <DropdownMenu.Item
                            onClick={() => alert("Note modal coming next!")}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 rounded-md hover:bg-blue-50 hover:text-blue-700 cursor-pointer outline-none transition-colors"
                        >
                            <FileText size={16} />
                            <span className="font-medium">Note</span>
                        </DropdownMenu.Item>
                    </DropdownMenu.Content>
                </DropdownMenu.Portal>
            </DropdownMenu.Root>

            {/* Modals rendered here to be available globally */}
            <AddLeadModal
                open={isAddLeadOpen}
                onClose={() => setIsAddLeadOpen(false)}
                onSave={() => {
                    // Ideally trigger a global refresh or toast
                    setIsAddLeadOpen(false);
                }}
            />
        </>
    );
};
