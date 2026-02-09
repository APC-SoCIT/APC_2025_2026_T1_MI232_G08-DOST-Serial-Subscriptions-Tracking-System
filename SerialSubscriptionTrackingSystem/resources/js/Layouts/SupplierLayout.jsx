import React, { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { GoHomeFill } from "react-icons/go";
import { HiUsers } from "react-icons/hi";
import { FaTruckFast } from "react-icons/fa6";
import { TbTruckOff } from "react-icons/tb";
import { FaTruckLoading } from "react-icons/fa";
import { MdOutlineNotificationsActive } from "react-icons/md";
import { VscAccount } from "react-icons/vsc";
import { BsFillChatTextFill } from "react-icons/bs";

const Icon = ({ children }) => (
  <span style={{ marginRight: 8 }}>{children}</span>
);

const sidebarItems = [
  { icon: <GoHomeFill />, label: 'Dashboard', route: 'supplier.dashboard' },
  { icon: <BsFillChatTextFill />, label: 'Chat', route: 'dashboard-supplier-chat' },
  { icon: <HiUsers />, label: 'List of Serials', route: 'dashboard-supplier-listofserial' },
  { icon: <FaTruckFast />, label: 'Late', route: 'dashboard-supplier-late' },
  { icon: <TbTruckOff />, label: 'Undelivered', route: 'dashboard-supplier-undelivered' },
  { icon: <FaTruckLoading />, label: 'Delivered', route: 'dashboard-supplier-delivered' },
];

function Sidebar() {
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
      left: 0,
      top: 0,
      zIndex: 100
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
            const isActive = currentRouteName.includes(item.route.replace('dashboard-supplier-', '').replace('supplier.dashboard', 'supplier'));
            
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

function TopBar({ title }) {
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
      padding: '16px 32px',
      boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
      background: '#fff',
      position: 'sticky',
      top: 0,
      zIndex: 9
    }}>
      <h2 style={{ color: '#0B4DA1', fontWeight: 600, fontSize: 20 }}>
        {title || 'Supplier Dashboard'}
      </h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: 18, position: 'relative' }}>
        <span onClick={() => handleIconClick('notifications')} style={{ cursor: 'pointer' }}>
          <MdOutlineNotificationsActive />
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
          <VscAccount size={22} />
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
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: '#0B4DA1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 'bold',
                  marginRight: 10,
                }}>
                  {auth?.user?.name?.charAt(0) || 'S'}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 16, color: '#222' }}>
                    {auth?.user?.name || 'Supplier'}
                  </h4>
                  <p style={{ margin: 0, fontSize: 13, color: '#777' }}>Supplier Account</p>
                </div>
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
  const isChatPage = title === 'Supplier Chat';
  const isFullPage = isChatPage || title === 'List of Serials' || title === 'Late Deliveries' || title === 'Undelivered' || title === 'Delivered';

  return (
    <div style={{ display: 'flex', background: '#F5F6FA', minHeight: '100vh', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 160, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <TopBar title={title} />
        <div style={{ 
          flex: 1,
          padding: isChatPage ? '0' : '24px',
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
