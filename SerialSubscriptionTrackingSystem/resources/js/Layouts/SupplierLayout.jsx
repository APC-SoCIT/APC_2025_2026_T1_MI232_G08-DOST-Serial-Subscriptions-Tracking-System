import React, { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { GoHomeFill } from "react-icons/go";
import { HiUsers, HiMenu, HiX } from "react-icons/hi";
import { MdNotifications } from "react-icons/md";
import { FaUserCircle } from "react-icons/fa";
import { BsFillChatTextFill } from "react-icons/bs";
import { FaTruckFast } from "react-icons/fa6";
import { useRole } from "@/Components/RequireRole";

const Icon = ({ children }) => (
  <span style={{ marginRight: 8 }}>{children}</span>
);

const sidebarItems = [
  { icon: <GoHomeFill />, label: 'Dashboard', route: 'supplier.dashboard' },
  { icon: <BsFillChatTextFill />, label: 'Chat', route: 'supplier.chat' },
  { icon: <HiUsers />, label: 'List of Serials', route: 'supplier.listofserial' },
  { icon: <FaTruckFast />, label: 'Delivery', route: 'supplier.delivery' },
];

function Sidebar({ isMobile, sidebarOpen }) {
  const currentRouteName = usePage().url;
  
  return (
    <div style={{
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
      <Link href={route('supplier.dashboard')} style={{ textDecoration: 'none' }}>
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
          {sidebarItems.map((item) => {
            const routePart = item.route.split('.').pop();
            const isActive = currentRouteName.includes(routePart) || 
                           (item.route === 'supplier.dashboard' && (currentRouteName === 'dashboard-supplier' || currentRouteName === ''));
            
            return (
              <li key={item.label}>
                <Link
                  href={route(item.route)}
                  style={{
                    margin: '10px 0',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    fontSize: 16,
                    fontWeight: 500,
                    color: '#fff',
                    background: isActive ? '#0062f4ff' : 'transparent',
                    borderRadius: 6,
                    padding: '8px 12px',
                    width: '140px',
                    marginLeft: '10px',
                    transition: 'background 0.2s, transform 0.1s',
                    boxShadow: isActive ? '0 3px 6px rgba(0,0,0,0.15)' : 'none',
                    textDecoration: 'none',
                  }}
                >
                  <Icon>{item.icon}</Icon>
                  <span style={{ fontSize: 15 }}>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

function TopBar({ title, isMobile, sidebarOpen, setSidebarOpen }) {
  const [activeIcon, setActiveIcon] = useState(null);
  const { auth } = usePage().props;

  const handleIconClick = (icon) => {
    setActiveIcon(activeIcon === icon ? null : icon);
  };

  const handleLogout = () => {
    router.post(route('logout'));
  };

  return (
    <div style={{
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
          Supplier | {title || 'Dashboard'}
        </h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 18, position: 'relative' }}>
        <span onClick={() => handleIconClick('notifications')} style={{ cursor: 'pointer' }}>
          <MdNotifications />
        </span>
        {activeIcon === 'notifications' && (
          <div style={{
            position: 'absolute',
            top: 60,
            right: 20,
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 6px 12px rgba(0,0,0,0.1)',
            padding: 16,
            width: 260,
            zIndex: 10,
          }}>
            <h4 style={{ margin: '0 0 8px' }}>Notifications</h4>
            <p style={{ fontSize: 14, color: '#555' }}>You're all caught up!</p>
          </div>
        )}

        <span onClick={() => handleIconClick('account')} style={{ cursor: 'pointer', position: 'relative' }}>
          <FaUserCircle size={22} />
          {activeIcon === 'account' && (
            <div style={{
              position: 'absolute',
              top: '35px',
              right: 0,
              background: '#fff',
              borderRadius: 10,
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              width: 200,
              padding: '16px 18px',
              zIndex: 100,
            }}>
              <div style={{ marginBottom: 12 }}>
                <h4 style={{ margin: 0, fontSize: 16, color: '#222' }}>
                  {auth?.user?.name || 'Supplier'}
                </h4>
                <p style={{ margin: 0, fontSize: 13, color: '#777' }}>{auth?.user?.email || 'Supplier Account'}</p>
                <p style={{ margin: 0, fontSize: 11, color: '#0B4DA1', textTransform: 'capitalize' }}>Role: {auth?.user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  background: '#0B4DA1',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 0',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                }}
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

export default function SupplierLayout({ children, title }) {
  const { isSupplier, user } = useRole();
  const currentUrl = usePage().url;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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
  const isFullPage = isChatPage || pageTitle === 'List of Serials' || pageTitle === 'Late' || pageTitle === 'Undelivered' || pageTitle === 'Delivered';

  // Role verification - redirect if not Supplier
  useEffect(() => {
    if (user && !isSupplier) {
      const roleRoutes = {
        admin: '/dashboard-admin',
        gsps: '/dashboard-gsps',
        tpu: '/dashboard-tpu',
        inspection: '/inspection-dashboard',
      };
      const redirectPath = roleRoutes[user.role] || '/dashboard';
      router.visit(redirectPath);
    }
  }, [user, isSupplier]);

  // Don't render layout if user is not Supplier
  if (!user || !isSupplier) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F6FA' }}>
        <div style={{ width: 48, height: 48, border: '4px solid #0B4DA1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', background: '#F5F6FA', minHeight: '100vh', height: '100vh', overflow: 'hidden' }}>
      {/* Mobile overlay */}
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
      <Sidebar isMobile={isMobile} sidebarOpen={sidebarOpen} />
      <div style={{ flex: 1, marginLeft: isMobile ? 0 : 160, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', transition: 'margin-left 0.3s ease' }}>
        <TopBar title={pageTitle} isMobile={isMobile} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
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
