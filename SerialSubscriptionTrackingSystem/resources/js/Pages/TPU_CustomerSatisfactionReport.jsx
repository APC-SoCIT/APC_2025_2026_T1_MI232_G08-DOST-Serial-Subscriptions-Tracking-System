import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import TPULayout from '@/Layouts/TpuLayout';

const labels = {
  ease_of_navigation: 'Ease of navigation',
  speed_and_reliability: 'Speed and reliability',
  record_accuracy: 'Record accuracy',
  overall_satisfaction: 'Overall satisfaction',
};

const chartColors = ['#004A98', '#0D9488', '#E67E22', '#7C3AED', '#DC2626', '#64748B'];

function HorizontalResponseChart({ data, labelKey, title }) {
  const chartData = Object.entries(data || {}).map(([label, count]) => ({
    label,
    count,
  }));
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
                <XAxis type="number" allowDecimals={false} tick={{ fill: '#68737d', fontSize: 12 }} />
                <YAxis type="category" dataKey="label" width={110} tick={{ fill: '#34414d', fontSize: 12 }} tickFormatter={(value) => labelKey === 'role' ? String(value).replace(/^./, (letter) => letter.toUpperCase()) : (String(value).length > 18 ? `${String(value).slice(0, 18)}...` : value)} />
                <Tooltip formatter={(value) => [value, 'Responses']} cursor={{ fill: '#f0f4f8' }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} fill="#004A98">
                  {chartData.map((entry, index) => <Cell key={`${entry.label}-${index}`} fill={chartColors[index % chartColors.length]} />)}
                  <LabelList dataKey="count" position="right" fill="#34414d" fontSize={12} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </section>
  );
}

export default function TPUCustomerSatisfactionReport() {
  const [report, setReport] = useState(null);

  useEffect(() => {
    axios.get('/api/customer-satisfaction/report').then(({ data }) => setReport(data));
  }, []);

  return (
    <TPULayout title="Customer Satisfaction Report">
      <Head title="Customer Satisfaction Report" />
      <div style={{ padding: '28px 32px', color: '#1f2933' }}>
        <h1 style={{ color: '#004A98', fontSize: 24 }}>Customer Satisfaction Report</h1>
        {!report ? <p>Loading report...</p> : (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, margin: '20px 0' }}>
              <div style={{ background: '#fff', padding: 20, borderRadius: 8, minWidth: 180, boxShadow: '0 2px 8px rgba(0,0,0,.08)' }}>
                <small>Total responses</small>
                <strong style={{ display: 'block', fontSize: 30, color: '#004A98' }}>{report.total_responses}</strong>
              </div>
              <div style={{ background: '#fff', padding: 20, borderRadius: 8, minWidth: 180, boxShadow: '0 2px 8px rgba(0,0,0,.08)' }}>
                <small>Average summary rating</small>
                <strong style={{ display: 'block', fontSize: 24, color: '#f5a623' }}>{Number(report.average_summary_rating || 0).toFixed(1)} / 5</strong>
              </div>
              {Object.entries(report.averages || {}).map(([key, value]) => (
                <div key={key} style={{ background: '#fff', padding: 20, borderRadius: 8, minWidth: 180, boxShadow: '0 2px 8px rgba(0,0,0,.08)' }}>
                  <small>{labels[key]}</small>
                  <strong style={{ display: 'block', fontSize: 24, color: '#f5a623' }}>{value} / 5</strong>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
              <section style={{ background: '#fff', padding: 20, borderRadius: 8 }}>
                <h2 style={{ fontSize: 17, color: '#004A98' }}>Overall rating distribution</h2>
                {Object.entries(report.distribution || {}).map(([rating, count]) => (
                  <div key={rating} style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0' }}>
                    <span style={{ width: 92 }}>{rating} stars</span>
                    <div style={{ flex: 1, height: 12, background: '#e8edf1', borderRadius: 6 }}><div style={{ width: `${report.total_responses ? (count / report.total_responses) * 100 : 0}%`, height: '100%', background: '#f5a623', borderRadius: 6 }} /></div>
                    <strong>{count}</strong>
                  </div>
                ))}
              </section>
              <HorizontalResponseChart data={report.by_role} labelKey="role" title="Responses by Role" />
              <HorizontalResponseChart data={report.by_delivery} labelKey="delivery" title="Responses by Delivery" />
            </div>

            <section style={{ background: '#fff', padding: 20, borderRadius: 8, marginTop: 18 }}>
              <h2 style={{ fontSize: 17, color: '#004A98' }}>Suggestions for improvement</h2>
              {(report.suggestions || []).length ? report.suggestions.map((item, index) => <p key={index} style={{ borderBottom: '1px solid #edf0f2', paddingBottom: 10 }}>&ldquo;{item.suggestion}&rdquo; <small>({item.role}, {item.delivery_title})</small></p>) : <p>No suggestions submitted.</p>}
            </section>
          </>
        )}
      </div>
    </TPULayout>
  );
}
