import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, BadgeDollarSign } from "lucide-react";
import { supabase } from "../../lib/supabase";

interface AddDealModalProps {
    open: boolean;
    onClose: () => void;
    onSave?: () => void;
}

const AddDealModal: React.FC<AddDealModalProps> = ({ open, onClose, onSave }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        phone: "",
        status: "New",
        description: "",
        lead_source: "",
        city: "",
        amount: "",
        requirement: "",
        size: "",
        email: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.from("deals").insert({
                ...formData,
                amount: formData.amount ? parseFloat(formData.amount) : 0,
                created_at: new Date().toISOString()
            });

            if (error) throw error;

            onSave?.();
            onClose();
            // Reset form
            setFormData({
                title: "",
                phone: "",
                status: "New",
                description: "",
                lead_source: "",
                city: "",
                amount: "",
                requirement: "",
                size: "",
                email: ""
            });
        } catch (err) {
            console.error("Error creating deal:", err);
            alert("Failed to create deal");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog.Root open={open} onOpenChange={(val) => !val && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
                <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] bg-white rounded-lg shadow-xl z-50 p-0 outline-none">

                    <div className="flex items-center justify-between p-4 border-b">
                        <Dialog.Title className="text-sm font-semibold flex items-center gap-2">
                            <BadgeDollarSign className="w-4 h-4 text-blue-600" />
                            Create New Deal
                        </Dialog.Title>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X size={18} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-4 space-y-4">

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium text-gray-500 uppercase">Deal Title (Deal Name)</label>
                            <input
                                required
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="Ex. 3BHK Apartment Sale"
                                className="w-full text-xs border rounded-md px-2 py-1.5 focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-medium text-gray-500 uppercase">Amount (₹)</label>
                                <input
                                    type="number"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    className="w-full text-xs border rounded-md px-2 py-1.5 focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-medium text-gray-500 uppercase">Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="w-full text-xs border rounded-md px-2 py-1.5 focus:ring-1 focus:ring-blue-500 outline-none"
                                >
                                    <option value="New">New</option>
                                    <option value="Qualified">Qualified</option>
                                    <option value="Proposal Sent">Proposal Sent</option>
                                    <option value="Negotiation">Negotiation</option>
                                    <option value="Closed Won">Closed Won</option>
                                    <option value="Closed Lost">Closed Lost</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-medium text-gray-500 uppercase">Phone</label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+91..."
                                    className="w-full text-xs border rounded-md px-2 py-1.5 focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-medium text-gray-500 uppercase">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="client@example.com"
                                    className="w-full text-xs border rounded-md px-2 py-1.5 focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-medium text-gray-500 uppercase">Source</label>
                                <select
                                    name="lead_source"
                                    value={formData.lead_source}
                                    onChange={handleChange}
                                    className="w-full text-xs border rounded-md px-2 py-1.5 focus:ring-1 focus:ring-blue-500 outline-none"
                                >
                                    <option value="">Select...</option>
                                    <option value="Website">Website</option>
                                    <option value="Referral">Referral</option>
                                    <option value="Cold Call">Cold Call</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-medium text-gray-500 uppercase">City</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    className="w-full text-xs border rounded-md px-2 py-1.5 focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-medium text-gray-500 uppercase">Size</label>
                                <input
                                    type="text"
                                    name="size"
                                    value={formData.size}
                                    onChange={handleChange}
                                    className="w-full text-xs border rounded-md px-2 py-1.5 focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium text-gray-500 uppercase">Requirement</label>
                            <textarea
                                name="requirement"
                                value={formData.requirement}
                                onChange={handleChange}
                                placeholder="Specific requirements..."
                                className="w-full text-xs border rounded-md px-2 py-1.5 h-16 resize-none focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium text-gray-500 uppercase">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Notes..."
                                className="w-full text-xs border rounded-md px-2 py-1.5 h-16 resize-none focus:ring-1 focus:ring-blue-500 outline-none"
                            />
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
                                {loading ? "Creating..." : "Create Deal"}
                            </button>
                        </div>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export default AddDealModal;
