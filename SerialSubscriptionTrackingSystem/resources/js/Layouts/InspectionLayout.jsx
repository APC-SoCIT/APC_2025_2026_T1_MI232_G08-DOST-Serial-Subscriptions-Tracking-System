import React, { useState, useEffect } from "react";
import { router, usePage, Link } from "@inertiajs/react";
import { GoHomeFill } from "react-icons/go";
import { FaClipboardList, FaClipboardCheck, FaUserCircle } from "react-icons/fa";
import { BsFillChatTextFill } from "react-icons/bs";
import { MdNotifications } from "react-icons/md";
import { HiMenu, HiX } from "react-icons/hi";
import { useRole } from "@/Components/RequireRole";

const navItems = [
  { icon: <GoHomeFill size={18} />, label: "Dashboard", href: "/inspection-dashboard" },
  { icon: <FaClipboardList size={18} />, label: "List of Serials", href: "/inspection-serials" },
  { icon: <FaClipboardCheck size={18} />, label: "Serials for Inspection", href: "/inspection-serialsforinspection" },
  { icon: <BsFillChatTextFill size={18} />, label: "Chat", href: "/inspection-chat" },
];

export default function InspectionLayout({ children, title }) {
  const { url } = usePage();
  const { isInspection, user } = useRole();
  const [activeView, setActiveView] = useState("content");
  const [openNotifications, setOpenNotifications] = useState(false);
  const [openAccount, setOpenAccount] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);

  // Check screen size for responsive behavior
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
    return currentNav ? currentNav.label : 'Dashboard';
  };
  
  const pageTitle = getPageTitle();
  const isChatPage = pageTitle?.toLowerCase().includes('chat') || url.includes('/inspection-chat');

  // Role verification - redirect if not inspection
  useEffect(() => {
    if (user && !isInspection) {
      const roleRoutes = {
        admin: '/dashboard-admin',
        supplier: '/dashboard-supplier',
        gsps: '/dashboard-gsps',
        tpu: '/dashboard-tpu',
      };
      const redirectPath = roleRoutes[user.role] || '/dashboard';
      router.visit(redirectPath);
    }
  }, [user, isInspection]);

  // Don't render layout if user is not inspection
  if (!user || !isInspection) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F6FA' }}>
        <div style={{ width: 48, height: 48, border: '4px solid #0B4DA1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', background: '#F5F6FA', minHeight: '100vh', height: '100vh', overflow: 'hidden' }}>
      {/* ================= MOBILE OVERLAY ================= */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 99,
          }}
        />
      )}

      {/* ================= SIDEBAR ================= */}
      <aside style={{
        background: '#004A98',
        color: '#fff',
        width: 160,
        minHeight: '100vh',
        padding: '20px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'fixed',
        left: isMobile ? (sidebarOpen ? 0 : -160) : 0,
        top: 0,
        zIndex: 100,
        transition: 'left 0.3s ease',
      }}>
        <Link href="/inspection-dashboard" style={{ textDecoration: 'none' }}>
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            marginBottom: 24
          }}>
            <img
              src="/images/dost-logo1.png"
              alt="LOGO"
              style={{
                width: 55,
                height: 55,
                borderRadius: 12,
                cursor: 'pointer'
              }}
            />
            <div style={{
              color: '#fff',
              fontWeight: 600,
              fontSize: 16,
              letterSpacing: 1,
              fontFamily: 'Montserrat Bold',
              textAlign: 'left',
            }}>
              DOST <br />
              STII
            </div>
          </div>
        </Link>

        <nav style={{ width: '100%' }}>
          <ul style={{ listStyle: 'none', padding: 0, width: '100%' }}>
            {navItems.map((item, idx) => {
              const isActive = url.startsWith(item.href);
              
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    onMouseEnter={() => setHoveredItem(idx)}
                    onMouseLeave={() => setHoveredItem(null)}
                    style={{
                      margin: '10px 0',
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      fontSize: 16,
                      fontWeight: 500,
                      color: '#fff',
                      background: isActive ? '#0062f4ff' : (hoveredItem === idx ? 'rgba(255,255,255,0.15)' : 'transparent'),
                      borderRadius: 6,
                      padding: '8px 12px',
                      width: '140px',
                      marginLeft: '10px',
                      transition: 'background 0.2s, transform 0.1s',
                      boxShadow: isActive ? '0 3px 6px rgba(0,0,0,0.15)' : 'none',
                      textDecoration: 'none',
                    }}
                  >
                    <span style={{ marginRight: 8 }}>{item.icon}</span>
                    <span style={{ fontSize: 15 }}>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* ================= MAIN ================= */}
      <div style={{ flex: 1, marginLeft: isMobile ? 0 : 160, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', transition: 'margin-left 0.3s ease' }}>
        {/* ================= TOPBAR ================= */}
        <header style={{
          fontSize: 22,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: isMobile ? '12px 16px' : '16px 32px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
          background: '#fff',
          position: 'sticky',
          top: 0,
          zIndex: 9
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {sidebarOpen ? <HiX size={24} color="#0B4DA1" /> : <HiMenu size={24} color="#0B4DA1" />}
              </button>
            )}
            <h2 style={{ color: '#0B4DA1', fontWeight: 600, fontSize: isMobile ? 16 : 20, margin: 0 }}>
              Inspection | {pageTitle}
            </h2>
          </div>

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
                    <div style={{ marginBottom: 12 }}>
                      <h4 style={{ margin: 0, fontSize: 16, color: '#222' }}>{user?.name || 'Inspection'}</h4>
                      <p style={{ margin: 0, fontSize: 13, color: '#777' }}>{user?.email || 'Inspection Team'}</p>
                      <p style={{ margin: 0, fontSize: 11, color: '#0f57a3', textTransform: 'capitalize' }}>Role: {user?.role}</p>
                    </div>

                    <Link
                      href={route('profile.edit')}
                      style={{
                        display: 'block',
                        width: '100%',
                        background: 'transparent',
                        color: '#004A98',
                        border: '1px solid #004A98',
                        padding: '8px 0',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 14,
                        fontWeight: 500,
                        textAlign: 'center',
                        textDecoration: 'none',
                        marginBottom: 8,
                        transition: 'all 0.2s ease',
                      }}
                      onMouseOver={(e) => {
                        e.target.style.background = '#004A98';
                        e.target.style.color = '#fff';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = 'transparent';
                        e.target.style.color = '#004A98';
                      }}
                    >
                      Profile
                    </Link>

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
        </header>

        {/* ================= PAGE CONTENT ================= */}
        <div style={{ 
          flex: 1,
          padding: isChatPage ? '0' : (isMobile ? '16px' : '24px'),
          overflow: isChatPage ? 'hidden' : 'auto',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}
