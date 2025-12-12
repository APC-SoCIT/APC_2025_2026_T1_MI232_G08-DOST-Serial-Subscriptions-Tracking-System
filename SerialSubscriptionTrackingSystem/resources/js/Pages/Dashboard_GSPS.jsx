import React, { useState } from 'react';
import { GoHomeFill } from "react-icons/go";
import { HiUsers } from "react-icons/hi";
import { ImStatsBars } from "react-icons/im";
import { FaTruck } from "react-icons/fa";
import { MdMarkEmailRead } from "react-icons/md";
import { VscAccount } from "react-icons/vsc";
import { MdOutlineNotificationsActive } from "react-icons/md";
import { IoChatboxEllipsesOutline } from "react-icons/io5";
import { RiAddLargeFill } from "react-icons/ri";
import { FiTrendingUp, FiTrendingDown } from "react-icons/fi";

const Icon = ({ children }) => (
  <span style={{ marginRight: 8 }}>{children}</span>
);

const sidebarItems = [
  { icon: <GoHomeFill />, label: 'Dashboard' },
  { icon: <RiAddLargeFill />, label: 'Add Serial' },
  { icon: <HiUsers />, label: 'Supplier Info' },
  { icon: <ImStatsBars />, label: 'Subscription' },
  { icon: <FaTruck />, label: 'Monitor Delivery' },
  { icon: <MdMarkEmailRead />, label: 'Received' },
];

// Dashboard Component for GSPS Role
function GSPSDashboard() {
  const [hoveredCard, setHoveredCard] = useState(null);
  
  // Dashboard stats data
  const dashboardStats = [
    {
      title: 'Total Serial',
      value: '568',
      description: 'Total number of serials tracked',
      icon: <FiTrendingUp />,
      color: '#004A98',
      trend: 'up'
    },
    {
      title: 'Most Delivered Title',
      value: '568',
      description: 'Most frequently delivered serial title',
      icon: <FiTrendingUp />,
      color: '#28a745',
      trend: 'up'
    },
    {
      title: 'Best Performing Supplier',
      value: '568',
      description: 'Supplier with highest delivery performance',
      icon: <FiTrendingUp />,
      color: '#17a2b8',
      trend: 'up'
    },
    {
      title: 'Manila Bulletin',
      value: '568',
      description: 'Specific supplier performance metric',
      icon: <FiTrendingDown />,
      color: '#ffc107',
      trend: 'down'
    },
  ];

  // Serial Report Chart Data
  const serialReportData = [600, 450, 250, 130, 140, 310, 150, 330, 140, 120, 180, 260];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Incoming Serial Data
  const incomingSerialData = [
    {
      volumeNo: 'Vol 2',
      issueNo: '0027-8424',
      titleSerial: 'Proceedings of the National Academy of Sciences of the United States of America',
      date: '20.09.2025'
    },
    {
      volumeNo: 'Vol 1',
      issueNo: '0036-8075',
      titleSerial: 'Science',
      date: '18.09.2025'
    },
    {
      volumeNo: 'Vol 3',
      issueNo: '0028-0836',
      titleSerial: 'Nature',
      date: '15.09.2025'
    }
  ];

  const cardStyle = (isHovered) => ({
    background: '#fff',
    borderRadius: 12,
    boxShadow: isHovered 
      ? '0 8px 25px rgba(0,0,0,0.15)' 
      : '0 2px 8px rgba(0,0,0,0.05)',
    padding: 24,
    marginRight: 20,
    minWidth: 220,
    flex: 1,
    position: 'relative',
    transition: 'all 0.3s ease',
    transform: isHovered ? 'translateY(-5px)' : 'none',
    cursor: 'pointer',
    borderTop: `4px solid ${isHovered ? '#004A98' : '#f0f4f8'}`,
  });

  return (
    <div style={{ background: '#f0f4f8', minHeight: 'calc(100vh - 120px)' }}>
      {/* Welcome Section */}
      <div style={{ marginBottom: 30 }}>
        <h2 style={{ color: '#004A98', margin: '0 0 8px 0', fontSize: 24 }}>Dashboard Overview</h2>
        <p style={{ color: '#666', margin: 0, fontSize: 16 }}>Welcome back! Here's what's happening with your serial subscriptions.</p>
      </div>

      {/* Dashboard Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 40 }}>
        {dashboardStats.map((stat, index) => (
          <div
            key={index}
            style={cardStyle(hoveredCard === index)}
            onMouseEnter={() => setHoveredCard(index)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: 14, color: '#666', margin: '0 0 12px 0', fontWeight: 500 }}>
                  {stat.title}
                </h3>
                <p style={{
                  fontSize: 32,
                  fontWeight: 'bold',
                  margin: '0 0 8px 0',
                  color: stat.color
                }}>
                  {stat.value}
                </p>
              </div>
              <div style={{
                color: stat.color,
                fontSize: 24,
                opacity: 0.8
              }}>
                {stat.icon}
              </div>
            </div>
            
            {hoveredCard === index && (
              <div style={{
                position: 'absolute',
                bottom: '-40px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#333',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: 6,
                fontSize: 13,
                whiteSpace: 'nowrap',
                zIndex: 10,
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                animation: 'fadeIn 0.2s ease',
              }}>
                {stat.description}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Main Content Row */}
      <div style={{ display: 'flex', gap: 30, marginBottom: 40 }}>
        {/* Serial Report Chart */}
        <div style={{ flex: 2, background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ color: '#004A98', margin: '0 0 20px 0', fontSize: 18 }}>Serial Report</h3>
          
          <div style={{ height: 300, position: 'relative' }}>
            {/* Y-axis labels */}
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 40, width: 40, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              {[600, 450, 300, 150, 0].map((value) => (
                <span key={value} style={{ fontSize: 12, color: '#666', textAlign: 'right', paddingRight: 8 }}>
                  {value}
                </span>
              ))}
            </div>

            {/* Chart area */}
            <div style={{ position: 'absolute', left: 40, right: 0, top: 0, bottom: 40 }}>
              {/* Grid lines */}
              {[0, 1, 2, 3, 4].map((line) => (
                <div
                  key={line}
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: `${line * 25}%`,
                    height: '1px',
                    background: '#e0e0e0'
                  }}
                />
              ))}

              {/* Bars */}
              <div style={{ display: 'flex', height: '100%', alignItems: 'flex-end', gap: 12, padding: '0 20px' }}>
                {serialReportData.map((value, index) => {
                  const heightPercentage = (value / 600) * 100;
                  return (
                    <div
                      key={index}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                      }}
                    >
                      {/* Bar */}
                      <div
                        style={{
                          width: '80%',
                          height: `${heightPercentage}%`,
                          background: 'linear-gradient(to top, #004A98, #0062f4)',
                          borderRadius: '4px 4px 0 0',
                          position: 'relative'
                        }}
                      >
                        {/* Value on hover */}
                        <div
                          style={{
                            position: 'absolute',
                            top: '-30px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: '#333',
                            color: '#fff',
                            padding: '4px 8px',
                            borderRadius: 4,
                            fontSize: 12,
                            opacity: 0,
                            transition: 'opacity 0.2s',
                            whiteSpace: 'nowrap'
                          }}
                          className="bar-value"
                        >
                          {value}
                        </div>
                      </div>
                      
                      {/* Month label */}
                      <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                        {months[index]}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Sidebar */}
        <div style={{ flex: 1, background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ color: '#004A98', margin: '0 0 20px 0', fontSize: 18 }}>Quick Stats</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid #eee' }}>
              <span style={{ color: '#666', fontSize: 14 }}>Today's Deliveries</span>
              <span style={{ color: '#004A98', fontWeight: 'bold', fontSize: 16 }}>12</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid #eee' }}>
              <span style={{ color: '#666', fontSize: 14 }}>Pending Inspections</span>
              <span style={{ color: '#ffc107', fontWeight: 'bold', fontSize: 16 }}>5</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid #eee' }}>
              <span style={{ color: '#666', fontSize: 14 }}>Active Suppliers</span>
              <span style={{ color: '#28a745', fontWeight: 'bold', fontSize: 16 }}>8</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid #eee' }}>
              <span style={{ color: '#666', fontSize: 14 }}>Overdue Subscriptions</span>
              <span style={{ color: '#dc3545', fontWeight: 'bold', fontSize: 16 }}>3</span>
            </div>
          </div>

          {/* Recent Activity */}
          <div style={{ marginTop: 24 }}>
            <h4 style={{ color: '#004A98', margin: '0 0 16px 0', fontSize: 16 }}>Recent Activity</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#28a745' }} />
                <span style={{ fontSize: 14 }}>Nature delivered (Vol 2 Issue 24)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffc107' }} />
                <span style={{ fontSize: 14 }}>Science pending inspection</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#004A98' }} />
                <span style={{ fontSize: 14 }}>New supplier added</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Incoming Serial Table */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ color: '#004A98', margin: 0, fontSize: 18 }}>Incoming Serial</h3>
          <button style={{ 
            padding: '8px 16px', 
            background: '#004A98', 
            color: '#fff', 
            border: 'none', 
            borderRadius: 6, 
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500
          }}>
            View All
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>VOLUME NO.</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>ISSUE NO.</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>TITLE SERIAL</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>DATE</th>
              </tr>
            </thead>
            <tbody>
              {incomingSerialData.map((item, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '16px', fontWeight: 'bold', color: '#004A98' }}>{item.volumeNo}</td>
                  <td style={{ padding: '16px', fontFamily: 'monospace', color: '#666' }}>{item.issueNo}</td>
                  <td style={{ padding: '16px' }}>{item.titleSerial}</td>
                  <td style={{ padding: '16px', color: '#666' }}>
                    <div style={{ 
                      padding: '6px 12px', 
                      background: '#e3f2fd', 
                      borderRadius: 6,
                      fontWeight: 500,
                      fontSize: 14
                    }}>
                      {item.date}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, color: '#666', fontSize: 14 }}>
          <div>
            Showing {incomingSerialData.length} of 50 results
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ 
              padding: '6px 12px', 
              border: '1px solid #ddd', 
              background: '#fff', 
              borderRadius: 4, 
              cursor: 'pointer' 
            }}>
              Previous
            </button>
            <button style={{ 
              padding: '6px 12px', 
              border: '1px solid #004A98', 
              background: '#004A98', 
              color: '#fff', 
              borderRadius: 4, 
              cursor: 'pointer' 
            }}>
              1
            </button>
            <button style={{ 
              padding: '6px 12px', 
              border: '1px solid #ddd', 
              background: '#fff', 
              borderRadius: 4, 
              cursor: 'pointer' 
            }}>
              2
            </button>
            <button style={{ 
              padding: '6px 12px', 
              border: '1px solid #ddd', 
              background: '#fff', 
              borderRadius: 4, 
              cursor: 'pointer' 
            }}>
              Next
            </button>
          </div>
        </div>
      </div>

      {/* CSS for hover effects */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .bar-value {
          opacity: 0;
        }
        
        div:hover > .bar-value {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}

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
      alignItems: 'center'
    }}>
      <img
        src="/images/dost-logo1.png"
        alt="LOGO"
        style={{
          marginBottom: 24,
          width: 55,
          height: 55,
          borderRadius: 12
        }}
      />
      <nav style={{ width: '100%' }}>
        <ul style={{ listStyle: 'none', padding: 0, width: '100%' }}>
          {sidebarItems.map((item, idx) => (
            <li
              key={item.label}
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
                boxShadow: active === idx ? '0 3px 6px rgba(0,0,0,0.15)' : 'none'
              }}
              onClick={() => setActive(idx)}
            >
              <Icon>{item.icon}</Icon>
              <span style={{ fontSize: 15 }}>{item.label}</span>
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
        zIndex: 9
      }}
    >
      <h2 style={{ color: '#004A98', fontWeight: 600, fontSize: 20 }}>GSPS - Serial Subscription System</h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: 18, position: 'relative' }}>
        <div style={{ fontSize: 14, color: '#666', background: '#f0f4f8', padding: '8px 16px', borderRadius: 20 }}>
          GSPS Role
        </div>

        <span onClick={() => handleIconClick('chat')} style={{ cursor: 'pointer' }}>
          <IoChatboxEllipsesOutline />
        </span>
        {activeIcon === 'chat' && (
          <div style={popupStyle}>
            <h4 style={{ margin: '0 0 8px' }}>Messages</h4>
            <p style={{ fontSize: 14, color: '#555' }}>No new messages.</p>
          </div>
        )}

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
                    background: '#004A98',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 'bold',
                    marginRight: 10,
                  }}
                >
                  G
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 16, color: '#222' }}>GSPS User</h4>
                  <p style={{ margin: 0, fontSize: 13, color: '#777' }}>Government Serial Procurement</p>
                </div>
              </div>

              <button
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

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning,';
  if (hour < 18) return 'Good afternoon,';
  return 'Good evening,';
}

function App() {
  const [activeSidebar, setActiveSidebar] = useState(0); // Default to Dashboard

  const renderContent = () => {
    switch (activeSidebar) {
      case 0: // Dashboard
        return (
          <>
            <GSPSDashboard />
          </>
        );
      case 2: // Supplier Info
        return (
          <>
            <h2 style={{ marginBottom: 8 }}>Supplier Information</h2>
            <p style={{ color: '#666', marginBottom: 32 }}>Manage and view all supplier details</p>
            <div style={{ textAlign: 'center', padding: 60, color: '#666' }}>
              <h3>Supplier Info View</h3>
              <p>This would show your supplier information table</p>
            </div>
          </>
        );
      case 3: // Subscription Tracking
        return (
          <>
            <h2 style={{ marginBottom: 8 }}>Subscription Tracking</h2>
            <p style={{ color: '#666', marginBottom: 32 }}>Monitor and manage subscription payments</p>
            <div style={{ textAlign: 'center', padding: 60, color: '#666' }}>
              <h3>Subscription View</h3>
              <p>This would show your subscription tracking table</p>
            </div>
          </>
        );
      case 4: // Monitor Delivery
        return (
          <>
            <h2 style={{ marginBottom: 8 }}>Monitor Delivery</h2>
            <p style={{ color: '#666', marginBottom: 32 }}>Track and monitor all delivery activities</p>
            <div style={{ textAlign: 'center', padding: 60, color: '#666' }}>
              <h3>Monitor Delivery View</h3>
              <p>This would show your delivery monitoring table</p>
            </div>
          </>
        );
      case 5: // Received Items
        return (
          <>
            <h2 style={{ marginBottom: 8 }}>Received Items</h2>
            <p style={{ color: '#666', marginBottom: 32 }}>Track received serial items and inspection status</p>
            <div style={{ textAlign: 'center', padding: 60, color: '#666' }}>
              <h3>Received Items View</h3>
              <p>This would show your received items table</p>
            </div>
          </>
        );
      default:
        return (
          <>
            <h2 style={{ marginBottom: 8 }}>{sidebarItems[activeSidebar].label}</h2>
            <p style={{ color: '#666', marginBottom: 32 }}>Content for {sidebarItems[activeSidebar].label} section</p>
            <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 12, color: '#666' }}>
              <h3>{sidebarItems[activeSidebar].label} View</h3>
              <p>This section is under development</p>
            </div>
          </>
        );
    }
  };

  return (
    <div style={{ display: 'flex', fontFamily: 'Segoe UI, Arial, sans-serif', background: '#f0f4f8', minHeight: '100vh' }}>
      <Sidebar active={activeSidebar} setActive={setActiveSidebar} />
      <div style={{ flex: 1 }}>
        <TopBar />
        <div style={{ padding: '32px 40px' }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default App;

console.log("GSPS Dashboard loaded ✅");