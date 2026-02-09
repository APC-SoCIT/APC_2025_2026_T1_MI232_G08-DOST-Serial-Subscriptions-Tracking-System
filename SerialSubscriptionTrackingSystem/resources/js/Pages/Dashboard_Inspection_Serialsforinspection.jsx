import InspectionLayout from "@/Layouts/InspectionLayout";
import { FaClipboardCheck } from "react-icons/fa";
import { MdSearch, MdFilterList } from "react-icons/md";
import { useState, useEffect } from "react";
import { usePage } from "@inertiajs/react";
import axios from "axios";

export default function InspectionSerialsForInspection() {
  // Get authenticated user
  const { auth } = usePage().props;
  const user = auth?.user;

  // ===================== STATE =====================
  const [showModal, setShowModal] = useState(false);
  const [selectedSerial, setSelectedSerial] = useState(null);
  const [condition, setCondition] = useState("Good");
  const [inspectorName, setInspectorName] = useState(user?.name || "");
  const [remark, setRemark] = useState("");
  const [otherDescription, setOtherDescription] = useState("");
  const [checklist, setChecklist] = useState({
    missingPages: false,
    tornPages: false,
    waterDamage: false,
    misprint: false,
    other: false,
  });

  // API data state
  const [serialsForInspection, setSerialsForInspection] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');
  const [showFilter, setShowFilter] = useState(false);

  const checklistLabels = {
    missingPages: "Missing Pages",
    tornPages: "Torn Pages",
    waterDamage: "Water Damage",
    misprint: "Misprint",
    other: "Others",
  };

  // Fetch serials for inspection from API
  useEffect(() => {
    fetchSerialsForInspection();
  }, []);

  const fetchSerialsForInspection = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/subscriptions/inspection-serials');
      
      if (response.data.success) {
        setSerialsForInspection(response.data.serials || []);
      }
    } catch (err) {
      console.error('Error fetching serials for inspection:', err);
      setError('Failed to load inspection data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter data
  const filteredData = serialsForInspection.filter(item => {
    const matchesSearch = 
      (item.serialTitle && item.serialTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.supplierName && item.supplierName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.issn && item.issn.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = 
      filter === 'All' || 
      (filter === 'Pending' && item.inspection_status === 'pending') ||
      (filter === 'Inspected' && item.inspection_status === 'inspected') ||
      (filter === 'For Return' && item.inspection_status === 'for_return');
    
    return matchesSearch && matchesFilter;
  });

  // Calculate totals
  const totalPending = serialsForInspection.filter(item => item.inspection_status === 'pending').length;
  const totalInspected = serialsForInspection.filter(item => item.inspection_status === 'inspected').length;
  const totalForReturn = serialsForInspection.filter(item => item.inspection_status === 'for_return').length;

  // ===================== FUNCTIONS =====================
  const openModal = (serial) => {
    setSelectedSerial(serial);
    setInspectorName(user?.name || "");
    setRemark("");
    setOtherDescription("");
    setChecklist({
      missingPages: false,
      tornPages: false,
      waterDamage: false,
      misprint: false,
      other: false,
    });
    setCondition("Good");
    setShowModal(true);
  };

  const submitInspection = async () => {
    if (!inspectorName.trim()) {
      alert("Inspector name is required.");
      return;
    }

    try {
      setSubmitting(true);
      
      const response = await axios.post(`/api/subscriptions/${selectedSerial.subscription_id}/submit-inspection`, {
        serial_issn: selectedSerial.issn,
        inspector_name: inspectorName,
        condition: condition,
        checklist: checklist,
        other_description: otherDescription,
        remarks: remark,
      });

      if (response.data.success) {
        // Update local state
        setSerialsForInspection((prev) =>
          prev.map((s) =>
            s.id === selectedSerial.id 
              ? { 
                  ...s, 
                  inspection_status: response.data.inspection_status,
                  inspector_name: inspectorName,
                  condition: condition,
                  inspection_date: response.data.inspection_date,
                }
              : s
          )
        );
        alert(`Inspection submitted successfully by ${inspectorName}`);
        setShowModal(false);
      } else {
        alert('Failed to submit inspection. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting inspection:', err);
      alert('Failed to submit inspection. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Get status badge style
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return { background: '#ffc107', color: '#000' };
      case 'inspected':
        return { background: '#28a745', color: '#fff' };
      case 'for_return':
        return { background: '#dc3545', color: '#fff' };
      default:
        return { background: '#6c757d', color: '#fff' };
    }
  };

  // Format status display text
  const formatStatus = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'inspected':
        return 'Inspected';
      case 'for_return':
        return 'For Return';
      default:
        return status;
    }
  };

  // ===================== UI =====================
  return (
    <InspectionLayout title="Serials for Inspection">
      <div style={{ background: '#f0f4f8', minHeight: 'calc(100vh - 120px)' }}>
        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 30 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: 14, color: '#666', margin: '0 0 10px 0' }}>Total Serials</h3>
            <p style={{ fontSize: 28, fontWeight: 'bold', margin: 0, color: '#004A98' }}>{serialsForInspection.length}</p>
          </div>
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: 14, color: '#666', margin: '0 0 10px 0' }}>Pending Inspection</h3>
            <p style={{ fontSize: 28, fontWeight: 'bold', margin: 0, color: '#ffc107' }}>{totalPending}</p>
          </div>
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: 14, color: '#666', margin: '0 0 10px 0' }}>Inspected</h3>
            <p style={{ fontSize: 28, fontWeight: 'bold', margin: 0, color: '#28a745' }}>{totalInspected}</p>
          </div>
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: 14, color: '#666', margin: '0 0 10px 0' }}>For Return</h3>
            <p style={{ fontSize: 28, fontWeight: 'bold', margin: 0, color: '#dc3545' }}>{totalForReturn}</p>
          </div>
        </div>

        {/* Main Table Card */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ color: '#004A98', margin: '0 0 8px 0', fontSize: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaClipboardCheck /> Serials for Inspection
              </h2>
              <p style={{ color: '#666', margin: 0, fontSize: 14 }}>Inspect received serials for quality control</p>
            </div>
            <button
              onClick={fetchSerialsForInspection}
              disabled={loading}
              style={{
                background: '#004A98',
                border: 'none',
                color: '#fff',
                padding: '12px 20px',
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

          {/* Search and Filter */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <MdSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
              <input
                type="text"
                placeholder="Search serial title, supplier, or ISSN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  borderRadius: 6,
                  border: '1px solid #ddd',
                  fontSize: 14,
                }}
              />
            </div>

            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowFilter(!showFilter)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 20px',
                  background: '#f8f9fa',
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                <MdFilterList /> Filter
              </button>
              
              {showFilter && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  background: '#fff',
                  borderRadius: 6,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  padding: 16,
                  width: 180,
                  zIndex: 10,
                  marginTop: 8,
                }}>
                  <p style={{ margin: '0 0 12px 0', fontWeight: 500, fontSize: 14 }}>Filter Status</p>
                  {['All', 'Pending', 'Inspected', 'For Return'].map(option => (
                    <label key={option} style={{ display: 'block', marginBottom: 10, cursor: 'pointer', fontSize: 14 }}>
                      <input
                        type="radio"
                        checked={filter === option}
                        onChange={() => {
                          setFilter(option);
                          setShowFilter(false);
                        }}
                        style={{ marginRight: 8 }}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ 
                  background: 'linear-gradient(90deg, #004A98, #0062f4)',
                  color: '#fff'
                }}>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>ISSN</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Serial Title</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Supplier</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600, fontSize: 14 }}>Received Date</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600, fontSize: 14 }}>Status</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600, fontSize: 14 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                      Loading inspection data...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#dc3545' }}>
                      {error}
                      <button 
                        onClick={fetchSerialsForInspection}
                        style={{ marginLeft: 16, padding: '8px 16px', background: '#004A98', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                      >
                        Retry
                      </button>
                    </td>
                  </tr>
                ) : filteredData.length > 0 ? (
                  filteredData.map((s, index) => (
                    <tr 
                      key={s.id} 
                      style={{ 
                        borderBottom: '1px solid #eee',
                        background: index % 2 === 0 ? '#fff' : '#f9f9f9'
                      }}
                    >
                      <td style={{ padding: '16px', fontWeight: 500 }}>{s.issn}</td>
                      <td style={{ padding: '16px' }}>{s.serialTitle}</td>
                      <td style={{ padding: '16px' }}>{s.supplierName}</td>
                      <td style={{ padding: '16px', textAlign: 'center', color: '#555' }}>
                        {s.receivedDate 
                          ? new Date(s.receivedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                          : '-'
                        }
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '6px 16px',
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 600,
                            ...getStatusBadge(s.inspection_status),
                          }}
                        >
                          {formatStatus(s.inspection_status)}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        {s.inspection_status === 'pending' ? (
                          <button
                            onClick={() => openModal(s)}
                            style={{
                              padding: '8px 20px',
                              borderRadius: 6,
                              border: 'none',
                              background: '#004A98',
                              color: '#fff',
                              cursor: 'pointer',
                              fontSize: 13,
                              fontWeight: 600,
                              transition: 'all 0.2s',
                            }}
                            onMouseOver={(e) => e.target.style.background = '#003875'}
                            onMouseOut={(e) => e.target.style.background = '#004A98'}
                          >
                            Inspect
                          </button>
                        ) : (
                          <span style={{ color: '#666', fontSize: 13 }}>
                            {s.inspector_name ? `By: ${s.inspector_name}` : 'Completed'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                      {searchTerm || filter !== 'All' 
                        ? 'No serials match your search/filter criteria.' 
                        : 'No serials available for inspection. Serials will appear here once they are marked as received by GSPS.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-full max-w-lg">
              <h3 className="text-lg font-semibold mb-4">
                Inspection – {selectedSerial.serialTitle}
              </h3>
              <p className="text-sm text-gray-500 mb-4">ISSN: {selectedSerial.issn}</p>

              <div className="w-full border p-2 rounded mb-4 bg-gray-100 text-gray-700">
                <span className="text-sm text-gray-500">Inspector: </span>
                {inspectorName}
              </div>

              <select
                className="w-full border p-2 rounded mb-4"
                value={condition}
                onChange={(e) => {
                  const newCondition = e.target.value;
                  setCondition(newCondition);
                  // Reset checklist when switching to Good
                  if (newCondition === "Good") {
                    setChecklist({
                      missingPages: false,
                      tornPages: false,
                      waterDamage: false,
                      misprint: false,
                      other: false,
                    });
                    setOtherDescription("");
                  }
                }}
              >
                <option>Good</option>
                <option>For Return</option>
              </select>

              {condition === "For Return" && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {Object.keys(checklist).map((key) => (
                    <label 
                      key={key} 
                      className="flex gap-2 text-sm cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checklist[key]}
                        onChange={(e) =>
                          setChecklist({ ...checklist, [key]: e.target.checked })
                        }
                      />
                      {checklistLabels[key]}
                    </label>
                  ))}
                </div>
              )}

              {condition === "For Return" && checklist.other && (
                <input
                  type="text"
                  placeholder="Please specify"
                  className="w-full border p-2 rounded mb-4 text-sm"
                  value={otherDescription}
                  onChange={(e) => setOtherDescription(e.target.value)}
                />
              )}

              <textarea
                placeholder="Remarks"
                className="w-full border p-2 rounded mb-4 text-sm"
                rows="4"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 rounded"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={submitInspection}
                  className={`px-4 py-2 rounded text-white ${condition === 'For Return' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                  disabled={submitting}
                >
                  {submitting ? 'Processing...' : (condition === 'For Return' ? 'For Return' : 'Submit')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </InspectionLayout>
  );
}
