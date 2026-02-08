import React, { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { GoHomeFill } from "react-icons/go";
import { HiUsers } from "react-icons/hi";
import { FaTruck } from "react-icons/fa";
import { MdMarkEmailRead } from "react-icons/md";
import { VscAccount } from "react-icons/vsc";
import { MdOutlineNotificationsActive } from "react-icons/md";
import { IoChatboxEllipsesOutline } from "react-icons/io5";

const Icon = ({ children }) => (
  <span style={{ marginRight: 0 }}>{children}</span>
);

const sidebarItems = [
  { icon: <GoHomeFill />, label: 'Dashboard', route: 'gsps.dashboard' },
  { icon: <IoChatboxEllipsesOutline />, label: 'Chat', route: 'dashboard-gsps-chat' },
  { icon: <HiUsers />, label: 'Supplier Info', route: 'dashboard-gsps-supplierinfo' },
  { icon: <FaTruck />, label: 'Delivery Status', route: 'dashboard-gsps-deliverystatus' },
  { icon: <MdMarkEmailRead />, label: 'Inspection Status', route: 'dashboard-gsps-inspectionstatus' },
];

function Sidebar() {
  const currentRouteName = usePage().url.split('/').pop() || 'gsps.dashboard';
  
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
      left: 0,
      top: 0,
      zIndex: 100
    }}>
      <Link href={route('gsps.dashboard')} style={{ textDecoration: 'none' }}>
        <img
          src="/images/dost-logo1.png"
          alt="LOGO"
          style={{
            marginBottom: 24,
            width: 55,
            height: 55,
            borderRadius: 12,
            cursor: 'pointer'
          }}
        />
      </Link>
      
      <nav style={{ width: '100%' }}>
        <ul style={{ listStyle: 'none', padding: 0, width: '100%' }}>
          {sidebarItems.map((item) => {
            const isActive = currentRouteName.includes(item.route.replace('dashboard-gsps-', '')) || 
                           (item.route === 'gsps.dashboard' && currentRouteName === 'gsps.dashboard');
            
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

function TopBar() {
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
        padding: '16px 32px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
        background: '#fff',
        position: 'sticky',
        top: 0,
        zIndex: 99
      }}
    >
      <h2 style={{ color: '#004A98', fontWeight: 600, fontSize: 20 }}>
        GSPS Dashboard
      </h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: 18, position: 'relative' }}>
        <span onClick={() => handleIconClick('notifications')} style={{ cursor: 'pointer', position: 'relative' }}>
          <MdOutlineNotificationsActive />
          
          {activeIcon === 'notifications' && (
            <div
              style={{
                position: 'absolute',
                top: '35px',
                right: 0,
                background: '#fff',
                borderRadius: 10,
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                width: 200,
                padding: '16px 18px',
                zIndex: 10000,
                transition: 'all 0.2s ease',
              }}
            >
              <p style={{ margin: 0, fontSize: 14, color: '#555' }}>You're all caught up!</p>
            </div>
          )}
        </span>
        
        <span onClick={() => handleIconClick('account')} style={{ cursor: 'pointer', position: 'relative' }}>
          <VscAccount size={22} />
          
          {activeIcon === 'account' && (
            <div
              style={{
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
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <div
                  style={{
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
                  }}
                >
                  {user?.name?.charAt(0) || 'G'}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 16, color: '#222' }}>
                    {user?.name || 'GSPS User'}
                  </h4>
                  <p style={{ margin: 0, fontSize: 13, color: '#777' }}>
                    {user?.email || 'Government Serial Procurement'}
                  </p>
                </div>
              </div>

              <Link
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

export default function GSPSLayout({ children, title = '' }) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning,';
    if (hour < 18) return 'Good afternoon,';
    return 'Good evening,';
  };
export default function GSPSLayout({ children, title = 'GSPS Dashboard', hideTitle = false }) {
  const isChatPage = title === 'GSPS Chat';
  const isFullPage = hideTitle || isChatPage || title === 'Supplier Information' || title === 'Delivery Status' || title === 'Inspection Status';

  return (
    <div style={{ display: 'flex', fontFamily: 'Segoe UI, Arial, sans-serif', background: '#f0f4f8', minHeight: '100vh', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 160, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <TopBar />
        <div style={{ 
          flex: 1,
          padding: isFullPage ? '0' : '32px 40px',
          overflow: isChatPage ? 'hidden' : (isFullPage ? 'auto' : 'visible'),
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0
        }}>
          {!isFullPage && (
            <>
              <h2 style={{ marginBottom: 8 }}>{title}</h2>
              <p style={{ color: '#666', marginBottom: 32 }}>
                {(() => {
                  const hour = new Date().getHours();
                  if (hour < 12) return 'Good morning,';
                  if (hour < 18) return 'Good afternoon,';
                  return 'Good evening,';
                })()} Welcome back!
              </p>
            </>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}