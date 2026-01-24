import React, { useState } from "react";
import { router, usePage } from "@inertiajs/react";
import { GoHome } from "react-icons/go";
import { ImStatsBars } from "react-icons/im";
import { FaClipboardList, FaUserCircle } from "react-icons/fa";
import { IoChatboxEllipsesOutline } from "react-icons/io5";
import { MdOutlineNotificationsActive } from "react-icons/md";
import Chat from "@/Components/Chat";

const navItems = [
  { icon: <GoHome size={18} />, label: "Dashboard", href: "/inspection-dashboard" },
  { icon: <ImStatsBars size={18} />, label: "View by Date", href: "/inspection-date" },
  { icon: <FaClipboardList size={18} />, label: "List of Serials", href: "/inspection-serials" },
  { icon: <IoChatboxEllipsesOutline size={18} />, label: "Chat", type: "chat" },
];

export default function InspectionLayout({ children }) {
  const { url } = usePage();
  const [activeView, setActiveView] = useState("content");
  const [openNotifications, setOpenNotifications] = useState(false);
  const [openAccount, setOpenAccount] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      {/* ================= SIDEBAR ================= */}
      <aside className="fixed left-0 top-0 h-screen w-52 bg-[#0f57a3] text-white">
        <div className="px-5 py-5 flex items-center gap-3 border-b border-blue-800">
          <img src="/images/dost-logo1.png" className="w-9 h-9 rounded" />
          <span className="font-semibold text-sm">DOST STII</span>
        </div>

        <nav className="mt-4 px-2">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.label}>
                {item.type === "chat" ? (
                  <button
                    onClick={() => setActiveView("chat")}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm
                      ${
                        activeView === "chat"
                          ? "bg-blue-600"
                          : "hover:bg-blue-600/70"
                      }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ) : (
                  <a
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveView("content");
                      router.get(item.href);
                    }}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm
                      ${
                        activeView === "content" && url.startsWith(item.href)
                          ? "bg-blue-600"
                          : "hover:bg-blue-600/70"
                      }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </a>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* ================= MAIN ================= */}
      <div className="ml-52 flex flex-col min-h-screen">
        {/* ================= TOPBAR ================= */}
        <header className="sticky top-0 z-20 bg-white border-b">
          <div className="px-6 py-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#004A98]">
              Inspection Dashboard
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: 18, position: 'relative' }}>
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
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => {
                    setOpenAccount(!openAccount);
                    setOpenNotifications(false);
                  }}
                  style={{ cursor: 'pointer', border: 'none', background: 'none', padding: 0 }}
                >
                  <FaUserCircle size={22} />
                </button>

                {openAccount && (
                  <div style={{
                    position: 'absolute',
                    top: '35px',
                    right: 0,
                    background: '#fff',
                    borderRadius: 10,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                    width: 200,
                    padding: '16px 18px',
                    zIndex: 1000,
                    transition: 'all 0.2s ease',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: '#004A98',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 'bold',
                        marginRight: 10,
                      }}>
                        I
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: 16, color: '#222' }}>Inspection</h4>
                        <p style={{ margin: 0, fontSize: 13, color: '#777' }}>Inspection Team</p>
                      </div>
                    </div>

                    <a
                      href={route('profile.edit')}
                      style={{
                        width: '100%',
                        display: 'block',
                        background: '#f8f9fa',
                        color: '#333',
                        border: 'none',
                        padding: '8px 0',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 14,
                        fontWeight: 500,
                        textAlign: 'center',
                        textDecoration: 'none',
                        marginBottom: 8,
                      }}>
                      Profile
                    </a>

                    <button
                      onClick={() => router.post(route('logout'))}
                      style={{
                        width: '100%',
                        background: '#004A98',
                        color: '#fff',
                        border: 'none',
                        padding: '8px 0',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 14,
                        fontWeight: 500,
                        transition: 'background 0.2s ease',
                      }}
                      onMouseOver={(e) => (e.target.style.background = '#003C7A')}
                      onMouseOut={(e) => (e.target.style.background = '#004A98')}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* ================= PAGE CONTENT ================= */}
        <main className="flex-1 bg-[#eef2f5] px-6 py-6">
          {children}
        </main>
      </div>

      {/* ================= FLOATING CHAT MODAL ================= */}
      {activeView === "chat" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setActiveView("content")}
          />

          {/* Chat Window */}
          <div className="relative w-[900px] h-[550px] bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="absolute top-3 right-3">
              <button
                onClick={() => setActiveView("content")}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <Chat />
          </div>
        </div>
      )}
    </div>
  );
}
