import React, { useState, useRef, ChangeEvent, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, User, Building, Phone, Mail, MapPin,
  AlignLeft, Info, Search,
  Layers, Target, ClipboardList, IndianRupee,
  LucideIcon
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { logActivity } from "../../lib/activity";

/* ============================================================
   TYPES & INTERFACES
   ============================================================ */

interface LeadFormData {
  name: string;
  phone: string;
  email: string;
  status: string;
  lead_source: string;
  city: string;
  budget: string;
  purpose: string;
  requirement: string;
  size: string;
  project: string;
  description: string;
  assigned_to: string | null;
}

interface AddLeadModalProps {
  open: boolean;
  onClose: () => void;
  onSave?: (data: LeadFormData) => void;
}

interface InputGroupProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  icon?: LucideIcon;
  info?: string;
}

interface SectionHeaderProps {
  id: string;
  title: string;
}

/* ============================================================
   SUB-COMPONENTS
   ============================================================ */

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

const SectionHeader: React.FC<SectionHeaderProps> = ({ id, title }) => (
  <div id={id} className="border-b border-gray-200 pb-2 mb-6 mt-10 first:mt-0 flex items-center justify-between">
    <h3 className="text-[14px] font-bold text-gray-800 uppercase tracking-widest">{title}</h3>
    <div className="h-[1px] flex-grow ml-4 bg-gray-100"></div>
  </div>
);

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

const AddLeadModal: React.FC<AddLeadModalProps> = ({ open, onClose, onSave }) => {
  const [activeSection, setActiveSection] = useState<string>("lead-info");
  const [loading, setLoading] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<LeadFormData>({
    name: "",
    phone: "",
    email: "",
    status: "Attempted",
    lead_source: "Website",
    city: "",
    budget: "",
    purpose: "",
    requirement: "",
    size: "",
    project: "",
    description: "",
    assigned_to: null, // Should be a UUID or null
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const sections = ["lead-info", "requirement-info", "address-info", "description-info"];
    const scrollPos = (e.target as HTMLDivElement).scrollTop;

    sections.forEach(section => {
      const element = document.getElementById(section);
      if (element && scrollPos >= element.offsetTop - 150) {
        setActiveSection(section);
      }
    });
  };

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Prepare clean payload
      const { ...rest } = formData;

      const payload = {
        ...rest,
        budget: formData.budget ? parseFloat(formData.budget.replace(/[^0-9.]/g, '')) : null,
        created_at: new Date().toISOString(),
        // Removing assigned_to if it's not a valid UUID string
        assigned_to: null,
      };

      // Direct Supabase Insert
      const { data, error } = await supabase
        .from("leads")
        .insert([payload])
        .select();

      if (error) throw error;

      // Log Activity
      if (data && data.length > 0) {
        await logActivity({
          lead_id: data[0].id,
          type: 'CREATED',
          description: 'Lead created',
          user_name: 'You'
        });
      }

      console.log("Lead created successfully:", data);
      onSave?.(payload as unknown as LeadFormData);
      onClose();
    } catch (err) {
      console.error("Failed to save lead:", err);
      alert("Error saving lead. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full pl-3 pr-3 py-2 border border-gray-300 rounded text-[13px] focus:border-[#2C7CF6] focus:ring-1 focus:ring-[#2C7CF6] outline-none transition-all bg-white placeholder-gray-400";
  const iconInputClass = "w-full pl-10 pr-3 py-2 border border-gray-300 rounded text-[13px] focus:border-[#2C7CF6] focus:ring-1 focus:ring-[#2C7CF6] outline-none transition-all bg-white";

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white w-full max-w-5xl h-[90vh] rounded shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-[#2C7CF6] to-[#1a66db] rounded-lg flex items-center justify-center shadow-lg">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Create Lead</h2>
                  <p className="text-[11px] text-gray-500 font-medium tracking-tight">
                    Permanent Supabase Connection • Real-time Sync
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

            {/* Sidebar & Form Wrapper */}
            <div className="flex flex-1 overflow-hidden">
              <div className="w-52 bg-gray-50 border-r border-gray-200 p-4 hidden md:block">
                <nav className="space-y-1">
                  {[
                    { id: "lead-info", label: "Lead Info", icon: User },
                    { id: "requirement-info", label: "Requirements", icon: Target },
                    { id: "address-info", label: "Address", icon: MapPin },
                    { id: "description-info", label: "Description", icon: AlignLeft },
                  ].map((section) => (
                    <button
                      key={section.id}
                      onClick={() => scrollTo(section.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-[12px] font-bold transition-all ${activeSection === section.id
                        ? "bg-white text-[#2C7CF6] shadow-sm border border-gray-200"
                        : "text-gray-500 hover:bg-gray-100"
                        }`}
                    >
                      <section.icon className={`w-4 h-4 ${activeSection === section.id ? 'text-[#2C7CF6]' : 'text-gray-400'}`} />
                      {section.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Scrollable Form Content */}
              <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-8 bg-white scroll-smooth"
              >
                <form id="lead-form" onSubmit={handleSubmit}>
                  <SectionHeader id="lead-info" title="Lead Information" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    <InputGroup label="Lead Owner" info="This lead will be assigned to this user in Supabase.">
                      <div className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded bg-gray-50 text-[13px] text-gray-700">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">JD</div>
                          {formData.assigned_to}
                        </div>
                        <Search className="w-3.5 h-3.5 text-gray-400" />
                      </div>
                    </InputGroup>

                    <InputGroup label="Lead Status">
                      <select name="status" value={formData.status} onChange={handleChange} className={inputClass}>
                        {["Attempted", "Budget Issue", "Contacted", "Follow Up", "Interested", "Junk", "Not Interested"].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </InputGroup>

                    <InputGroup label="Lead Name" required>
                      <input name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" className={inputClass} required />
                    </InputGroup>

                    <InputGroup label="Phone" icon={Phone} required>
                      <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Primary phone number" className={iconInputClass} required />
                    </InputGroup>

                    <InputGroup label="Email" icon={Mail}>
                      <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="email@domain.com" className={iconInputClass} />
                    </InputGroup>

                    <InputGroup label="Lead Source">
                      <select name="lead_source" value={formData.lead_source} onChange={handleChange} className={inputClass}>
                        {["Website", "Referral", "Cold Call", "Social Media", "Ads"].map(source => (
                          <option key={source} value={source}>{source}</option>
                        ))}
                      </select>
                    </InputGroup>

                    <InputGroup label="Project" icon={Building}>
                      <input name="project" value={formData.project} onChange={handleChange} placeholder="Associated Project Name" className={iconInputClass} />
                    </InputGroup>
                  </div>

                  <SectionHeader id="requirement-info" title="Requirement Details" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    <InputGroup label="Budget" icon={IndianRupee}>
                      <input name="budget" value={formData.budget} onChange={handleChange} placeholder="Total Budget" className={iconInputClass} />
                    </InputGroup>

                    <InputGroup label="Purpose" icon={Target}>
                      <input name="purpose" value={formData.purpose} onChange={handleChange} placeholder="Investment, End User" className={iconInputClass} />
                    </InputGroup>

                    <InputGroup label="Size" icon={Layers}>
                      <input name="size" value={formData.size} onChange={handleChange} placeholder="e.g. 1200 SqFt" className={iconInputClass} />
                    </InputGroup>

                    <InputGroup label="Requirement" icon={ClipboardList}>
                      <input name="requirement" value={formData.requirement} onChange={handleChange} placeholder="Specific needs" className={iconInputClass} />
                    </InputGroup>
                  </div>

                  <SectionHeader id="address-info" title="Address Information" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    <InputGroup label="City" icon={MapPin}>
                      <input name="city" value={formData.city} onChange={handleChange} placeholder="City Name" className={iconInputClass} />
                    </InputGroup>
                  </div>

                  <SectionHeader id="description-info" title="Description Information" />
                  <div className="mb-10">
                    <InputGroup label="Description" icon={AlignLeft}>
                      <textarea
                        name="description"
                        rows={5}
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Additional notes..."
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded text-[13px] focus:border-[#2C7CF6] outline-none bg-white resize-none min-h-[120px]"
                      />
                    </InputGroup>
                  </div>
                </form>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-8 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center sticky bottom-0 z-10">
              <div className="text-[11px] text-gray-400 font-medium flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${loading ? 'bg-orange-500 animate-pulse' : 'bg-green-500 animate-pulse'}`}></div>
                {loading ? "Syncing..." : "Permanent Supabase Sync"}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-5 py-2 text-[13px] font-bold text-gray-600 hover:text-gray-800 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  form="lead-form"
                  type="submit"
                  disabled={loading}
                  className="px-8 py-2 text-[13px] font-bold text-white bg-[#2C7CF6] rounded hover:bg-[#1a66db] shadow-md shadow-blue-100 transition-all disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddLeadModal;