import React, { useState, useMemo, useEffect } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import axios from "axios";
import { GoHomeFill } from "react-icons/go";
import { HiUsers } from "react-icons/hi";
import { FaTruckFast } from "react-icons/fa6";
import { TbTruckOff } from "react-icons/tb";
import { FaTruckLoading } from "react-icons/fa";
import { IoSearchOutline } from "react-icons/io5"; // Added for search icon
import { MdOutlineNotificationsActive } from "react-icons/md";
import { VscAccount } from "react-icons/vsc";
import { BsFillChatTextFill } from "react-icons/bs";
import { BiSortAlt2 } from "react-icons/bi"; // Added for sort icon

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
          marginBottom: 24
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
      <h2 style={{ color: '#0B4DA1', fontWeight: 600, fontSize: 20 }}>Serial Subscription Tracking System</h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: 18, position: 'relative' }}>
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

function Dashboard_Supplier_ListofSerial() {
  const { auth } = usePage().props;
  const [activeSidebar, setActiveSidebar] = useState(2);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // New State for Search and Sort
  const [searchQuery, setSearchQuery] = useState("");
  const [isSortNewest, setIsSortNewest] = useState(true);

  // Serials data from API
  const [serials, setSerials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status state for each serial (keyed by serial id)
  const [serialStatuses, setSerialStatuses] = useState({});
  // Confirmation modal state - type can be 'accept' or 'delivery'
  const [confirmModal, setConfirmModal] = useState({ show: false, serialId: null, serialData: null, type: null });

  // Fetch serials from API
  useEffect(() => {
    fetchSerials();
  }, []);

  const fetchSerials = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get supplier name from authenticated user
      const supplierName = auth?.user?.name || '';
      
      const response = await axios.get('/api/subscriptions/supplier-serials', {
        params: { supplier_name: supplierName }
      });
      
      if (response.data.success) {
        const fetchedSerials = response.data.serials || [];
        setSerials(fetchedSerials);
        
        // Initialize status state from fetched data
        const statusMap = {};
        fetchedSerials.forEach(serial => {
          if (serial.status && serial.status !== 'pending') {
            statusMap[serial.id] = serial.status;
          }
        });
        setSerialStatuses(statusMap);
        
        // Calculate total pages
        setTotalPages(Math.max(1, Math.ceil(fetchedSerials.length / itemsPerPage)));
      }
    } catch (err) {
      console.error('Error fetching serials:', err);
      setError('Failed to load serials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Status options in sequential order
  const statusFlow = [
    { value: 'prepare', label: 'Prepare', color: '#ffc107' },
    { value: 'for_delivery', label: 'For Delivery', color: '#17a2b8' },
  ];

  // Handle Accept button click - show confirmation
  const handleAcceptClick = (serial) => {
    setConfirmModal({ show: true, serialId: serial.id, serialData: serial, type: 'accept' });
  };

  // Handle Prepare button click - show confirmation for delivery
  const handlePrepareClick = (serial) => {
    setConfirmModal({ show: true, serialId: serial.id, serialData: serial, type: 'delivery' });
  };

  // Handle confirmation Yes
  const handleConfirmYes = async () => {
    const { serialId, serialData, type } = confirmModal;
    const newStatus = type === 'accept' ? 'prepare' : 'for_delivery';
    
    try {
      // Update status via API
      const response = await axios.put(`/api/subscriptions/${serialData.subscription_id}/serial-status`, {
        serial_issn: serialData.issn,
        status: newStatus
      });
      
      if (response.data.success) {
        // Update local state
        setSerialStatuses(prev => ({ ...prev, [serialId]: newStatus }));
        
        // Also update the serials array
        setSerials(prev => prev.map(s => 
          s.id === serialId ? { ...s, status: newStatus } : s
        ));
      } else {
        console.error('Failed to update status:', response.data.message);
        alert('Failed to update status. Please try again.');
      }
    } catch (err) {
      console.error('Error updating serial status:', err);
      alert('Failed to update status. Please try again.');
    }
    
    setConfirmModal({ show: false, serialId: null, serialData: null, type: null });
  };

  // Handle confirmation No
  const handleConfirmNo = () => {
    setConfirmModal({ show: false, serialId: null, serialData: null, type: null });
  };

  // Handle status button click
  const handleStatusClick = (serial) => {
    const currentStatus = serialStatuses[serial.id] || serial.status;
    
    if (currentStatus === 'prepare') {
      handlePrepareClick(serial);
    }
  };

  // Get status display info
  const getStatusInfo = (serial) => {
    const status = serialStatuses[serial.id] || serial.status;
    if (!status || status === 'pending') return null;
    return statusFlow.find(opt => opt.value === status);
  };

  // Check if status is final (For Delivery)
  const isFinalStatus = (serial) => {
    const status = serialStatuses[serial.id] || serial.status;
    return status === 'for_delivery';
  };

  // Filter and Sort Logic
  const filteredAndSortedSerials = useMemo(() => {
    let result = [...serials];

    // 1. Search Filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          (item.title && item.title.toLowerCase().includes(lowerQuery)) ||
          (item.issn && item.issn.toLowerCase().includes(lowerQuery))
      );
    }

    // 2. Sort Logic (by delivery date)
    result.sort((a, b) => {
      const dateA = a.dateDelivered ? new Date(a.dateDelivered) : new Date(0);
      const dateB = b.dateDelivered ? new Date(b.dateDelivered) : new Date(0);
      
      return isSortNewest ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [serials, searchQuery, isSortNewest]);

  // Paginated serials
  const paginatedSerials = useMemo(() => {
    const startIdx = (page - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    return filteredAndSortedSerials.slice(startIdx, endIdx);
  }, [filteredAndSortedSerials, page, itemsPerPage]);

  // Update total pages when filtered data changes
  useEffect(() => {
    setTotalPages(Math.max(1, Math.ceil(filteredAndSortedSerials.length / itemsPerPage)));
    setPage(1); // Reset to first page on filter change
  }, [filteredAndSortedSerials.length]);


  return (
    <div style={{ display: "flex", background: "#F5F6FA", minHeight: "100vh" }}>
      <Sidebar active={activeSidebar} setActive={setActiveSidebar} />
      <div style={{ flex: 1 }}>
        <TopBar />
        {activeSidebar === 2 && (
          <div style={{ padding: "40px 60px" }}>
            <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 32, color: "#222" }}>
              Serial Subscription Period
            </h1>
            
            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                boxShadow: "0 2px 8px #0001",
                padding: "0 0 24px 0",
              }}
            >
              <div
                style={{
                  background: "#004A98",
                  borderTopLeftRadius: 12,
                  borderTopRightRadius: 12,
                  height: 32,
                  marginBottom: 0,
                }}
              ></div>

              {/* === SEARCH BAR === */}
              <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                 {/* Search Input */}
                 <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <IoSearchOutline style={{ position: 'absolute', left: 12, color: '#666', fontSize: 18 }} />
                    <input 
                      type="text" 
                      placeholder="Search Title or ISSN..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
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
                  {/* Refresh Button */}
                  <button
                    onClick={fetchSerials}
                    disabled={loading}
                    style={{
                      background: '#004A98',
                      border: 'none',
                      color: '#fff',
                      padding: '10px 20px',
                      borderRadius: 6,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: 14,
                      fontWeight: 500,
                      opacity: loading ? 0.7 : 1,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {loading ? 'Loading...' : 'Refresh'}
                  </button>
              </div>

              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 16,
                  marginTop: 0,
                }}
              >
                <thead>
                  <tr style={{ color: "#222", fontWeight: 700, borderBottom: "1px solid #eee" }}>
                    <th style={{ padding: "12px 8px", textAlign: "center", width: 120 }}>ISSN</th>
                    <th style={{ padding: "12px 8px", textAlign: "left", width: 380 }}>Title</th>
                    <th style={{ padding: "12px 8px", textAlign: "center", width: 150 }}>Delivery Date</th>
                    <th style={{ padding: "12px 8px", textAlign: "center", width: 180 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: "center", padding: "40px", color: "#888" }}>
                        Loading serials...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: "center", padding: "40px", color: "#dc3545" }}>
                        {error}
                        <button 
                          onClick={fetchSerials}
                          style={{ marginLeft: 16, padding: '8px 16px', background: '#004A98', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                        >
                          Retry
                        </button>
                      </td>
                    </tr>
                  ) : paginatedSerials.length > 0 ? (
                    paginatedSerials.map((row, idx) => (
                      <tr
                        key={row.id}
                        style={{
                          background: idx % 2 === 0 ? "#f9f9f9" : "#fff",
                          borderBottom: '1px solid #f0f0f0'
                        }}
                      >
                        <td style={{ padding: "16px 8px", textAlign: "center", width: 120, fontWeight: 700, color: "#004A98" }}>
                          {row.issn}
                        </td>
                        <td style={{ padding: "16px 8px", textAlign: "left", width: 380 }}>{row.title}</td>
                        <td style={{ padding: "16px 8px", textAlign: "center", width: 150, color: "#555" }}>
                          {row.dateDelivered ? new Date(row.dateDelivered).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                        </td>
                        <td style={{ padding: "16px 8px", textAlign: "center", width: 180, position: 'relative' }}>
                          {getStatusInfo(row) ? (
                            <button
                              onClick={() => handleStatusClick(row)}
                              disabled={isFinalStatus(row)}
                              style={{
                                padding: '8px 16px',
                                borderRadius: 20,
                                border: 'none',
                                background: getStatusInfo(row).color,
                                color: getStatusInfo(row).value === 'preparing' ? '#333' : '#fff',
                                cursor: isFinalStatus(row) ? 'default' : 'pointer',
                                fontSize: 13,
                                fontWeight: 600,
                                transition: 'all 0.2s',
                                opacity: isFinalStatus(row) ? 1 : 0.9,
                              }}
                              onMouseOver={(e) => !isFinalStatus(row) && (e.target.style.opacity = '1')}
                              onMouseOut={(e) => !isFinalStatus(row) && (e.target.style.opacity = '0.9')}
                              title={isFinalStatus(row) ? 'Final status reached' : 'Click to advance status'}
                            >
                              {getStatusInfo(row).label}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAcceptClick(row)}
                              style={{
                                padding: '8px 16px',
                                borderRadius: 6,
                                border: 'none',
                                background: '#28a745',
                                color: '#fff',
                                cursor: 'pointer',
                                fontSize: 13,
                                fontWeight: 600,
                                transition: 'all 0.2s',
                              }}
                              onMouseOver={(e) => e.target.style.background = '#218838'}
                              onMouseOut={(e) => e.target.style.background = '#28a745'}
                            >
                              Accept
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ textAlign: "center", padding: "40px", color: "#888" }}>
                        {searchQuery ? `No serials found matching "${searchQuery}"` : 'No serials assigned to you yet.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, padding: "0 24px" }}>
                <Pagination current={page} total={totalPages} onPage={setPage} />
                <span style={{ color: "#444", fontSize: 15 }}>
                  Showing {paginatedSerials.length} of {filteredAndSortedSerials.length} results
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}
          onClick={handleConfirmNo}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: '32px 40px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              textAlign: 'center',
              maxWidth: 400,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: 20, color: '#222' }}>
              {confirmModal.type === 'accept' ? 'Confirm Acceptance' : 'Confirm For Delivery'}
            </h3>
            <p style={{ margin: '0 0 24px', fontSize: 15, color: '#666' }}>
              {confirmModal.type === 'accept' 
                ? 'Are you sure you want to accept this serial subscription?' 
                : 'Are you sure this serial is ready for delivery?'}
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <button
                onClick={handleConfirmYes}
                style={{
                  padding: '10px 32px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#28a745',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => e.target.style.background = '#218838'}
                onMouseOut={(e) => e.target.style.background = '#28a745'}
              >
                Yes
              </button>
              <button
                onClick={handleConfirmNo}
                style={{
                  padding: '10px 32px',
                  borderRadius: 6,
                  border: '1px solid #dc3545',
                  background: '#fff',
                  color: '#dc3545',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => { e.target.style.background = '#dc3545'; e.target.style.color = '#fff'; }}
                onMouseOut={(e) => { e.target.style.background = '#fff'; e.target.style.color = '#dc3545'; }}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard_Supplier_ListofSerial;