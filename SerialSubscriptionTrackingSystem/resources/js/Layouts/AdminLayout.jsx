import React, { useState } from "react";
import { router, usePage } from "@inertiajs/react";
import { GoHome } from "react-icons/go";
import { HiUsers } from "react-icons/hi";
import { ImStatsBars } from "react-icons/im";
import { MdOutlineNotificationsActive } from "react-icons/md";

/* ===================== NAV ITEMS ===================== */
const navItems = [
  { icon: <GoHome size={18} />, label: "Dashboard", href: "/dashboard" },
  { icon: <HiUsers size={18} />, label: "Account Approval", href: "/account-approval" },
  { icon: <ImStatsBars size={18} />, label: "List of Supplier", href: "/list-of-supplier" },
];

export default function AdminLayout({ children, header }) {
  const { url } = usePage();
  const [openNotifications, setOpenNotifications] = useState(false);
  const [openAccount, setOpenAccount] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#f5f7fb] text-gray-800">

      {/* ===================== SIDEBAR ===================== */}
      <aside className="w-48 bg-[#0f57a3] text-white flex-shrink-0 flex flex-col justify-between sticky top-0 h-screen shadow-xl">

        {/* LOGO */}
        <div>
          <div className="px-5 py-6 flex items-center gap-3 border-b border-blue-800">
            <img
              src="/images/dost-logo1.png"
              alt="logo"
              className="w-10 h-10 rounded-lg"
            />
            <div>
              <p className="font-semibold text-base">DOST STII</p>
              <p className="text-xs text-blue-200">Admin Panel</p>
            </div>
          </div>

          {/* NAV */}
          <nav className="mt-6 px-3">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      router.get(item.href);
                    }}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all
                      ${
                        url.startsWith(item.href)
                          ? "bg-[#0b63d6] shadow-md"
                          : "hover:bg-[#0b63d6]/70"
                      }
                    `}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>

      {/* ===================== MAIN WRAPPER ===================== */}
      <div className="flex-1 flex flex-col min-h-screen">

        {/* TOPBAR */}
        <header className="bg-white shadow-sm sticky top-0 z-20">
          <div className="px-6 py-5 flex items-center justify-between">
            <h2 className="text-[20px] font-semibold text-[#004A98]">
              Admin Dashboard
            </h2>

            <div className="flex items-center gap-4">

              {/* Notifications */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => {
                    setOpenNotifications(!openNotifications);
                    setOpenAccount(false);
                  }}
                  style={{ cursor: 'pointer', border: 'none', background: 'none', padding: 0 }}
                >
                  <MdOutlineNotificationsActive size={20} />
                </button>

                {openNotifications && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: '35px',
                    background: '#fff',
                    borderRadius: 10,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                    width: 200,
                    padding: '16px 18px',
                    zIndex: 10000,
                    transition: 'all 0.2s ease',
                  }}>
                    <p style={{ margin: 0, fontSize: 14, color: '#555' }}>You're all caught up!</p>
                  </div>
                )}
              </div>

              {/* Account */}
              <div className="relative">
                <button
                  onClick={() => {
                    setOpenAccount(!openAccount);
                    setOpenNotifications(false);
                  }}
                  className="w-9 h-9 rounded-full bg-[#0f57a3] text-white font-semibold"
                >
                  A
                </button>

                {openAccount && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg p-4">
                    <p className="text-sm font-semibold">Admin</p>
                    <p className="text-xs text-gray-500 mb-4">
                      System Administrator
                    </p>

                    <button
                      onClick={() => router.post(route('logout'))}
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

        {/* PAGE CONTENT */}
        <main className="flex-1 px-6 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
