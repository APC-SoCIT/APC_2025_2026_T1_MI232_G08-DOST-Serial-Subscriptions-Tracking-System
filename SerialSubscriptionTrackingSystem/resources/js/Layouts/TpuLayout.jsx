import React, { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { GoHomeFill } from "react-icons/go";
import { HiUsers, HiMenu, HiX } from "react-icons/hi";
import { ImStatsBars } from "react-icons/im";
import { FaTruck, FaUserPlus, FaUserCircle } from "react-icons/fa";
import { MdMarkEmailRead, MdNotifications } from "react-icons/md";
import { BsFillChatTextFill } from "react-icons/bs";
import { useRole } from "@/Components/RequireRole";

const Icon = ({ children }) => (
  <span style={{ marginRight: 8 }}>{children}</span>
);

const sidebarItems = [
  { icon: <GoHomeFill />, label: 'Dashboard', route: 'tpu.dashboard' },
  { icon: <BsFillChatTextFill />, label: 'Chat', route: 'tpu.chat' },
  { icon: <HiUsers />, label: 'Supplier Info', route: 'tpu.supplierinfo' },
  { icon: <ImStatsBars />, label: 'Subscription', route: 'tpu.subscriptiontracking' },
  { icon: <FaTruck />, label: 'Monitor Delivery', route: 'tpu.monitordelivery' },
  { icon: <FaUserPlus />, label: 'Add Account', route: 'tpu.addaccount' },
];

function Sidebar({ isMobile, sidebarOpen, setSidebarOpen }) {
  const currentUrl = usePage().url;
  const sidebarWidth = isMobile ? 200 : 160;
  const [hoveredItem, setHoveredItem] = useState(null);
  
  // Map routes to their URL paths for exact matching
  const routeToPath = {
    'tpu.dashboard': '/dashboard-tpu',
    'tpu.chat': '/chat',
    'tpu.supplierinfo': '/supplierinfo',
    'tpu.subscriptiontracking': '/subscriptiontracking',
    'tpu.monitordelivery': '/monitordelivery',
    'tpu.addaccount': '/addaccount',
  };
  
  return (
    <div style={{
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

      <Link href={route('tpu.dashboard')} style={{ textDecoration: 'none' }}>
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
            alt="LOGO"
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
      </Link>
      
      <nav style={{ width: '100%' }}>
        <ul style={{ listStyle: 'none', padding: 0, width: '100%' }}>
          {sidebarItems.map((item, idx) => {
            const expectedPath = routeToPath[item.route] || '';
            const isActive = currentUrl === expectedPath || currentUrl.startsWith(expectedPath + '/');
            
            return (
              <li key={item.label}>
                <Link
                  href={item.route !== '#' ? route(item.route) : '#'}
                  onClick={() => isMobile && setSidebarOpen(false)}
                  onMouseEnter={() => setHoveredItem(idx)}
                  onMouseLeave={() => setHoveredItem(null)}
                  style={{
                    margin: '10px 0',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: item.route !== '#' ? 'pointer' : 'not-allowed',
                    fontSize: isMobile ? 14 : 16,
                    fontWeight: 500,
                    color: '#fff',
                    background: isActive ? '#0062f4' : (hoveredItem === idx ? 'rgba(255,255,255,0.15)' : 'transparent'),
                    borderRadius: 6,
                    padding: '8px 12px',
                    width: isMobile ? '170px' : '140px',
                    marginLeft: '10px',
                    transition: 'background 0.2s, transform 0.1s',
                    boxShadow: isActive ? '0 3px 6px rgba(0,0,0,0.15)' : 'none',
                    textDecoration: 'none',
                    opacity: item.route === '#' ? 0.6 : 1
                  }}
                >
                  <Icon>{item.icon}</Icon>
                  <span style={{ fontSize: isMobile ? 13 : 15 }}>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

function TopBar({ pageTitle, isMobile, setSidebarOpen }) {
  const [activeIcon, setActiveIcon] = useState(null);
  const user = usePage().props.auth.user;

  const handleIconClick = (icon) => {
    setActiveIcon(activeIcon === icon ? null : icon);
  };

  const handleLogout = () => {
    router.post(route('logout'));
  };

  return (
    <div
      style={{
        fontSize: 22,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: isMobile ? '12px 16px' : '16px 32px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
        background: '#fff',
        position: 'sticky',
        top: 0,
        zIndex: 99
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
        <h2 style={{ color: '#004A98', fontWeight: 600, fontSize: isMobile ? 16 : 20 }}>
          TPU | {pageTitle || 'Dashboard'}
        </h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 18, position: 'relative' }}>
        <span onClick={() => handleIconClick('notifications')} style={{ cursor: 'pointer' }}>
          <MdNotifications />
        </span>
        
        <span onClick={() => handleIconClick('account')} style={{ cursor: 'pointer', position: 'relative' }}>
          <FaUserCircle size={22} />
          
          {activeIcon === 'account' && (
            <div
              style={{
                position: 'absolute',
                top: '35px',
                right: 0,
                background: '#fff',
                borderRadius: 10,
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                width: isMobile ? 180 : 200,
                padding: '16px 18px',
                zIndex: 1000,
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ marginBottom: 12 }}>
                <h4 style={{ margin: 0, fontSize: 14, color: '#222' }}>
                  {user?.name || 'TPU User'}
                </h4>
                <p style={{ margin: 0, fontSize: 11, color: '#777' }}>
                  {user?.email || 'TPU Account'}
                </p>
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
                onClick={handleLogout}
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
        </span>
      </div>
    </div>
  );
}

export default function TPULayout({ children, title, hideTitle = false }) {
  const { isTpu, user } = useRole();
  const currentUrl = usePage().url;
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
  
  // Get page title from sidebarItems based on current URL, or use passed title prop
  const getPageTitle = () => {
    if (title) return title;
    const currentNav = sidebarItems.find(item => {
      const routePath = item.route.split('.').pop();
      return currentUrl.includes(routePath);
    });
    return currentNav ? currentNav.label : 'Dashboard';
  };
  
  const pageTitle = getPageTitle();
  const isChatPage = pageTitle?.toLowerCase().includes('chat');
  const isFullPage = hideTitle || isChatPage || pageTitle === 'Dashboard' || pageTitle === 'Add Account' || pageTitle === 'Supplier Info' || pageTitle === 'Subscription' || pageTitle === 'Monitor Delivery';
  
  // Role verification - redirect if not TPU
  useEffect(() => {
    if (user && !isTpu) {
      const roleRoutes = {
        admin: '/dashboard-admin',
        supplier: '/dashboard-supplier',
        gsps: '/dashboard-gsps',
        inspection: '/inspection-dashboard',
      };
      const redirectPath = roleRoutes[user.role] || '/dashboard';
      router.visit(redirectPath);
    }
  }, [user, isTpu]);

  // Don't render layout if user is not TPU
  if (!user || !isTpu) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F6FA' }}>
        <div style={{ width: 48, height: 48, border: '4px solid #0B4DA1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', background: '#F5F6FA', minHeight: '100vh', height: '100vh', overflow: 'hidden' }}>
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

      <Sidebar isMobile={isMobile} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div style={{ 
        flex: 1, 
        marginLeft: isMobile ? 0 : 160, 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh', 
        overflow: 'hidden',
        transition: 'margin-left 0.3s ease',
      }}>
        <TopBar pageTitle={pageTitle} isMobile={isMobile} setSidebarOpen={setSidebarOpen} />
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