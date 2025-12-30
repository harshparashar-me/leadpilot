import React, { useState } from "react";
import Layout from "../components/Layout";
import {
  User,
  Bell,
  Palette,
  Shield,
  Building2,
  CreditCard,
  ChevronRight,
  Globe,
  ToggleLeft,
  ToggleRight,
  Camera,
} from "lucide-react";

import { useTheme } from "../store/useTheme";

export const Settings: React.FC = () => {
  const [section, setSection] = useState("general");

  const { themeColor, setThemeColor } = useTheme();

  const [companyLogo, setCompanyLogo] = useState("/company-logo.png");

  const uploadCompanyLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setCompanyLogo(URL.createObjectURL(f));
  };

  const colorPresets = ["#2D6CDF", "#F97316", "#059669", "#8B5CF6", "#DC2626", "#0EA5E9", "#1F2937"];

  return (
    <Layout>
      <div className="flex gap-6">

        {/* LEFT MENU */}
        <div className="w-60 bg-white rounded-xl shadow border p-4 space-y-2 h-fit">
          <h2 className="text-lg font-semibold pb-2 border-b">Settings</h2>

          <SideItem icon={<User />} label="General" active={section === "general"} onClick={() => setSection("general")} />
          <SideItem icon={<Bell />} label="Notifications" active={section === "notifications"} onClick={() => setSection("notifications")} />
          <SideItem icon={<Palette />} label="Appearance" active={section === "appearance"} onClick={() => setSection("appearance")} />
          <SideItem icon={<Building2 />} label="Company Settings" active={section === "company"} onClick={() => setSection("company")} />
          <SideItem icon={<Shield />} label="Security" active={section === "security"} onClick={() => setSection("security")} />
          <SideItem icon={<CreditCard />} label="Billing" active={section === "billing"} onClick={() => setSection("billing")} />
        </div>

        {/* RIGHT CONTENT */}
        <div className="flex-1">

          {/* COMPANY SETTINGS */}
          {section === "company" && (
            <SettingsCard title="Company Settings">

              {/* LOGO */}
              <div>
                <label className="text-sm text-gray-700 font-medium">Company Logo</label>
                <div className="flex items-center gap-6 mt-3">
                  <img
                    src={companyLogo}
                    className="h-20 w-20 rounded-lg border shadow-sm bg-white object-contain"
                  />

                  <label className="px-5 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 cursor-pointer flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Upload Logo
                    <input type="file" className="hidden" onChange={uploadCompanyLogo} />
                  </label>
                </div>
              </div>

              {/* NAME */}
              <InputRow label="Company Name" icon={<Building2 />}>
                <input className="outline-none w-full bg-transparent" defaultValue="Shivansh Realtors" />
              </InputRow>

              {/* WEBSITE */}
              <InputRow label="Website" icon={<Globe />}>
                <input className="outline-none w-full bg-transparent" defaultValue="https://company.com" />
              </InputRow>

              <hr className="my-6" />

              {/* COLOR PICKER */}
              <div>
                <label className="text-sm text-gray-700 font-medium">Theme Color</label>
                <div className="flex flex-wrap items-center gap-3 mt-3">

                  {colorPresets.map((c) => (
                    <div
                      key={c}
                      onClick={() => setThemeColor(c)}
                      className="h-8 w-8 rounded-full shadow cursor-pointer hover:scale-110 transition border"
                      style={{
                        backgroundColor: c,
                        borderColor: themeColor === c ? "black" : "#ccc",
                        borderWidth: themeColor === c ? 2 : 1,
                      }}
                    />
                  ))}

                  <input
                    type="color"
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    className="h-8 w-12 rounded border cursor-pointer"
                  />
                </div>
              </div>

              {/* PREVIEW */}
              <div className="mt-6">
                <p className="text-sm text-gray-600 mb-2">Preview</p>
                <div
                  className="w-full h-12 rounded-lg shadow flex items-center justify-center text-white font-medium"
                  style={{ backgroundColor: themeColor }}
                >
                  Primary Button Sample
                </div>
              </div>
            </SettingsCard>
          )}

          {/* OTHER SECTIONS */}
          {section === "general" && <GeneralSection />}
          {section === "notifications" && <NotificationSection />}
          {section === "appearance" && <AppearanceSection />}
          {section === "security" && <SecuritySection />}
          {section === "billing" && <BillingSection />}
        </div>
      </div>
    </Layout>
  );
};

/* =====================================================
                      COMPONENTS
===================================================== */

const SideItem = ({ icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center justify-between w-full px-3 py-2 rounded-lg transition ${
      active ? "bg-blue-50 text-blue-600" : "hover:bg-gray-100 text-gray-700"
    }`}
  >
    <div className="flex items-center gap-2">
      {React.cloneElement(icon, { className: "h-4 w-4" })}
      <span className="text-sm">{label}</span>
    </div>
    <ChevronRight className="h-4 w-4 opacity-40" />
  </button>
);

const SettingsCard = ({ title, children }: any) => (
  <div className="bg-white p-6 rounded-xl shadow border animate-fadeIn space-y-6">
    <h2 className="text-xl font-semibold">{title}</h2>
    {children}
  </div>
);

const InputRow = ({ label, icon, children }: any) => (
  <div>
    <label className="text-sm text-gray-700 font-medium">{label}</label>
    <div className="flex items-center gap-3 bg-gray-50 border px-4 py-3 rounded-lg mt-1">
      {React.cloneElement(icon, { className: "h-5 w-5 text-gray-500" })}
      {children}
    </div>
  </div>
);

/* =====================================================
                SECTION: GENERAL
===================================================== */

const GeneralSection = () => (
  <SettingsCard title="General Settings">
    <InputRow label="Language" icon={<Globe />}>
      <select className="w-full bg-transparent outline-none">
        <option>English</option>
        <option>Hindi</option>
      </select>
    </InputRow>
  </SettingsCard>
);

/* =====================================================
                SECTION: NOTIFICATIONS
===================================================== */

const NotificationSection = () => (
  <SettingsCard title="Notification Preferences">
    <ToggleItem title="Push Notifications" subtitle="Show browser notifications" />
    <ToggleItem title="New Lead Alerts" subtitle="When leads are assigned to you" />
    <ToggleItem title="Deal Status Updates" subtitle="Receive stage change alerts" />
  </SettingsCard>
);

/* =====================================================
                SECTION: APPEARANCE
===================================================== */

const AppearanceSection = () => (
  <SettingsCard title="Appearance">
    <ToggleItem title="Compact Mode" subtitle="Reduce padding & spacing for dense tables" />
  </SettingsCard>
);

/* =====================================================
                SECTION: SECURITY
===================================================== */

const SecuritySection = () => (
  <SettingsCard title="Security Settings">
    <InputRow label="Change Password" icon={<Shield />}>
      <input type="password" placeholder="Enter new password" className="bg-transparent w-full outline-none" />
    </InputRow>

    <ToggleItem title="Two-Factor Authentication" subtitle="Add an extra layer of security" />
  </SettingsCard>
);

/* =====================================================
                SECTION: BILLING
===================================================== */

const BillingSection = () => (
  <SettingsCard title="Billing & Subscription">
    <p className="text-gray-600">Billing features coming soon…</p>
  </SettingsCard>
);

/* =====================================================
                REUSABLE TOGGLE ITEM
===================================================== */

const ToggleItem = ({ title, subtitle }: any) => {
  const [on, setOn] = useState(true);

  return (
    <div
      onClick={() => setOn(!on)}
      className="flex justify-between items-center bg-gray-50 border px-4 py-3 rounded-lg cursor-pointer"
    >
      <div>
        <p className="font-medium text-gray-800">{title}</p>
        <p className="text-gray-500 text-sm">{subtitle}</p>
      </div>

      {on ? (
        <ToggleRight className="h-6 w-6 text-blue-600" />
      ) : (
        <ToggleLeft className="h-6 w-6 text-gray-400" />
      )}
    </div>
  );
};
