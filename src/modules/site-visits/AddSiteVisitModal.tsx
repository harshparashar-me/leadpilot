import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Calendar, MapPin, User, Search, Map } from "lucide-react";
import { supabase } from "../../lib/supabase";

interface AddSiteVisitModalProps {
    open: boolean;
    onClose: () => void;
    onSave?: () => void;
}

const AddSiteVisitModal: React.FC<AddSiteVisitModalProps> = ({ open, onClose, onSave }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        project: "",
        visit_date: "",
        visit_time: "",
        location: "",
        lead_name: "",
        phone: "",
        status: "Pending",
        assigned_to: "", // Ideally this would be a user dropdown
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.from("site_visits").insert({
                ...formData,
                // Optional: Resolve lead_id if selecting from existing leads
                created_at: new Date().toISOString()
            });

            if (error) throw error;

            onSave?.();
            onClose();
            // Reset form
            setFormData({
                project: "",
                visit_date: "",
                visit_time: "",
                location: "",
                lead_name: "",
                phone: "",
                status: "Pending",
                assigned_to: ""
            });
        } catch (err) {
            console.error("Error creating site visit:", err);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const message = (err as any).message || "Failed to create site visit";
            alert(message);
        } finally {
            setLoading(false);
        }
    };

    // Helper for input styles
    const inputClass = "w-full text-xs border rounded-md px-2 py-1.5 focus:ring-1 focus:ring-blue-500 outline-none";

    return (
        <Dialog.Root open={open} onOpenChange={(val) => !val && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
                <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] bg-white rounded-lg shadow-xl z-50 p-0 outline-none">

                    <div className="flex items-center justify-between p-4 border-b">
                        <Dialog.Title className="text-sm font-semibold flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            Schedule Site Visit
                        </Dialog.Title>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X size={18} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-4 space-y-4">

                        {/* Top Row: Lead Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-medium text-gray-500 uppercase">Lead Name</label>
                                <div className="relative">
                                    <User className="absolute left-2 top-1.5 w-3.5 h-3.5 text-gray-400" />
                                    <input
                                        required
                                        type="text"
                                        name="lead_name"
                                        value={formData.lead_name}
                                        onChange={handleChange}
                                        placeholder="Search or enter name..."
                                        className={`${inputClass} pl-7`}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-medium text-gray-500 uppercase">Phone</label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+91..."
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        {/* Project & Location */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium text-gray-500 uppercase">Project / Property</label>
                            <input
                                type="text"
                                name="project"
                                value={formData.project}
                                onChange={handleChange}
                                placeholder="e.g. Green Valley Project"
                                className={inputClass}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium text-gray-500 uppercase">Location Address</label>
                            <div className="relative">
                                <Map className="absolute left-2 top-1.5 w-3.5 h-3.5 text-gray-400" />
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    placeholder="Site Address..."
                                    className={`${inputClass} pl-7`}
                                />
                            </div>
                        </div>

                        {/* Date & Time */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-medium text-gray-500 uppercase">Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-2 top-1.5 w-3.5 h-3.5 text-gray-400" />
                                    <input
                                        required
                                        type="date"
                                        name="visit_date"
                                        value={formData.visit_date}
                                        onChange={handleChange}
                                        className={`${inputClass} pl-7`}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-medium text-gray-500 uppercase">Time</label>
                                <input
                                    type="time"
                                    name="visit_time"
                                    value={formData.visit_time}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        {/* Status & Owner */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-medium text-gray-500 uppercase">Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className={inputClass}
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Rescheduled">Rescheduled</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-medium text-gray-500 uppercase">Assigned To</label>
                                <div className="relative">
                                    <Search className="absolute left-2 top-1.5 w-3.5 h-3.5 text-gray-400" />
                                    <input
                                        disabled
                                        value={formData.assigned_to}
                                        placeholder="Unassigned"
                                        className={`${inputClass} pl-7 bg-gray-50 text-gray-400`}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-md"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 flex items-center gap-1.5"
                            >
                                {loading ? "Scheduling..." : "Schedule Visit"}
                            </button>
                        </div>

                    </form>

                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export default AddSiteVisitModal;
