import React, { useState } from "react";
import Layout from "../components/Layout";
import {
  Camera,
  User,
  Mail,
  Phone,
  Building2,
  Lock,
  Globe,
  KeyRound,
  Settings,
} from "lucide-react";

export const Profile: React.FC = () => {
  const [tab, setTab] = useState<"profile" | "preferences" | "security">("profile");
  const [avatar, setAvatar] = useState("/default-avatar.png");

  const user = {
    name: "Harsh Parashar",
    email: "harsh@company.com",
    phone: "+91 9990000000",
    company: "Shivansh Realtors",
    role: "Sales Executive",
    joined: "Jan 2024",
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatar(url);
  };

  return (
    <Layout>
      <div className="w-full space-y-8">

        {/* PROFILE BANNER */}
        <div className="relative rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-500 text-white p-10 shadow-lg overflow-hidden">
          {/* Background Blur Orbs */}
          <div className="absolute top-0 right-0 h-32 w-32 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 h-24 w-24 bg-white/10 rounded-full blur-2xl" />

          <div className="flex items-center gap-8 relative">

            {/* Profile Image */}
            <div className="relative">
              <img
                src={avatar}
                className="h-32 w-32 rounded-full border-4 border-white shadow-2xl object-cover"
              />
              <label className="absolute bottom-1 right-1 bg-white text-blue-600 p-2 rounded-full shadow hover:bg-gray-100 transition cursor-pointer">
                <Camera className="h-4 w-4" />
                <input type="file" className="hidden" onChange={handleAvatarUpload} />
              </label>
            </div>

            {/* User Meta */}
            <div>
              <h1 className="text-3xl font-bold">{user.name}</h1>
              <p className="text-white/90 text-lg">{user.role}</p>
              <p className="text-white/80">{user.company}</p>
              <p className="text-white/70 text-sm mt-1">Member since {user.joined}</p>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-8 border-b pb-2">
          {[
            { label: "Profile Info", key: "profile" },
            { label: "Preferences", key: "preferences" },
            { label: "Security", key: "security" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key as any)}
              className={`pb-3 text-sm font-medium transition ${
                tab === item.key
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        <div className="animate-fadeIn">

          {/* PROFILE TAB */}
          {tab === "profile" && (
            <div className="grid md:grid-cols-2 gap-8">

              {/* Info Card */}
              <div className="bg-white p-6 rounded-xl shadow border space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>

                <div className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="text-sm text-gray-600">Full Name</label>
                    <div className="flex items-center bg-gray-50 px-4 py-3 rounded-lg mt-1 gap-3 border">
                      <User className="h-5 w-5 text-gray-500" />
                      <input
                        className="bg-transparent w-full outline-none"
                        defaultValue={user.name}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-sm text-gray-600">Email Address</label>
                    <div className="flex items-center bg-gray-50 px-4 py-3 rounded-lg mt-1 gap-3 border">
                      <Mail className="h-5 w-5 text-gray-500" />
                      <input
                        className="bg-transparent w-full outline-none"
                        defaultValue={user.email}
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="text-sm text-gray-600">Phone Number</label>
                    <div className="flex items-center bg-gray-50 px-4 py-3 rounded-lg mt-1 gap-3 border">
                      <Phone className="h-5 w-5 text-gray-500" />
                      <input
                        className="bg-transparent w-full outline-none"
                        defaultValue={user.phone}
                      />
                    </div>
                  </div>

                  {/* Company */}
                  <div>
                    <label className="text-sm text-gray-600">Company</label>
                    <div className="flex items-center bg-gray-50 px-4 py-3 rounded-lg mt-1 gap-3 border">
                      <Building2 className="h-5 w-5 text-gray-500" />
                      <input
                        className="bg-transparent w-full outline-none"
                        defaultValue={user.company}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional card (Bio or Socials) */}
              <div className="bg-white p-6 rounded-xl shadow border space-y-4">
                <h2 className="text-lg font-semibold">About You</h2>
                <textarea
                  className="w-full bg-gray-50 border rounded-lg p-4 h-40 outline-none"
                  placeholder="Write something about yourself..."
                />
              </div>
            </div>
          )}

          {/* PREFERENCES TAB */}
          {tab === "preferences" && (
            <div className="bg-white p-6 rounded-xl shadow border space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">App Preferences</h2>

              {/* Language */}
              <div>
                <label className="text-sm text-gray-600">Language</label>
                <div className="flex items-center bg-gray-50 border px-4 py-3 rounded-lg mt-1 gap-3">
                  <Globe className="h-5 w-5 text-gray-500" />
                  <select className="bg-transparent w-full outline-none">
                    <option>English</option>
                    <option>Hindi</option>
                  </select>
                </div>
              </div>

              {/* Timezone */}
              <div>
                <label className="text-sm text-gray-600">Timezone</label>
                <div className="flex items-center bg-gray-50 border px-4 py-3 rounded-lg mt-1 gap-3">
                  <Settings className="h-5 w-5 text-gray-500" />
                  <select className="bg-transparent w-full outline-none">
                    <option>IST (India)</option>
                    <option>UTC</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {tab === "security" && (
            <div className="bg-white p-6 rounded-xl shadow border space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Security Settings</h2>

              {/* Password */}
              <div>
                <label className="text-sm text-gray-600">New Password</label>
                <div className="flex items-center bg-gray-50 border px-4 py-3 rounded-lg mt-1 gap-3">
                  <Lock className="h-5 w-5 text-gray-500" />
                  <input type="password" className="bg-transparent w-full outline-none" placeholder="Enter new password" />
                </div>
              </div>

              {/* API Key */}
              <div>
                <label className="text-sm text-gray-600">API Key</label>
                <div className="flex items-center bg-gray-50 border px-4 py-3 rounded-lg mt-1 gap-3">
                  <KeyRound className="h-5 w-5 text-gray-500" />
                  <input type="text" className="bg-transparent w-full outline-none" defaultValue="sk_live_****************" />
                </div>
              </div>

              {/* Save Button */}
              <div className="text-right pt-4">
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
