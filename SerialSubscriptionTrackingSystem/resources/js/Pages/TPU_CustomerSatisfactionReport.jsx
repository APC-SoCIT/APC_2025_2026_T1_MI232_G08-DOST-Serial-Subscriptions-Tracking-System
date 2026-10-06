import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import TPULayout from '@/Layouts/TpuLayout';

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

function HorizontalResponseChart({ data, title, valueSuffix = '', maxValue = null }) {
  const chartData = Object.entries(data || {}).map(([label, value]) => ({
    label,
    value,
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

export default function TPUPerformanceFeedbackReport() {
  const [report, setReport] = useState(null);
  const [range, setRange] = useState({ from: '', to: '' });
  const [downloading, setDownloading] = useState(false);

  const fetchReport = (params) => {
    axios.get('/api/customer-satisfaction/report', { params }).then(({ data }) => setReport(data));
  };

  useEffect(() => {
    fetchReport(range);
  }, [range.from, range.to]);

  const updateRange = (key) => (event) => setRange((current) => ({ ...current, [key]: event.target.value }));

  const downloadExcel = async () => {
    setDownloading(true);
    try {
      const response = await axios.get('/api/customer-satisfaction/report/export', { params: range, responseType: 'blob' });
      const disposition = response.headers['content-disposition'] || '';
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match ? match[1] : 'Performance_Feedback_Report.xlsx';
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  const fieldStyle = { padding: '10px 14px', border: '1px solid #ccd3da', borderRadius: 6, boxSizing: 'border-box' };

  return (
    <TPULayout title="Performance Feedback Report">
      <Head title="Performance Feedback Report" />
      <div style={{ padding: '28px 32px', color: '#1f2933' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 14 }}>
          <h1 style={{ color: '#004A98', fontSize: 24, margin: 0 }}>Performance Feedback Report</h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 10 }}>
            <label style={{ color: '#68737d', fontSize: 12 }}>
              From
              <input aria-label="From date" type="date" value={range.from} onChange={updateRange('from')} style={{ ...fieldStyle, display: 'block', marginTop: 4 }} />
            </label>
            <label style={{ color: '#68737d', fontSize: 12 }}>
              To
              <input aria-label="To date" type="date" value={range.to} onChange={updateRange('to')} style={{ ...fieldStyle, display: 'block', marginTop: 4 }} />
            </label>
            <button
              onClick={downloadExcel}
              disabled={downloading}
              style={{ background: '#004A98', color: '#fff', border: 0, borderRadius: 6, padding: '10px 20px', cursor: downloading ? 'wait' : 'pointer', fontWeight: 600, opacity: downloading ? 0.7 : 1 }}
            >
              {downloading ? 'Preparing...' : 'Download Excel'}
            </button>
          </div>
        </div>
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
                  <small>{labels[key] || key}</small>
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
              <HorizontalResponseChart data={report.by_supplier} title="Responses by Supplier" />
              <HorizontalResponseChart data={report.supplier_ratings} title="Average Rating by Supplier" valueSuffix=" / 5" maxValue={5} />
            </div>

            <section style={{ background: '#fff', padding: 20, borderRadius: 8, marginTop: 18 }}>
              <h2 style={{ fontSize: 17, color: '#004A98', margin: '0 0 16px' }}>Comments about the supplier</h2>
              {(report.comments || []).length ? report.comments.map((item, index) => (
                <div key={index} style={{ borderBottom: index < report.comments.length - 1 ? '1px solid #edf0f2' : 'none', padding: '14px 0' }}>
                  <p style={{ margin: '0 0 8px', fontSize: 15, color: '#1f2933', lineHeight: 1.5 }}>&ldquo;{item.comment}&rdquo;</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12, color: '#68737d' }}>
                    <span><strong style={{ color: '#004A98' }}>Supplier:</strong> {item.supplier_name || 'Unknown'}</span>
                    <span><strong style={{ color: '#004A98' }}>Submitted by:</strong> {item.submitted_by || 'Anonymous'}</span>
                  </div>
                </div>
              )) : <p style={{ color: '#68737d' }}>No comments submitted.</p>}
            </section>
          </>
        )}
      </div>
    </TPULayout>
  );
}