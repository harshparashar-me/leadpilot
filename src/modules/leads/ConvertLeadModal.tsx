import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, ArrowRightLeft, Building, User, BadgeDollarSign, CheckCircle2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Lead } from "../../components/table/registry";
import { logActivity } from "../../lib/activity";

interface ConvertLeadModalProps {
    lead: Lead;
    open: boolean;
    onClose: () => void;
    onConverted?: () => void;
}

const ConvertLeadModal: React.FC<ConvertLeadModalProps> = ({ lead, open, onClose, onConverted }) => {
    const [loading, setLoading] = useState(false);
    const [createDeal, setCreateDeal] = useState(true);
    const [dealAmount, setDealAmount] = useState(lead.budget?.toString() || "");
    const [dealName, setDealName] = useState(lead.name || "New Deal"); // Changed from lead.project per user request

    const handleConvert = async () => {
        setLoading(true);
        try {
            const timestamp = new Date().toISOString();
            // For Account Name: Use Company/Project if available, else Lead Name
            const accountName = lead.project || lead.name;

            // 1. Create Account
            const { error: accountError } = await supabase
                .from("accounts")
                .insert({
                    name: accountName,
                    phone: lead.phone,
                    city: lead.city,
                    assigned_to: lead.assigned_to,
                    created_at: timestamp
                });

            if (accountError) throw new Error(`Account Error: ${accountError.message}`);

            // 2. Create Contact
            const { error: contactError } = await supabase
                .from("contacts")
                .insert({
                    full_name: lead.name,
                    email: lead.email,
                    phone: lead.phone,
                    city: lead.city,
                    assigned_to: lead.assigned_to,
                    created_at: timestamp
                });

            if (contactError) throw new Error(`Contact Error: ${contactError.message}`);

            // 3. Create Deal (Optional)
            if (createDeal) {
                const { error: dealError } = await supabase
                    .from("deals")
                    .insert({
                        title: dealName,
                        amount: parseFloat(dealAmount) || 0,
                        status: "New",
                        phone: lead.phone,
                        email: lead.email,
                        lead_source: lead.lead_source,
                        description: lead.description,
                        assigned_to: lead.assigned_to,
                        created_at: timestamp
                    });

                if (dealError) throw new Error(`Deal Error: ${dealError.message}`);
            }

            // 4. Update Lead Status
            await supabase
                .from("leads")
                .update({ status: "Interested" })
                .eq("id", lead.id);

            // Log the conversion
            await logActivity({
                lead_id: lead.id,
                type: 'STATUS_CHANGE',
                description: `Lead converted to Account: ${accountName}, Contact: ${lead.name}${createDeal ? ', and Deal' : ''}`,
                user_name: 'You'
            });

            onConverted?.();
            onClose();
            alert("Lead converted successfully!");

        } catch (err: unknown) {
            console.error("Conversion failed:", err);
            const message = err instanceof Error ? err.message : 'Unknown error';
            alert(`Failed to convert lead: ${message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog.Root open={open} onOpenChange={(val) => !val && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
                <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] bg-white rounded-lg shadow-xl z-50 p-0 outline-none">

                    <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                        <Dialog.Title className="text-sm font-bold flex items-center gap-2 text-gray-800">
                            <ArrowRightLeft className="w-4 h-4 text-emerald-600" />
                            Convert Lead
                        </Dialog.Title>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="bg-blue-50 border border-blue-100 rounded-md p-3 text-xs text-blue-800 flex gap-2">
                            <CheckCircle2 size={16} className="shrink-0" />
                            <div>
                                Converting this lead will create a new <strong>Account</strong> and <strong>Contact</strong>. You can optionally create a <strong>Deal</strong>.
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Account Section */}
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-gray-100 rounded-lg">
                                    <Building size={18} className="text-gray-600" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-gray-700">New Account</div>
                                    <div className="text-sm text-gray-900 mt-0.5">{lead.project || `${lead.name} Org`}</div>
                                </div>
                            </div>

                            {/* Contact Section */}
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-gray-100 rounded-lg">
                                    <User size={18} className="text-gray-600" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-gray-700">New Contact</div>
                                    <div className="text-sm text-gray-900 mt-0.5">{lead.name}</div>
                                </div>
                            </div>

                            {/* Deal Section */}
                            <div className="border-t pt-4 mt-2">
                                <label className="flex items-center gap-2 cursor-pointer mb-4">
                                    <input
                                        type="checkbox"
                                        checked={createDeal}
                                        onChange={(e) => setCreateDeal(e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-semibold text-gray-900">Create a new Deal for this Account</span>
                                </label>

                                {createDeal && (
                                    <div className="pl-6 space-y-3 animation-fade-in">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase">Deal Name</label>
                                            <input
                                                type="text"
                                                value={dealName}
                                                onChange={(e) => setDealName(e.target.value)}
                                                className="w-full text-xs border rounded-md px-2 py-1.5 focus:ring-1 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase">Amount</label>
                                            <div className="relative">
                                                <BadgeDollarSign className="w-3.5 h-3.5 absolute left-2 top-2 text-gray-400" />
                                                <input
                                                    type="number"
                                                    value={dealAmount}
                                                    onChange={(e) => setDealAmount(e.target.value)}
                                                    className="w-full text-xs border rounded-md pl-7 pr-2 py-1.5 focus:ring-1 focus:ring-blue-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConvert}
                            disabled={loading}
                            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-sm disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            {loading ? "Converting..." : "Convert Lead"}
                        </button>
                    </div>

                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export default ConvertLeadModal;
