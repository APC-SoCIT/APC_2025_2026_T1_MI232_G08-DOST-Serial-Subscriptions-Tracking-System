import React, { useState, useEffect } from "react";
import { router, usePage } from "@inertiajs/react";
import { GoHomeFill } from "react-icons/go";
import { HiUsers, HiUserAdd, HiMenu, HiX } from "react-icons/hi";
import { ImStatsBars } from "react-icons/im";
import { MdNotifications } from "react-icons/md";
import { FaUserCircle } from "react-icons/fa";
import { useRole } from "@/Components/RequireRole";

/* ===================== NAV ITEMS ===================== */
const navItems = [
  { icon: <GoHomeFill size={18} />, label: "Dashboard", href: "/dashboard-admin" },
  { icon: <HiUsers size={18} />, label: "Account Approval", href: "/account-approval" },
  { icon: <ImStatsBars size={18} />, label: "List of Supplier", href: "/list-of-supplier" },
  { icon: <HiUsers size={18} />, label: "List of User", href: "/list-of-user" },
  { icon: <HiUserAdd size={18} />, label: "Add Account", href: "/admin-add-account" },
];

export default function AdminLayout({ children, header, title }) {
  const { url } = usePage();
  const { isAdmin, user } = useRole();
  const [openNotifications, setOpenNotifications] = useState(false);
  const [openAccount, setOpenAccount] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Get page title from navItems based on current URL, or use passed title prop
  const getPageTitle = () => {
    if (title) return title;
    const currentNav = navItems.find(item => url.startsWith(item.href));
    return currentNav ? currentNav.label : 'Admin Dashboard';
  };

  // Role verification - redirect if not admin
  useEffect(() => {
    if (user && !isAdmin) {
      const roleRoutes = {
        supplier: '/dashboard-supplier',
        gsps: '/dashboard-gsps',
        tpu: '/dashboard-tpu',
        inspection: '/inspection-dashboard',
      };
      const redirectPath = roleRoutes[user.role] || '/dashboard';
      router.visit(redirectPath);
    }
  }, [user, isAdmin]);

  // Don't render layout if user is not admin
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f57a3]"></div>
      </div>
    );
  }

  const sidebarWidth = isMobile ? 200 : 160;

  return (
    <div style={{ display: 'flex', fontFamily: 'Segoe UI, Arial, sans-serif', background: '#f0f4f8', minHeight: '100vh', height: '100vh', overflow: 'hidden' }}>

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 90,
          }}
        />
      )}

      {/* ===================== SIDEBAR ===================== */}
      <aside style={{
        background: '#004A98',
        color: '#fff',
        width: sidebarWidth,
        minHeight: '100vh',
        padding: '20px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'fixed',
        left: isMobile ? (sidebarOpen ? 0 : -sidebarWidth) : 0,
        top: 0,
        zIndex: 100,
        transition: 'left 0.3s ease',
      }}>

        {/* Close button for mobile */}
        {isMobile && (
          <button
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              background: 'transparent',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            <HiX size={24} />
          </button>
        )}

        {/* LOGO */}
        <a href="/dashboard" style={{ textDecoration: 'none' }}>
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            marginBottom: 24,
            marginTop: isMobile ? 20 : 0,
          }}>
            <img
              src="/images/dost-logo1.png"
              alt="logo"
              style={{
                width: isMobile ? 45 : 55,
                height: isMobile ? 45 : 55,
                borderRadius: 12,
                cursor: 'pointer'
              }}
            />
            <div style={{
              color: '#fff',
              fontWeight: 600,
              fontSize: isMobile ? 14 : 16,
              letterSpacing: 1,
              fontFamily: 'Montserrat Bold',
              textAlign: 'left',
            }}>
              DOST <br />
              STII
            </div>
          </div>
        </a>

        {/* NAV */}
        <nav style={{ width: '100%' }}>
          <ul style={{ listStyle: 'none', padding: 0, width: '100%' }}>
            {navItems.map((item) => {
              const isActive = url.startsWith(item.href);
              
              return (
                <li key={item.label}>
                  <a
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      if (isMobile) setSidebarOpen(false);
                      router.get(item.href);
                    }}
                    style={{
                      margin: '10px 0',
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      fontSize: isMobile ? 14 : 16,
                      fontWeight: 500,
                      color: '#fff',
                      background: isActive ? '#0062f4ff' : 'transparent',
                      borderRadius: 6,
                      padding: '8px 12px',
                      width: isMobile ? '170px' : '140px',
                      marginLeft: '10px',
                      transition: 'background 0.2s, transform 0.1s',
                      boxShadow: isActive ? '0 3px 6px rgba(0,0,0,0.15)' : 'none',
                      textDecoration: 'none',
                    }}
                  >
                    <span style={{ marginRight: 8 }}>{item.icon}</span>
                    <span style={{ fontSize: isMobile ? 13 : 15 }}>{item.label}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* ===================== MAIN WRAPPER ===================== */}
      <div style={{ 
        flex: 1, 
        marginLeft: isMobile ? 0 : 160, 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh', 
        overflow: 'hidden',
        transition: 'margin-left 0.3s ease',
      }}>

        {/* TOPBAR */}
        <header className="bg-white shadow-sm sticky top-0 z-20">
          <div className="px-4 md:px-6 py-4 md:py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Hamburger menu for mobile */}
              {isMobile && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                  }}
                >
                  <HiMenu size={24} color="#004A98" />
                </button>
              )}
              <h2 className="text-[16px] md:text-[20px] font-semibold text-[#004A98]">
                Admin | {getPageTitle()}
              </h2>
            </div>

            <div className="flex items-center gap-3 md:gap-4">

              {/* Notifications */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => {
                    setOpenNotifications(!openNotifications);
                    setOpenAccount(false);
                  }}
                  style={{ cursor: 'pointer', border: 'none', background: 'none', padding: 0 }}
                >
                  <MdNotifications size={20} />
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
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  <FaUserCircle size={22} />
                </button>

                {openAccount && (
                  <div className="absolute right-0 mt-2 w-52 md:w-56 bg-white rounded-xl shadow-lg p-4">
                    <p className="text-sm font-semibold">{user?.name || 'Admin'}</p>
                    <p className="text-xs text-gray-500 mb-1 truncate">{user?.email}</p>
                    <p className="text-xs text-blue-600 capitalize mb-4">
                      Role: {user?.role || 'admin'}
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
        <main className="flex-1 px-4 md:px-6 py-4 md:py-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
