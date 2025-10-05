import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { GoHomeFill } from "react-icons/go";
import { HiUsers } from "react-icons/hi";
import { ImStatsBars } from "react-icons/im";
import { FaTruck } from "react-icons/fa";
import { MdMarkEmailRead } from "react-icons/md";
import { VscAccount } from "react-icons/vsc";
import { MdOutlineNotificationsActive } from "react-icons/md";
import { IoChatboxEllipsesOutline } from "react-icons/io5";
import { RiAddLargeFill } from "react-icons/ri";


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

function Sidebar({ active, setActive }) {
  return (
    <div style={{
      background: '#004A98',
      color: '#fff',
      width: 220,
      minHeight: '100vh',
      padding: '24px 0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <img
        src="/Image/DOST-STII Logo.png"
        alt="LOGO"
        style={{ marginBottom: 32, width: 65, height: 65, borderRadius: 12, marginRight: 100}}
      />      
      <nav>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {sidebarItems.map((item, idx) => (
            <li
              key={item.label}
              style={{
                margin: '20px 0',
                display: 'flex',
                font: 'Gotham Bold',
                fontSize: 21,
                alignItems: 'center',
                cursor: 'pointer',
                background: active === idx ? '#0062f4ff' : 'none',
                borderRadius: 6,
                boxShadow: '0 10px 8px rgba(0,0,0,0.1)',
                padding: '6px 12px'
              }}
              onClick={() => setActive(idx)}
            >
              <Icon>{item.icon}</Icon> {item.label}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

function TopBar() {
  return (
    <div style={{
      fontSize: 23,
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
      padding: '16px 32px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      background: '#fff',      
    }}
      onClick={() => setActive(idx)}
    >
      <Icon><IoChatboxEllipsesOutline /></Icon>
      <Icon><MdOutlineNotificationsActive /></Icon>
      <Icon><VscAccount /></Icon>
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
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    padding: 24,
    marginRight: 24,
    minWidth: 220,
    flex: 1,
    position: 'relative',
    transition: 'box-shadow 0.2s',
    boxShadow: isHovered ? '0 4px 16px rgba(21,101,192,0.15)' : '0 2px 8px rgba(0,0,0,0.05)'
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
          <p style={{ fontSize: card.title === 'Total Serial' ? 32 : 18, fontWeight: 'bold' }}>{card.value}</p>
          {hovered === idx && (
            <div style={{
              position: 'absolute',
              top: 8,
              right: 8,
              background: '#1565c0',
              color: '#fff',
              padding: '6px 12px',
              borderRadius: 6,
              fontSize: 13,
              zIndex: 1
            }}>
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

function App() {
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

ReactDOM.createRoot(document.getElementById('app')).render(<App />);