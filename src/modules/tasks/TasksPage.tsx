import React, { useState } from "react";
import Layout from "../../components/Layout";
import DataTable from "../../components/table/DataTable";
import { Plus, ClipboardList } from "lucide-react";
import AddTaskModal from "./AddTaskModal";
import TasksDrawer from "./TasksDrawer";

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

export const TasksPage: React.FC = () => {
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleRowClick = (row: Record<string, unknown>) => {
    setSelectedTask(row as unknown as Task);
    setOpenDrawer(true);
  };

  const handleRefresh = () => {
    setRefreshTrigger(p => p + 1);
  };

  return (
    <Layout>
      <div className="flex flex-col h-full space-y-3">
        {/* Header - Zoho CRM Style */}
        <div className="bg-white border rounded-lg shadow-sm p-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList className="w-5 h-5 text-blue-600" />
              <h1 className="text-lg font-semibold text-gray-900">Tasks</h1>
            </div>
            <p className="text-sm text-gray-500">Manage and track your tasks and activities</p>
          </div>

          <button
            onClick={() => setOpenAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create Task
          </button>
        </div>

        {/* Table - Zoho CRM Style */}
        <div className="flex-1 min-h-0 bg-white border rounded-lg shadow-sm overflow-hidden">
          <DataTable 
            resource="tasks" 
            refreshTrigger={refreshTrigger}
            onRowClick={handleRowClick}
          />
        </div>

        {/* Modals and Drawers */}
        <AddTaskModal
          open={openAddModal}
          onClose={() => setOpenAddModal(false)}
          onSave={handleRefresh}
        />

        <TasksDrawer
          task={selectedTask}
          isOpen={openDrawer}
          onClose={() => {
            setOpenDrawer(false);
            setSelectedTask(null);
          }}
          onUpdate={handleRefresh}
        />
      </div>
    </Layout>
  );
};

export default TasksPage;
