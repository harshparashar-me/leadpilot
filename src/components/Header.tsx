import React, { useState } from "react";
import {
  Menu,
  Bell,
  RefreshCcw,
  Search,
  User,
  LogOut,
  Settings,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../store/useTheme";
import { GlobalQuickAdd } from "./GlobalQuickAdd";

interface HeaderProps {
  onMenuClick: () => void;
  userName?: string;
}

const Header: React.FC<HeaderProps> = ({
  onMenuClick,
  userName = "Admin User",
}) => {
  const navigate = useNavigate();
  const { themeColor } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="px-4 pt-3">
      <div className="bg-white border shadow-sm rounded-xl px-4 py-2.5 flex items-center justify-between">

        {/* LEFT SECTION */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="p-1.5 rounded-md hover:bg-gray-100 transition lg:hidden"
          >
            <Menu className="h-5 w-5 text-gray-700" />
          </button>

          <h2 className="hidden md:block text-[15px] font-semibold text-gray-700">
            CRM Overview
          </h2>
        </div>

        {/* RIGHT ACTIONS */}
        <div className="flex items-center gap-3">

          {/* QUICK ADD */}
          <div className="hidden md:block">
            <GlobalQuickAdd />
          </div>

          {/* SEARCH SHORTCUT */}
          <button
            onClick={() => navigate("/search")}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-xs text-gray-600 hover:bg-gray-200 transition"
          >
            <Search className="h-4 w-4" />
            Quick Search
          </button>

          {/* REFRESH */}
          <button
            onClick={() => window.location.reload()}
            className="p-1.5 hover:bg-gray-100 rounded-md"
          >
            <RefreshCcw className="h-5 w-5 text-gray-600" />
          </button>

          {/* NOTIFICATIONS */}
          <button className="relative p-1.5 hover:bg-gray-100 rounded-md">
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
          </button>

          {/* PROFILE DROPDOWN */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-200"
            >
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: themeColor }}
              >
                {userName.charAt(0)}
              </div>
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border z-50 animate-in fade-in slide-in-from-top-2">
                <button
                  onClick={() => navigate("/profile")}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                >
                  <User className="h-4 w-4" /> Profile
                </button>

                <button
                  onClick={() => navigate("/settings")}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                >
                  <Settings className="h-4 w-4" /> Settings
                </button>

                <hr className="my-1" />

                <button
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
