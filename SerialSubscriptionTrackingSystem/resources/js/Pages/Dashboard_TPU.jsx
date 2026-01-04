import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { GoHome } from "react-icons/go";
import { HiUsers } from "react-icons/hi";
import { ImStatsBars } from "react-icons/im";
import { FaTruck } from "react-icons/fa";
import { MdMarkEmailRead } from "react-icons/md";
import { router } from '@inertiajs/react';
import { VscAccount } from "react-icons/vsc";
import { MdOutlineNotificationsActive } from "react-icons/md";
import { IoChatboxEllipsesOutline } from "react-icons/io5";
import { RiAddLargeFill } from "react-icons/ri";


const Icon = ({ children }) => (
  <span style={{ marginRight: 8 }}>{children}</span>
);

const sidebarItems = [
  { icon: <GoHome />, label: 'Dashboard' },
  { icon: <RiAddLargeFill />, label: 'Add Serial' },
  { icon: <HiUsers />, label: 'Supplier Info' },
  { icon: <ImStatsBars />, label: 'Subscription' },
  { icon: <FaTruck />, label: 'Monitor Delivery' },
  { icon: <MdMarkEmailRead />, label: 'Received' },
];

function Sidebar({ active, setActive }) {
  return (
    <div style={{
      background: '#004A98',
      color: '#fff',
      width: 160, // smaller sidebar
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
                width: '140px', // narrower clickable area
                marginLeft: '10px', // leaves space on left
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
      <h2 style={{ color: '#004A98', fontWeight: 600, fontSize: 20 }}>Serial Subscription System</h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: 18, position: 'relative' }}>
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
            <p style={{ fontSize: 14, color: '#555' }}>You’re all caught up!</p>
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
                  A
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 16, color: '#222' }}>Admin</h4>
                  <p style={{ margin: 0, fontSize: 13, color: '#777' }}>System Administrator</p>
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
                onClick={() => router.post('/logout')}
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

function OverviewCards() {
  const [hovered, setHovered] = useState(null);
  const cards = [
    { title: 'Total Serial', value: '568', info: 'Total number of serials tracked.' },
    { title: 'Most Delivered Title', value: 'Harvard Business Review', info: 'Most frequently delivered serial.' },
    { title: 'Best Performing Supplier', value: 'Manila Bulletin', info: 'Supplier with best delivery record.' },
  ];

  const cardStyle = (isHovered) => ({
    background: '#fff',
    borderRadius: 8,
    boxShadow: isHovered
      ? '0 4px 16px rgba(0,0,0,0.1)'
      : '0 2px 8px rgba(0,0,0,0.05)',
    padding: 24,
    marginRight: 24,
    minWidth: 220,
    flex: 1,
    position: 'relative',
    transition: 'all 0.2s ease',
    transform: isHovered ? 'translateY(-4px)' : 'none',
    cursor: 'pointer',
  });

  return (
    <div style={{ display: 'flex', margin: '32px 0' }}>
      {cards.map((card, idx) => (
        <div
          key={card.title}
          style={cardStyle(hovered === idx)}
          onMouseEnter={() => setHovered(idx)}
          onMouseLeave={() => setHovered(null)}
        >
          <h3>{card.title}</h3>
          <p
            style={{
              fontSize: card.title === 'Total Serial' ? 32 : 18,
              fontWeight: 'bold',
            }}
          >
            {card.value}
          </p>

          {hovered === idx && (
            <div
              style={{
                position: 'absolute',
                bottom: '-40px', // moved below the card
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#333',
                color: '#fff',
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: 13,
                whiteSpace: 'nowrap',
                zIndex: 1,
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              }}
            >
              {card.info}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}


function SerialReportChart() {
  const data = [290, 450, 250, 130, 140, 310, 150, 330, 140, 120, 180, 260];
  const max = Math.max(...data);
  const min = Math.min(...data);
  const chartHeight = 300;
  const chartWidth = 900;
  const padding = 50;
  const pointSpacing = (chartWidth - padding * 2) / (data.length - 1);

  const points = data
    .map((v, i) => `${padding + i * pointSpacing},${chartHeight - padding - ((v - min) / (max - min)) * (chartHeight - padding * 1.5)}`)
    .join(' ');

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 8,
        padding: 24,
        marginBottom: 32,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      }}
    >
      <h3 style={{ marginBottom: 16 }}>Serial Report</h3>
      <svg width="100%" height={chartHeight}>
        {[0, 1, 2, 3, 4, 5].map((g) => (
          <line
            key={g}
            x1={padding}
            x2={chartWidth - padding}
            y1={padding + g * ((chartHeight - padding * 1.5) / 5)}
            y2={padding + g * ((chartHeight - padding * 1.5) / 5)}
            stroke="#e0e0e0"
            strokeWidth="1"
          />
        ))}

        <polyline
          fill="none"
          stroke="#8D6E63"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />

        {data.map((v, i) => (
          <circle
            key={i}
            cx={padding + i * pointSpacing}
            cy={chartHeight - padding - ((v - min) / (max - min)) * (chartHeight - padding * 1.5)}
            r={4}
            fill="#fff"
            stroke="#8D6E63"
            strokeWidth="2"
          />
        ))}

        {data.map((_, i) => (
          <text
            key={i}
            x={padding + i * pointSpacing}
            y={chartHeight - padding / 3}
            fontSize="12"
            textAnchor="middle"
            fill="#333"
          >
            {i + 1}
          </text>
        ))}

        {[0, 1, 2, 3, 4, 5].map((g) => (
          <text
            key={g}
            x={padding - 35}
            y={padding + g * ((chartHeight - padding * 1.5) / 5) + 5}
            fontSize="12"
            fill="#333"
          >
            {Math.round(max - ((max - min) / 5) * g)}
          </text>
        ))}
      </svg>
    </div>
  );
}




function IncomingSerialTable() {
  const [sortAsc, setSortAsc] = useState(true);
  const [filtered, setFiltered] = useState(false);
  const rows = [
    {
      volume: 'Vol 2',
      issue: '0027-8424',
      title: 'Proceedings of the National Academy of Sciences of the United States of America',
      date: '20.09.2025'
    },
    {
      volume: 'Vol 1',
      issue: '0036-8075',
      title: 'Science',
      date: '18.09.2025'
    }
  ];
  let displayRows = [...rows];
  if (filtered) {
    displayRows = displayRows.filter(r => r.volume === 'Vol 2');
  }
  if (!sortAsc) {
    displayRows = displayRows.reverse();
  }
  return (
    <div style={{ background: '#fff', borderRadius: 8, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Incoming Serial</h3>
        <div>
          <button
            style={{ marginRight: 8, padding: '6px 16px', borderRadius: 4, border: '1px solid #1565c0', background: '#fff', color: '#1565c0', cursor: 'pointer' }}
            onClick={() => setSortAsc(s => !s)}
          >
            Sort {sortAsc ? '↓' : '↑'}
          </button>
          <button
            style={{ padding: '6px 16px', borderRadius: 4, border: '1px solid #1565c0', background: filtered ? '#1565c0' : '#fff', color: filtered ? '#fff' : '#1565c0', cursor: 'pointer' }}
            onClick={() => setFiltered(f => !f)}
          >
            {filtered ? 'Clear Filter' : 'Filter Vol 2'}
          </button>
        </div>
      </div>
      <table style={{ width: '100%', marginTop: 16, borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ padding: 8, textAlign: 'left' }}>Volume No.</th>
            <th style={{ padding: 8, textAlign: 'left' }}>Issue No.</th>
            <th style={{ padding: 8, textAlign: 'left' }}>Title Serial</th>
            <th style={{ padding: 8, textAlign: 'left' }}>Date</th>
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row, idx) => (
            <tr key={idx}>
              <td style={{ padding: 8 }}>{row.volume}</td>
              <td style={{ padding: 8 }}>{row.issue}</td>
              <td style={{ padding: 8 }}>{row.title}</td>
              <td style={{ padding: 8 }}>{row.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning,';
  if (hour < 18) return 'Good afternoon,';
  return 'Good evening,';
}

function Dashboard_TPU() {
    const [activeSidebar, setActiveSidebar] = useState(0);

    return (
        <div style={{ display: 'flex', fontFamily: 'Segoe UI, Arial, sans-serif', background: '#f0f4f8', minHeight: '100vh' }}>
            <Sidebar active={activeSidebar} setActive={setActiveSidebar} />
            <div style={{ flex: 1 }}>
                <TopBar />
                <div style={{ padding: '32px 40px' }}>
                    <h2 style={{ marginBottom: 8 }}>Dashboard Overview</h2>
                    <p style={{ color: '#666', marginBottom: 32 }}>{getGreeting()} Welcome back!</p>
                    <OverviewCards />
                    <SerialReportChart />
                    <IncomingSerialTable />
                </div>
            </div>
        </div>
    );
}

export default Dashboard_TPU;
