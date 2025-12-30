import React, { useState } from "react"
import { useNotifications } from "../store/useNotifications"

export const Notifications: React.FC = () => {
  const { notifications, markAllRead } = useNotifications()

  const [filter, setFilter] = useState("all")

  const filtered = notifications.filter((n) => {
    if (filter === "all") return true
    if (filter === "unread") return !n.read
    return n.type === filter
  })

  const filters = [
    { value: "all", label: "All" },
    { value: "unread", label: "Unread" },
    { value: "lead_assigned", label: "Lead Updates" },
    { value: "task_due", label: "Tasks" },
    { value: "deal_updated", label: "Deals" },
    { value: "call_logged", label: "Calls" },
  ]

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
        <p className="text-gray-600 mt-1">
          All CRM notifications in one place
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border">

        {/* FILTERS */}
        <div className="flex gap-3 mb-6">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium
                ${filter === f.value ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}
              `}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* LIST */}
        <div className="divide-y">
          {filtered.map((note) => (
            <div
              key={note.id}
              className={`py-4 px-2 hover:bg-gray-50 flex justify-between ${
                !note.read ? "bg-blue-50/50" : ""
              }`}
            >
              <div>
                <p className="text-gray-900 font-semibold">{note.title}</p>
                <p className="text-xs text-gray-500">{note.created_at}</p>
              </div>

              {!note.read && (
                <span className="h-2 w-2 bg-blue-600 rounded-full"></span>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={markAllRead}
          className="mt-4 text-blue-600 text-sm hover:underline"
        >
          Mark all as read
        </button>
      </div>
    </div>
  )
}
