// resources/js/Pages/Dashboard_TPU_Supplierinfo.jsx
import React, { useState } from 'react';
import TPULayout from '@/Layouts/TPULayout';
import { MdSearch, MdFilterList, MdAdd, MdClose } from "react-icons/md";

function SupplierInfo() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    contactPerson: '',
    supplierName: '',
    email: '',
    phone: '',
    address: '',
    status: 'Active'
  });

  const [suppliers, setSuppliers] = useState([
    {
      id: 1,
      contactPerson: 'Maria Santos',
      supplierName: 'ABC Books Supplier',
      email: 'abcbooks@email.com',
      phone: '+63 912 345 6789',
      address: 'Makati City',
      status: 'Active'
    },
    {
      id: 2,
      contactPerson: 'Leo Cruz',
      supplierName: 'MedJournal Suppliers Inc.',
      email: 'medjournal@email.com',
      phone: '+63 912 345 7777',
      address: 'Pasig City',
      status: 'Active'
    },
    {
      id: 3,
      contactPerson: 'Leo Cruz',
      supplierName: 'Global Periodicals Co.',
      email: 'globalperiodic@gmail.com',
      phone: '+63 912 345 7777',
      address: 'Pasig City',
      status: 'Active'
    },
    {
      id: 4,
      contactPerson: 'Julian Ramos',
      supplierName: 'EastAsia Books & Journals',
      email: 'eastasia@gmail.com',
      phone: '+63 945 567 8901',
      address: 'Manila City',
      status: 'Active'
    },
    {
      id: 5,
      contactPerson: 'Kean Dela Rosa',
      supplierName: 'MedJournal Suppliers Inc.',
      email: 'medjournal@email.com',
      phone: '+63 956 678 9012',
      address: 'Makati City',
      status: 'Active'
    },
  ]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSupplier(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSupplier = (e) => {
    e.preventDefault();
    const newId = suppliers.length > 0 ? Math.max(...suppliers.map(s => s.id)) + 1 : 1;
    const supplierToAdd = {
      id: newId,
      ...newSupplier
    };
    setSuppliers(prev => [...prev, supplierToAdd]);
    setNewSupplier({
      contactPerson: '',
      supplierName: '',
      email: '',
      phone: '',
      address: '',
      status: 'Active'
    });
    setShowAddModal(false);
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = 
      supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || supplier.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ background: '#fff', padding: 24, height: 'calc(100vh - 73px)', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ color: '#004A98', margin: 0, fontSize: 20 }}>Supplier Information</h2>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            background: '#28a745',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
            transition: 'all 0.2s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#218838';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = '#28a745';
          }}
        >
          <MdAdd size={18} /> Add Supplier
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <MdSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
          <input
            type="text"
            placeholder="Search suppliers..."
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

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowFilter(!showFilter)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 16px',
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
                <p style={{ margin: '0 0 8px 0', fontWeight: 500 }}>Filter by Status</p>
                {['All', 'Active', 'Inactive'].map(status => (
                  <label key={status} style={{ display: 'block', marginBottom: 6, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      checked={statusFilter === status}
                      onChange={() => {
                        setStatusFilter(status);
                        setShowFilter(false);
                      }}
                      style={{ marginRight: 8 }}
                    />
                    {status}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Contact Person</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Supplier Name</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Email</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Phone</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Address</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredSuppliers.map((supplier) => (
              <tr key={supplier.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '16px', fontWeight: 500 }}>{supplier.contactPerson}</td>
                <td style={{ padding: '16px' }}>{supplier.supplierName}</td>
                <td style={{ padding: '16px', color: '#004A98' }}>{supplier.email}</td>
                <td style={{ padding: '16px' }}>{supplier.phone}</td>
                <td style={{ padding: '16px' }}>{supplier.address}</td>
                <td style={{ padding: '16px' }}>
                  <span style={{
                    padding: '6px 16px',
                    borderRadius: 20,
                    background: supplier.status === 'Active' ? '#d4edda' : '#f8d7da',
                    color: supplier.status === 'Active' ? '#155724' : '#721c24',
                    fontSize: 12,
                    fontWeight: 500,
                    display: 'inline-block',
                  }}>
                    {supplier.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{ 
        marginTop: 30, 
        paddingTop: 20, 
        borderTop: '1px solid #eee',
        display: 'flex', 
        justifyContent: 'flex-end', 
        alignItems: 'center' 
      }}>
        <div style={{ color: '#666', fontSize: 14 }}>
          Showing {filteredSuppliers.length} of {suppliers.length} results
        </div>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ 
            padding: '8px 16px', 
            border: '1px solid #ddd', 
            background: '#fff', 
            borderRadius: 6, 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            Previous
          </button>
          <button style={{ 
            padding: '8px 16px', 
            border: '1px solid #004A98', 
            background: '#004A98', 
            color: '#fff', 
            borderRadius: 6, 
            cursor: 'pointer' 
          }}>
            1
          </button>
          <button style={{ 
            padding: '8px 16px', 
            border: '1px solid #ddd', 
            background: '#fff', 
            borderRadius: 6, 
            cursor: 'pointer' 
          }}>
            2
          </button>
          <button style={{ 
            padding: '8px 16px', 
            border: '1px solid #ddd', 
            background: '#fff', 
            borderRadius: 6, 
            cursor: 'pointer' 
          }}>
            3
          </button>
          <button style={{ 
            padding: '8px 16px', 
            border: '1px solid #ddd', 
            background: '#fff', 
            borderRadius: 6, 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            Next
          </button>
        </div>
      </div>

      {/* Add Supplier Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: 24,
            width: '600px',
            maxWidth: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ color: '#004A98', margin: 0 }}>Add Supplier Information</h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                <MdClose size={24} color="#666" />
              </button>
            </div>

            <form onSubmit={handleAddSupplier}>
              {/* Supplier Name - Full Width */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: '#333' }}>
                  Supplier Name *
                </label>
                <input
                  type="text"
                  name="supplierName"
                  value={newSupplier.supplierName}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 8,
                    border: '1px solid #ddd',
                    fontSize: 14,
                  }}
                  placeholder="Enter supplier/company name"
                />
              </div>

              {/* Contact Person & Email - Side by Side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: '#333' }}>
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={newSupplier.contactPerson}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 8,
                      border: '1px solid #ddd',
                      fontSize: 14,
                    }}
                    placeholder="Enter contact person name"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: '#333' }}>
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={newSupplier.email}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 8,
                      border: '1px solid #ddd',
                      fontSize: 14,
                    }}
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              {/* Phone & Address - Side by Side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: '#333' }}>
                    Phone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={newSupplier.phone}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 8,
                      border: '1px solid #ddd',
                      fontSize: 14,
                    }}
                    placeholder="+63 XXX XXX XXXX"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: '#333' }}>
                    Address *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={newSupplier.address}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 8,
                      border: '1px solid #ddd',
                      fontSize: 14,
                    }}
                    placeholder="Enter address"
                  />
                </div>
              </div>

              {/* Status - Full Width */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: '#333' }}>
                  Status
                </label>
                <select
                  name="status"
                  value={newSupplier.status}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 8,
                    border: '1px solid #ddd',
                    fontSize: 14,
                    background: '#fff',
                  }}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '10px 20px',
                    background: '#f5f5f5',
                    border: '1px solid #ddd',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    background: '#004A98',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  Add Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardTPUSupplierInfo() {
  return (
    <TPULayout title="Supplier Information">
      <SupplierInfo />
    </TPULayout>
  );
}