import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
    X, Phone, Mail,
    User, Briefcase, MapPin
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { ActivityFeed } from "../../components/ActivityFeed";
import { RecordNotes } from "../../components/RecordNotes";
import { RelatedRecordsSidebar } from "../../components/RelatedRecordsSidebar";
import { DocumentManager } from "../../components/DocumentManager";

interface Contact {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    position: string | null;
    city: string | null;
    assigned_to: string | null;
    created_at: string;
    modified_at?: string;
}

interface ContactsDrawerProps {
    contact: Contact | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate?: () => void;
}

const ContactsDrawer: React.FC<ContactsDrawerProps> = ({ contact, isOpen, onClose, onUpdate }) => {
    const [localContact, setLocalContact] = useState<Contact | null>(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<"overview" | "activity" | "notes" | "related">("overview");

    // Sidebar items
    const sidebarItems = [
        { id: "contact_info", label: "Contact Information" },
        { id: "attachments", label: "Attachments" },
    ];

    useEffect(() => {
        if (contact) {
            setLocalContact({ ...contact });
            setHasChanges(false);
            setActiveTab("overview");
        }
    }, [contact]);

    const handleFieldChange = <K extends keyof Contact>(field: K, value: Contact[K]) => {
        if (!localContact) return;
        setLocalContact({ ...localContact, [field]: value });
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (!localContact || !hasChanges) return;
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from("contacts")
                .update({
                    full_name: localContact.full_name,
                    email: localContact.email,
                    phone: localContact.phone,
                    position: localContact.position,
                    city: localContact.city,
                    assigned_to: localContact.assigned_to,
                    modified_at: new Date().toISOString(),
                })
                .eq("id", localContact.id);

            if (error) throw error;

            setHasChanges(false);
            onUpdate?.();
        } catch (err) {
            console.error("Failed to save contact:", err);
            alert("Error saving contact.");
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

    if (!contact || !localContact) return null;

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
                <Dialog.Content className="fixed right-0 top-0 h-full w-[85%] bg-gray-50 shadow-2xl z-50 outline-none flex flex-col font-sans">

                    {/* 1. Header Area */}
                    <div className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm z-20">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                                {localContact.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-bold text-gray-900">{localContact.full_name}</h2>
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded border uppercase tracking-wide">
                                        {localContact.position || "Contact"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                    {localContact.email && <span>{localContact.email}</span>}
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
                                    onClick={() => setActiveTab(tab as "overview" | "activity" | "notes" | "related")}
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

                                    {/* Summary Card */}
                                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                                        <div className="grid grid-cols-2 gap-y-4 gap-x-12">
                                            <div className="flex items-center justify-between border-b border-dashed pb-2">
                                                <span className="text-xs text-gray-500 font-medium">Full Name</span>
                                                <input
                                                    value={localContact.full_name}
                                                    onChange={(e) => handleFieldChange("full_name", e.target.value)}
                                                    className="text-sm text-gray-800 font-bold text-right border-none p-0 focus:ring-0 w-1/2"
                                                />
                                            </div>
                                            <div className="flex items-center justify-between border-b border-dashed pb-2">
                                                <span className="text-xs text-gray-500 font-medium">Owner</span>
                                                <span className="text-sm text-gray-800 font-medium">{localContact.assigned_to || "Unassigned"}</span>
                                            </div>
                                            <div className="flex items-center justify-between border-b border-dashed pb-2">
                                                <span className="text-xs text-gray-500 font-medium">Email</span>
                                                <div className="flex items-center gap-1 justify-end w-1/2">
                                                    <Mail size={14} className="text-gray-400" />
                                                    <input
                                                        value={localContact.email || ""}
                                                        onChange={(e) => handleFieldChange("email", e.target.value)}
                                                        className="text-sm text-blue-600 font-medium text-right border-none p-0 focus:ring-0 w-full"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between border-b border-dashed pb-2">
                                                <span className="text-xs text-gray-500 font-medium">Phone</span>
                                                <div className="flex items-center gap-1 justify-end w-1/2">
                                                    <Phone size={14} className="text-gray-400" />
                                                    <input
                                                        value={localContact.phone || ""}
                                                        onChange={(e) => handleFieldChange("phone", e.target.value)}
                                                        className="text-sm text-gray-800 font-medium text-right border-none p-0 focus:ring-0 w-full"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contact Details */}
                                    <div id="contact_info" className="bg-white p-6 rounded-lg shadow-sm border">
                                        <h3 className="text-sm font-bold text-gray-800 mb-4 border-b pb-2">Contact Information</h3>
                                        <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                                            {/* Left Col */}
                                            <div className="space-y-4">
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[11px] text-gray-500 uppercase font-semibold">Position</label>
                                                    <div className="flex items-center gap-2 border-b border-gray-200 pb-1">
                                                        <Briefcase size={14} className="text-gray-400" />
                                                        <input
                                                            value={localContact.position || ""}
                                                            onChange={(e) => handleFieldChange("position", e.target.value)}
                                                            className="text-sm flex-1 outline-none"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[11px] text-gray-500 uppercase font-semibold">City</label>
                                                    <div className="flex items-center gap-2 border-b border-gray-200 pb-1">
                                                        <MapPin size={14} className="text-gray-400" />
                                                        <input
                                                            value={localContact.city || ""}
                                                            onChange={(e) => handleFieldChange("city", e.target.value)}
                                                            className="text-sm flex-1 outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Right Col */}
                                            <div className="space-y-4">
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[11px] text-gray-500 uppercase font-semibold">Assigned To</label>
                                                    <div className="flex items-center gap-2 border-b border-gray-200 pb-1">
                                                        <User size={14} className="text-gray-400" />
                                                        <input
                                                            disabled
                                                            value={localContact.assigned_to || ""}
                                                            className="text-sm flex-1 outline-none bg-transparent text-gray-500"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Attachments */}
                                    <div id="attachments" className="bg-white p-6 rounded-lg shadow-sm border">
                                        <h3 className="text-sm font-bold text-gray-800 mb-4">Attachments</h3>
                                        <DocumentManager entityType="contact" entityId={localContact.id} />
                                    </div>

                                </div>
                            )}

                            {/* --- ACTIVITY VIEW --- */}
                            {activeTab === "activity" && (
                                <div className="max-w-3xl mx-auto py-6">
                                    <h3 className="text-lg font-bold text-gray-800 mb-6">Activity Timeline</h3>
                                    <ActivityFeed entityType="contact" entityId={localContact.id} />
                                </div>
                            )}

                            {/* --- NOTES VIEW --- */}
                            {activeTab === "notes" && (
                                <div className="max-w-3xl mx-auto py-6">
                                    <h3 className="text-lg font-bold text-gray-800 mb-6">Notes</h3>
                                    <RecordNotes entityType="contact" entityId={localContact.id} />
                                </div>
                            )}

                            {/* --- RELATED RECORDS VIEW --- */}
                            {activeTab === "related" && (
                                <div className="max-w-3xl mx-auto py-6">
                                    <h3 className="text-lg font-bold text-gray-800 mb-6">Related Records</h3>
                                    <RelatedRecordsSidebar entityType="contact" entityId={localContact.id} />
                                </div>
                            )}
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export default ContactsDrawer;
