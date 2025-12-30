import React from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useLocation } from "react-router-dom";
import { CommandPalette } from "./CommandPalette";

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  // Show header only on dashboard + search pages
  const showHeader =
    location.pathname === "/dashboard" ||
    location.pathname === "/search";

  return (
    <div className="h-screen w-full flex bg-gray-100 overflow-hidden">

      {/* SIDEBAR */}
      <Sidebar
        isOpen={true}
        onToggle={() => { }}
        collapsed={false}
        setCollapsed={() => { }}
      />

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-col flex-1 min-w-0 ml-14 lg:ml-52 transition-all duration-300">

        {/* HEADER (when allowed) */}
        {showHeader && (
          <Header onMenuClick={() => { }} userName="Harsh" />
        )}

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-5">
          {children}
        </main>

      </div>

      {/* GLOBAL OVERLAYS */}
      <CommandPalette />
    </div>
  );
}
