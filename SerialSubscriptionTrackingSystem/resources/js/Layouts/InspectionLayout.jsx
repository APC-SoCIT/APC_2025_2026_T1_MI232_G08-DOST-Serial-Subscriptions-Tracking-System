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
  const [openNotif, setOpenNotif] = useState(false);
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
          <div className="flex items-center px-6 py-3">
            <h2 className="text-lg font-semibold text-[#004A98]">
              Inspection Dashboard
            </h2>

            <div className="ml-auto flex items-center gap-3">
              <button
                onClick={() => setOpenNotif(!openNotif)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <MdOutlineNotificationsActive size={18} />
              </button>

              <div className="relative">
                <button
                  onClick={() => setOpenAccount(!openAccount)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <FaUserCircle size={18} />
                </button>

                {openAccount && (
                  <div className="absolute right-0 mt-2 w-44 bg-white shadow rounded">
                    <a className="block px-4 py-2 text-sm hover:bg-gray-100">Profile</a>
                    <a className="block px-4 py-2 text-sm hover:bg-gray-100">Settings</a>
                    <a className="block px-4 py-2 text-sm hover:bg-gray-100">Logout</a>
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
