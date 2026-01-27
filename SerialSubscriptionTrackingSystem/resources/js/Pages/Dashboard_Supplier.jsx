import React, { useState, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { Link } from '@inertiajs/react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { GoHomeFill } from "react-icons/go";
import { MdOutlineNotificationsActive } from "react-icons/md";
import { VscAccount } from "react-icons/vsc";
import { FaTruckLoading } from "react-icons/fa";
import { HiUsers } from "react-icons/hi";
import { TbTruckOff } from "react-icons/tb";
import { FaTruckFast } from "react-icons/fa6";
import { BsFillChatTextFill } from "react-icons/bs";
import { IoFilterSharp, IoSearchOutline } from "react-icons/io5";
import { BiSortAlt2 } from "react-icons/bi"; 

const Icon = ({ children }) => (
  <span style={{ marginRight: 8 }}>{children}</span>
);

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
          DOST <br />
          STII
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
                <Icon>{item.icon}</Icon>
                <span style={{ fontSize: 15 }}>{item.label}</span>
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
        zIndex: 9
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

function OverviewCards({ year }) {
  const [hovered, setHovered] = useState(null);

  const getStatsForYear = (y) => {
    const numYear = parseInt(y);
    const baseTotal = 400 + (numYear % 10) * 30; 
    const baseRate = 80 + (numYear % 5) * 3;
    
    return {
      total: baseTotal,
      rate: baseRate > 98 ? 98 : baseRate,
      topSupplier: numYear % 2 === 0 ? 'Manila Bulletin' : 'Philippine Star'
    };
  };

  const stats = getStatsForYear(year);

  const cards = [
    { title: 'Total Serials', value: stats.total, info: `Total number of serials tracked in ${year}.`, color: '#0B4DA1' },
    { title: 'Best Performing Suppliers', value: stats.topSupplier, info: 'Supplier with best delivery record.', color: '#2E7D32' },
    { title: 'Most Delivered Titles', value: 'Harvard Business Review', info: 'Most frequently delivered serial.', color: '#ED6C02' },
    { title: 'On-Time Delivery Rate', value: `${stats.rate}%`, info: `Percentage of serials delivered on time in ${year}.`, color: '#9C27B0' },
  ];

  const cardStyle = (isHovered, color) => ({
    background: '#fff',
    borderRadius: 8,
    boxShadow: isHovered
      ? '0 4px 16px rgba(0,0,0,0.1)'
      : '0 2px 8px rgba(0,0,0,0.05)',
    padding: 24,
    marginRight: 16,
    minWidth: 200,
    flex: 1,
    position: 'relative',
    transition: 'all 0.2s ease',
    transform: isHovered ? 'translateY(-4px)' : 'none',
    cursor: 'pointer',
    borderTop: `4px solid ${color}`,
  });

  return (
    <div style={{ display: 'flex', margin: '32px 0', gap: 16, flexWrap: 'wrap' }}>
      {cards.map((card, idx) => (
        <div
          key={card.title}
          style={cardStyle(hovered === idx, card.color)}
          onMouseEnter={() => setHovered(idx)}
          onMouseLeave={() => setHovered(null)}
        >
          <h3 style={{ fontSize: 16, color: '#666', marginBottom: 8 }}>{card.title}</h3>
          <p
            style={{
              fontSize: card.title === 'Total Serials' ? 32 : 24,
              fontWeight: 'bold',
              color: '#222',
              margin: 0,
            }}
          >
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function SerialReportChart({ year }) {
  const [filterMonth, setFilterMonth] = useState('All');

  // Helper to generate chart data based on year
  const generateData = (selectedYear) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const baseVal = parseInt(selectedYear) % 5; 
    
    return months.map((m, i) => ({
      month: m,
      delivered: 30 + baseVal * 5 + (i * 2) + Math.floor(Math.random() * 10),
      late: Math.floor(Math.random() * 8),
      undelivered: Math.floor(Math.random() * 3)
    }));
  };

  const monthlyData = useMemo(() => generateData(year), [year]);
  
  // Logic to handle Specific Month View
  const singleMonthData = useMemo(() => {
    if (filterMonth === 'All') return null;
    const data = monthlyData.find(d => d.month === filterMonth);
    if (!data) return [];
    return [
        { name: 'Delivered', value: data.delivered, fill: '#4CAF50' },
        { name: 'Late', value: data.late, fill: '#FF9800' },
        { name: 'Undelivered', value: data.undelivered, fill: '#F44336' },
    ];
  }, [monthlyData, filterMonth]);

  const deliveryStatusData = [
    { name: 'Delivered', value: 400 + (parseInt(year)%10)*10, color: '#4CAF50' },
    { name: 'Late', value: 40 + (parseInt(year)%5)*5, color: '#FF9800' },
    { name: 'Undelivered', value: 15 + (parseInt(year)%3)*2, color: '#F44336' },
  ];

  const monthsList = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, marginBottom: 32 }}>
      
      {/* Monthly Trends Chart Card */}
      <div
        style={{
          background: '#fff',
          borderRadius: 8,
          padding: 24,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, color: '#0B4DA1' }}>{year} Monthly Serial Delivery Trends</h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: '#666' }}>Filter:</span>
                <select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    style={{
                        padding: '4px 8px',
                        borderRadius: 4,
                        border: '1px solid #ddd',
                        fontSize: 14,
                        color: '#333',
                        outline: 'none',
                        cursor: 'pointer'
                    }}
                >
                    <option value="All">All Months</option>
                    {monthsList.map(m => (
                        <option key={m} value={m}>{m}</option>
                    ))}
                </select>
            </div>
        </div>

        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            {filterMonth === 'All' ? (
                <LineChart
                data={monthlyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                    dataKey="month" 
                    stroke="#666"
                    tick={{ fill: '#666' }}
                />
                <YAxis 
                    stroke="#666"
                    tick={{ fill: '#666' }}
                    label={{ 
                    value: 'Number of Serials', 
                    angle: -90, 
                    position: 'insideLeft',
                    offset: -10,
                    style: { textAnchor: 'middle', fill: '#666' }
                    }}
                />
                <Tooltip 
                    contentStyle={{ borderRadius: 8, border: '1px solid #e0e0e0' }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingBottom: 20 }} />
                <Line
                    type="monotone"
                    dataKey="delivered"
                    name="Delivered"
                    stroke="#4CAF50"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    animationDuration={800}
                />
                <Line
                    type="monotone"
                    dataKey="late"
                    name="Late Deliveries"
                    stroke="#FF9800"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    strokeDasharray="5 5"
                    animationDuration={800}
                />
                </LineChart>
            ) : (
                <BarChart
                    data={singleMonthData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    barSize={60}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                        dataKey="name" 
                        stroke="#666"
                        tick={{ fill: '#666' }}
                    />
                    <YAxis 
                        stroke="#666"
                        tick={{ fill: '#666' }}
                    />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={500}>
                        {
                            singleMonthData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))
                        }
                    </Bar>
                </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row - Top Suppliers & Pie Chart */}
      <div style={{ display: 'flex', gap: 24 }}>
        {/* Top Suppliers Bar Chart - HORIZONTAL LAYOUT UPDATE */}
        <div
          style={{
            background: '#fff',
            borderRadius: 8,
            padding: 24,
            flex: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}
        >
          <h3 style={{ marginBottom: 16, color: '#0B4DA1' }}>Top Delivered Serials ({year})</h3>
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={[
                  { name: 'Manila B.', deliveries: 85 - (2025-year)*2, onTime: 92 },
                  { name: 'Phil Star', deliveries: 68 + (2025-year), onTime: 85 },
                  { name: 'Bus. World', deliveries: 72 - (2025-year)*3, onTime: 88 },
                  { name: 'J. Storage', deliveries: 65, onTime: 90 },
                  { name: 'Elsevier', deliveries: 60, onTime: 87 },
                ]}
                margin={{ top: 0, right: 30, left: 20, bottom: 0 }}
                barSize={12}
                barGap={4}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="#f0f0f0" />
                
                {/* XAxis is numeric, hidden for cleaner look */}
                <XAxis type="number" hide />
                
                {/* YAxis is category (Names) */}
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false}
                  width={80}
                  tick={{ fill: '#555', fontSize: 13 }}
                />
                
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: 8, border: '1px solid #e0e0e0' }} />
                
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: 10 }}
                />
                
                <Bar 
                  dataKey="deliveries" 
                  name="Deliveries" 
                  fill="#0B4DA1" 
                  radius={[0, 4, 4, 0]}
                  animationDuration={800}
                />
                <Bar 
                  dataKey="onTime" 
                  name="On-Time %" 
                  fill="#4CAF50" 
                  radius={[0, 4, 4, 0]}
                  animationDuration={800}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Delivery Status Pie Chart */}
        <div
          style={{
            background: '#fff',
            borderRadius: 8,
            padding: 24,
            flex: 1,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}
        >
          <h3 style={{ marginBottom: 16, color: '#0B4DA1' }}>{year} Status Overview</h3>
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deliveryStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  animationDuration={800}
                >
                  {deliveryStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function IncomingSerialTable() {
  const [sortAsc, setSortAsc] = useState(true);
  const [filtered, setFiltered] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const rows = [
    {
      volume: 'Vol 2',
      issue: '0027-8424',
      title: 'Proceedings of the National Academy of Sciences of the United States of America',
      date: '20.09.2025',
      status: 'Delivered',
      statusColor: '#4CAF50'
    },
    {
      volume: 'Vol 1',
      issue: '0036-8075',
      title: 'Science',
      date: '18.09.2025',
      status: 'Delivered',
      statusColor: '#4CAF50'
    },
    {
      volume: 'Vol 3',
      issue: '0091-7453',
      title: 'Nature',
      date: '22.09.2025',
      status: 'Delivered',
      statusColor: '#4CAF50'
    },
    {
      volume: 'Vol 2',
      issue: '0021-9258',
      title: 'Journal of Biological Chemistry',
      date: '19.09.2025',
      status: 'Delivered',
      statusColor: '#4CAF50'
    }
  ];
  
  let displayRows = rows.filter(row => {
    const query = searchQuery.toLowerCase();
    const matchSearch = 
      row.title.toLowerCase().includes(query) || 
      row.issue.toLowerCase().includes(query) || 
      row.volume.toLowerCase().includes(query);
      
    const matchFilter = filtered ? row.volume === 'Vol 2' : true;

    return matchSearch && matchFilter;
  });

  if (!sortAsc) {
    displayRows = displayRows.reverse();
  }
  
  return (
    <div style={{ background: '#fff', borderRadius: 8, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ color: '#0B4DA1', margin: 0 }}>Incoming Serials</h3>
        
        <div style={{ display: 'flex', gap: 12 }}>
          {/* SEARCH BAR */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <IoSearchOutline style={{ position: 'absolute', left: 10, color: '#999' }} />
            <input 
              type="text" 
              placeholder="Search title, issue..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '8px 8px 8px 32px',
                borderRadius: 4,
                border: '1px solid #ddd',
                outline: 'none',
                fontSize: 14,
                width: 200,
                color: '#333'
              }}
            />
          </div>

          <button
            style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px', 
              borderRadius: 8, 
              border: '1px solid #0B4DA1', 
              background: sortAsc ? '#0B4DA1' : '#fff', 
              color: sortAsc ? '#fff' : '#0B4DA1', 
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
            onClick={() => setSortAsc(s => !s)}
          >
            <BiSortAlt2 size={18} />
            {sortAsc ? 'New' : 'Old'}
          </button>
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e0e0e0' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#666', fontWeight: 600 }}>Volume No.</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#666', fontWeight: 600 }}>Issue No.</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#666', fontWeight: 600 }}>Title Serial</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#666', fontWeight: 600 }}>Date</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#666', fontWeight: 600 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.length > 0 ? (
              displayRows.map((row, idx) => (
                <tr 
                  key={idx} 
                  style={{ borderBottom: '1px solid #f0f0f0' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                >
                  <td style={{ padding: '12px 16px', color: '#333' }}>{row.volume}</td>
                  <td style={{ padding: '12px 16px', color: '#333' }}>{row.issue}</td>
                  <td style={{ padding: '12px 16px', color: '#333', maxWidth: 400 }}>{row.title}</td>
                  <td style={{ padding: '12px 16px', color: '#333' }}>{row.date}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        background: row.statusColor,
                        color: '#fff',
                        padding: '4px 12px',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 500,
                        display: 'inline-block',
                        minWidth: 80,
                        textAlign: 'center'
                      }}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#888' }}>
                  No serials found matching "{searchQuery}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
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

function Dashboard_Supplier() {
  const [activeSidebar, setActiveSidebar] = useState(0);
  const [selectedYear, setSelectedYear] = useState('2025');
  const years = [2025, 2024, 2023, 2022, 2021, 2020];

  return (
    <div style={{ display: 'flex', fontFamily: 'Segoe UI, Arial, sans-serif',  background: '#F5F6FA', minHeight: '100vh' }}>
      <Sidebar active={activeSidebar} setActive={setActiveSidebar} />
      <div style={{ flex: 1 }}>
        <TopBar />
        <div style={{ padding: '32px 40px' }}>
          
          {/* Header with Year Filter */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <div>
              <h2 style={{ marginBottom: 8, fontWeight: 'bold', fontSize: 30, color: '#0B4DA1', margin: 0 }}>Dashboard Overview</h2>
              <p style={{ color: '#666', marginTop: 4 }}>{getGreeting()} Welcome back!</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', background: '#fff', padding: '8px 16px', borderRadius: 8, boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
               <IoFilterSharp style={{ color: '#0B4DA1', marginRight: 8 }} />
               <span style={{ fontSize: 14, fontWeight: 600, color: '#444', marginRight: 8 }}>Period:</span>
               <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  padding: '6px 12px',
                  fontSize: 14,
                  color: '#333',
                  outline: 'none',
                  cursor: 'pointer',
                  background: '#f9f9f9'
                }}
               >
                 {years.map(year => (
                   <option key={year} value={year}>Year {year}</option>
                 ))}
               </select>
            </div>
          </div>

          <OverviewCards year={selectedYear} />
          <SerialReportChart year={selectedYear} />
          <IncomingSerialTable />
        </div>
      </div>
    </div>
  );
}

export default Dashboard_Supplier;