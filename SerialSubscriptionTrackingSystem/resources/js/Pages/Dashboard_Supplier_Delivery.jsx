import React, { useState, useMemo, useEffect } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import axios from "axios";
import { GoHomeFill } from "react-icons/go";
import { HiUsers } from "react-icons/hi";
import { IoSearchOutline } from "react-icons/io5";
import { VscAccount } from "react-icons/vsc";
import { BsFillChatTextFill } from "react-icons/bs";
import { BiSortAlt2 } from "react-icons/bi";
import { FaTruckFast } from "react-icons/fa6";
import SerialsNotification from "@/Components/SerialsNotification";
import { MdRefresh } from "react-icons/md";

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
        <SerialsNotification />

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

function Dashboard_Supplier_Delivery() {
  const { auth } = usePage().props;
  const [activeSidebar, setActiveSidebar] = useState(3);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState([]);

  const itemsPerPage = 10;

  // Fetch issues on component mount
  useEffect(() => {
    if (auth?.user?.name) {
      fetchIssues();
      // Auto-refresh every 30 seconds to keep data synchronized
      const interval = setInterval(() => {
        fetchIssues();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [auth?.user?.name]);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/serial-issues/supplier', {
        params: { supplier_name: auth?.user?.name || '' }
      });
      if (response.data.success) {
        const fetchedIssues = response.data.issues || [];
        // Map issue status directly to delivery display status
        const issuesWithDeliveryStatus = fetchedIssues.map(issue => {
          let deliveryStatus = 'undelivered';
          
          // Determine delivery status based on issue status and dates
          if (issue.status === 'pending') {
            deliveryStatus = 'undelivered'; // Pending = Undelivered
          } else if (['prepare', 'for_delivery', 'received'].includes(issue.status)) {
            deliveryStatus = 'ongoing'; // Preparing/For Delivery/Received = Ongoing
          } else if (issue.status === 'for_return') {
            deliveryStatus = 'for_return'; // For Return = For Return
          } else if (issue.status === 'delivered') {
            // Check if delivered on time or late
            const deliveredDate = issue.delivered_date ? new Date(issue.delivered_date) : null;
            const expectedDate = issue.expected_delivery_date ? new Date(issue.expected_delivery_date) : null;
            
            if (deliveredDate && expectedDate) {
              // Compare only the dates, not the time
              const deliveredDateOnly = new Date(deliveredDate.getFullYear(), deliveredDate.getMonth(), deliveredDate.getDate());
              const expectedDateOnly = new Date(expectedDate.getFullYear(), expectedDate.getMonth(), expectedDate.getDate());
              
              if (deliveredDateOnly > expectedDateOnly) {
                deliveryStatus = 'late'; // Delivered but exceeded expected date
              } else {
                deliveryStatus = 'delivered'; // Delivered on time or before
              }
            } else {
              deliveryStatus = 'delivered'; // Delivered (no expected date to compare)
            }
          }
          
          return {
            ...issue,
            deliveryStatus,
          };
        });
        setIssues(issuesWithDeliveryStatus);
      }
    } catch (error) {
      console.error('Error fetching issues:', error);
    } finally {
      setLoading(false);
    }
  };

  // Determine status - count statuses
  const lateCount = issues.filter(i => i.deliveryStatus === 'late').length;
  const ongoingCount = issues.filter(i => i.deliveryStatus === 'ongoing').length;
  const forReturnCount = issues.filter(i => i.deliveryStatus === 'for_return').length;
  const deliveredCount = issues.filter(i => i.deliveryStatus === 'delivered').length;
  const undeliveredCount = issues.filter(i => i.deliveryStatus === 'undelivered').length;

  // Filter data based on dropdown selection
  const filteredIssues = useMemo(() => {
    let result = issues.filter(item => {
      if (statusFilter === 'all') return true;
      return item.deliveryStatus === statusFilter;
    });

    // Search filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          (item.serial_title?.toLowerCase() || '').includes(lowerQuery) ||
          (item.issue_number?.toLowerCase() || '').includes(lowerQuery)
      );
    }

    // Sort by status order: For Return, Late, Ongoing, Undelivered, Delivered
    const statusOrder = { for_return: 0, late: 1, ongoing: 2, undelivered: 3, delivered: 4 };
    result.sort((a, b) => statusOrder[a.deliveryStatus] - statusOrder[b.deliveryStatus]);

    return result;
  }, [statusFilter, searchQuery, issues]);

  const totalPages = Math.max(1, Math.ceil(filteredIssues.length / itemsPerPage));
  const paginatedIssues = filteredIssues.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  // Status badge component
  const StatusBadge = ({ status }) => {
    const colors = {
      for_return: { bg: '#f8d7da', text: '#721c24', border: '#f5c6cb' },
      late: { bg: '#fff3cd', text: '#856404', border: '#ffeaa7' },
      ongoing: { bg: '#d1ecf1', text: '#0c5460', border: '#bee5eb' },
      delivered: { bg: '#d4edda', text: '#155724', border: '#c3e6cb' },
      undelivered: { bg: '#f8f9fa', text: '#6c757d', border: '#e9ecef' },
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
        {status === 'for_return' ? 'For Return' : status}
      </span>
    );
  };

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
                    placeholder="Search Serial or Issue No..." 
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

                {/* Status Filter Dropdown and Refresh */}
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
                      minWidth: 200,
                    }}
                  >
                    <option value="all">All Status ({issues.length})</option>
                    <option value="for_return">For Return ({forReturnCount})</option>
                    <option value="late">Late ({lateCount})</option>
                    <option value="ongoing">Ongoing ({ongoingCount})</option>
                    <option value="undelivered">Undelivered ({undeliveredCount})</option>
                    <option value="delivered">Delivered ({deliveredCount})</option>
                  </select>
                  <button
                    onClick={fetchIssues}
                    disabled={loading}
                    style={{
                      padding: '10px 16px',
                      borderRadius: 8,
                      border: '1px solid #ddd',
                      background: '#f9f9f9',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#004A98',
                      opacity: loading ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <MdRefresh style={{ transform: loading ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} /> Refresh
                  </button>
                </div>
              </div>

              {/* Table */}
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
                <thead>
                  <tr style={{ color: "#222", fontWeight: 700, borderBottom: '1px solid #eee' }}>
                    <th style={{ padding: "12px 8px", textAlign: "center", width: 60 }}>NO.</th>
                    <th style={{ padding: "12px 8px", textAlign: "left" }}>Serial Title</th>
                    <th style={{ padding: "12px 8px", textAlign: "center" }}>Issue No.</th>
                    <th style={{ padding: "12px 8px", textAlign: "center" }}>Expected Delivery</th>
                    <th style={{ padding: "12px 8px", textAlign: "center" }}>Delivered Date</th>
                    <th style={{ padding: "12px 8px", textAlign: "center" }}>Amount (₱)</th>
                    <th style={{ padding: "12px 8px", textAlign: "center" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: '#666' }}>
                        Loading delivery data...
                      </td>
                    </tr>
                  ) : paginatedIssues.length > 0 ? (
                    paginatedIssues.map((row, idx) => (
                      <tr key={row.id} style={{ background: idx % 2 === 0 ? "#f9f9f9" : "#fff", borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: "14px 8px", textAlign: "center", fontWeight: 500 }}>{(page - 1) * itemsPerPage + idx + 1}</td>
                        <td style={{ padding: "14px 8px", textAlign: "left", fontWeight: 600, color: "#004A98" }}>{row.serial_title}</td>
                        <td style={{ padding: "14px 8px", textAlign: "center", fontWeight: 500 }}>{row.issue_number}</td>
                        <td style={{ padding: "14px 8px", textAlign: "center", color: "#555" }}>
                          {row.expected_delivery_date 
                            ? new Date(row.expected_delivery_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                            : '-'}
                        </td>
                        <td style={{ padding: "14px 8px", textAlign: "center", color: "#555" }}>
                          {row.delivered_date 
                            ? new Date(row.delivered_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                            : '-'}
                        </td>
                        <td style={{ padding: "14px 8px", textAlign: "center", fontWeight: 600, color: "#004A98" }}>
                          {row.cost ? `₱${parseFloat(row.cost).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '-'}
                        </td>
                        <td style={{ padding: "14px 8px", textAlign: "center" }}><StatusBadge status={row.deliveryStatus} /></td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "#888" }}>
                        No issues found {searchQuery && `matching "${searchQuery}"`}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px" }}>
                <Pagination current={page} total={totalPages} onPage={setPage} />
                <span style={{ color: "#444", fontSize: 15 }}>
                  Showing {filteredIssues.length} results
                </span>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard_Supplier_Delivery;
