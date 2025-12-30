import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Contact, User } from "lucide-react";
import { supabase } from "../../lib/supabase";

interface AddContactModalProps {
    open: boolean;
    onClose: () => void;
    onSave?: () => void;
}

const AddContactModal: React.FC<AddContactModalProps> = ({ open, onClose, onSave }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        phone: "",
        city: "",
        position: "",
        assigned_to: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.from("contacts").insert({
                ...formData,
                created_at: new Date().toISOString()
            });

            if (error) throw error;

            onSave?.();
            onClose();
            // Reset form
            setFormData({
                full_name: "",
                email: "",
                phone: "",
                city: "",
                position: "",
                assigned_to: ""
            });
        } catch (err) {
            console.error("Error creating contact:", err);
            alert("Failed to create contact");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog.Root open={open} onOpenChange={(val) => !val && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
                <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] bg-white rounded-lg shadow-xl z-50 p-0 outline-none">

                    <div className="flex items-center justify-between p-4 border-b">
                        <Dialog.Title className="text-sm font-semibold flex items-center gap-2">
                            <Contact className="w-4 h-4 text-blue-600" />
                            Add New Contact
                        </Dialog.Title>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X size={18} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-4 space-y-4">

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium text-gray-500 uppercase">Full Name</label>
                            <input
                                required
                                type="text"
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleChange}
                                placeholder="John Doe"
                                className="w-full text-xs border rounded-md px-2 py-1.5 focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-medium text-gray-500 uppercase">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="john@example.com"
                                    className="w-full text-xs border rounded-md px-2 py-1.5 focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                            </div>

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
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-medium text-gray-500 uppercase">Position (Job Title)</label>
                                <input
                                    type="text"
                                    name="position"
                                    value={formData.position}
                                    onChange={handleChange}
                                    placeholder="Manager"
                                    className="w-full text-xs border rounded-md px-2 py-1.5 focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-medium text-gray-500 uppercase">City</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    placeholder="Mumbai"
                                    className="w-full text-xs border rounded-md px-2 py-1.5 focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium text-gray-500 uppercase">Assigned To (Owner)</label>
                            <input
                                type="text"
                                name="assigned_to"
                                value={formData.assigned_to}
                                onChange={handleChange}
                                placeholder="Owner Name"
                                className="w-full text-xs border rounded-md px-2 py-1.5 focus:ring-1 focus:ring-blue-500 outline-none"
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
                                <User className="w-3.5 h-3.5" />
                                {loading ? "Creating..." : "Save Contact"}
                            </button>
                        </div>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export default AddContactModal;
