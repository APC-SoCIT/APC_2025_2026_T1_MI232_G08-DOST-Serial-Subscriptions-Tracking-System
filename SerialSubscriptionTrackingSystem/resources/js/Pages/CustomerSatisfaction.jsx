import React, { useEffect, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import axios from 'axios';
import AdminLayout from '@/Layouts/AdminLayout';
import TPULayout from '@/Layouts/TpuLayout';
import GSPSLayout from '@/Layouts/GspsLayout';
import InspectionLayout from '@/Layouts/InspectionLayout';
import SupplierLayout from '@/Layouts/SupplierLayout';

const questions = [
  ['ease_of_navigation', 'Ease of navigating the system'],
  ['speed_and_reliability', 'Speed and reliability of the system'],
  ['record_accuracy', 'Accuracy of serial subscription records'],
  ['overall_satisfaction', 'Overall satisfaction with the system'],
];

const shellByRole = { admin: AdminLayout, tpu: TPULayout, gsps: GSPSLayout, inspection: InspectionLayout, supplier: SupplierLayout };

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

export default function CustomerSatisfaction() {
  const { auth } = usePage().props;
  const role = String(auth?.user?.role || '').toLowerCase();
  const Layout = shellByRole[role] || TPULayout;
  const [deliveries, setDeliveries] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState('');
  const [ratings, setRatings] = useState(Object.fromEntries(questions.map(([key]) => [key, 0])));
  const [name, setName] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    axios.get('/api/customer-satisfaction/eligible')
      .then(({ data }) => setDeliveries(data.deliveries || []))
      .catch(() => setMessage({ type: 'error', text: 'Unable to load eligible deliveries.' }))
      .finally(() => setLoading(false));
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    if (!selectedDelivery || Object.values(ratings).some((rating) => !rating)) {
      setMessage({ type: 'error', text: 'Select a delivery and rate all four questions.' });
      return;
    }
    const delivery = deliveries.find((item) => item.delivery_key === selectedDelivery);
    setSubmitting(true);
    setMessage({ type: '', text: '' });
    try {
      const { data } = await axios.post('/api/customer-satisfaction', { ...ratings, user_name: name || null, suggestions: suggestions || null, subscription_id: delivery.subscription_id, serial_index: delivery.serial_index });
      setMessage({ type: 'success', text: data.message });
      setDeliveries((current) => current.filter((item) => item.delivery_key !== selectedDelivery));
      setSelectedDelivery('');
      setRatings(Object.fromEntries(questions.map(([key]) => [key, 0])));
      setName('');
      setSuggestions('');
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Feedback could not be submitted.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout title="Customer Satisfaction">
      <Head title="Customer Satisfaction" />
      <div style={{ padding: '28px 32px', maxWidth: 820, margin: '0 auto', color: '#1f2933' }}>
        <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 10px rgba(0,0,0,0.08)', padding: 28 }}>
          <h1 style={{ color: '#004A98', fontSize: 24, margin: '0 0 6px' }}>Customer satisfaction survey</h1>
          <p style={{ color: '#68737d', margin: '0 0 24px' }}>Serial Subscription Tracking System (DOST-STII LAMS)</p>
          {role === 'tpu' && <a href="/tpu/customer-satisfaction-report" style={{ display: 'inline-block', color: '#004A98', fontWeight: 600, marginBottom: 18 }}>View overall satisfaction report</a>}
          {message.text && <div role="status" style={{ background: message.type === 'success' ? '#e7f6ec' : '#fdecec', color: message.type === 'success' ? '#237a3b' : '#a12a2a', padding: '12px 14px', borderRadius: 6, marginBottom: 18 }}>{message.text}</div>}
          {loading ? <p>Loading eligible deliveries...</p> : deliveries.length === 0 ? <p style={{ color: '#68737d' }}>There are no completed deliveries awaiting feedback.</p> : (
            <form onSubmit={submit}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 7 }}>Completed Transactions or Delivered Serial Issue</label>
              <select value={selectedDelivery} onChange={(event) => setSelectedDelivery(event.target.value)} style={{ width: '100%', padding: '11px 12px', border: '1px solid #ccd3da', borderRadius: 6, marginBottom: 20, background: '#fff' }}>
                <option value="">Select a delivery</option>
                {deliveries.map((delivery) => <option key={delivery.delivery_key} value={delivery.delivery_key}>{delivery.title} - {delivery.supplier_name || 'Unknown supplier'} - Issue {delivery.issue_number}</option>)}
              </select>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 7 }}>Name <span style={{ color: '#68737d', fontWeight: 400 }}>(optional)</span></label>
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Juan Dela Cruz" style={{ width: '100%', padding: '11px 12px', border: '1px solid #ccd3da', borderRadius: 6, marginBottom: 24, boxSizing: 'border-box' }} />
              {questions.map(([key, label], index) => <div key={key} style={{ borderTop: index ? '1px solid #e5e9ed' : 0, padding: '16px 0 10px' }}><p style={{ fontWeight: 600, margin: '0 0 9px', fontSize: 14 }}>{index + 1}. {label}</p><Stars value={ratings[key]} onChange={(value) => setRatings((current) => ({ ...current, [key]: value }))} /></div>)}
              <label style={{ display: 'block', fontWeight: 600, fontSize: 14, margin: '22px 0 7px' }}>Suggestions for improvement <span style={{ color: '#68737d', fontWeight: 400 }}>(optional)</span></label>
              <textarea value={suggestions} onChange={(event) => setSuggestions(event.target.value)} placeholder="Tell us what could be better..." rows={4} style={{ width: '100%', padding: '11px 12px', border: '1px solid #ccd3da', borderRadius: 6, resize: 'vertical', boxSizing: 'border-box' }} />
              <button type="submit" disabled={submitting} style={{ width: '100%', marginTop: 20, padding: '12px 16px', border: 0, borderRadius: 6, background: submitting ? '#9aa4ad' : '#004A98', color: '#fff', fontWeight: 600, cursor: submitting ? 'wait' : 'pointer' }}>{submitting ? 'Submitting...' : 'Submit feedback'}</button>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
}
