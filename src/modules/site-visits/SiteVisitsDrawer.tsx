import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
    X, Calendar, MapPin, User,
    Phone, Clock
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { formatDate } from "../../components/table/utils/formatters";

interface SiteVisit {
    id: string;
    lead_name: string;
    project: string;
    visit_date: string;
    visit_time: string | null;
    location: string | null;
    status: string;
    phone: string | null;
    assigned_to: string | null;
    created_at: string;
    modified_at?: string;
}

interface SiteVisitsDrawerProps {
    visit: SiteVisit | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate?: () => void;
}

const SiteVisitsDrawer: React.FC<SiteVisitsDrawerProps> = ({ visit, isOpen, onClose, onUpdate }) => {
    const [localVisit, setLocalVisit] = useState<SiteVisit | null>(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [viewMode, setViewMode] = useState<"overview" | "timeline">("overview");

    useEffect(() => {
        if (visit) {
            setLocalVisit({ ...visit });
            setHasChanges(false);
        }
    }, [visit]);

    const handleFieldChange = <K extends keyof SiteVisit>(field: K, value: SiteVisit[K]) => {
        if (!localVisit) return;
        setLocalVisit({ ...localVisit, [field]: value });
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (!localVisit || !hasChanges) return;
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from("site_visits")
                .update({
                    project: localVisit.project,
                    visit_date: localVisit.visit_date,
                    visit_time: localVisit.visit_time,
                    location: localVisit.location,
                    status: localVisit.status,
                    phone: localVisit.phone,
                    modified_at: new Date().toISOString(),
                })
                .eq("id", localVisit.id);

            if (error) throw error;

            setHasChanges(false);
            onUpdate?.();
        } catch (err) {
            console.error("Failed to save visit:", err);
            alert("Error saving visit.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!visit || !localVisit) return null;

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
                <Dialog.Content className="fixed right-0 top-0 h-full w-[85%] bg-gray-50 shadow-2xl z-50 outline-none flex flex-col font-sans">

                    {/* 1. Header Area */}
                    <div className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm z-20">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white shadow-md">
                                <MapPin size={24} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-bold text-gray-900">{localVisit.project || "Site Visit"}</h2>
                                    <span className={`px-2 py-0.5 text-[10px] rounded border uppercase tracking-wide font-bold ${localVisit.status === 'Completed' ? 'bg-green-100 text-green-700 border-green-200' :
                                        localVisit.status === 'Rescheduled' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-blue-100 text-blue-700 border-blue-200'
                                        }`}>
                                        {localVisit.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <User size={12} /> {localVisit.lead_name}
                                    </span>
                                    <span className="text-gray-300">|</span>
                                    <span className="flex items-center gap-1">
                                        <Calendar size={12} /> {formatDate(localVisit.visit_date)}
                                    </span>
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
                                Directions
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
                                    <button
                                        onClick={() => document.getElementById("visit_info")?.scrollIntoView({ behavior: 'smooth' })}
                                        className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                    >
                                        Visit Information
                                    </button>
                                    <button
                                        onClick={() => document.getElementById("notes")?.scrollIntoView({ behavior: 'smooth' })}
                                        className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                    >
                                        Notes
                                    </button>
                                </nav>
                            </div>
                        )}

                        {/* Main Content Area */}
                        <div className="flex-1 overflow-y-auto scroll-smooth bg-gray-50/50 p-6">
                            {viewMode === "timeline" ? (
                                <div className="flex items-center justify-center h-full text-gray-400 text-sm italic">
                                    Timeline view coming soon...
                                </div>
                            ) : (
                                <div className="max-w-4xl mx-auto space-y-6 pb-20">

                                    {/* Summary Card */}
                                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                                        <div className="grid grid-cols-2 gap-y-4 gap-x-12">
                                            <div className="flex items-center justify-between border-b border-dashed pb-2">
                                                <span className="text-xs text-gray-500 font-medium">Status</span>
                                                <select
                                                    value={localVisit.status}
                                                    onChange={(e) => handleFieldChange("status", e.target.value)}
                                                    className="text-sm text-blue-600 font-semibold text-right border-none p-0 focus:ring-0 bg-transparent w-1/2 cursor-pointer"
                                                >
                                                    {["Pending", "Completed", "Rescheduled"].map(s => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="flex items-center justify-between border-b border-dashed pb-2">
                                                <span className="text-xs text-gray-500 font-medium">Date</span>
                                                <input
                                                    type="date"
                                                    value={localVisit.visit_date}
                                                    onChange={(e) => handleFieldChange("visit_date", e.target.value)}
                                                    className="text-sm text-gray-800 font-medium text-right border-none p-0 focus:ring-0 w-1/2"
                                                />
                                            </div>
                                            <div className="flex items-center justify-between border-b border-dashed pb-2">
                                                <span className="text-xs text-gray-500 font-medium">Time</span>
                                                <div className="flex items-center gap-1 justify-end w-1/2">
                                                    <Clock size={14} className="text-gray-400" />
                                                    <input
                                                        type="time"
                                                        value={localVisit.visit_time || ""}
                                                        onChange={(e) => handleFieldChange("visit_time", e.target.value)}
                                                        className="text-sm text-gray-800 font-medium text-right border-none p-0 focus:ring-0 w-full"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Visit Details */}
                                    <div id="visit_info" className="bg-white p-6 rounded-lg shadow-sm border">
                                        <h3 className="text-sm font-bold text-gray-800 mb-4 border-b pb-2">Visit Information</h3>
                                        <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                                            {/* Left Col */}
                                            <div className="space-y-4">
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[11px] text-gray-500 uppercase font-semibold">Project Name</label>
                                                    <div className="flex items-center gap-2 border-b border-gray-200 pb-1">
                                                        <MapPin size={14} className="text-gray-400" />
                                                        <input
                                                            value={localVisit.project || ""}
                                                            onChange={(e) => handleFieldChange("project", e.target.value)}
                                                            className="text-sm flex-1 outline-none"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[11px] text-gray-500 uppercase font-semibold">Location / Address</label>
                                                    <div className="flex items-center gap-2 border-b border-gray-200 pb-1">
                                                        <input
                                                            value={localVisit.location || ""}
                                                            onChange={(e) => handleFieldChange("location", e.target.value)}
                                                            className="text-sm flex-1 outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Right Col */}
                                            <div className="space-y-4">
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[11px] text-gray-500 uppercase font-semibold">Contact Phone</label>
                                                    <div className="flex items-center gap-2 border-b border-gray-200 pb-1">
                                                        <Phone size={14} className="text-gray-400" />
                                                        <input
                                                            value={localVisit.phone || ""}
                                                            onChange={(e) => handleFieldChange("phone", e.target.value)}
                                                            className="text-sm flex-1 outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Visit Outcome / Notes */}
                                    <div id="notes" className="bg-white p-6 rounded-lg shadow-sm border">
                                        <h3 className="text-sm font-bold text-gray-800 mb-4">Visit Notes / Outcome</h3>
                                        <textarea
                                            className="w-full h-32 p-3 text-sm border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none resize-none"
                                            placeholder="Enter visit feedback..."
                                        ></textarea>
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

export default SiteVisitsDrawer;
