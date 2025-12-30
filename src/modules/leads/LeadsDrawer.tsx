import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  X, Phone,
  Tag, CheckCircle2, Circle
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { logActivity } from "../../lib/activity";
import ConvertLeadModal from "./ConvertLeadModal";
import { Lead, Task } from "../../components/table/registry";
import { ActivityFeed } from "../../components/ActivityFeed";
import { RecordNotes } from "../../components/RecordNotes";
import { RelatedRecordsSidebar } from "../../components/RelatedRecordsSidebar";
import { DocumentManager } from "../../components/DocumentManager";

interface LeadsDrawerProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

const LeadsDrawer: React.FC<LeadsDrawerProps> = ({ lead, isOpen, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<"overview" | "activity" | "notes" | "related">("overview");
  const [localLead, setLocalLead] = useState<Lead | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);

  // Sidebar items
  const sidebarItems = [
    { id: "notes", label: "Notes" },
    { id: "attachments", label: "Attachments" },
    { id: "open_activities", label: "Open Activities" },
    { id: "closed_activities", label: "Closed Activities" },
    { id: "invited_meetings", label: "Invited Meetings" },
    { id: "emails", label: "Emails" },
  ];

  /* Improved fetchTasks function - fetch tasks related to this lead */
  const fetchTasks = React.useCallback(async () => {
    if (!lead?.id || !lead?.name) return;
    try {
      // Fetch tasks where lead_name matches or related_to contains lead name
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .or(`lead_name.eq.${lead.name},related_to.eq.${lead.name},related_to_id.eq.${lead.id}`)
        .order("due_date", { ascending: true });
      
      if (error) {
        console.error("Error fetching tasks:", error);
        setTasks([]);
      } else if (data) {
        setTasks(data as Task[]);
      } else {
        setTasks([]);
      }
    } catch (err) {
      console.error("Error in fetchTasks:", err);
      setTasks([]);
    }
  }, [lead?.id, lead?.name]); // Depend on ID and name

  useEffect(() => {
    if (lead) {
      setLocalLead({ ...lead });
      setHasChanges(false);
      fetchTasks();
      setActiveTab("overview");
    }
  }, [lead, fetchTasks]);

  const handleFieldChange = <K extends keyof Lead>(field: K, value: Lead[K]) => {
    if (!localLead) return;
    setLocalLead({ ...localLead, [field]: value });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!localLead || !hasChanges) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("leads")
        .update({
          name: localLead.name,
          phone: localLead.phone,
          email: localLead.email,
          status: localLead.status,
          assigned_to: localLead.assigned_to,
          lead_source: localLead.lead_source,
          city: localLead.city,
          budget: localLead.budget,
          purpose: localLead.purpose,
          requirement: localLead.requirement,
          size: localLead.size,
          project: localLead.project,
          description: localLead.description,
          modified_at: new Date().toISOString(),
        })
        .eq("id", localLead.id);

      if (error) throw error;

      // Log activity logic...
      const changes: string[] = [];
      if (localLead.status !== lead?.status) changes.push(`Status changed to ${localLead.status} `);

      const description = changes.length > 0 ? changes.join(", ") : "Lead details updated";

      await logActivity({
        lead_id: localLead.id,
        type: localLead.status !== lead?.status ? 'STATUS_CHANGE' : 'UPDATED',
        description: description,
        user_name: 'You'
      });

      setHasChanges(false);
      onUpdate?.();
    } catch (err) {
      console.error("Failed to save changes:", err);
      alert("Error saving changes.");
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

  if (!lead || !localLead) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed right-0 top-0 h-full w-[85%] bg-gray-50 shadow-2xl z-50 outline-none flex flex-col font-sans">

          {/* 1. Header Area */}
          <div className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm z-20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold">
                {localLead.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900">{localLead.name}</h2>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded border uppercase tracking-wide">
                    {localLead.lead_source || "Lead"}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1">
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
              <button className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700 transition">
                Send Email
              </button>
              <button
                onClick={() => setShowConvertModal(true)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded hover:bg-gray-50 transition"
              >
                Convert
              </button>
              <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded hover:bg-gray-50 transition">
                Edit
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500" onClick={onClose}>
                <X size={24} />
              </button>
            </div>
          </div>

          {/* 2. Toggle Switcher (Overview vs Activity vs Notes vs Related) */}
          <div className="bg-white border-b px-6">
            <div className="flex gap-6 overflow-x-auto">
              {["overview", "activity", "notes", "related"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as "overview" | "activity" | "notes" | "related")}
                  className={`py - 3 text - sm font - semibold border - b - 2 transition - colors capitalize ${activeTab === tab
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                    } `}
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

                <div className="px-4 mt-6 mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Links</div>
                <div className="px-4 py-1 text-xs text-gray-400 italic">No Links Found</div>
              </div>
            )}

            {/* 4. Main Content Area */}
            <div className="flex-1 overflow-y-auto scroll-smooth bg-gray-50/50 p-6">

              {activeTab === "overview" && (
                /* --- OVERVIEW VIEW --- */
                <div className="max-w-5xl mx-auto space-y-6 pb-20">

                  {/* Business Card (Summary) */}
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="grid grid-cols-2 gap-y-4 gap-x-12">
                      <div className="flex items-center justify-between border-b border-dashed pb-2">
                        <span className="text-xs text-gray-500 font-medium">Lead Owner</span>
                        <span className="text-sm text-gray-800 font-medium">{localLead.assigned_to || "Unassigned"}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-dashed pb-2">
                        <span className="text-xs text-gray-500 font-medium">Email</span>
                        <input
                          value={localLead.email || ""}
                          onChange={(e) => handleFieldChange("email", e.target.value)}
                          className="text-sm text-blue-600 font-medium text-right border-none p-0 focus:ring-0 w-1/2"
                        />
                      </div>
                      <div className="flex items-center justify-between border-b border-dashed pb-2">
                        <span className="text-xs text-gray-500 font-medium">Phone</span>
                        <div className="flex items-center gap-2">
                          {localLead.phone && <Phone size={14} className="text-green-600 fill-green-100" />}
                          <input
                            value={localLead.phone || ""}
                            onChange={(e) => handleFieldChange("phone", e.target.value)}
                            className="text-sm text-gray-800 font-medium text-right border-none p-0 focus:ring-0 w-32"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-b border-dashed pb-2">
                        <span className="text-xs text-gray-500 font-medium">Lead Status</span>
                        <select
                          value={localLead.status}
                          onChange={(e) => handleFieldChange("status", e.target.value)}
                          className="text-sm text-gray-800 font-medium text-right border-none p-0 focus:ring-0 bg-transparent text-right w-32"
                        >
                          {["Attempted", "Budget Issue", "Contacted", "Follow Up", "Interested", "Junk", "Not Interested"].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center justify-between border-b border-dashed pb-2">
                        <span className="text-xs text-gray-500 font-medium">Lead Source</span>
                        <select
                          value={localLead.lead_source}
                          onChange={(e) => handleFieldChange("lead_source", e.target.value)}
                          className="text-sm text-gray-800 font-medium text-right border-none p-0 focus:ring-0 bg-transparent text-right w-32"
                        >
                          {["Website", "Referral", "Cold Call", "Social Media", "Ads"].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Hide Details Toggle */}
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-sm font-bold text-gray-800 mb-4 border-b pb-2">Lead Information</h3>
                    <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                      {/* Left Col */}
                      <div className="space-y-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] text-gray-500 uppercase font-semibold">Project</label>
                          <input
                            value={localLead.project || ""}
                            onChange={(e) => handleFieldChange("project", e.target.value)}
                            className="text-sm border-b border-gray-200 focus:border-blue-500 outline-none pb-1"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] text-gray-500 uppercase font-semibold">City</label>
                          <input
                            value={localLead.city || ""}
                            onChange={(e) => handleFieldChange("city", e.target.value)}
                            className="text-sm border-b border-gray-200 focus:border-blue-500 outline-none pb-1"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] text-gray-500 uppercase font-semibold">Budget</label>
                          <input
                            value={localLead.budget || ""}
                            onChange={(e) => handleFieldChange("budget", e.target.value ? parseFloat(e.target.value) : null)}
                            className="text-sm border-b border-gray-200 focus:border-blue-500 outline-none pb-1"
                            type="number"
                          />
                        </div>
                      </div>
                      {/* Right Col */}
                      <div className="space-y-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] text-gray-500 uppercase font-semibold">Requirement</label>
                          <input
                            value={localLead.requirement || ""}
                            onChange={(e) => handleFieldChange("requirement", e.target.value)}
                            className="text-sm border-b border-gray-200 focus:border-blue-500 outline-none pb-1"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] text-gray-500 uppercase font-semibold">Size</label>
                          <input
                            value={localLead.size || ""}
                            onChange={(e) => handleFieldChange("size", e.target.value)}
                            className="text-sm border-b border-gray-200 focus:border-blue-500 outline-none pb-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RELATED LISTS SECTIONS */}

                  {/* Open Activities - keep this or move to Activity tab? Keeping as tasks list */}
                  <div id="open_activities" className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-bold text-gray-800">Open Activities (Tasks)</h3>
                      <button className="text-[10px] bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded border border-blue-200 font-bold">
                        + Add New
                      </button>
                    </div>
                    {tasks.filter(t => t.status !== 'Completed').length > 0 ? (
                      <div className="space-y-2">
                        {tasks.filter(t => t.status !== 'Completed').map(task => (
                          <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                              <Circle size={16} className="text-blue-500" />
                              <div>
                                <div className="text-sm font-medium text-gray-800">{task.subject}</div>
                                <div className="text-[10px] text-gray-500">{new Date(task.due_date).toLocaleDateString()}</div>
                              </div>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">{task.status}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-xs text-gray-400 italic bg-gray-50 rounded border border-dashed">No records found</div>
                    )}
                  </div>

                  {/* Closed Activities */}
                  <div id="closed_activities" className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-sm font-bold text-gray-800 mb-4">Closed Activities</h3>
                    {tasks.filter(t => t.status === 'Completed').length > 0 ? (
                      <div className="space-y-2">
                        {tasks.filter(t => t.status === 'Completed').map(task => (
                          <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg opacity-60">
                            <div className="flex items-center gap-3">
                              <CheckCircle2 size={16} className="text-emerald-500" />
                              <div>
                                <div className="text-sm font-medium text-gray-800 line-through">{task.subject}</div>
                                <div className="text-[10px] text-gray-500">Completed on {new Date(task.modified_at).toLocaleDateString()}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-xs text-gray-400 italic bg-gray-50 rounded border border-dashed">No records found</div>
                    )}
                  </div>

                  {/* Attachments */}
                  <div id="attachments" className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-bold text-gray-800">Attachments</h3>
                    </div>
                    {/* Document Manager Integration */}
                    <DocumentManager entityType="lead" entityId={localLead.id} />
                  </div>

                  {/* Placeholders for Invited Meetings & Emails */}
                  <div id="invited_meetings" className="bg-white p-6 rounded-lg shadow-sm border opacity-60">
                    <h3 className="text-sm font-bold text-gray-800 mb-4">Invited Meetings</h3>
                    <div className="py-4 text-center text-xs text-gray-400 italic bg-gray-50 rounded border border-dashed">No records found</div>
                  </div>

                  <div id="emails" className="bg-white p-6 rounded-lg shadow-sm border opacity-60">
                    <h3 className="text-sm font-bold text-gray-800 mb-4">Emails</h3>
                    <div className="py-4 text-center text-xs text-gray-400 italic bg-gray-50 rounded border border-dashed">No records found</div>
                  </div>

                </div>
              )}

              {/* --- ACTIVITY VIEW --- */}
              {activeTab === "activity" && (
                <div className="max-w-3xl mx-auto py-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-6">Activity Timeline</h3>
                  <ActivityFeed entityType="lead" entityId={localLead.id} />
                </div>
              )}

              {/* --- NOTES VIEW --- */}
              {activeTab === "notes" && (
                <div className="max-w-3xl mx-auto py-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-6">Notes</h3>
                  <RecordNotes entityType="lead" entityId={localLead.id} />
                </div>
              )}

              {/* --- RELATED RECORDS VIEW --- */}
              {activeTab === "related" && (
                <div className="max-w-3xl mx-auto py-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-6">Related Records</h3>
                  <RelatedRecordsSidebar entityType="lead" entityId={localLead.id} />
                </div>
              )}

            </div>
          </div>

          <ConvertLeadModal
            lead={lead}
            open={showConvertModal}
            onClose={() => setShowConvertModal(false)}
            onConverted={() => {
              onClose(); // Close drawer after conversion
              onUpdate?.(); // Refresh list
            }}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default LeadsDrawer;