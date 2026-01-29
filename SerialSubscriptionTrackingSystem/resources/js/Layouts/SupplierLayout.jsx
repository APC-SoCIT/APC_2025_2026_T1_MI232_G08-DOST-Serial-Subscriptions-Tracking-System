import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import { GoHomeFill } from "react-icons/go";
import { HiUsers } from "react-icons/hi";
import { FaTruckFast } from "react-icons/fa6";
import { TbTruckOff } from "react-icons/tb";
import { FaTruckLoading } from "react-icons/fa";
import { MdOutlineNotificationsActive } from "react-icons/md";
import { VscAccount } from "react-icons/vsc";
import { BsFillChatTextFill } from "react-icons/bs";

const sidebarItems = [
  { icon: <GoHomeFill />, label: 'Dashboard', route: '/dashboard-supplier' },
  { icon: <BsFillChatTextFill />, label: 'Chat', route: '/dashboard-supplier-chat' },
  { icon: <HiUsers />, label: 'List of Serials', route: '/dashboard-supplier-listofserial' },
  { icon: <FaTruckFast />, label: 'Late', route: '/dashboard-supplier-late' },
  { icon: <TbTruckOff />, label: 'Undelivered', route: '/dashboard-supplier-undelivered' },
  { icon: <FaTruckLoading />, label: 'Delivered', route: '/dashboard-supplier-delivered' },
];

function Sidebar({ active, setActive }) {
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
      <div style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 24,
      }}>
        <img
          src="/images/dost-logo1.png"
          alt="LOGO"
          style={{
            width: 55,
            height: 55,
            borderRadius: 12,
          }}
        />
        <div style={{
          color: "#fff",
          fontWeight: 600,
          fontSize: 16,
          letterSpacing: 1,
          fontFamily: "Montserrat Bold",
          textAlign: 'left',
        }}>
           <br />
          
        </div>
      </div>
      <nav style={{ width: '100%' }}>
        <ul style={{ listStyle: 'none', padding: 0, width: '100%' }}>
          {sidebarItems.map((item, idx) => (
            <li key={item.label}>
              <Link
                href={item.route}
                style={{
                  margin: '10px 0',
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  fontSize: 16,
                  fontWeight: 500,
                  color: '#fff',
                  background: active === idx ? '#0062f4ff' : 'transparent',
                  borderRadius: 6,
                  padding: '8px 12px',
                  width: '140px',
                  marginLeft: '10px',
                  transition: 'background 0.2s, transform 0.1s',
                  boxShadow: active === idx ? '0 3px 6px rgba(0,0,0,0.15)' : 'none',
                  textDecoration: 'none',
                }}
                onClick={() => setActive(idx)}
              >
                <span style={{ marginRight: 15 }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

function TopBar() {
  const [activeIcon, setActiveIcon] = useState(null);

  const handleIconClick = (icon) => {
    setActiveIcon(activeIcon === icon ? null : icon);
  };

  const popupStyle = {
    position: 'absolute',
    top: 60,
    right: 20,
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 6px 12px rgba(0,0,0,0.1)',
    padding: 16,
    width: 260,
    zIndex: 10,
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
      <h2 style={{ color: '#0B4DA1', fontWeight: 600, fontSize: 20 }}>Supplier Dashboard</h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: 18, position: 'relative' }}>
        <span onClick={() => handleIconClick('notifications')} style={{ cursor: 'pointer' }}>
          <MdOutlineNotificationsActive />
        </span>
        {activeIcon === 'notifications' && (
          <div style={popupStyle}>
            <h4 style={{ margin: '0 0 8px' }}>Notifications</h4>
            <p style={{ fontSize: 14, color: '#555' }}>You're all caught up!</p>
          </div>
        )}

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
                zIndex: 100,
                transition: 'all 0.2s ease',
                animation: 'fadeIn 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <div
                  style={{
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
                  }}
                >
                  S
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 16, color: '#222' }}>Supplier</h4>
                  <p style={{ margin: 0, fontSize: 13, color: '#777' }}>Supplier Account</p>
                </div>
              </div>

              <button
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
                  transition: 'background 0.2s ease',
                }}
                onMouseOver={(e) => (e.target.style.background = '#093a7a')}
                onMouseOut={(e) => (e.target.style.background = '#0B4DA1')}
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

export default function SupplierLayout({ children, title = 'Supplier Dashboard' }) {
  const isChatPage = title === 'Supplier Chat';
  
  return (
    <div style={{ display: 'flex', fontFamily: 'Segoe UI, Arial, sans-serif', background: '#F5F6FA', minHeight: '100vh' }}>
      <Sidebar active={isChatPage ? 1 : 0} setActive={() => {}} />
      <div style={{ flex: 1, marginLeft: 160 }}>
        <TopBar />
        <div style={{ 
          padding: isChatPage ? '0' : '32px 40px',
          height: isChatPage ? 'calc(100vh - 73px)' : 'auto',
          overflow: isChatPage ? 'hidden' : 'visible'
        }}>
          {!isChatPage && (
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