import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
    X, Phone, Globe, Building,
    Briefcase, MapPin, Search
} from "lucide-react";
import { supabase } from "../../lib/supabase";

interface Account {
    id: string;
    name: string;
    phone: string | null;
    website: string | null;
    industry: string | null;
    city: string | null;
    assigned_to: string | null;
    created_at: string;
    modified_at?: string;
}

interface AccountsDrawerProps {
    account: Account | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate?: () => void;
}

const AccountsDrawer: React.FC<AccountsDrawerProps> = ({ account, isOpen, onClose, onUpdate }) => {
    const [localAccount, setLocalAccount] = useState<Account | null>(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [viewMode, setViewMode] = useState<"overview" | "timeline">("overview");

    // Sidebar items
    const sidebarItems = [
        { id: "account_info", label: "Account Information" },
        { id: "notes", label: "Notes" },
        { id: "attachments", label: "Attachments" },
    ];

    useEffect(() => {
        if (account) {
            setLocalAccount({ ...account });
            setHasChanges(false);
        }
    }, [account]);

    const handleFieldChange = <K extends keyof Account>(field: K, value: Account[K]) => {
        if (!localAccount) return;
        setLocalAccount({ ...localAccount, [field]: value });
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (!localAccount || !hasChanges) return;
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from("accounts")
                .update({
                    name: localAccount.name,
                    phone: localAccount.phone,
                    website: localAccount.website,
                    industry: localAccount.industry,
                    city: localAccount.city,
                    assigned_to: localAccount.assigned_to,
                    modified_at: new Date().toISOString(),
                })
                .eq("id", localAccount.id);

            if (error) throw error;

            setHasChanges(false);
            onUpdate?.();
        } catch (err) {
            console.error("Failed to save account:", err);
            alert("Error saving account.");
        } finally {
            setIsSaving(false);
        }
    };

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    if (!account || !localAccount) return null;

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
                <Dialog.Content className="fixed right-0 top-0 h-full w-[85%] bg-gray-50 shadow-2xl z-50 outline-none flex flex-col font-sans">

                    {/* 1. Header Area */}
                    <div className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm z-20">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md">
                                <Building size={24} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-bold text-gray-900">{localAccount.name}</h2>
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded border uppercase tracking-wide">
                                        {localAccount.industry || "Account"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                    {localAccount.website && (
                                        <span className="flex items-center gap-1 hover:text-blue-600 cursor-pointer">
                                            <Globe size={12} /> {localAccount.website}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {hasChanges && (
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700 transition"
                                >
                                    {isSaving ? "Saving..." : "Save"}
                                </button>
                            )}
                            <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded hover:bg-gray-50 transition">
                                Send Email
                            </button>
                            <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500" onClick={onClose}>
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    {/* 2. Toggle Switcher */}
                    <div className="bg-white border-b px-6">
                        <div className="flex gap-6">
                            <button
                                onClick={() => setViewMode("overview")}
                                className={`py-3 text-sm font-semibold border-b-2 transition-colors ${viewMode === "overview" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-900"
                                    }`}
                            >
                                Overview
                            </button>
                            <button
                                onClick={() => setViewMode("timeline")}
                                className={`py-3 text-sm font-semibold border-b-2 transition-colors ${viewMode === "timeline" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-900"
                                    }`}
                            >
                                Timeline
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 flex overflow-hidden">
                        {/* 3. Left Sidebar */}
                        {viewMode === "overview" && (
                            <div className="w-56 bg-white border-r overflow-y-auto py-4 hidden md:block">
                                <div className="px-4 mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Related List</div>
                                <nav className="space-y-0.5">
                                    {sidebarItems.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => scrollToSection(item.id)}
                                            className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </nav>
                            </div>
                        )}

                        {/* 4. Main Content Area */}
                        <div className="flex-1 overflow-y-auto scroll-smooth bg-gray-50/50 p-6">
                            {viewMode === "timeline" ? (
                                <div className="flex items-center justify-center h-full text-gray-400 text-sm italic">
                                    Timeline view coming soon for Accounts...
                                </div>
                            ) : (
                                <div className="max-w-5xl mx-auto space-y-6 pb-20">

                                    {/* Summary Card */}
                                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                                        <div className="grid grid-cols-2 gap-y-4 gap-x-12">
                                            <div className="flex items-center justify-between border-b border-dashed pb-2">
                                                <span className="text-xs text-gray-500 font-medium">Account Name</span>
                                                <input
                                                    value={localAccount.name}
                                                    onChange={(e) => handleFieldChange("name", e.target.value)}
                                                    className="text-sm text-gray-800 font-bold text-right border-none p-0 focus:ring-0 w-1/2"
                                                />
                                            </div>
                                            <div className="flex items-center justify-between border-b border-dashed pb-2">
                                                <span className="text-xs text-gray-500 font-medium">Phone</span>
                                                <div className="flex items-center gap-1 justify-end w-1/2">
                                                    <Phone size={14} className="text-gray-400" />
                                                    <input
                                                        value={localAccount.phone || ""}
                                                        onChange={(e) => handleFieldChange("phone", e.target.value)}
                                                        className="text-sm text-gray-800 font-medium text-right border-none p-0 focus:ring-0 w-full"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between border-b border-dashed pb-2">
                                                <span className="text-xs text-gray-500 font-medium">Website</span>
                                                <div className="flex items-center gap-1 justify-end w-1/2">
                                                    <Globe size={14} className="text-gray-400" />
                                                    <input
                                                        value={localAccount.website || ""}
                                                        onChange={(e) => handleFieldChange("website", e.target.value)}
                                                        className="text-sm text-blue-600 font-medium text-right border-none p-0 focus:ring-0 w-full"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Account Details */}
                                    <div id="account_info" className="bg-white p-6 rounded-lg shadow-sm border">
                                        <h3 className="text-sm font-bold text-gray-800 mb-4 border-b pb-2">Account Information</h3>
                                        <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                                            {/* Left Col */}
                                            <div className="space-y-4">
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[11px] text-gray-500 uppercase font-semibold">Industry</label>
                                                    <div className="flex items-center gap-2 border-b border-gray-200 pb-1">
                                                        <Briefcase size={14} className="text-gray-400" />
                                                        <input
                                                            value={localAccount.industry || ""}
                                                            onChange={(e) => handleFieldChange("industry", e.target.value)}
                                                            className="text-sm flex-1 outline-none"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[11px] text-gray-500 uppercase font-semibold">City</label>
                                                    <div className="flex items-center gap-2 border-b border-gray-200 pb-1">
                                                        <MapPin size={14} className="text-gray-400" />
                                                        <input
                                                            value={localAccount.city || ""}
                                                            onChange={(e) => handleFieldChange("city", e.target.value)}
                                                            className="text-sm flex-1 outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Right Col */}
                                            <div className="space-y-4">
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[11px] text-gray-500 uppercase font-semibold">Account Owner</label>
                                                    <div className="flex items-center gap-2 border-b border-gray-200 pb-1">
                                                        <Search size={14} className="text-gray-400" />
                                                        <input
                                                            disabled
                                                            value={localAccount.assigned_to || ""}
                                                            className="text-sm flex-1 outline-none bg-transparent text-gray-500"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Notes Placeholder */}
                                    <div id="notes" className="bg-white p-6 rounded-lg shadow-sm border">
                                        <h3 className="text-sm font-bold text-gray-800 mb-4">Notes</h3>
                                        <div className="py-6 text-center text-xs text-gray-400 italic bg-gray-50 rounded border border-dashed">No notes added yet</div>
                                    </div>

                                    {/* Attachments Placeholder */}
                                    <div id="attachments" className="bg-white p-6 rounded-lg shadow-sm border">
                                        <h3 className="text-sm font-bold text-gray-800 mb-4">Attachments</h3>
                                        <div className="py-6 text-center text-xs text-gray-400 italic bg-gray-50 rounded border border-dashed">No attachments</div>
                                    </div>

                                </div>
                            )}
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export default AccountsDrawer;
