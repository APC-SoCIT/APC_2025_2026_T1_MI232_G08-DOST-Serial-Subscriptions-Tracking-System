import InspectionLayout from "@/Layouts/InspectionLayout";
import { FaClipboardCheck, FaHistory } from "react-icons/fa";
import { MdSearch, MdFilterList, MdCloudUpload, MdClose, MdImage, MdVisibility } from "react-icons/md";
import { useState, useEffect, useRef } from "react";
import { usePage } from "@inertiajs/react";
import axios from "axios";
import Swal from 'sweetalert2';
import 'animate.css';
import ProcessMovementHistory from "@/Components/ProcessMovementHistory";

export default function InspectionSerialsForInspection() {
  // Get authenticated user
  const { auth } = usePage().props;
  const user = auth?.user;

  // ===================== STATE =====================
  const [showModal, setShowModal] = useState(false);
  const [selectedSerial, setSelectedSerial] = useState(null);
  const [condition, setCondition] = useState("Acceptable");
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
  
  // Attachment state
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const fileInputRef = useRef(null);
  
  // Re-upload state for view modal
  const [reuploadFile, setReuploadFile] = useState(null);
  const [reuploadPreview, setReuploadPreview] = useState(null);
  const [reuploadUploading, setReuploadUploading] = useState(false);
  const reuploadFileInputRef = useRef(null);
  
  // Search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');
  const [showFilter, setShowFilter] = useState(false);
  
  // View modal and history modal state
  const [viewModal, setViewModal] = useState({ show: false, item: null });
  const [historyModal, setHistoryModal] = useState({ open: false, serial: null });

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
    setCondition("Acceptable");
    setAttachmentFile(null);
    setAttachmentPreview(null);
    setShowModal(true);
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check if it's an image or PDF
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        Swal.fire({ title: 'Please select an image (JPG, PNG) or PDF file', icon: 'warning', confirmButtonColor: '#0062f4', showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' }, hideClass: { popup: 'animate__animated animate__fadeOutDown animate__faster' } });
        return;
      }
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        Swal.fire({ title: 'File size must be less than 10MB', icon: 'warning', confirmButtonColor: '#0062f4', showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' }, hideClass: { popup: 'animate__animated animate__fadeOutDown animate__faster' } });
        return;
      }
      setAttachmentFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachmentPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove attachment
  const handleRemoveAttachment = () => {
    setAttachmentFile(null);
    setAttachmentPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const submitInspection = async () => {
    if (!inspectorName.trim()) {
      Swal.fire({ title: 'Inspector name is required.', icon: 'warning', confirmButtonColor: '#0062f4', showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' }, hideClass: { popup: 'animate__animated animate__fadeOutDown animate__faster' } });
      return;
    }

    try {
      setSubmitting(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('serial_issn', selectedSerial.issn);
      formData.append('inspector_name', inspectorName);
      formData.append('condition', condition);
      formData.append('checklist', JSON.stringify(checklist));
      formData.append('other_description', otherDescription);
      formData.append('remarks', remark);
      
      if (attachmentFile) {
        formData.append('attachment', attachmentFile);
      }
      
      const response = await axios.post(
        `/api/subscriptions/${selectedSerial.subscription_id}/submit-inspection`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

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
                  attachmentUrl: response.data.attachmentUrl,
                }
              : s
          )
        );
        Swal.fire({ title: `Inspection submitted successfully by ${inspectorName}`, icon: 'success', confirmButtonColor: '#0062f4', showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' }, hideClass: { popup: 'animate__animated animate__fadeOutDown animate__faster' } });
        setShowModal(false);
      } else {
        Swal.fire({ title: 'Failed to submit inspection. Please try again.', icon: 'error', confirmButtonColor: '#0062f4', showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' }, hideClass: { popup: 'animate__animated animate__fadeOutDown animate__faster' } });
      }
    } catch (err) {
      console.error('Error submitting inspection:', err);
      Swal.fire({ title: 'Failed to submit inspection. Please try again.', icon: 'error', confirmButtonColor: '#0062f4', showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' }, hideClass: { popup: 'animate__animated animate__fadeOutDown animate__faster' } });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle re-upload file selection in view modal
  const handleReuploadFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        Swal.fire({ title: 'Please select an image (JPG, PNG) or PDF file', icon: 'warning', confirmButtonColor: '#0062f4', showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' }, hideClass: { popup: 'animate__animated animate__fadeOutDown animate__faster' } });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        Swal.fire({ title: 'File size must be less than 10MB', icon: 'warning', confirmButtonColor: '#0062f4', showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' }, hideClass: { popup: 'animate__animated animate__fadeOutDown animate__faster' } });
        return;
      }
      setReuploadFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReuploadPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle re-upload submission
  const handleReuploadSubmit = async () => {
    if (!reuploadFile || !viewModal.item) return;

    setReuploadUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('serial_issn', viewModal.item.issn);
      formData.append('attachment', reuploadFile);
      
      const response = await axios.post(
        `/api/subscriptions/${viewModal.item.subscription_id}/update-inspection-attachment`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.data.success) {
        // Update local state with new attachment URL
        setSerialsForInspection(prev => prev.map(item => 
          item.id === viewModal.item.id 
            ? { ...item, inspection_attachment: response.data.inspection_attachment }
            : item
        ));
        // Update view modal with new attachment
        setViewModal(prev => ({
          ...prev,
          item: { ...prev.item, inspection_attachment: response.data.inspection_attachment }
        }));
        // Reset re-upload state
        setReuploadFile(null);
        setReuploadPreview(null);
        Swal.fire({ title: 'Inspection image updated successfully!', icon: 'success', confirmButtonColor: '#0062f4', showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' }, hideClass: { popup: 'animate__animated animate__fadeOutDown animate__faster' } });
      } else {
        Swal.fire({ title: 'Failed to update image. Please try again.', icon: 'error', confirmButtonColor: '#0062f4', showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' }, hideClass: { popup: 'animate__animated animate__fadeOutDown animate__faster' } });
      }
    } catch (err) {
      console.error('Error updating inspection attachment:', err);
      Swal.fire({ title: 'Failed to update image. Please try again.', icon: 'error', confirmButtonColor: '#0062f4', showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' }, hideClass: { popup: 'animate__animated animate__fadeOutDown animate__faster' } });
    } finally {
      setReuploadUploading(false);
    }
  };

  // Close view modal and reset re-upload state
  const handleCloseViewModal = () => {
    setViewModal({ show: false, item: null });
    setReuploadFile(null);
    setReuploadPreview(null);
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
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                          {s.inspection_status === 'pending' && (
                            <button
                              onClick={() => openModal(s)}
                              style={{
                                padding: '6px 14px',
                                borderRadius: 6,
                                border: 'none',
                                background: '#004A98',
                                color: '#fff',
                                cursor: 'pointer',
                                fontSize: 12,
                                fontWeight: 600,
                                transition: 'all 0.2s',
                              }}
                              onMouseOver={(e) => e.target.style.background = '#003875'}
                              onMouseOut={(e) => e.target.style.background = '#004A98'}
                            >
                              Inspect
                            </button>
                          )}
                          <button
                            onClick={() => setViewModal({ show: true, item: s })}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 6,
                              border: '1px solid #17a2b8',
                              background: '#f8f9fa',
                              color: '#17a2b8',
                              cursor: 'pointer',
                              fontSize: 12,
                              fontWeight: 500,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              transition: 'all 0.2s',
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.background = '#17a2b8'; e.currentTarget.style.color = '#fff'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = '#f8f9fa'; e.currentTarget.style.color = '#17a2b8'; }}
                            title="View Serial Details"
                          >
                            <MdVisibility size={14} /> View
                          </button>
                          <button
                            onClick={() => setHistoryModal({ open: true, serial: s })}
                            style={{
                              padding: '6px 10px',
                              borderRadius: 6,
                              border: '1px solid #004A98',
                              background: '#f8f9fa',
                              color: '#004A98',
                              cursor: 'pointer',
                              fontSize: 12,
                              fontWeight: 500,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              transition: 'all 0.2s',
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.background = '#004A98'; e.currentTarget.style.color = '#fff'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = '#f8f9fa'; e.currentTarget.style.color = '#004A98'; }}
                            title="View Process Movement History"
                          >
                            <FaHistory size={10} /> History
                          </button>
                        </div>
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
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowModal(false)}
            style={{ animation: 'fadeIn 0.2s ease-out' }}
          >
            <style>{`
              @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
              @keyframes slideIn { from { opacity: 0; transform: scale(0.95) translateY(-10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
            `}</style>
            <div 
              className="bg-white p-6 rounded-xl w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
              style={{ animation: 'slideIn 0.25s ease-out' }}
            >
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
                  // Reset checklist when switching to Acceptable
                  if (newCondition === "Acceptable") {
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
                <option>Acceptable</option>
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

              {/* Attachment Upload Section */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attachment 
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                  style={{ display: 'none' }}
                />
                
                {!attachmentPreview ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                  >
                    <MdCloudUpload className="mx-auto text-4xl text-blue-600 mb-2" />
                    <p className="text-sm font-medium text-gray-700">Click to upload image or PDF</p>
                    <p className="text-xs text-gray-500">JPG, PNG, PDF (max 10MB)</p>
                  </div>
                ) : (
                  <div className="relative inline-block">
                    <img
                      src={attachmentPreview}
                      alt="Preview"
                      className="max-w-full max-h-40 rounded-lg border"
                    />
                    <button
                      onClick={handleRemoveAttachment}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                      type="button"
                    >
                      <MdClose size={16} />
                    </button>
                    <p className="mt-2 text-xs text-green-600 font-medium flex items-center gap-1">
                      <MdImage /> {attachmentFile?.name}
                    </p>
                  </div>
                )}
              </div>

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
                  disabled={submitting || !attachmentFile}
                >
                  {submitting ? 'Processing...' : (condition === 'For Return' ? 'For Return' : 'Submit')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Serial Details Modal */}
        {viewModal.show && viewModal.item && (
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
              animation: 'fadeIn 0.2s ease-out',
            }}
            onClick={() => setViewModal({ show: false, item: null })}
          >
            <style>{`
              @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
              @keyframes slideIn { from { opacity: 0; transform: scale(0.95) translateY(-10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
            `}</style>
            <div
              style={{
                background: '#fff',
                borderRadius: 12,
                padding: '32px 40px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                maxWidth: 700,
                width: '90%',
                maxHeight: '90vh',
                overflow: 'auto',
                animation: 'slideIn 0.25s ease-out',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: 20, color: '#004A98' }}>Serial Details</h3>
                <button
                  onClick={() => setViewModal({ show: false, item: null })}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                  }}
                >
                  <MdClose size={24} color="#666" />
                </button>
              </div>

              {/* Serial Information */}
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ margin: '0 0 16px', fontSize: 16, color: '#333', borderBottom: '2px solid #004A98', paddingBottom: 8 }}>
                  {viewModal.item.serialTitle}
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: 12, color: '#666' }}>ISSN</p>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{viewModal.item.issn || '-'}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: 12, color: '#666' }}>Supplier</p>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{viewModal.item.supplierName || '-'}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: 12, color: '#666' }}>Received Date</p>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>
                      {viewModal.item.receivedDate 
                        ? new Date(viewModal.item.receivedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: 12, color: '#666' }}>Inspection Status</p>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: 12,
                      ...getStatusBadge(viewModal.item.inspection_status),
                      fontSize: 12,
                      fontWeight: 600,
                    }}>
                      {formatStatus(viewModal.item.inspection_status)}
                    </span>
                  </div>
                  {viewModal.item.inspector_name && (
                    <>
                      <div>
                        <p style={{ margin: '0 0 4px', fontSize: 12, color: '#666' }}>Inspector</p>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{viewModal.item.inspector_name}</p>
                      </div>
                      <div>
                        <p style={{ margin: '0 0 4px', fontSize: 12, color: '#666' }}>Inspection Date</p>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>
                          {viewModal.item.inspection_date 
                            ? new Date(viewModal.item.inspection_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                            : '-'}
                        </p>
                      </div>
                      <div>
                        <p style={{ margin: '0 0 4px', fontSize: 12, color: '#666' }}>Condition</p>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{viewModal.item.condition || '-'}</p>
                      </div>
                    </>
                  )}
                  {viewModal.item.inspection_remarks && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <p style={{ margin: '0 0 4px', fontSize: 12, color: '#666' }}>Remarks</p>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{viewModal.item.inspection_remarks}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Attachments Section */}
              <div>
                <h4 style={{ margin: '0 0 16px', fontSize: 16, color: '#333', borderBottom: '2px solid #004A98', paddingBottom: 8 }}>
                  Attachments
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {/* Receipt Attachment */}
                  <div>
                    <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 500, color: '#333' }}>Receipt Image (from GSPS)</p>
                    {viewModal.item.attachmentUrl ? (
                      <div style={{ textAlign: 'center' }}>
                        <img
                          src={viewModal.item.attachmentUrl}
                          alt="Receipt Attachment"
                          style={{
                            maxWidth: '100%',
                            maxHeight: 200,
                            borderRadius: 8,
                            border: '1px solid #ddd',
                            cursor: 'pointer',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(viewModal.item.attachmentUrl, '_blank');
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                            if (e.target.nextSibling.nextSibling) e.target.nextSibling.nextSibling.style.display = 'none';
                          }}
                        />
                        <div style={{ display: 'none', padding: 15, background: '#f8f9fa', borderRadius: 8 }}>
                          <p style={{ margin: 0, color: '#dc3545', fontSize: 12 }}>Failed to load image</p>
                        </div>
                        <p style={{ margin: '8px 0 0', fontSize: 11, color: '#666' }}>
                          Click to view full size
                        </p>
                      </div>
                    ) : (
                      <div style={{ 
                        textAlign: 'center', 
                        padding: 30, 
                        background: '#f8f9fa', 
                        borderRadius: 8,
                        color: '#666',
                      }}>
                        <MdImage size={32} style={{ opacity: 0.3, marginBottom: 4 }} />
                        <p style={{ margin: 0, fontSize: 12 }}>No receipt image</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Inspection Attachment */}
                  <div>
                    <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 500, color: '#333' }}>Inspection Image</p>
                    {viewModal.item.inspection_attachment && !reuploadPreview ? (
                      <div style={{ textAlign: 'center' }}>
                        <img
                          src={viewModal.item.inspection_attachment}
                          alt="Inspection Attachment"
                          style={{
                            maxWidth: '100%',
                            maxHeight: 200,
                            borderRadius: 8,
                            border: '1px solid #ddd',
                            cursor: 'pointer',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(viewModal.item.inspection_attachment, '_blank');
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                            if (e.target.nextSibling.nextSibling) e.target.nextSibling.nextSibling.style.display = 'none';
                          }}
                        />
                        <div style={{ display: 'none', padding: 15, background: '#f8f9fa', borderRadius: 8 }}>
                          <p style={{ margin: 0, color: '#dc3545', fontSize: 12 }}>Failed to load image</p>
                        </div>
                        <p style={{ margin: '8px 0 0', fontSize: 11, color: '#666' }}>
                          Click to view full size
                        </p>
                      </div>
                    ) : !reuploadPreview ? (
                      <div style={{ 
                        textAlign: 'center', 
                        padding: 30, 
                        background: '#f8f9fa', 
                        borderRadius: 8,
                        color: '#666',
                      }}>
                        <MdImage size={32} style={{ opacity: 0.3, marginBottom: 4 }} />
                        <p style={{ margin: 0, fontSize: 12 }}>No inspection image</p>
                      </div>
                    ) : null}

                    {/* Re-upload Preview */}
                    {reuploadPreview && (
                      <div style={{ textAlign: 'center', marginBottom: 12 }}>
                        <p style={{ fontSize: 12, color: '#28a745', marginBottom: 8, fontWeight: 500 }}>New image preview:</p>
                        <img
                          src={reuploadPreview}
                          alt="New attachment preview"
                          style={{ maxWidth: '100%', maxHeight: 150, borderRadius: 8, border: '2px solid #28a745' }}
                        />
                        <button
                          onClick={() => { setReuploadFile(null); setReuploadPreview(null); }}
                          style={{
                            display: 'block',
                            margin: '8px auto 0',
                            padding: '4px 12px',
                            fontSize: 11,
                            background: '#dc3545',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                          }}
                        >
                          <MdClose style={{ verticalAlign: 'middle', marginRight: 4 }} />
                          Remove
                        </button>
                      </div>
                    )}

                    {/* Re-upload Button - only show for inspected serials */}
                    {(viewModal.item.inspection_status === 'inspected' || viewModal.item.inspection_status === 'for_return') && (
                      <div style={{ marginTop: 12, textAlign: 'center' }}>
                        <input
                          type="file"
                          ref={reuploadFileInputRef}
                          onChange={handleReuploadFileSelect}
                          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                          style={{ display: 'none' }}
                        />
                        {!reuploadPreview ? (
                          <button
                            onClick={() => reuploadFileInputRef.current?.click()}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 6,
                              border: '1px dashed #004A98',
                              background: 'transparent',
                              color: '#004A98',
                              cursor: 'pointer',
                              fontSize: 11,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <MdCloudUpload size={16} />
                            {viewModal.item.inspection_attachment ? 'Re-upload' : 'Upload'}
                          </button>
                        ) : (
                          <button
                            onClick={handleReuploadSubmit}
                            disabled={reuploadUploading}
                            style={{
                              padding: '6px 14px',
                              borderRadius: 6,
                              border: 'none',
                              background: reuploadUploading ? '#6c757d' : '#28a745',
                              color: '#fff',
                              cursor: reuploadUploading ? 'not-allowed' : 'pointer',
                              fontSize: 11,
                              fontWeight: 500,
                            }}
                          >
                            {reuploadUploading ? 'Uploading...' : 'Save'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 24, textAlign: 'right' }}>
                <button
                  onClick={handleCloseViewModal}
                  style={{
                    padding: '10px 32px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#004A98',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Process Movement History Modal */}
        <ProcessMovementHistory
          isOpen={historyModal.open}
          onClose={() => setHistoryModal({ open: false, serial: null })}
          recordType="subscription"
          recordId={historyModal.serial?.subscription_id}
          title={historyModal.serial?.serialTitle}
        />
      </div>
    </InspectionLayout>
  );
}
