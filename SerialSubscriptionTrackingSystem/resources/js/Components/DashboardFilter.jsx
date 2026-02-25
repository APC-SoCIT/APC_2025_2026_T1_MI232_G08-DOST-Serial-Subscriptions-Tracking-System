import React, { useState, useEffect } from "react";
import { FaFilter, FaFileExcel } from 'react-icons/fa';
import axios from 'axios';

/* ================= CONSTANTS ================= */
const YEARS = [2022, 2023, 2024, 2025, 2026];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

/* ================= HELPERS ================= */
const monthIndex = (month) => MONTHS.indexOf(month);

const firstDayOfMonth = (year, month) =>
  `${year}-${String(monthIndex(month) + 1).padStart(2, "0")}-01`;

const lastDayOfMonth = (year, month) =>
  new Date(year, monthIndex(month) + 1, 0).toISOString().split("T")[0];

const getDaysInMonth = (year, month) => {
  const days = [];
  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Empty cells before month starts
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  for (let d = 1; d <= totalDays; d++) {
    days.push(d);
  }

  return days;
};

/**
 * DashboardFilter - A reusable dropdown-style filter component
 * Matches the Admin Logs filter design for UI consistency
 * 
 * Props:
 * - title: String - Header title (e.g., "Dashboard Overview")
 * - dashboardName: String - Name for export file (e.g., "Admin Dashboard")
 * - onFilterChange: Function - Callback when filters are applied
 * - onGenerateReport: Function - Custom report generation handler (optional)
 * - exportEndpoint: String - API endpoint for Excel export (e.g., "/api/admin/export")
 * - exportData: Object - Additional data to include in export
 * - defaultYear: Number - Default year (default: 2026)
 */
export default function DashboardFilter({
  title = "Dashboard Overview",
  dashboardName = "Dashboard",
  onFilterChange,
  onGenerateReport,
  exportEndpoint = "",
  exportData = {},
  defaultYear = 2026,
}) {
  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filterMode, setFilterMode] = useState("year");
  const [year, setYear] = useState(defaultYear);
  const [startMonth, setStartMonth] = useState("January");
  const [endMonth, setEndMonth] = useState("December");
  const [startDate, setStartDate] = useState(firstDayOfMonth(defaultYear, "January"));
  const [endDate, setEndDate] = useState(lastDayOfMonth(defaultYear, "December"));

  // Temporary state for filter panel (before applying)
  const [tempYear, setTempYear] = useState(defaultYear);
  const [tempStartMonth, setTempStartMonth] = useState("January");
  const [tempEndMonth, setTempEndMonth] = useState("December");
  const [tempStartDate, setTempStartDate] = useState(firstDayOfMonth(defaultYear, "January"));
  const [tempEndDate, setTempEndDate] = useState(lastDayOfMonth(defaultYear, "December"));

  // Calendar state for week picker
  const [calendarMonth, setCalendarMonth] = useState(0);
  const [calendarYear, setCalendarYear] = useState(defaultYear);

  // Export state
  const [isExporting, setIsExporting] = useState(false);

  // Check if filters are active (not default values)
  const isFilterActive = filterMode !== 'year' || 
    year !== defaultYear || 
    startDate !== firstDayOfMonth(defaultYear, "January") || 
    endDate !== lastDayOfMonth(defaultYear, "December");

  // Select a week from the calendar
  const selectWeek = (day) => {
    const start = new Date(calendarYear, calendarMonth, day);

    // Start of week (Monday)
    const dayOfWeek = start.getDay();
    const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);

    const weekStart = new Date(calendarYear, calendarMonth, diff);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    setTempStartDate(weekStart.toISOString().split("T")[0]);
    setTempEndDate(weekEnd.toISOString().split("T")[0]);
  };

  // Apply filters and notify parent
  const applyFilters = () => {
    setYear(tempYear);
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);

    // Derive months from dates
    const start = new Date(tempStartDate);
    const end = new Date(tempEndDate);
    const startMonthName = MONTHS[start.getMonth()];
    const endMonthName = MONTHS[end.getMonth()];

    setStartMonth(startMonthName);
    setEndMonth(endMonthName);

    // Close filter panel
    setShowFilters(false);

    // Notify parent component
    if (onFilterChange) {
      onFilterChange({
        startDate: tempStartDate,
        endDate: tempEndDate,
        filterMode,
        year: tempYear,
        startMonth: startMonthName,
        endMonth: endMonthName,
      });
    }
  };

  // Clear all filters to defaults
  const clearFilters = () => {
    setFilterMode('year');
    setTempYear(defaultYear);
    setTempStartMonth('January');
    setTempEndMonth('December');
    setTempStartDate(firstDayOfMonth(defaultYear, 'January'));
    setTempEndDate(lastDayOfMonth(defaultYear, 'December'));
    setYear(defaultYear);
    setStartMonth('January');
    setEndMonth('December');
    setStartDate(firstDayOfMonth(defaultYear, 'January'));
    setEndDate(lastDayOfMonth(defaultYear, 'December'));

    // Notify parent component
    if (onFilterChange) {
      onFilterChange({
        startDate: firstDayOfMonth(defaultYear, 'January'),
        endDate: lastDayOfMonth(defaultYear, 'December'),
        filterMode: 'year',
        year: defaultYear,
        startMonth: 'January',
        endMonth: 'December',
      });
    }
  };

  // Sync temp values when opening filter panel
  const openFilterPanel = () => {
    if (!showFilters) {
      setTempYear(year);
      setTempStartMonth(startMonth);
      setTempEndMonth(endMonth);
      setTempStartDate(startDate);
      setTempEndDate(endDate);
      if (filterMode === "week") {
        setCalendarYear(year);
        setCalendarMonth(monthIndex(startMonth));
      }
    }
    setShowFilters(!showFilters);
  };

  // Generate Excel Report
  const handleGenerateReport = async () => {
    // Use custom handler if provided
    if (onGenerateReport) {
      onGenerateReport({
        startDate,
        endDate,
        filterMode,
        year,
        startMonth,
        endMonth,
        dashboardName,
      });
      return;
    }

    // Default: Use export endpoint
    if (!exportEndpoint) {
      alert('Export endpoint not configured');
      return;
    }

    setIsExporting(true);
    try {
      const response = await axios.get(exportEndpoint, {
        params: {
          start_date: startDate,
          end_date: endDate,
          dashboard_name: dashboardName,
          ...exportData,
        },
        responseType: 'blob',
      });

      // Create download link
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileName = `${dashboardName.replace(/\s+/g, '_')}_Report_${startDate}_to_${endDate}.xlsx`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-gray-200">
      
      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-6 py-4 border-b border-gray-100 gap-4">
        
        {/* Title */}
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={openFilterPanel}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
          >
            <FaFilter size={14} />
            Filters
            {isFilterActive && (
              <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">Active</span>
            )}
          </button>

          <button
            onClick={handleGenerateReport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
          >
            <FaFileExcel size={14} />
            {isExporting ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {/* Filter Panel - Expandable */}
      {showFilters && (
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            
            {/* Year Selector */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
              <select
                value={tempYear}
                onChange={(e) => {
                  const selectedYear = parseInt(e.target.value);
                  setTempYear(selectedYear);
                  setTempStartDate(firstDayOfMonth(selectedYear, tempStartMonth));
                  setTempEndDate(lastDayOfMonth(selectedYear, tempEndMonth));
                  setCalendarYear(selectedYear);
                }}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {YEARS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Month Selector */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Month</label>
              <select
                value={tempStartMonth}
                onChange={(e) => {
                  const m = e.target.value;
                  setTempStartMonth(m);
                  setTempEndMonth(m);
                  setTempStartDate(firstDayOfMonth(tempYear, m));
                  setTempEndDate(lastDayOfMonth(tempYear, m));
                  setCalendarMonth(monthIndex(m));
                }}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Months</option>
                {MONTHS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Week Selector */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Week</label>
              <select
                onChange={(e) => {
                  const weekNum = parseInt(e.target.value);
                  if (weekNum) {
                    // Calculate week start date
                    const janFirst = new Date(tempYear, 0, 1);
                    const daysOffset = (weekNum - 1) * 7;
                    const weekStart = new Date(janFirst);
                    weekStart.setDate(janFirst.getDate() + daysOffset - janFirst.getDay() + 1);
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6);
                    
                    setTempStartDate(weekStart.toISOString().split("T")[0]);
                    setTempEndDate(weekEnd.toISOString().split("T")[0]);
                  }
                }}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Week</option>
                {Array.from({ length: 52 }, (_, i) => i + 1).map(w => (
                  <option key={w} value={w}>Week {w}</option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
              <input
                type="date"
                value={tempStartDate}
                onChange={(e) => setTempStartDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
              <input
                type="date"
                value={tempEndDate}
                onChange={(e) => setTempEndDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Clear All
            </button>
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Export constants for use in parent components if needed
export { YEARS, MONTHS, monthIndex, firstDayOfMonth, lastDayOfMonth };
