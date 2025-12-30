import React from "react";
import Layout from "../components/Layout";
import { Link } from "react-router-dom";
import {
  Settings,
  User,
  Bell,
  HelpCircle,
  ShieldCheck,
  Palette,
  LogOut,
  Workflow,
  Mail,
  ClipboardList,
  Brain,
  Plug,
  MessageCircle,
  Search,
  ChevronRight,
  UserCog
} from "lucide-react";

export const More: React.FC = () => {
  // Premium "More" Dashboard Design
  const user = {
    name: "Harsh Parashar",
    role: "Administrator",
    email: "harsh@leadpilot.com", // Placeholder
    avatar: "HP"
  };

  const features = [
    {
      category: "Automation & Intelligence",
      description: "Power up your CRM with AI and automation tools.",
      items: [
        {
          icon: Workflow,
          label: "Workflows",
          path: "/workflows",
          desc: "Automate repetitive tasks and processes.",
          color: "text-purple-600",
          bg: "bg-purple-50",
          border: "border-purple-200"
        },
        {
          icon: Brain,
          label: "AI Insights",
          path: "/ai-insights",
          desc: "Smart lead scoring and predictive analytics.",
          color: "text-emerald-600",
          bg: "bg-emerald-50",
          border: "border-emerald-200"
        },
        {
          icon: Search,
          label: "Global Search",
          path: "/search",
          desc: "Search across all records instantly.",
          color: "text-blue-600",
          bg: "bg-blue-50",
          border: "border-blue-200"
        }
      ]
    },
    {
      category: "Communication & Templates",
      description: "Manage templates and external channels.",
      items: [
        {
          icon: Mail,
          label: "Email Templates",
          path: "/email-templates",
          desc: "Design and manage email campaigns.",
          color: "text-orange-600",
          bg: "bg-orange-50",
          border: "border-orange-200"
        },
        {
          icon: ClipboardList,
          label: "Task Templates",
          path: "/task-templates",
          desc: "Standardize task creation with templates.",
          color: "text-indigo-600",
          bg: "bg-indigo-50",
          border: "border-indigo-200"
        },
        {
          icon: MessageCircle,
          label: "WhatsApp",
          path: "/whatsapp",
          desc: "Connect and chat via WhatsApp Business.",
          color: "text-green-600",
          bg: "bg-green-50",
          border: "border-green-200"
        },
        {
          icon: Plug,
          label: "Integrations",
          path: "/integrations",
          desc: "Connect with Meta, Google, and more.",
          color: "text-cyan-600",
          bg: "bg-cyan-50",
          border: "border-cyan-200"
        }
      ]
    },
    {
      category: "System & Settings",
      description: "Configure your personal and system preferences.",
      items: [
        {
          icon: UserCog,
          label: "Users & Roles",
          path: "/admin/users-and-roles",
          desc: "Create users, assign roles, and manage permissions.",
          color: "text-blue-600",
          bg: "bg-blue-50",
          border: "border-blue-200"
        },
        {
          icon: User,
          label: "Profile",
          path: "/profile",
          desc: "Manage your personal information.",
          color: "text-gray-600",
          bg: "bg-gray-50",
          border: "border-gray-200"
        },
        {
          icon: Settings,
          label: "Settings",
          path: "/settings",
          desc: "System-wide configurations.",
          color: "text-gray-600",
          bg: "bg-gray-50",
          border: "border-gray-200"
        },
        {
          icon: Bell,
          label: "Notifications",
          path: "/notifications",
          desc: "Manage your alert preferences.",
          color: "text-gray-600",
          bg: "bg-gray-50",
          border: "border-gray-200"
        },
        {
          icon: Palette,
          label: "Appearance",
          path: "/theme",
          desc: "Customize the look and feel.",
          color: "text-pink-600",
          bg: "bg-pink-50",
          border: "border-pink-200"
        }
      ]
    }
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50/50 pb-20">
        {/* Header Section */}
        <div className="bg-white border-b px-8 py-8 md:py-10">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                More Options <span className="text-blue-600 text-4xl">.</span>
              </h1>
              <p className="text-gray-500 mt-2 text-lg">
                Explore advanced features, integrations, and settings.
              </p>
            </div>

            {/* Mini Profile Card */}
            <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-2xl border border-gray-100 shadow-sm pr-6">
              <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                {user.avatar}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 leading-tight">{user.name}</h3>
                <p className="text-xs text-gray-500 font-medium">{user.role}</p>
              </div>
              <div className="h-8 w-[1px] bg-gray-200 mx-2"></div>
              <Link to="/logout" className="text-gray-400 hover:text-red-500 transition-colors" title="Logout">
                <LogOut size={20} />
              </Link>
            </div>
          </div>
        </div>

        {/* Main Grid Content */}
        <div className="max-w-6xl mx-auto px-6 py-10 space-y-12">
          {features.map((section, idx) => (
            <div key={idx} className="animate-fade-in-up" style={{ animationDelay: `${idx * 100}ms` }}>
              <div className="flex items-end gap-3 mb-6 border-b border-gray-200 pb-2">
                <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide">
                  {section.category}
                </h2>
                <span className="text-sm text-gray-400 font-medium pb-0.5 hidden sm:block">
                  — {section.description}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.label}
                      to={item.path}
                      className="group relative bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                    >
                      {/* Hover Gradient Overlay */}
                      <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 ${item.bg.replace('50', '500')}`}></div>

                      <div className="flex items-start gap-4 relaitve z-10">
                        <div className={`p-3 rounded-xl ${item.bg} ${item.color} ${item.border} border shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                          <Icon size={24} strokeWidth={2} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors flex items-center gap-1">
                            {item.label}
                            <ChevronRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-500" />
                          </h3>
                          <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Help & Support Banner */}
          <div className="mt-16 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform duration-700">
              <HelpCircle size={200} />
            </div>

            <div className="relative z-10 max-w-2xl">
              <div className="flex items-center gap-3 mb-3 text-blue-300 font-semibold tracking-wide text-sm uppercase">
                <ShieldCheck size={16} /> Enterprise Support
              </div>
              <h2 className="text-3xl font-bold mb-4">Need help setting up integrations?</h2>
              <p className="text-slate-300 mb-8 text-lg">
                Our support team is available 24/7 to help you configure Workflows, AI Insights, and third-party integrations.
              </p>
              <div className="flex gap-4">
                <button className="bg-white text-slate-900 px-6 py-3 rounded-lg font-bold hover:bg-blue-50 transition shadow-lg flex items-center gap-2">
                  <HelpCircle size={18} /> Contact Support
                </button>
                <button className="bg-slate-700 text-white px-6 py-3 rounded-lg font-bold hover:bg-slate-600 transition border border-slate-600">
                  Read Documentation
                </button>
              </div>
            </div>
          </div>

          <div className="text-center pt-8 text-gray-400 text-xs font-medium">
            LeadPilot CRM Enterprise • v2.5.0 (Build 2025.12)
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default More;
