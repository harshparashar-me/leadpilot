import React, { useState, FormEvent, ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, Building, Phone, Globe, MapPin,
    Search, Info, LucideIcon, Briefcase
} from "lucide-react";
import { supabase } from "../../lib/supabase";

interface AccountFormData {
    name: string;
    phone: string;
    website: string;
    industry: string;
    city: string;
    assigned_to: string | null;
}

interface AddAccountModalProps {
    open: boolean;
    onClose: () => void;
    onSave?: () => void;
}

interface InputGroupProps {
    label: string;
    required?: boolean;
    children: React.ReactNode;
    icon?: LucideIcon;
    info?: string;
}

const InputGroup: React.FC<InputGroupProps> = ({ label, required, children, icon: Icon, info }) => (
    <div className="flex flex-col space-y-1.5 w-full">
        <div className="flex items-center justify-between">
            <label className="text-[12px] font-semibold text-gray-500 flex items-center gap-1 uppercase tracking-tight">
                {label}
                {required && <span className="text-red-500">*</span>}
            </label>
            {info && (
                <div className="group relative">
                    <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                    <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl">
                        {info}
                    </div>
                </div>
            )}
        </div>
        <div className="relative flex items-center">
            {Icon && <Icon className="absolute left-3 w-4 h-4 text-gray-400" />}
            {children}
        </div>
    </div>
);

const AddAccountModal: React.FC<AddAccountModalProps> = ({ open, onClose, onSave }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<AccountFormData>({
        name: "",
        phone: "",
        website: "",
        industry: "",
        city: "",
        assigned_to: null,
    });

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                ...formData,
                created_at: new Date().toISOString(),
                // Removing assigned_to if it's not a valid UUID string (or keep it if it is)
                assigned_to: null,
            };

            const { error } = await supabase
                .from("accounts")
                .insert([payload]);

            if (error) throw error;

            onSave?.();
            onClose();
            // Reset form
            setFormData({
                name: "",
                phone: "",
                website: "",
                industry: "",
                city: "",
                assigned_to: null,
            });

        } catch (err: unknown) {
            console.error("Failed to save account:", err);
            const message = err instanceof Error ? err.message : 'Unknown error';
            alert(`Error saving account: ${message}`);
        } finally {
            setLoading(false);
        }
    };

    const iconInputClass = "w-full pl-10 pr-3 py-2 border border-gray-300 rounded text-[13px] focus:border-[#2C7CF6] focus:ring-1 focus:ring-[#2C7CF6] outline-none transition-all bg-white";

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white w-full max-w-2xl rounded shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                                    <Building className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-800">New Account</h2>
                                    <p className="text-[11px] text-gray-500 font-medium tracking-tight">
                                        Create a new business account
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                disabled={loading}
                                className="p-1 hover:bg-red-50 hover:text-red-500 rounded transition-colors disabled:opacity-50"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Form Content */}
                        <div className="flex-1 overflow-y-auto p-8 bg-white">
                            <form id="account-form" onSubmit={handleSubmit} className="space-y-6">

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                                    {/* Account Name */}
                                    <InputGroup label="Account Name" required icon={Building}>
                                        <input name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Acme Corp" className={iconInputClass} required />
                                    </InputGroup>

                                    {/* Phone */}
                                    <InputGroup label="Phone" icon={Phone}>
                                        <input name="phone" value={formData.phone} onChange={handleChange} placeholder="+1 234..." className={iconInputClass} />
                                    </InputGroup>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                                    {/* Website */}
                                    <InputGroup label="Website" icon={Globe}>
                                        <input name="website" value={formData.website} onChange={handleChange} placeholder="www.example.com" className={iconInputClass} />
                                    </InputGroup>

                                    {/* Industry */}
                                    <InputGroup label="Industry" icon={Briefcase}>
                                        <select name="industry" value={formData.industry} onChange={handleChange} className={iconInputClass}>
                                            <option value="">Select Industry</option>
                                            {["Technology", "Real Estate", "Finance", "Healthcare", "Retail", "Manufacturing", "Other"].map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </InputGroup>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                                    {/* City */}
                                    <InputGroup label="City" icon={MapPin}>
                                        <input name="city" value={formData.city} onChange={handleChange} placeholder="City" className={iconInputClass} />
                                    </InputGroup>

                                    {/* Account Owner */}
                                    <InputGroup label="Account Owner" info="Assigned User">
                                        <div className="relative">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400">
                                                <Search size={16} />
                                            </div>
                                            <input
                                                disabled
                                                value={formData.assigned_to || "Unassigned"}
                                                className={`${iconInputClass} bg-gray-50 cursor-not-allowed`}
                                            />
                                        </div>
                                    </InputGroup>
                                </div>

                            </form>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-4 bg-gray-50 border-t border-gray-200 flex justify-end items-center gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="px-5 py-2 text-[13px] font-bold text-gray-600 hover:text-gray-800 transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                form="account-form"
                                type="submit"
                                disabled={loading}
                                className="px-8 py-2 text-[13px] font-bold text-white bg-blue-600 rounded hover:bg-blue-700 shadow-md transition-all disabled:opacity-50"
                            >
                                {loading ? "Saving..." : "Save Account"}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AddAccountModal;
