import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Calendar, User, Tag, Clock, CheckCircle2, AlertCircle, Flag } from "lucide-react";
import { supabase } from "../../lib/supabase";
// Activity logging for tasks - can be added to activity_logs table if needed
import { ActivityFeed } from "../../components/ActivityFeed";
import { RecordNotes } from "../../components/RecordNotes";
import { getTaskStatusColor, getPriorityBadge } from "../../components/table/registry";
import { formatRelativeDate, formatDateTime } from "../../components/table/utils/dateFormatting";

interface Task {
  id: string;
  subject: string | null;
  description: string | null;
  due_date: string | null;
  status: string;
  priority?: string;
  assigned_to: string | null;
  lead_name: string | null;
  contact: string | null;
  related_to?: string | null;
  created_at: string;
  created_by: string;
  modified_at?: string;
  task_owner?: string | null;
}

interface TasksDrawerProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

const TasksDrawer: React.FC<TasksDrawerProps> = ({ task, isOpen, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<"overview" | "activity" | "notes">("overview");
  const [localTask, setLocalTask] = useState<Task | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setLocalTask({ ...task });
      setHasChanges(false);
      setActiveTab("overview");
    }
  }, [task]);

  const handleFieldChange = <K extends keyof Task>(field: K, value: Task[K]) => {
    if (!localTask) return;
    setLocalTask({ ...localTask, [field]: value });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!localTask || !hasChanges) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          subject: localTask.subject,
          description: localTask.description,
          due_date: localTask.due_date,
          status: localTask.status,
          priority: localTask.priority || "Medium",
          assigned_to: localTask.assigned_to,
          lead_name: localTask.lead_name,
          contact: localTask.contact,
          modified_at: new Date().toISOString(),
        })
        .eq("id", localTask.id);

      if (error) throw error;

      // Activity logging can be added here if activity_logs table supports tasks
      // await supabase.from('activity_logs').insert({...});

      setHasChanges(false);
      onUpdate?.();
    } catch (err) {
      console.error("Error updating task:", err);
      alert("Failed to update task");
    } finally {
      setIsSaving(false);
    }
  };

  if (!task || !localTask) return null;

  const isOverdue = localTask.due_date && new Date(localTask.due_date) < new Date() && localTask.status !== "Completed";

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed right-0 top-0 h-full w-full md:w-[90%] lg:w-[85%] bg-gray-50 shadow-2xl z-50 outline-none flex flex-col font-sans">

          {/* Header */}
          <div className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm z-20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900">{localTask.subject || "Untitled Task"}</h2>
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  {localTask.assigned_to && (
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {localTask.assigned_to}
                    </span>
                  )}
                  {localTask.due_date && (
                    <span className={`flex items-center gap-1 ${isOverdue ? "text-red-600 font-medium" : ""}`}>
                      <Calendar className="w-3.5 h-3.5" />
                      {formatRelativeDate(localTask.due_date)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {hasChanges && (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              )}
              <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500" onClick={onClose}>
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white border-b px-6 flex gap-6">
            {(["overview", "activity", "notes"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                  activeTab === tab
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab === "overview" ? "Details" : tab}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "overview" && (
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Status and Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white border rounded-lg p-4">
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Status</label>
                    <select
                      value={localTask.status || "Not Started"}
                      onChange={(e) => handleFieldChange("status", e.target.value)}
                      className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Deferred">Deferred</option>
                      <option value="Waiting on someone else">Waiting on someone else</option>
                    </select>
                  </div>

                  <div className="bg-white border rounded-lg p-4">
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Priority</label>
                    <select
                      value={localTask.priority || "Medium"}
                      onChange={(e) => handleFieldChange("priority", e.target.value)}
                      className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

                {/* Subject */}
                <div className="bg-white border rounded-lg p-4">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Subject</label>
                  <input
                    type="text"
                    value={localTask.subject || ""}
                    onChange={(e) => handleFieldChange("subject", e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Task subject"
                  />
                </div>

                {/* Description */}
                <div className="bg-white border rounded-lg p-4">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Description</label>
                  <textarea
                    value={localTask.description || ""}
                    onChange={(e) => handleFieldChange("description", e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none"
                    placeholder="Task description"
                  />
                </div>

                {/* Due Date and Assigned To */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white border rounded-lg p-4">
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Due Date</label>
                    <input
                      type="datetime-local"
                      value={localTask.due_date ? new Date(localTask.due_date).toISOString().slice(0, 16) : ""}
                      onChange={(e) => handleFieldChange("due_date", e.target.value ? new Date(e.target.value).toISOString() : null)}
                      className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div className="bg-white border rounded-lg p-4">
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Assigned To</label>
                    <input
                      type="text"
                      value={localTask.assigned_to || ""}
                      onChange={(e) => handleFieldChange("assigned_to", e.target.value)}
                      className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="User name or ID"
                    />
                  </div>
                </div>

                {/* Related To */}
                <div className="bg-white border rounded-lg p-4">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Related To</label>
                  <input
                    type="text"
                    value={localTask.lead_name || localTask.contact || ""}
                    onChange={(e) => handleFieldChange("lead_name", e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Lead, Contact, or Deal name"
                  />
                </div>

                {/* Metadata */}
                <div className="bg-gray-50 border rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Additional Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Created:</span>
                      <span className="ml-2 text-gray-900">{formatDateTime(localTask.created_at)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Modified:</span>
                      <span className="ml-2 text-gray-900">{formatDateTime(localTask.modified_at || localTask.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "activity" && (
              <div className="max-w-4xl mx-auto">
                <ActivityFeed entityType="task" entityId={task.id} />
              </div>
            )}

            {activeTab === "notes" && (
              <div className="max-w-4xl mx-auto">
                <RecordNotes entityType="task" entityId={task.id} />
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default TasksDrawer;

