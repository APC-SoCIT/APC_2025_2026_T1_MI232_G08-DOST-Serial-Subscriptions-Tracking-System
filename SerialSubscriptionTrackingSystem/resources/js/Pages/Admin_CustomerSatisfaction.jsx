import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import AdminLayout from '@/Layouts/AdminLayout';

const labels = {
  delivered_on_schedule: 'Delivered on schedule',
  completeness_of_delivery: 'Completeness of delivery',
  compliance_technical_specs: 'Compliance with technical specs',
  quality_of_goods: 'Quality of goods',
  packaging_handling_condition: 'Packaging & handling',
  responsiveness: 'Responsiveness',
  after_sales_support: 'After-sales support',
  compliance_contract_terms: 'Compliance with contract terms',
};

const chartColors = ['#004A98', '#0D9488', '#E67E22', '#7C3AED', '#DC2626', '#64748B', '#059669', '#B45309'];

// Matches the backend summary: arithmetic mean of the eight independent
// category ratings, rounded to one decimal place.
const summaryRating = (item) => Number(item.summary_rating ?? (
  (Number(item.delivered_on_schedule) + Number(item.completeness_of_delivery) + Number(item.compliance_technical_specs) + Number(item.quality_of_goods) + Number(item.packaging_handling_condition) + Number(item.responsiveness) + Number(item.after_sales_support) + Number(item.compliance_contract_terms)) / 8
)).toFixed(1);

function HorizontalResponseChart({ data, title, valueSuffix = '', maxValue = null }) {
  const chartData = Object.entries(data || {}).map(([label, value]) => ({ label, value }));
  const chartHeight = Math.max(260, chartData.length * 44);

  return (
    <section style={{ background: '#fff', padding: 20, borderRadius: 8, minWidth: 0 }}>
      <h2 style={{ fontSize: 17, color: '#004A98', margin: '0 0 14px' }}>{title}</h2>
      {chartData.length === 0 ? <p style={{ color: '#68737d' }}>No responses yet.</p> : (
        <div style={{ maxHeight: 440, overflowY: 'auto', overflowX: 'hidden' }}>
          <div style={{ minWidth: 360, height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 32, left: 8, bottom: 4 }} barCategoryGap="24%">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e9ed" />
                <XAxis type="number" domain={maxValue ? [0, maxValue] : undefined} allowDecimals={!!maxValue} tick={{ fill: '#68737d', fontSize: 12 }} />
                <YAxis type="category" dataKey="label" width={130} tick={{ fill: '#34414d', fontSize: 12 }} tickFormatter={(value) => (String(value).length > 20 ? `${String(value).slice(0, 20)}...` : value)} />
                <Tooltip formatter={(value) => [`${value}${valueSuffix}`, title]} cursor={{ fill: '#f0f4f8' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} fill="#004A98">
                  {chartData.map((entry, index) => <Cell key={`${entry.label}-${index}`} fill={chartColors[index % chartColors.length]} />)}
                  <LabelList dataKey="value" position="right" fill="#34414d" fontSize={12} formatter={(value) => `${value}${valueSuffix}`} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </section>
  );
}

export default function AdminPerformanceFeedback() {
  const [responses, setResponses] = useState([]);
  const [filters, setFilters] = useState({ search: '', rating: '', from: '', to: '' });
  const [sort, setSort] = useState('submitted_at');
  const [loading, setLoading] = useState(true);

  const fetchResponses = () => {
    setLoading(true);
    axios.get('/api/customer-satisfaction/responses', { params: filters })
      .then(({ data }) => setResponses(data.responses || []))
      .finally(() => setLoading(false));
  };

  useEffect(fetchResponses, [filters.rating, filters.from, filters.to]);

  const visible = responses
    .filter((item) => {
      const text = `${item.supplier_name || ''} ${item.user_name || ''} ${item.user_email || ''}`.toLowerCase();
      return text.includes(filters.search.toLowerCase());
    })
    .sort((a, b) => {
      if (sort === 'rating') return Number(summaryRating(b)) - Number(summaryRating(a));
      if (sort === 'supplier') return String(a.supplier_name || '').localeCompare(String(b.supplier_name || ''));
      return new Date(b.submitted_at) - new Date(a.submitted_at);
    });

  const updateFilter = (key) => (event) => setFilters((current) => ({ ...current, [key]: event.target.value }));

  const fieldStyle = { padding: '10px 14px', border: '1px solid #ccd3da', borderRadius: 6, boxSizing: 'border-box', width: '100%' };

   return (
    <AdminLayout title="Performance Feedback">
      <Head title="Performance Feedback Responses" />
      <div style={{ padding: '20px 24px', color: '#1f2933' }}>
        <h1 style={{ color: '#004A98', margin: '0 0 14px', fontSize: 22 }}>All Responses</h1>

        <div style={{ background: '#fff', borderRadius: 8, padding: 18, boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 10, marginBottom: 14 }}>
            <input
              placeholder="Search supplier, name, or email"
              value={filters.search}
              onChange={updateFilter('search')}
              style={{ ...fieldStyle, flex: '2 1 280px', minWidth: 260 }}
            />
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
              <option value="supplier">Supplier A-Z</option>
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
                <thead><tr style={{ background: '#f0f4f8', color: '#004A98', textAlign: 'left' }}>{['Supplier', 'Submitted by', 'Rating', 'Comments', 'Submitted'].map((heading) => <th key={heading} style={{ padding: 12, borderBottom: '1px solid #dfe5ea' }}>{heading}</th>)}</tr></thead>
                <tbody>
                  {visible.map((item) => <tr key={item._id || item.id}>
                    <td style={{ padding: 12, borderBottom: '1px solid #edf0f2' }}>{item.supplier_name || 'Unknown supplier'}</td>
                    <td style={{ padding: 12, borderBottom: '1px solid #edf0f2' }}>{item.user_name || 'Anonymous'}</td>
                    <td style={{ padding: 12, borderBottom: '1px solid #edf0f2', color: '#f5a623', fontWeight: 700 }}>{summaryRating(item)} / 5</td>
                    <td style={{ padding: 12, borderBottom: '1px solid #edf0f2', maxWidth: 260 }}>{item.comments || '-'}</td>
                    <td style={{ padding: 12, borderBottom: '1px solid #edf0f2' }}>{item.submitted_at ? new Date(item.submitted_at).toLocaleString() : '-'}</td>
                  </tr>)}
                  {!visible.length && <tr><td colSpan="5" style={{ padding: 24, textAlign: 'center', color: '#68737d' }}>No responses found.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}