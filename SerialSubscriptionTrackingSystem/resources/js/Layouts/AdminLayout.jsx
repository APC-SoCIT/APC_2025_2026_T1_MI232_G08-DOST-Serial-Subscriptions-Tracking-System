import React, { useState } from "react";
import { router } from "@inertiajs/react";
import { GoHome } from "react-icons/go";
import { HiUsers } from "react-icons/hi";
import { ImStatsBars } from "react-icons/im";
import { FaTruck } from "react-icons/fa";
import { MdMarkEmailRead } from "react-icons/md";
import { VscAccount } from "react-icons/vsc";
import { MdOutlineNotificationsActive } from "react-icons/md";
import { IoChatboxEllipsesOutline } from "react-icons/io5";
import { RiAddLargeFill } from "react-icons/ri";

const navItems = [
  { icon: <GoHome size={18} />, label: "Dashboard", href: "/admin-dashboard" },
  { icon: <HiUsers size={18} />, label: "Account Approval", href: "/account-approval" },
  { icon: <ImStatsBars size={18} />, label: "Supplier Serial", href: "/supplier-serial" },
];

export default function AdminLayout({ children, header }) {
  const [active, setActive] = useState(0);
  const [openAccount, setOpenAccount] = useState(false);
  const [openNotifications, setOpenNotifications] = useState(false);
  const [openChat, setOpenChat] = useState(false);

  return (
    <div className="min-h-screen flex bg-gray-100 text-gray-800">
      {/* Sidebar */}
      <aside className="w-56 bg-[#0f57a3] text-white flex-shrink-0">
        <div className="px-6 py-6 flex items-center gap-3 border-b border-blue-800">
          <img src="/images/dost-logo1.png" alt="logo" className="w-12 h-12 rounded-md" />
          <span className="font-semibold text-xl">DOST STII</span>
        </div>

        <nav className="mt-6 px-3">
          <ul className="space-y-2">
            {navItems.map((it, i) => (
              <li key={it.label}>
                <a
                  href={it.href}
                  onClick={(e) => {
                    e.preventDefault();
                    setActive(i);
                    router.get(it.href);
                  }}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                    active === i ? "bg-[#0b63d6] shadow-lg" : "hover:bg-[#0b63d6]/60"
                  }`}
                >
                  <div className="text-lg">{it.icon}</div>
                  <span className="text-sm font-medium">{it.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-h-screen flex flex-col">
        {/* Topbar */}
        <header className="bg-white shadow-sm sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
            
            <h2 className="text-[20px] font-semibold" style={{ color: '#004A98' }}>
              {header ?? "Serial Subscription Tracking System"}
            </h2>
            <div className="flex items-center gap-4 ml-auto">
              {/* Messages */}
              <div className="relative">
                <button
                  onClick={() => {
                    setOpenChat((s) => !s);
                    setOpenNotifications(false);
                    setOpenAccount(false);
                  }}
                  className="p-2 rounded-md hover:bg-gray-100"
                  title="Messages"
                >
                  <IoChatboxEllipsesOutline size={20} />
                </button>
                {openChat && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg p-3">
                    <p className="text-sm text-gray-600">No new messages.</p>
                  </div>
                )}
              </div>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => {
                    setOpenNotifications((s) => !s);
                    setOpenChat(false);
                    setOpenAccount(false);
                  }}
                  className="p-2 rounded-md hover:bg-gray-100"
                  title="Notifications"
                >
                  <MdOutlineNotificationsActive size={20} />
                </button>
                {openNotifications && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg p-3">
                    <p className="text-sm text-gray-600">You’re all caught up!</p>
                  </div>
                )}
              </div>

              {/* Account */}
              <div className="relative">
                <button
                  onClick={() => {
                    setOpenAccount((s) => !s);
                    setOpenChat(false);
                    setOpenNotifications(false);
                  }}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100"
                  title="Account"
                >
                  <div className="w-8 h-8 rounded-full bg-[#0f57a3] text-white flex items-center justify-center font-semibold">
                    A
                  </div>
                </button>

                {openAccount && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-[#0f57a3] text-white flex items-center justify-center font-semibold">
                        A
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Admin</p>
                        <p className="text-xs text-gray-500">System Administrator</p>
                      </div>
                    </div>

                    <button
                      onClick={() => router.post("/logout")}
                      className="w-full bg-[#0f57a3] text-white py-2 rounded-md text-sm"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page body */}
        <main className="flex-1 max-w-7xl mx-auto px-6 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
