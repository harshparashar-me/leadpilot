import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Role } from "../../types/database";

interface AddRoleModalProps {
  onClose: () => void;
  onSave: () => void;
  editingRole?: Role | null;
}

const AVAILABLE_PERMISSIONS = [
  "view_leads",
  "create_leads",
  "edit_leads",
  "delete_leads",
  "view_accounts",
  "create_accounts",
  "edit_accounts",
  "delete_accounts",
  "view_contacts",
  "create_contacts",
  "edit_contacts",
  "delete_contacts",
  "view_deals",
  "create_deals",
  "edit_deals",
  "delete_deals",
  "view_tasks",
  "create_tasks",
  "edit_tasks",
  "delete_tasks",
  "view_analytics",
  "manage_users",
  "manage_roles",
];

const AddRoleModal: React.FC<AddRoleModalProps> = ({
  onClose,
  onSave,
  editingRole,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: editingRole?.name || "",
    description: editingRole?.description || "",
    status: (editingRole?.status as "active" | "inactive") || "active",
    permissions: editingRole?.permissions || [],
  });

  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      status: value as "active" | "inactive",
    }));
  };

  const togglePermission = (permission: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!formData.name) {
        setError("Role name is required");
        setLoading(false);
        return;
      }

      if (editingRole) {
        // Update existing role
        const { error: updateError } = await supabase
          .from("roles")
          .update(formData)
          .eq("id", editingRole.id);

        if (updateError) throw updateError;
      } else {
        // Create new role
        const { error: insertError } = await supabase
          .from("roles")
          .insert([{ ...formData, id: crypto.randomUUID() }]);

        if (insertError) throw insertError;
      }

      onSave();
    } catch (err: any) {
      setError(err.message || "Failed to save role");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl my-8">
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingRole ? "Edit Role" : "Add New Role"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-100 border border-red-300 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Basic Info Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Basic Information</h3>

            {/* Role Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Sales Manager, Team Lead"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief description of this role's responsibilities"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={handleStatusChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Permissions Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Permissions</h3>
            <p className="text-sm text-gray-600">
              Select permissions that this role should have
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {AVAILABLE_PERMISSIONS.map((permission) => (
                <label
                  key={permission}
                  className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                >
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes(permission)}
                    onChange={() => togglePermission(permission)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700 flex-1">
                    {permission
                      .split("_")
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(" ")}
                  </span>
                </label>
              ))}
            </div>

            {formData.permissions.length === 0 && (
              <p className="text-sm text-gray-500 italic">
                No permissions selected. This role will have no access.
              </p>
            )}

            {formData.permissions.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">
                  Selected Permissions: {formData.permissions.length}
                </p>
                <div className="flex flex-wrap gap-2">
                  {formData.permissions.map((perm) => (
                    <span
                      key={perm}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium"
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </form>

        {/* FOOTER */}
        <div className="flex gap-3 p-6 border-t bg-gray-50 rounded-b-lg sticky bottom-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
          >
            {loading ? "Saving..." : editingRole ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddRoleModal;
