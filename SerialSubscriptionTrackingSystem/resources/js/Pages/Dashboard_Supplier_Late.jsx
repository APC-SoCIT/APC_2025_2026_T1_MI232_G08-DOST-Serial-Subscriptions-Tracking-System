import React, { useState, useMemo } from "react";
import { Link } from "@inertiajs/react";
import { GoHomeFill } from "react-icons/go";
import { HiUsers } from "react-icons/hi";
import { FaTruckFast } from "react-icons/fa6";
import { TbTruckOff } from "react-icons/tb";
import { FaTruckLoading } from "react-icons/fa";
import { MdOutlineNotificationsActive } from "react-icons/md";
import { VscAccount } from "react-icons/vsc";
import { BsFillChatTextFill } from "react-icons/bs";
import { IoSearchOutline } from "react-icons/io5";
import { BiSortAlt2 } from "react-icons/bi";

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
      <h2 style={{ color: '#0B4DA1', fontWeight: 600, fontSize: 20 }}>Serial Subscription Tracking System</h2>

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

const serialsData = [
  {
    no: 1,
    serial_title: "Time Magazine",
    purchase_order_no: "PO-2025-0001",
    total_issues_delivered: "52",
    no_of_late_issues: "4",
    remarks: "Jan-Feb issues delivered in March",
    date: new Date("2025-01-15"),
  },
  {
    no: 2,
    serial_title: "National Geographic",
    purchase_order_no: "PO-2025-0002",
    total_issues_delivered: "12",
    no_of_late_issues: "0",
    remarks: "All issues on time",
    date: new Date("2025-01-10"),
  },
  {
    no: 3,
    serial_title: "IEEE Spectrum",
    purchase_order_no: "PO-2025-0003",
    total_issues_delivered: "12",
    no_of_late_issues: "0",
    remarks: "All issues on time",
    date: new Date("2025-01-05"),
  },
  {
    no: 4,
    serial_title: "The Economist",
    purchase_order_no: "PO-2025-0004",
    total_issues_delivered: "51",
    no_of_late_issues: "3",
    remarks: "Issues delivered one month late",
    date: new Date("2024-12-28"),
  },
  {
    no: 5,
    serial_title: "Philippines Journal of Science",
    purchase_order_no: "PO-2025-0005",
    total_issues_delivered: "4",
    no_of_late_issues: "0",
    remarks: "All issues on time",
    date: new Date("2024-12-20"),
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

function Dashbooard_Supplier_Late() {
  const [activeSidebar, setActiveSidebar] = useState(3);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSortNewest, setIsSortNewest] = useState(true);
  const totalPages = 10;

  const filteredAndSortedSerials = useMemo(() => {
    let filtered = serialsData.filter((serial) => {
      const query = searchQuery.toLowerCase();
      return (
        serial.serial_title.toLowerCase().includes(query) ||
        serial.purchase_order_no.toLowerCase().includes(query) ||
        serial.remarks.toLowerCase().includes(query)
      );
    });

    filtered.sort((a, b) => {
      if (isSortNewest) {
        return b.date - a.date;
      } else {
        return a.date - b.date;
      }
    });

    return filtered;
  }, [searchQuery, isSortNewest]);

  return (
    <div style={{ display: "flex", background: "#F5F6FA", minHeight: "100vh" }}>
      <Sidebar active={activeSidebar} setActive={setActiveSidebar} />
      <div style={{ flex: 1 }}>
        <TopBar />
        {activeSidebar === 3 && (
          <div style={{ padding: "40px 60px" }}>
            <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 32, color: "#222" }}>
              Late Deliveries
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

              {/* === SEARCH AND SORT CONTROLS === */}
              <div style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {/* Search */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <IoSearchOutline style={{ position: 'absolute', left: 12, color: '#666', fontSize: 18 }} />
                  <input 
                    type="text" 
                    placeholder="Search Serial or PO No..." 
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

                {/* Sort */}
                <button 
                  onClick={() => setIsSortNewest(!isSortNewest)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 16px',
                    borderRadius: 8,
                    border: '1px solid #004A98',
                    background: isSortNewest ? '#004A98' : '#fff',
                    color: isSortNewest ? '#fff' : '#004A98',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                >
                  <BiSortAlt2 size={18} />
                  {isSortNewest ? 'New' : 'Old'}
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
                  <tr style={{ color: "#222", fontWeight: 700 }}>
                    <th style={{ padding: "12px 8px", textAlign: "center", width: 60 }}>NO.</th>
                    <th style={{ padding: "12px 8px", textAlign: "center", width: 120 }}>Serial Title</th>
                    <th style={{ padding: "12px 8px", textAlign: "left", width: 340 }}>Purchase Order No.</th>
                    <th style={{ padding: "12px 8px", textAlign: "center", width: 120 }}>Total Issues Delivered</th>
                    <th style={{ padding: "12px 8px", textAlign: "center", width: 120 }}>No. of Late Issues</th>
                    <th style={{ padding: "12px 8px", textAlign: "center", width: 120 }}>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedSerials.length > 0 ? (
                    filteredAndSortedSerials.map((row, idx) => (
                      <tr
                        key={row.no}
                        style={{
                          background: idx % 2 === 0 ? "#f5f5f5" : "#fff",
                        }}
                      >
                        <td style={{ padding: "12px 8px", textAlign: "center", width: 60, fontWeight: 500 }}>
                          {row.no}
                        </td>
                        <td style={{ padding: "12px 8px", textAlign: "center", width: 340, fontWeight: 700 }}>
                          {row.serial_title}
                        </td>
                        <td style={{ padding: "12px 8px", textAlign: "left", width: 120 }}>{row.purchase_order_no}</td>
                        <td style={{ padding: "12px 8px", textAlign: "center", width: 120 }}>{row.total_issues_delivered}</td>
                        <td style={{ padding: "12px 8px", textAlign: "center", width: 120 }}>{row.no_of_late_issues}</td>
                        <td style={{ padding: "12px 8px", textAlign: "center", width: 340, fontWeight: 700 }}>{row.remarks}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ padding: "32px", textAlign: "center", color: "#999" }}>
                        No results found for "{searchQuery}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, padding: "0 16px" }}>
                <Pagination current={page} total={totalPages} onPage={setPage} />
                <span style={{ color: "#444", fontSize: 15 }}>
                  Showing {filteredAndSortedSerials.length} of {totalPages * serialsData.length} results
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashbooard_Supplier_Late;