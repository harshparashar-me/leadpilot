import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { User, Role } from "../../types/database";
import AddUserModal from "./AddUserModal";
import AddRoleModal from "./AddRoleModal";

type Tab = "users" | "roles";

export const UsersAndRolesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("users");
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddRole, setShowAddRole] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  // Fetch Users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Roles
  const fetchRoles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("roles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRoles(data || []);
    } catch (err) {
      console.error("Error fetching roles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    } else {
      fetchRoles();
    }
  }, [activeTab]);

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const { error } = await supabase.from("users").delete().eq("id", id);
      if (error) throw error;
      setUsers(users.filter((u) => u.id !== id));
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  const handleDeleteRole = async (id: string) => {
    if (!confirm("Are you sure you want to delete this role?")) return;

    try {
      const { error } = await supabase.from("roles").delete().eq("id", id);
      if (error) throw error;
      setRoles(roles.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Error deleting role:", err);
    }
  };

  const getRoleName = (roleId: string) => {
    return roles.find((r) => r.id === roleId)?.name || "Unknown Role";
  };

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* PAGE HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Users & Roles Management
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage users and define roles with permissions
            </p>
          </div>
        </div>

        {/* TABS */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-3 font-medium border-b-2 transition ${
              activeTab === "users"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab("roles")}
            className={`px-4 py-3 font-medium border-b-2 transition ${
              activeTab === "roles"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Roles ({roles.length})
          </button>
        </div>

        {/* USERS TAB */}
        {activeTab === "users" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">All Users</h2>
              <button
                onClick={() => {
                  setEditingUser(null);
                  setShowAddUser(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="h-4 w-4" />
                Add User
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500">
                Loading users...
              </div>
            ) : users.length === 0 ? (
              <div className="bg-white rounded-lg border p-8 text-center">
                <p className="text-gray-500">No users found</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                        Phone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                        Last Login
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <span className="font-medium text-gray-900">
                            {user.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {getRoleName(user.role_id)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {user.phone || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.status === "active"
                                ? "bg-green-100 text-green-800"
                                : user.status === "inactive"
                                ? "bg-gray-100 text-gray-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {user.last_login
                            ? new Date(user.last_login).toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => {
                                setEditingUser(user);
                                setShowAddUser(true);
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                              title="Edit user"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                              title="Delete user"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ROLES TAB */}
        {activeTab === "roles" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">All Roles</h2>
              <button
                onClick={() => {
                  setEditingRole(null);
                  setShowAddRole(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="h-4 w-4" />
                Add Role
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500">
                Loading roles...
              </div>
            ) : roles.length === 0 ? (
              <div className="bg-white rounded-lg border p-8 text-center">
                <p className="text-gray-500">No roles found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className="bg-white rounded-lg border p-5 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {role.name}
                        </h3>
                        {role.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {role.description}
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          role.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {role.status}
                      </span>
                    </div>

                    {role.permissions && role.permissions.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-gray-700 mb-2">
                          Permissions:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.map((perm) => (
                            <span
                              key={perm}
                              className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                            >
                              {perm}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-4 border-t">
                      <button
                        onClick={() => {
                          setEditingRole(role);
                          setShowAddRole(true);
                        }}
                        className="flex-1 px-3 py-2 text-blue-600 border border-blue-300 rounded hover:bg-blue-50 transition text-sm font-medium flex items-center justify-center gap-1"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRole(role.id)}
                        className="flex-1 px-3 py-2 text-red-600 border border-red-300 rounded hover:bg-red-50 transition text-sm font-medium flex items-center justify-center gap-1"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODALS */}
      {showAddUser && (
        <AddUserModal
          onClose={() => {
            setShowAddUser(false);
            setEditingUser(null);
          }}
          onSave={() => {
            setShowAddUser(false);
            setEditingUser(null);
            fetchUsers();
          }}
          editingUser={editingUser}
          roles={roles}
        />
      )}

      {showAddRole && (
        <AddRoleModal
          onClose={() => {
            setShowAddRole(false);
            setEditingRole(null);
          }}
          onSave={() => {
            setShowAddRole(false);
            setEditingRole(null);
            fetchRoles();
          }}
          editingRole={editingRole}
        />
      )}
    </Layout>
  );
};

export default UsersAndRolesPage;
