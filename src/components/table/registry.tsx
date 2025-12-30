import React from "react";
import { Badge } from "./utils/Badge";
import { formatDate, getStatusColor } from "./utils/formatters";
import { formatRelativeDate, formatDateTime } from "./utils/dateFormatting";

// Zoho CRM Task Status Colors
export const getTaskStatusColor = (status?: string) => {
    const s = (status || "Not Started").toLowerCase();
    
    if (s.includes("not started") || s === "open") return "bg-gray-100 text-gray-700 border-gray-200";
    if (s.includes("in progress")) return "bg-blue-100 text-blue-700 border-blue-200";
    if (s.includes("completed") || s === "done") return "bg-green-100 text-green-700 border-green-200";
    if (s.includes("deferred")) return "bg-orange-100 text-orange-700 border-orange-200";
    if (s.includes("waiting")) return "bg-yellow-100 text-yellow-700 border-yellow-200";
    
    return "bg-gray-100 text-gray-700 border-gray-200";
};

// Priority Badge Component
export const getPriorityBadge = (priority: string) => {
    const p = (priority || "Medium").toLowerCase();
    let colorClass = "bg-gray-100 text-gray-700 border-gray-200";
    
    if (p === "high" || p === "urgent") {
        colorClass = "bg-red-100 text-red-700 border-red-200";
    } else if (p === "medium") {
        colorClass = "bg-yellow-100 text-yellow-700 border-yellow-200";
    } else if (p === "low") {
        colorClass = "bg-green-100 text-green-700 border-green-200";
    }
    
    return (
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${colorClass}`}>
            {priority || "Medium"}
        </span>
    );
};

/* ============================================================
   TYPES
============================================================ */

export interface Column<T> {
  key: string;
  label: string;
  width?: number;
  minWidth?: number;
  sortable?: boolean;
  filterType?: "text" | "select" | "date";
  filterOptions?: string[];
  render?: (row: T) => React.ReactNode;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  status: string;
  lead_source: string;
  city: string | null;
  budget: number | null;
  purpose: string | null;
  requirement: string | null;
  size: string | null;
  project: string | null;
  description: string | null;
  assigned_to: string | null;
  created_at: string;
  created_by: string;
  modified_at?: string;
  modified_by?: string;
  conversion_time?: string;
}

export interface Task {
  id: string;
  assigned_to: string | null;
  subject: string | null;
  due_date: string | null;
  status: string;
  lead_name: string | null;
  contact: string | null;
  closed_time: string | null;
  created_at: string;
  created_by: string;
  modified_at?: string;
  modified_by?: string;
  task_owner?: string | null;
  description: string | null;
}

export const enumStatusMap: Record<string, string> = {
  "Attempted": "bg-blue-50 text-blue-700 border-blue-100",
  "Budget Issue": "bg-yellow-50 text-yellow-700 border-yellow-100",
  "Contacted": "bg-purple-50 text-purple-700 border-purple-100",
  "Follow Up": "bg-indigo-50 text-indigo-700 border-indigo-100",
  "Interested": "bg-green-50 text-green-700 border-green-100",
  "Junk": "bg-red-50 text-red-700 border-red-100",
  "Not Interested": "bg-gray-50 text-gray-700 border-gray-100",
};

export interface TableConfig {
  table: string;
  select: string;
  defaultSort?: { column: string; ascending?: boolean };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: Column<Record<string, any>>[];
}

/* ============================================================
   FULL TABLE REGISTRY (FINAL)
============================================================ */

export const tableRegistry: Record<string, TableConfig> = {
  /* ============================================================
     LEADS (MATCHES YOUR SUPABASE SCHEMA EXACTLY)
  ============================================================= */
  leads: {
    table: "leads",
    select: "*",
    defaultSort: { column: "created_at", ascending: false },

    columns: [
      {
        key: "assigned_to",
        label: "Assigned To",
        width: 150,
        render: (r) => r.assigned_to ?? r.created_by,
      },
      { key: "name", label: "Lead Name", width: 180, filterType: "text" },
      { key: "phone", label: "Phone", width: 130, filterType: "text" },
      { key: "email", label: "Email", width: 180, filterType: "text" },

      {
        key: "status",
        label: "Status",
        width: 130,
        filterType: "select",
        filterOptions: ["Attempted", "Budget Issue", "Contacted", "Follow Up", "Interested", "Junk", "Not Interested"],
        render: (r) => Badge(r.status, getStatusColor(r.status)),
      },

      {
        key: "lead_source",
        label: "Source",
        width: 140,
        filterType: "select",
        filterOptions: ["Website", "Referral", "Cold Call", "Social Media", "Ads"]
      },
      { key: "city", label: "City", width: 120, filterType: "text" },
      { key: "budget", label: "Budget", width: 130 },
      { key: "purpose", label: "Purpose", width: 140 },
      { key: "requirement", label: "Requirement", width: 180 },
      { key: "size", label: "Size", width: 120 },
      { key: "project", label: "Project", width: 160 },
      { key: "description", label: "Description", width: 250 },

      {
        key: "created_at",
        label: "Created At",
        width: 140,
        render: (r) => formatDate(r.created_at),
      },

      { key: "created_by", label: "Created By", width: 150 },

      {
        key: "modified_at",
        label: "Modified At",
        width: 140,
        render: (r) => formatDate(r.modified_at),
      },

      { key: "modified_by", label: "Modified By", width: 150 },
      { key: "conversion_time", label: "Conversion Time", width: 150 },
    ],
  },

  /* ============================================================
     TASKS (Zoho CRM Style)
  ============================================================= */
  tasks: {
    table: "tasks",
    select: "*",
    defaultSort: { column: "due_date", ascending: true },

    columns: [
      // Zoho CRM Column Order: Subject, Assigned To, Due Date, Status, Priority, Related To, Created Time, Modified Time
      { 
        key: "subject", 
        label: "Subject", 
        width: 250,
        filterType: "text",
        render: (r) => (
          <div className="font-medium text-gray-900">
            {r.subject || "-"}
          </div>
        ),
      },
      {
        key: "assigned_to",
        label: "Assigned To",
        width: 150,
        filterType: "text",
        render: (r) => (
          <span className="text-gray-700">
            {r.assigned_to ?? r.task_owner ?? r.created_by ?? "-"}
          </span>
        ),
      },
      {
        key: "due_date",
        label: "Due Date",
        width: 140,
        filterType: "date",
        render: (r) => {
          const dateStr = formatRelativeDate(r.due_date);
          const isOverdue = r.due_date && new Date(r.due_date) < new Date() && r.status !== "Completed" && r.status !== "Completed";
          return (
            <span className={isOverdue ? "text-red-600 font-medium" : "text-gray-700"}>
              {dateStr}
            </span>
          );
        },
      },
      {
        key: "status",
        label: "Status",
        width: 140,
        filterType: "select",
        filterOptions: ["Not Started", "In Progress", "Completed", "Deferred", "Waiting on someone else"],
        render: (r) => Badge(r.status || "Not Started", getTaskStatusColor(r.status)),
      },
      {
        key: "priority",
        label: "Priority",
        width: 120,
        filterType: "select",
        filterOptions: ["High", "Medium", "Low"],
        render: (r) => {
          const priority = r.priority || "Medium";
          return getPriorityBadge(priority);
        },
      },
      {
        key: "related_to",
        label: "Related To",
        width: 180,
        filterType: "text",
        render: (r) => {
          const relatedTo = r.lead_name || r.contact || r.related_to || "-";
          return (
            <span className="text-gray-700">
              {relatedTo}
            </span>
          );
        },
      },
      {
        key: "created_at",
        label: "Created Time",
        width: 140,
        filterType: "date",
        render: (r) => {
          return <span className="text-gray-600 text-xs">{formatDateTime(r.created_at)}</span>;
        },
      },
      {
        key: "modified_at",
        label: "Modified Time",
        width: 140,
        filterType: "date",
        render: (r) => {
          return <span className="text-gray-600 text-xs">{formatDateTime(r.modified_at || r.created_at)}</span>;
        },
      },
    ],
  },

  /* ============================================================
     DEALS
  ============================================================= */
  deals: {
    table: "deals",
    select: "*",
    defaultSort: { column: "created_at", ascending: false },

    columns: [
      {
        key: "assigned_to",
        label: "Assigned To",
        width: 150,
        render: (r) => r.assigned_to ?? r.modified_by ?? r.created_by,
      },
      { key: "title", label: "Deal Name", width: 200 },
      { key: "phone", label: "Phone", width: 140 },
      {
        key: "status",
        label: "Deal Status",
        width: 140,
        render: (r) => Badge(r.status, getStatusColor(r.status)),
      },
      { key: "description", label: "Description", width: 250 },
      { key: "lead_source", label: "Source", width: 140 },
      { key: "city", label: "City", width: 120 },
      {
        key: "amount",
        label: "Amount",
        width: 140,
        render: (r) => `₹${r.amount?.toLocaleString() || 0}`,
      },
      { key: "requirement", label: "Requirement", width: 180 },
      { key: "size", label: "Size", width: 120 },
      { key: "email", label: "Email", width: 180 },
      {
        key: "created_at",
        label: "Created",
        width: 140,
        render: (r) => formatDate(r.created_at),
      },
      { key: "created_by", label: "Created By", width: 150 },
      {
        key: "modified_at",
        label: "Modified",
        width: 140,
        render: (r) => formatDate(r.modified_at),
      },
      { key: "modified_by", label: "Modified By", width: 150 },
    ],
  },

  /* ============================================================
     SITE VISITS
  ============================================================= */
  site_visits: {
    table: "site_visits",
    select: "*",

    columns: [
      {
        key: "assigned_to",
        label: "Assigned To",
        width: 150,
        render: (r) => r.assigned_to ?? r.attended_by ?? r.created_by,
      },
      { key: "lead_name", label: "Lead Name", width: 180 },
      { key: "phone", label: "Phone", width: 150 },
      {
        key: "status",
        label: "Status",
        width: 130,
        render: (r) => Badge(r.status, getStatusColor(r.status)),
      },
      { key: "project", label: "Project", width: 150 },
      {
        key: "visit_date",
        label: "Visit Date",
        width: 140,
        render: (r) => formatDate(r.visit_date),
      },
      { key: "visit_time", label: "Time", width: 120 },
      { key: "location", label: "Location", width: 160 },
      { key: "attended_by", label: "Attended By", width: 150 },
      { key: "email", label: "Email", width: 180 },
      { key: "created_by", label: "Created By", width: 140 },
      {
        key: "created_at",
        label: "Created At",
        width: 140,
        render: (r) => formatDate(r.created_at),
      },
      {
        key: "modified_at",
        label: "Modified",
        width: 140,
        render: (r) => formatDate(r.modified_at),
      },
      { key: "modified_by", label: "Modified By", width: 150 },
    ],
  },

  /* ============================================================
     ACCOUNTS
  ============================================================= */
  accounts: {
    table: "accounts",
    select: "*",

    columns: [
      { key: "name", label: "Account Name", width: 200 },
      { key: "industry", label: "Industry", width: 150 },
      { key: "website", label: "Website", width: 180 },
      { key: "phone", label: "Phone", width: 150 },
      { key: "city", label: "City", width: 150 },
      { key: "assigned_to", label: "Owner", width: 150 },
    ],
  },

  /* ============================================================
     CONTACTS
  ============================================================= */
  contacts: {
    table: "contacts",
    select: "*",

    columns: [
      { key: "full_name", label: "Name", width: 180 },
      { key: "email", label: "Email", width: 200 },
      { key: "phone", label: "Phone", width: 150 },
      { key: "city", label: "City", width: 150 },
      { key: "position", label: "Position", width: 140 },
      { key: "assigned_to", label: "Owner", width: 150 },
    ],
  },

  /* ============================================================
     PROPERTIES
  ============================================================= */
  properties: {
    table: "properties",
    select: "*",

    columns: [
      {
        key: "assigned_to",
        label: "Assigned To",
        width: 150,
        render: (r) => r.assigned_to ?? r.modified_by ?? r.created_by,
      },
      { key: "name", label: "Property", width: 200 },
      { key: "property_type", label: "Type", width: 140 },
      {
        key: "price",
        label: "Price",
        width: 140,
        render: (r) => `₹${r.price?.toLocaleString() || 0}`,
      },
      { key: "location", label: "Location", width: 180 },
      {
        key: "status",
        label: "Status",
        width: 150,
        render: (r) => Badge(r.status, getStatusColor(r.status)),
      },
    ],
  },

  /* ============================================================
     CALL LOGS
  ============================================================= */
  call_logs: {
    table: "call_logs",
    select: "*",
    defaultSort: { column: "call_time", ascending: false },

    columns: [
      {
        key: "assigned_to",
        label: "Assigned To",
        width: 150,
        render: (r) => r.assigned_to ?? r.created_by,
      },
      { key: "phone", label: "Phone", width: 150 },
      { key: "outcome", label: "Outcome", width: 150 },
      {
        key: "call_time",
        label: "Call Time",
        width: 150,
        render: (r) => formatDate(r.call_time),
      },
      { key: "duration_seconds", label: "Duration (sec)", width: 150 },
      { key: "subject", label: "Subject", width: 200 },
      { key: "created_by", label: "Created By", width: 150 },
    ],
  },
};

/* Export list for TypeScript auto-complete */
export type ResourceKey = keyof typeof tableRegistry;
