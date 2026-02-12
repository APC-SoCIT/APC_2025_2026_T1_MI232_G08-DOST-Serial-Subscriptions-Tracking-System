import React, { useState, useMemo, useEffect } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import axios from "axios";
import { GoHomeFill } from "react-icons/go";
import { HiUsers } from "react-icons/hi";
import { IoSearchOutline } from "react-icons/io5";
import { MdOutlineNotificationsActive } from "react-icons/md";
import { VscAccount } from "react-icons/vsc";
import { BsFillChatTextFill } from "react-icons/bs";
import { BiSortAlt2 } from "react-icons/bi";
import { FaTruckFast } from "react-icons/fa6";

const sidebarItems = [
  { icon: <GoHomeFill />, label: 'Dashboard', route: '/dashboard-supplier' },
  { icon: <BsFillChatTextFill />, label: 'Chat', route: '/dashboard-supplier-chat' },
  { icon: <HiUsers />, label: 'List of Serials', route: '/dashboard-supplier-listofserial' },
  { icon: <FaTruckFast />, label: 'Delivery', route: '/dashboard-supplier-delivery' },
];

function Sidebar({ active, setActive }) {
  return (
    <div
      style={{
        background: "#004A98",
        color: "#fff",
        width: 160,
        minHeight: "100vh",
        padding: "20px 0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          marginBottom: 24,
        }}
      >
        <img
          src="/images/dost-logo1.png"
          alt="LOGO"
          style={{
            width: 55,
            height: 55,
            borderRadius: 12,
          }}
        />
        <div
          style={{
            color: "#fff",
            fontWeight: 600,
            fontSize: 16,
            letterSpacing: 1,
            fontFamily: "Montserrat Bold",
            textAlign: "left",
          }}
        >
          DOST <br />
          STII
        </div>
      </div>
      <nav style={{ width: "100%" }}>
        <ul style={{ listStyle: "none", padding: 0, width: "100%" }}>
          {sidebarItems.map((item, idx) => (
            <li key={item.label}>
              <Link
                href={item.route}
                style={{
                  margin: "10px 0",
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                  fontSize: 16,
                  fontWeight: 500,
                  color: "#fff",
                  background: active === idx ? "#0062f4ff" : "transparent",
                  borderRadius: 6,
                  padding: "8px 12px",
                  width: "140px",
                  marginLeft: "10px",
                  transition: "background 0.2s, transform 0.1s",
                  boxShadow: active === idx ? "0 3px 6px rgba(0,0,0,0.15)" : "none",
                  textDecoration: "none",
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
    zIndex: 10000,
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
      <h2 style={{ color: '#0B4DA1', fontWeight: 600, fontSize: 20 }}>Supplier | Delivery</h2>

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
                onClick={() => router.post(route('logout'))}
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

// Sample data - in production, this would come from the API
// Combined data with status field for unified table
const allSerials = [
  {
    id: 1,
    serial_title: "Time Magazine",
    purchase_order_no: "PO-2025-0001",
    issues: "4",
    amount: "₱430",
    date: "2025-01-15",
    remarks: "Jan-Feb issues delivered in March",
    status: "late",
  },
  {
    id: 2,
    serial_title: "Nature",
    purchase_order_no: "PO-2024-1256",
    issues: "48",
    amount: "₱14,500",
    date: "2024-12-15",
    remarks: "",
    status: "delivered",
  },
  {
    id: 3,
    serial_title: "Time Magazine",
    purchase_order_no: "PO-2025-0001",
    issues: "4",
    amount: "₱430",
    date: "",
    remarks: "Pending shipment",
    status: "undelivered",
  },
  {
    id: 4,
    serial_title: "The Economist",
    purchase_order_no: "PO-2025-0004",
    issues: "3",
    amount: "₱900",
    date: "2024-12-28",
    remarks: "Issues delivered one month late",
    status: "late",
  },
  {
    id: 5,
    serial_title: "Science",
    purchase_order_no: "PO-2024-1302",
    issues: "52",
    amount: "₱18,200",
    date: "2024-11-28",
    remarks: "",
    status: "delivered",
  },
  {
    id: 6,
    serial_title: "The Economist",
    purchase_order_no: "PO-2025-0004",
    issues: "1",
    amount: "₱300",
    date: "",
    remarks: "Awaiting stock",
    status: "undelivered",
  },
  {
    id: 7,
    serial_title: "The Lancet",
    purchase_order_no: "PO-2024-1378",
    issues: "24",
    amount: "₱9,800",
    date: "2024-12-10",
    remarks: "",
    status: "delivered",
  },
];

function Pagination({ current, total, onPage }) {
  const pages = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - current) <= 1) {
      pages.push(i);
    } else if (
      (i === current - 2 && current > 3) ||
      (i === current + 2 && current < total - 2)
    ) {
      pages.push("...");
    }
  }
  const uniquePages = pages.reduce((acc, p) => {
    if (acc.length === 0 || p !== "..." || acc[acc.length - 1] !== "...") {
      acc.push(p);
    }
    return acc;
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16 }}>
      <span
        style={{
          color: current === 1 ? "#aaa" : "#004A98",
          cursor: current === 1 ? "default" : "pointer",
        }}
        onClick={() => current > 1 && onPage(current - 1)}
      >
        &lt;
      </span>
      {uniquePages.map((p, idx) =>
        p === "..." ? (
          <span key={idx} style={{ color: "#aaa" }}>
            ...
          </span>
        ) : (
          <span
            key={idx}
            style={{
              color: current === p ? "#fff" : "#004A98",
              background: current === p ? "#004A98" : "transparent",
              borderRadius: 4,
              padding: "2px 8px",
              cursor: "pointer",
              fontWeight: current === p ? 700 : 500,
            }}
            onClick={() => typeof p === "number" && onPage(p)}
          >
            {p}
          </span>
        )
      )}
      <span
        style={{
          color: current === total ? "#aaa" : "#004A98",
          cursor: current === total ? "default" : "pointer",
        }}
        onClick={() => current < total && onPage(current + 1)}
      >
        &gt;
      </span>
    </div>
  );
}

function Dashboard_Supplier_Delivery() {
  const [activeSidebar, setActiveSidebar] = useState(3);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Status filter dropdown: 'all', 'late', 'delivered', 'undelivered'
  const [statusFilter, setStatusFilter] = useState('all');

  const itemsPerPage = 10;

  // Status badge component
  const StatusBadge = ({ status }) => {
    const colors = {
      late: { bg: '#fff3cd', text: '#856404', border: '#ffc107' },
      delivered: { bg: '#d4edda', text: '#155724', border: '#28a745' },
      undelivered: { bg: '#f8d7da', text: '#721c24', border: '#dc3545' },
    };
    const style = colors[status] || colors.undelivered;
    
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '4px 12px',
          borderRadius: 20,
          background: style.bg,
          color: style.text,
          border: `1px solid ${style.border}`,
          fontSize: 12,
          fontWeight: 600,
          textTransform: 'capitalize',
        }}
      >
        {status}
      </span>
    );
  };

  // Filter data based on dropdown selection
  const filteredSerials = useMemo(() => {
    let result = allSerials.filter(item => {
      if (statusFilter === 'all') return true;
      return item.status === statusFilter;
    });

    // Search filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.serial_title.toLowerCase().includes(lowerQuery) ||
          item.purchase_order_no.toLowerCase().includes(lowerQuery)
      );
    }

    // Sort by status order: Late, Delivered, Undelivered
    const statusOrder = { late: 0, delivered: 1, undelivered: 2 };
    result.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

    return result;
  }, [statusFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredSerials.length / itemsPerPage));
  const paginatedSerials = filteredSerials.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  // Count by status for filter labels
  const lateCount = allSerials.filter(s => s.status === 'late').length;
  const deliveredCount = allSerials.filter(s => s.status === 'delivered').length;
  const undeliveredCount = allSerials.filter(s => s.status === 'undelivered').length;

  return (
    <div style={{ display: "flex", background: "#F5F6FA", minHeight: "100vh" }}>
      <Sidebar active={activeSidebar} setActive={setActiveSidebar} />
      <div style={{ flex: 1, overflowY: "auto", maxHeight: "100vh" }}>
        <TopBar />
        <div style={{ padding: "40px 60px" }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 32, color: "#222" }}>
            Delivery
          </h1>
          
          <div
              style={{
                background: "#fff",
                borderRadius: 12,
                boxShadow: "0 2px 8px #0001",
              }}
            >
              <div
                style={{
                  background: "#004A98",
                  borderTopLeftRadius: 12,
                  borderTopRightRadius: 12,
                  height: 32,
                }}
              ></div>

              {/* Search Bar and Filters */}
              <div style={{ padding: "20px 24px", borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                {/* Search */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <IoSearchOutline style={{ position: 'absolute', left: 12, color: '#666', fontSize: 18 }} />
                  <input 
                    type="text" 
                    placeholder="Search Serial or PO No..." 
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    style={{
                      padding: '10px 10px 10px 40px',
                      borderRadius: 8,
                      border: '1px solid #ddd',
                      outline: 'none',
                      fontSize: 14,
                      width: 300,
                      color: '#333',
                      background: '#f9f9f9'
                    }}
                  />
                </div>

                {/* Status Filter Dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#555' }}>Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPage(1);
                    }}
                    style={{
                      padding: '10px 16px',
                      borderRadius: 8,
                      border: '1px solid #ddd',
                      outline: 'none',
                      fontSize: 14,
                      color: '#333',
                      background: '#f9f9f9',
                      cursor: 'pointer',
                      minWidth: 160,
                    }}
                  >
                    <option value="all">All Status ({allSerials.length})</option>
                    <option value="late">Late ({lateCount})</option>
                    <option value="delivered">Delivered ({deliveredCount})</option>
                    <option value="undelivered">Undelivered ({undeliveredCount})</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
                <thead>
                  <tr style={{ color: "#222", fontWeight: 700, borderBottom: '1px solid #eee' }}>
                    <th style={{ padding: "12px 8px", textAlign: "center", width: 60 }}>NO.</th>
                    <th style={{ padding: "12px 8px", textAlign: "center" }}>Serial Title</th>
                    <th style={{ padding: "12px 8px", textAlign: "left" }}>Purchase Order No.</th>
                    <th style={{ padding: "12px 8px", textAlign: "center" }}>Issues</th>
                    <th style={{ padding: "12px 8px", textAlign: "center" }}>Amount</th>
                    <th style={{ padding: "12px 8px", textAlign: "center" }}>Date</th>
                    <th style={{ padding: "12px 8px", textAlign: "center" }}>Status</th>
                    <th style={{ padding: "12px 8px", textAlign: "center" }}>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSerials.length > 0 ? (
                    paginatedSerials.map((row, idx) => (
                      <tr key={row.id} style={{ background: idx % 2 === 0 ? "#f9f9f9" : "#fff", borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: "14px 8px", textAlign: "center", fontWeight: 500 }}>{(page - 1) * itemsPerPage + idx + 1}</td>
                        <td style={{ padding: "14px 8px", textAlign: "center", fontWeight: 700, color: "#004A98" }}>{row.serial_title}</td>
                        <td style={{ padding: "14px 8px", textAlign: "left" }}>{row.purchase_order_no}</td>
                        <td style={{ padding: "14px 8px", textAlign: "center" }}>{row.issues}</td>
                        <td style={{ padding: "14px 8px", textAlign: "center" }}>{row.amount}</td>
                        <td style={{ padding: "14px 8px", textAlign: "center", color: "#555" }}>{row.date || '-'}</td>
                        <td style={{ padding: "14px 8px", textAlign: "center" }}><StatusBadge status={row.status} /></td>
                        <td style={{ padding: "14px 8px", textAlign: "center", color: "#555", maxWidth: 200 }}>{row.remarks || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" style={{ textAlign: "center", padding: "40px", color: "#888" }}>
                        No serials found {searchQuery && `matching "${searchQuery}"`}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px" }}>
                <Pagination current={page} total={totalPages} onPage={setPage} />
                <span style={{ color: "#444", fontSize: 15 }}>
                  Showing {filteredSerials.length} results
                </span>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard_Supplier_Delivery;
