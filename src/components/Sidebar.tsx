import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  Contact,
  CheckSquare,
  MapPin,
  Home,
  Handshake,
  Phone,
  MoreHorizontal,
  X,
  TrendingUp,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useTheme } from "../store/useTheme";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
}

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Users, label: "Leads", path: "/leads" },
  { icon: Contact, label: "Contacts", path: "/contacts" },
  { icon: Building2, label: "Accounts", path: "/accounts" },
  { icon: CheckSquare, label: "Tasks", path: "/tasks" },
  { icon: MapPin, label: "Site Visits", path: "/site-visits" },
  { icon: Home, label: "Properties", path: "/properties" },
  { icon: Handshake, label: "Deals", path: "/deals" },
  { icon: Phone, label: "Call Logs", path: "/call-logs" },
  { icon: TrendingUp, label: "Analytics", path: "/analytics" },

  // Advanced Features & Search moved to "More" page
  { icon: MoreHorizontal, label: "More", path: "/more" },
];

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  collapsed,
  setCollapsed,
}) => {
  const location = useLocation();
  const { themeColor } = useTheme();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
        />
      )}

      {/* SIDEBAR */}
      <div
        onMouseEnter={() => setCollapsed(false)}
        onMouseLeave={() => setCollapsed(true)}
        className={cn(
          "fixed top-3 bottom-3 left-3 bg-white border rounded-2xl shadow-sm z-40 flex flex-col transition-all duration-300",
          collapsed ? "w-14" : "w-52",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* TOP HEADER */}
        <div className="h-14 flex items-center justify-between px-3 border-b">
          <div className="flex items-center gap-2 overflow-hidden">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm"
              style={{ background: themeColor }}
            >
              LP
            </div>

            {!collapsed && (
              <span className="text-[14px] font-semibold tracking-wide text-gray-800">
                LeadPilot
              </span>
            )}
          </div>

          {/* Mobile close */}
          <button
            onClick={onToggle}
            className="lg:hidden p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MENU LIST */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 custom-scroll">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all select-none",
                      isActive
                        ? "text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-100",
                      collapsed && "justify-center px-0"
                    )}
                    style={isActive ? { backgroundColor: themeColor } : {}}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 shrink-0",
                        isActive ? "text-white" : "text-gray-500"
                      )}
                    />

                    {!collapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* FOOTER */}
        {!collapsed && (
          <div className="px-4 py-3 border-t text-[11px] text-gray-400 text-center">
            CRM v1.0.0
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;
