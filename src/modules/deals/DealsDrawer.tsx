import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
    X, Phone, Mail,
    BadgeDollarSign, Tag, Briefcase
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { formatCurrency } from "../../components/table/utils/formatters";
import { ActivityFeed } from "../../components/ActivityFeed";
import { RecordNotes } from "../../components/RecordNotes";
import { RelatedRecordsSidebar } from "../../components/RelatedRecordsSidebar";
import { DocumentManager } from "../../components/DocumentManager";

// Define a local Deal interface based on use case
interface Deal {
    id: string;
    title: string;
    amount: number | null;
    status: string;
    phone?: string;
    email?: string;
    lead_source?: string;
    description?: string;
    assigned_to?: string;
    city?: string;
    requirement?: string;
    size?: string;
    created_at: string;
    modified_at?: string;
}

interface DealsDrawerProps {
    deal: Deal | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate?: () => void;
}

const DealsDrawer: React.FC<DealsDrawerProps> = ({ deal, isOpen, onClose, onUpdate }) => {
    const [localDeal, setLocalDeal] = useState<Deal | null>(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<"overview" | "activity" | "notes" | "related">("overview");

    // Sidebar items
    const sidebarItems = [
        { id: "deal_info", label: "Deal Information" },
        { id: "attachments", label: "Attachments" },
    ];

    useEffect(() => {
        if (deal) {
            setLocalDeal({ ...deal });
            setHasChanges(false);
            setActiveTab("overview");
        }
    }, [deal]);

    const handleFieldChange = <K extends keyof Deal>(field: K, value: Deal[K]) => {
        if (!localDeal) return;
        setLocalDeal({ ...localDeal, [field]: value });
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (!localDeal || !hasChanges) return;
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from("deals")
                .update({
                    title: localDeal.title,
                    amount: localDeal.amount,
                    status: localDeal.status,
                    phone: localDeal.phone,
                    email: localDeal.email,
                    lead_source: localDeal.lead_source,
                    description: localDeal.description,
                    city: localDeal.city,
                    requirement: localDeal.requirement,
                    size: localDeal.size,
                    modified_at: new Date().toISOString(),
                })
                .eq("id", localDeal.id);

            if (error) throw error;

            setHasChanges(false);
            onUpdate?.();
        } catch (err) {
            console.error("Failed to save deal:", err);
            alert("Error saving deal.");
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

    if (!deal || !localDeal) return null;

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
                <Dialog.Content className="fixed right-0 top-0 h-full w-[85%] bg-gray-50 shadow-2xl z-50 outline-none flex flex-col font-sans">

                    {/* 1. Header Area */}
                    <div className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm z-20">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
                                <Briefcase size={24} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-bold text-gray-900">{localDeal.title}</h2>
                                    <span className={`px-2 py-0.5 text-[10px] rounded border uppercase tracking-wide font-bold ${localDeal.status === 'Closed Won' ? 'bg-green-100 text-green-700 border-green-200' :
                                        localDeal.status === 'Closed Lost' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-blue-100 text-blue-700 border-blue-200'
                                        }`}>
                                        {localDeal.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 font-medium">
                                    {formatCurrency(localDeal.amount || 0)}
                                    <span className="text-gray-300">|</span>
                                    <button className="text-blue-600 text-xs hover:underline flex items-center gap-1">
                                        <Tag size={12} /> Add Tags
                                    </button>
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

                    {/* 2. Tab Switcher */}
                    <div className="bg-white border-b px-6">
                        <div className="flex gap-6 overflow-x-auto">
                            {["overview", "activity", "notes", "related"].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className={`py-3 text-sm font-semibold border-b-2 transition-colors capitalize ${activeTab === tab
                                        ? "border-blue-600 text-blue-600"
                                        : "border-transparent text-gray-600 hover:text-gray-900"
                                        }`}
                                >
                                    {tab === 'related' ? 'Related Records' : tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 flex overflow-hidden">
                        {/* 3. Left Sidebar (Only visible in Overview) */}
                        {activeTab === "overview" && (
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

                            {activeTab === "overview" && (
                                <div className="max-w-5xl mx-auto space-y-6 pb-20">

                                    {/* Deal Summary */}
                                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                                        <div className="grid grid-cols-2 gap-y-4 gap-x-12">
                                            <div className="flex items-center justify-between border-b border-dashed pb-2">
                                                <span className="text-xs text-gray-500 font-medium">Amount</span>
                                                <div className="flex items-center gap-1 w-1/2 justify-end">
                                                    <BadgeDollarSign size={14} className="text-gray-400" />
                                                    <input
                                                        type="number"
                                                        value={localDeal.amount || ""}
                                                        onChange={(e) => handleFieldChange("amount", e.target.value ? parseFloat(e.target.value) : null)}
                                                        className="text-sm text-gray-800 font-bold text-right border-none p-0 focus:ring-0 w-full"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between border-b border-dashed pb-2">
                                                <span className="text-xs text-gray-500 font-medium">Stage</span>
                                                <select
                                                    value={localDeal.status}
                                                    onChange={(e) => handleFieldChange("status", e.target.value)}
                                                    className="text-sm text-blue-600 font-semibold text-right border-none p-0 focus:ring-0 bg-transparent text-right w-1/2 cursor-pointer"
                                                >
                                                    {["Negotiation", "Closed Won", "Closed Lost", "Qualified", "Proposal Sent", "New"].map(s => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="flex items-center justify-between border-b border-dashed pb-2">
                                                <span className="text-xs text-gray-500 font-medium">Closing Date</span>
                                                <span className="text-sm text-gray-400 italic">--</span>
                                            </div>
                                            <div className="flex items-center justify-between border-b border-dashed pb-2">
                                                <span className="text-xs text-gray-500 font-medium">Deal Owner</span>
                                                <span className="text-sm text-gray-800 font-medium">{localDeal.assigned_to || "Unassigned"}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Deal Details */}
                                    <div id="deal_info" className="bg-white p-6 rounded-lg shadow-sm border">
                                        <h3 className="text-sm font-bold text-gray-800 mb-4 border-b pb-2">Deal Information</h3>
                                        <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                                            {/* Left Col */}
                                            <div className="space-y-4">
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[11px] text-gray-500 uppercase font-semibold">Deal Name</label>
                                                    <input
                                                        value={localDeal.title || ""}
                                                        onChange={(e) => handleFieldChange("title", e.target.value)}
                                                        className="text-sm border-b border-gray-200 focus:border-blue-500 outline-none pb-1"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[11px] text-gray-500 uppercase font-semibold">Phone</label>
                                                    <div className="flex items-center gap-2 border-b border-gray-200 pb-1">
                                                        <Phone size={14} className="text-gray-400" />
                                                        <input
                                                            value={localDeal.phone || ""}
                                                            onChange={(e) => handleFieldChange("phone", e.target.value)}
                                                            className="text-sm flex-1 outline-none"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[11px] text-gray-500 uppercase font-semibold">Email</label>
                                                    <div className="flex items-center gap-2 border-b border-gray-200 pb-1">
                                                        <Mail size={14} className="text-gray-400" />
                                                        <input
                                                            value={localDeal.email || ""}
                                                            onChange={(e) => handleFieldChange("email", e.target.value)}
                                                            className="text-sm flex-1 outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Right Col */}
                                            <div className="space-y-4">
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[11px] text-gray-500 uppercase font-semibold">Source</label>
                                                    <select
                                                        value={localDeal.lead_source || ""}
                                                        onChange={(e) => handleFieldChange("lead_source", e.target.value)}
                                                        className="text-sm border-b border-gray-200 focus:border-blue-500 outline-none pb-1 bg-transparent"
                                                    >
                                                        {["Website", "Referral", "Cold Call", "Social Media", "Ads"].map(s => (
                                                            <option key={s} value={s}>{s}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[11px] text-gray-500 uppercase font-semibold">Requirement</label>
                                                    <input
                                                        value={localDeal.requirement || ""}
                                                        onChange={(e) => handleFieldChange("requirement", e.target.value)}
                                                        className="text-sm border-b border-gray-200 focus:border-blue-500 outline-none pb-1"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                                        <h3 className="text-sm font-bold text-gray-800 mb-4 border-b pb-2">Description</h3>
                                        <textarea
                                            value={localDeal.description || ""}
                                            onChange={(e) => handleFieldChange("description", e.target.value)}
                                            className="w-full text-sm border border-gray-200 rounded p-3 focus:border-blue-500 outline-none h-24 resize-none"
                                            placeholder="Deal description..."
                                        />
                                    </div>

                                    {/* Attachments */}
                                    <div id="attachments" className="bg-white p-6 rounded-lg shadow-sm border">
                                        <h3 className="text-sm font-bold text-gray-800 mb-4">Attachments</h3>
                                        <DocumentManager entityType="deal" entityId={localDeal.id} />
                                    </div>

                                </div>
                            )}

                            {/* --- ACTIVITY VIEW --- */}
                            {activeTab === "activity" && (
                                <div className="max-w-3xl mx-auto py-6">
                                    <h3 className="text-lg font-bold text-gray-800 mb-6">Activity Timeline</h3>
                                    <ActivityFeed entityType="deal" entityId={localDeal.id} />
                                </div>
                            )}

                            {/* --- NOTES VIEW --- */}
                            {activeTab === "notes" && (
                                <div className="max-w-3xl mx-auto py-6">
                                    <h3 className="text-lg font-bold text-gray-800 mb-6">Notes</h3>
                                    <RecordNotes entityType="deal" entityId={localDeal.id} />
                                </div>
                            )}

                            {/* --- RELATED RECORDS VIEW --- */}
                            {activeTab === "related" && (
                                <div className="max-w-3xl mx-auto py-6">
                                    <h3 className="text-lg font-bold text-gray-800 mb-6">Related Records</h3>
                                    <RelatedRecordsSidebar entityType="deal" entityId={localDeal.id} />
                                </div>
                            )}

                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export default DealsDrawer;
