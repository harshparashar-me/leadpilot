import React, { useState, useEffect } from "react";
import { Command } from "cmdk";
import { useNavigate } from "react-router-dom";
import {
    Search,
    LayoutDashboard,
    Users,
    Contact,
    Handshake,
    Settings,
    Plus,
    Moon,
    LogOut,
    FileText,
    CheckSquare
} from "lucide-react";
import { useTheme } from "../store/useTheme";

export const CommandPalette: React.FC = () => {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { themeColor, setThemeColor } = useTheme(); // Assuming you might use this for theming

    // Toggle with Ctrl+K or Cmd+K
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    return (
        <Command.Dialog
            open={open}
            onOpenChange={setOpen}
            label="Global Command Menu"
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[20vh]"
        >
            <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-200">

                {/* Search Input */}
                <div className="flex items-center border-b px-4 py-3 gap-3">
                    <Search className="w-5 h-5 text-gray-400" />
                    <Command.Input
                        placeholder="Type a command or search..."
                        className="flex-1 outline-none text-lg text-gray-900 placeholder:text-gray-400 font-medium"
                    />
                    <div className="flex gap-1">
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-bold border">ESC</span>
                    </div>
                </div>

                {/* List */}
                <Command.List className="max-h-[60vh] overflow-y-auto overflow-x-hidden p-2 scroll-smooth">
                    <Command.Empty className="py-10 text-center text-sm text-gray-500">
                        No results found.
                    </Command.Empty>

                    {/* Group: Navigation */}
                    <Command.Group heading="Go to" className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-2 mt-2">
                        <Command.Item
                            onSelect={() => runCommand(() => navigate("/dashboard"))}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 aria-selected:bg-blue-50 aria-selected:text-blue-700 cursor-pointer transition-colors"
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            <span>Dashboard</span>
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate("/leads"))}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 aria-selected:bg-blue-50 aria-selected:text-blue-700 cursor-pointer transition-colors"
                        >
                            <Users className="w-4 h-4" />
                            <span>Leads</span>
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate("/deals"))}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 aria-selected:bg-blue-50 aria-selected:text-blue-700 cursor-pointer transition-colors"
                        >
                            <Handshake className="w-4 h-4" />
                            <span>Deals</span>
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate("/contacts"))}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 aria-selected:bg-blue-50 aria-selected:text-blue-700 cursor-pointer transition-colors"
                        >
                            <Contact className="w-4 h-4" />
                            <span>Contacts</span>
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate("/tasks"))}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 aria-selected:bg-blue-50 aria-selected:text-blue-700 cursor-pointer transition-colors"
                        >
                            <CheckSquare className="w-4 h-4" />
                            <span>Tasks</span>
                        </Command.Item>
                    </Command.Group>

                    <Command.Separator className="h-[1px] bg-gray-100 my-2" />

                    {/* Group: Actions */}
                    <Command.Group heading="Quick Actions" className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-2">
                        <Command.Item
                            onSelect={() => runCommand(() => alert("Feature coming soon! Use the + button for now."))}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 aria-selected:bg-blue-50 aria-selected:text-blue-700 cursor-pointer transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Create New Lead</span>
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => alert("Feature coming soon! Use the + button for now."))}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 aria-selected:bg-blue-50 aria-selected:text-blue-700 cursor-pointer transition-colors"
                        >
                            <FileText className="w-4 h-4" />
                            <span>Create New Task</span>
                        </Command.Item>
                    </Command.Group>

                    <Command.Separator className="h-[1px] bg-gray-100 my-2" />

                    {/* Group: System */}
                    <Command.Group heading="System" className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-2">
                        <Command.Item
                            onSelect={() => runCommand(() => navigate("/settings"))}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 aria-selected:bg-blue-50 aria-selected:text-blue-700 cursor-pointer transition-colors"
                        >
                            <Settings className="w-4 h-4" />
                            <span>Settings</span>
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => window.location.reload())}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 aria-selected:bg-blue-50 aria-selected:text-blue-700 cursor-pointer transition-colors"
                        >
                            <Moon className="w-4 h-4" />
                            <span>Reload App</span>
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate("/logout"))}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 aria-selected:bg-red-50 aria-selected:text-red-700 cursor-pointer transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Log Out</span>
                        </Command.Item>
                    </Command.Group>

                </Command.List>

                <div className="border-t bg-gray-50 px-4 py-2 flex items-center justify-between text-xs text-gray-400">
                    <span> Use <strong>↑</strong> <strong>↓</strong> to navigate</span>
                    <span><strong>↵</strong> to select</span>
                </div>
            </div>
        </Command.Dialog>
    );
};
