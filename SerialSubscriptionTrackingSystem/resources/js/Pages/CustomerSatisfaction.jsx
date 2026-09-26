import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import TPULayout from '@/Layouts/TpuLayout';

const questions = [
  ['delivered_on_schedule', 'Delivered items/services within the agreed schedule'],
  ['completeness_of_delivery', 'Completeness of delivery/documents'],
  ['compliance_technical_specs', 'Compliance with technical specifications'],
  ['quality_of_goods', 'Quality of goods/technical specifications'],
  ['packaging_handling_condition', 'Packaging, handling, and condition upon delivery'],
  ['responsiveness', 'Responsiveness to requests and concerns'],
  ['after_sales_support', 'After-sales support/warranty compliance'],
  ['compliance_contract_terms', 'Compliance with contract terms and conditions'],
];

function Stars({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4 }} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" onClick={() => onChange(star)} aria-label={`${star} star${star > 1 ? 's' : ''}`} style={{ border: 0, background: 'transparent', color: star <= value ? '#f5a623' : '#9aa4ad', cursor: 'pointer', fontSize: 26, lineHeight: 1, padding: 0 }}>
          {star <= value ? '★' : '☆'}
        </button>
      ))}
    </div>
  );
}

export default function PerformanceFeedback() {
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [ratings, setRatings] = useState(Object.fromEntries(questions.map(([key]) => [key, 0])));
  const [name, setName] = useState('');
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    axios.get('/api/customer-satisfaction/suppliers')
      .then(({ data }) => setSuppliers(data.suppliers || []))
      .catch(() => setMessage({ type: 'error', text: 'Unable to load active suppliers.' }))
      .finally(() => setLoading(false));
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    if (submitting) return; // extra guard against double-fire beyond the disabled button
    if (!selectedSupplier || Object.values(ratings).some((rating) => !rating)) {
      setMessage({ type: 'error', text: 'Select a supplier and rate all eight questions.' });
      return;
    }
    setSubmitting(true);
    setMessage({ type: '', text: '' });
    try {
      const { data } = await axios.post('/api/customer-satisfaction', {
        ...ratings,
        supplier_id: selectedSupplier,
        user_name: name || null,
        comments: comments || null,
      });
      setMessage({ type: 'success', text: data.message });
      setSelectedSupplier('');
      setRatings(Object.fromEntries(questions.map(([key]) => [key, 0])));
      setName('');
      setComments('');
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Feedback could not be submitted.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <TPULayout title="Performance Feedback">
      <Head title="Performance Feedback" />
      <div style={{ padding: '28px 32px', maxWidth: 820, margin: '0 auto', color: '#1f2933' }}>
        <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 10px rgba(0,0,0,0.08)', padding: 28 }}>
          <h1 style={{ color: '#004A98', fontSize: 24, margin: '0 0 6px' }}>Performance feedback survey</h1>
          <p style={{ color: '#68737d', margin: '0 0 24px' }}>Serial Subscription Tracking System (DOST-STII LAMS)</p>
<a href="/tpu/performance-feedback-report" style={{ display: 'inline-block', color: '#004A98', fontWeight: 600, marginBottom: 18 }}>View performance feedback report</a>          {message.text && <div role="status" style={{ background: message.type === 'success' ? '#e7f6ec' : '#fdecec', color: message.type === 'success' ? '#237a3b' : '#a12a2a', padding: '12px 14px', borderRadius: 6, marginBottom: 18 }}>{message.text}</div>}
          {loading ? <p>Loading active suppliers...</p> : suppliers.length === 0 ? <p style={{ color: '#68737d' }}>There are no active supplier accounts available for feedback.</p> : (
            <form onSubmit={submit}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 7 }}>Supplier</label>
              <select value={selectedSupplier} onChange={(event) => setSelectedSupplier(event.target.value)} style={{ width: '100%', padding: '11px 12px', border: '1px solid #ccd3da', borderRadius: 6, marginBottom: 20, background: '#fff' }}>
                <option value="">Select a supplier</option>
                {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.label}</option>)}
              </select>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 7 }}>Name <span style={{ color: '#68737d', fontWeight: 400 }}>(optional)</span></label>
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Juan Dela Cruz" style={{ width: '100%', padding: '11px 12px', border: '1px solid #ccd3da', borderRadius: 6, marginBottom: 24, boxSizing: 'border-box' }} />
              {questions.map(([key, label], index) => <div key={key} style={{ borderTop: index ? '1px solid #e5e9ed' : 0, padding: '16px 0 10px' }}><p style={{ fontWeight: 600, margin: '0 0 9px', fontSize: 14 }}>{index + 1}. {label}</p><Stars value={ratings[key]} onChange={(value) => setRatings((current) => ({ ...current, [key]: value }))} /></div>)}
              <label style={{ display: 'block', fontWeight: 600, fontSize: 14, margin: '22px 0 7px' }}>Comments about the supplier <span style={{ color: '#68737d', fontWeight: 400 }}>(optional)</span></label>
              <textarea value={comments} onChange={(event) => setComments(event.target.value)} placeholder="Share your comments about this supplier..." rows={4} style={{ width: '100%', padding: '11px 12px', border: '1px solid #ccd3da', borderRadius: 6, resize: 'vertical', boxSizing: 'border-box' }} />
              <button type="submit" disabled={submitting} style={{ width: '100%', marginTop: 20, padding: '12px 16px', border: 0, borderRadius: 6, background: submitting ? '#9aa4ad' : '#004A98', color: '#fff', fontWeight: 600, cursor: submitting ? 'wait' : 'pointer' }}>{submitting ? 'Submitting...' : 'Submit feedback'}</button>
            </form>
          )}
        </div>
      </div>
    </TPULayout>
  );
}