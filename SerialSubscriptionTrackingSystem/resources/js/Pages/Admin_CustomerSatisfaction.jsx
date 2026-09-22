import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import AdminLayout from '@/Layouts/AdminLayout';

const roles = ['all', 'Admin', 'Tpu', 'Gsps', 'Inspection', 'Supplier'];
// Matches the backend summary: arithmetic mean of the four independent
// category ratings, rounded to one decimal place.
const summaryRating = (item) => Number(item.summary_rating ?? ((Number(item.ease_of_navigation) + Number(item.speed_and_reliability) + Number(item.record_accuracy) + Number(item.overall_satisfaction)) / 4)).toFixed(1);

export default function AdminCustomerSatisfaction() {
  const [responses, setResponses] = useState([]);
  const [filters, setFilters] = useState({ search: '', role: 'all', rating: '', from: '', to: '' });
  const [sort, setSort] = useState('submitted_at');
  const [loading, setLoading] = useState(true);

  const fetchResponses = () => {
    setLoading(true);
    axios.get('/api/customer-satisfaction/responses', { params: filters })
      .then(({ data }) => setResponses(data.responses || []))
      .finally(() => setLoading(false));
  };

  useEffect(fetchResponses, [filters.role, filters.rating, filters.from, filters.to]);

  const visible = responses
    .filter((item) => {
      const text = `${item.delivery_title || ''} ${item.user_name || ''} ${item.user_email || ''}`.toLowerCase();
      return text.includes(filters.search.toLowerCase());
    })
    .sort((a, b) => {
      if (sort === 'rating') return Number(summaryRating(b)) - Number(summaryRating(a));
      if (sort === 'delivery') return String(a.delivery_title || '').localeCompare(String(b.delivery_title || ''));
      return new Date(b.submitted_at) - new Date(a.submitted_at);
    });

  const updateFilter = (key) => (event) => setFilters((current) => ({ ...current, [key]: event.target.value }));

  const fieldStyle = { padding: '10px 14px', border: '1px solid #ccd3da', borderRadius: 6, boxSizing: 'border-box', width: '100%' };

  return (
    <AdminLayout title="Customer Satisfaction">
      <Head title="Customer Satisfaction Responses" />
      <div style={{ padding: '28px 32px', color: '#1f2933' }}>
        <div style={{ background: '#fff', borderRadius: 8, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
          <h1 style={{ color: '#004A98', margin: '0 0 20px', fontSize: 24 }}>Customer Satisfaction Responses</h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 12, marginBottom: 18, marginLeft: 12 }}>
            <input
              placeholder="Search delivery, name, or email"
              value={filters.search}
              onChange={updateFilter('search')}
              style={{ ...fieldStyle, flex: '2 1 280px', minWidth: 260 }}
            />
            <select
              value={filters.role}
              onChange={updateFilter('role')}
              style={{ ...fieldStyle, flex: '1 1 160px', minWidth: 160 }}
            >
              {roles.map((role) => <option key={role} value={role}>{role === 'all' ? 'All Roles' : role}</option>)}
            </select>
            <select
              value={filters.rating}
              onChange={updateFilter('rating')}
              style={{ ...fieldStyle, flex: '1 1 160px', minWidth: 160 }}
            >
              <option value="">Ratings</option>
              {[1, 2, 3, 4, 5].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}
            </select>
            <label style={{ flex: '1 1 150px', minWidth: 150, color: '#68737d', fontSize: 12 }}>
              From
              <input aria-label="From date" type="date" value={filters.from} onChange={updateFilter('from')} style={{ ...fieldStyle, display: 'block', marginTop: 4 }} />
            </label>
            <label style={{ flex: '1 1 150px', minWidth: 150, color: '#68737d', fontSize: 12 }}>
              To
              <input aria-label="To date" type="date" value={filters.to} onChange={updateFilter('to')} style={{ ...fieldStyle, display: 'block', marginTop: 4 }} />
            </label>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              style={{ ...fieldStyle, flex: '1 1 170px', minWidth: 170 }}
            >
              <option value="submitted_at">Newest first</option>
              <option value="rating">Highest rating</option>
              <option value="delivery">Delivery A-Z</option>
            </select>
            <button
              onClick={fetchResponses}
              style={{ flex: '0 0 auto', background: '#004A98', color: '#fff', border: 0, borderRadius: 6, padding: '10px 20px', cursor: 'pointer' }}
            >
              Refresh
            </button>
          </div>
          {loading ? <p>Loading responses...</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead><tr style={{ background: '#f0f4f8', color: '#004A98', textAlign: 'left' }}>{['Delivery', 'Role', 'Name', 'Rating', 'Suggestions', 'Submitted'].map((heading) => <th key={heading} style={{ padding: 12, borderBottom: '1px solid #dfe5ea' }}>{heading}</th>)}</tr></thead>
                <tbody>
                  {visible.map((item) => <tr key={item._id || item.id}>
                    <td style={{ padding: 12, borderBottom: '1px solid #edf0f2' }}>{item.delivery_title}<br /><small>{item.supplier_name || 'No supplier'}</small></td>
                    <td style={{ padding: 12, borderBottom: '1px solid #edf0f2', textTransform: 'capitalize' }}>{item.role}</td>
                    <td style={{ padding: 12, borderBottom: '1px solid #edf0f2' }}>{item.user_name || 'Anonymous'}</td>
                    <td style={{ padding: 12, borderBottom: '1px solid #edf0f2', color: '#f5a623', fontWeight: 700 }}>{summaryRating(item)} / 5</td>
                    <td style={{ padding: 12, borderBottom: '1px solid #edf0f2', maxWidth: 260 }}>{item.suggestions || '-'}</td>
                    <td style={{ padding: 12, borderBottom: '1px solid #edf0f2' }}>{item.submitted_at ? new Date(item.submitted_at).toLocaleString() : '-'}</td>
                  </tr>)}
                  {!visible.length && <tr><td colSpan="6" style={{ padding: 24, textAlign: 'center', color: '#68737d' }}>No responses found.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}