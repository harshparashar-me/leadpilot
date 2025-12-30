import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Calendar, ClipboardList, User, Link2, Clock, Flag, AlertCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";

interface AddTaskModalProps {
    open: boolean;
    onClose: () => void;
    onSave?: () => void;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({ open, onClose, onSave }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        subject: "",
        description: "",
        due_date: "",
        due_time: "",
        status: "Not Started",
        priority: "Medium",
        assigned_to: "",
        contact: "",
        lead_name: "",
        related_to: "",
        related_to_type: "Lead"
    });
    const [leads, setLeads] = useState<any[]>([]);
    const [contacts, setContacts] = useState<any[]>([]);
    const [showRelatedSearch, setShowRelatedSearch] = useState(false);

    // Load leads and contacts for Related To dropdown
    useEffect(() => {
        if (open) {
            loadRelatedRecords();
        }
    }, [open]);

    const loadRelatedRecords = async () => {
        try {
            const [leadsRes, contactsRes] = await Promise.all([
                supabase.from("leads").select("id, name").limit(100),
                supabase.from("contacts").select("id, full_name").limit(100)
            ]);
            if (leadsRes.data) setLeads(leadsRes.data);
            if (contactsRes.data) setContacts(contactsRes.data);
        } catch (err) {
            console.error("Error loading related records:", err);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.subject.trim()) {
            alert("Subject is required");
            return;
        }

        setLoading(true);

        try {
            // Combine date and time if both provided
            let dueDateTime = null;
            if (formData.due_date) {
                if (formData.due_time) {
                    dueDateTime = new Date(`${formData.due_date}T${formData.due_time}`).toISOString();
                } else {
                    dueDateTime = new Date(formData.due_date).toISOString();
                }
            }

            // Determine related_to value based on type
            let relatedToValue = null;
            if (formData.related_to_type === "Lead" && formData.lead_name) {
                relatedToValue = formData.lead_name;
            } else if (formData.related_to_type === "Contact" && formData.contact) {
                relatedToValue = formData.contact;
            }

            const { error } = await supabase.from("tasks").insert({
                subject: formData.subject,
                description: formData.description,
                due_date: dueDateTime,
                status: formData.status,
                priority: formData.priority,
                assigned_to: formData.assigned_to || null,
                contact: formData.contact,
                lead_name: formData.lead_name,
                related_to: relatedToValue,
                created_at: new Date().toISOString()
            });

            if (error) throw error;

            onSave?.();
            onClose();
            // Reset form
            setFormData({
                subject: "",
                description: "",
                due_date: "",
                due_time: "",
                status: "Not Started",
                priority: "Medium",
                assigned_to: "",
                contact: "",
                lead_name: "",
                related_to: "",
                related_to_type: "Lead"
            });
        } catch (err) {
            console.error("Error creating task:", err);
            alert("Failed to create task");
        } finally {
            setLoading(false);
        }
    };

    // Get today's date in YYYY-MM-DD format for min attribute
    const today = new Date().toISOString().split('T')[0];

    return (
        <Dialog.Root open={open} onOpenChange={(val) => !val && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
                <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] max-w-[90vw] max-h-[90vh] bg-white rounded-xl shadow-2xl z-50 p-0 outline-none overflow-hidden flex flex-col">

                    {/* Header - Zoho Style */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <Dialog.Title className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                <ClipboardList className="w-5 h-5 text-white" />
                            </div>
                            <span>Create Task</span>
                        </Dialog.Title>
                        <button 
                            onClick={onClose} 
                            className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg p-1.5 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Form Content - Scrollable */}
                    <form id="task-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">

                        {/* Subject - Zoho Style: Prominent and Required */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Subject <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                className="w-full text-sm border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                placeholder="Enter task subject"
                                required
                            />
                        </div>

                        {/* Status and Priority in one row - Zoho Style */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Status
                                </label>
                                <div className="relative">
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="w-full text-sm border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="Not Started">Not Started</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Deferred">Deferred</option>
                                        <option value="Waiting on someone else">Waiting on someone else</option>
                                    </select>
                                    <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                    <Flag className="w-4 h-4 text-gray-500" />
                                    Priority
                                </label>
                                <div className="relative">
                                    <select
                                        name="priority"
                                        value={formData.priority}
                                        onChange={handleChange}
                                        className="w-full text-sm border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                    <Flag className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* Due Date and Time - Zoho Style */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-500" />
                                    Due Date
                                </label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        name="due_date"
                                        value={formData.due_date}
                                        onChange={handleChange}
                                        min={today}
                                        className="w-full text-sm border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-gray-500" />
                                    Time
                                </label>
                                <div className="relative">
                                    <input
                                        type="time"
                                        name="due_time"
                                        value={formData.due_time}
                                        onChange={handleChange}
                                        className="w-full text-sm border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                    <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* Assigned To and Related To - Zoho Style */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                    <User className="w-4 h-4 text-gray-500" />
                                    Task Owner
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="assigned_to"
                                        value={formData.assigned_to}
                                        onChange={handleChange}
                                        placeholder="Enter user name"
                                        className="w-full text-sm border border-gray-300 rounded-lg px-4 py-2.5 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                    <Link2 className="w-4 h-4 text-gray-500" />
                                    Related To
                                </label>
                                <div className="space-y-2">
                                    <select
                                        name="related_to_type"
                                        value={formData.related_to_type}
                                        onChange={handleChange}
                                        className="w-full text-xs border border-gray-300 rounded-lg px-3 py-1.5 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    >
                                        <option value="Lead">Lead</option>
                                        <option value="Contact">Contact</option>
                                        <option value="Deal">Deal</option>
                                    </select>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name={formData.related_to_type === "Lead" ? "lead_name" : "contact"}
                                            value={formData.related_to_type === "Lead" ? formData.lead_name : formData.contact}
                                            onChange={handleChange}
                                            placeholder={`Select ${formData.related_to_type.toLowerCase()}`}
                                            className="w-full text-sm border border-gray-300 rounded-lg px-4 py-2.5 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                            onClick={() => setShowRelatedSearch(true)}
                                        />
                                        <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Description - Zoho Style */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Enter task description or notes..."
                                rows={4}
                                className="w-full text-sm border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                            />
                        </div>

                        {/* Footer Buttons - Inside Form for proper submission */}
                        <div className="pt-4 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !formData.subject.trim()}
                                className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-sm"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <ClipboardList className="w-4 h-4" />
                                        Create Task
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export default AddTaskModal;
