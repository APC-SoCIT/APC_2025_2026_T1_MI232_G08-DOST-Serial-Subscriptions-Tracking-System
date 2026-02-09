import InspectionLayout from "@/Layouts/InspectionLayout";
import { useState, useEffect } from "react";
import axios from "axios";

export default function ListOfSerials() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filterDate, setFilterDate] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [serials, setSerials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const perPage = 4; // number of rows per page

  // Fetch serials from API
  useEffect(() => {
    fetchSerials();
  }, []);

  const fetchSerials = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/subscriptions/inspection-serials');
      
      if (response.data.success) {
        setSerials(response.data.serials || []);
      }
    } catch (err) {
      console.error('Error fetching serials:', err);
      setError('Failed to load serials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format date to readable words (e.g., "December 10, 2025")
  const formatDateToWords = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  // Format inspection status for display
  const formatInspectionStatus = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending Inspection';
      case 'inspected':
        return 'Inspected';
      case 'for_return':
        return 'For Return';
      default:
        return status || 'Unknown';
    }
  };

  // Get status badge styling
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'inspected':
        return 'bg-green-100 text-green-800';
      case 'for_return':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Normalize date to YYYY-MM-DD format
  const normalizeDate = (dateString) => {
    if (!dateString) return null;
    // Handle various date formats and extract just the date part
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    // Return in YYYY-MM-DD format
    return date.toISOString().split('T')[0];
  };

  // Filter serials based on date, month, and year
  const filteredSerials = serials.filter((item) => {
    const rawDate = item.receivedDate || item.deliveryDate;
    const dateToUse = normalizeDate(rawDate);
    
    // If any filter is set but item has no date, exclude it
    if ((filterDate || filterMonth || filterYear) && !dateToUse) return false;
    
    // If no filters are set, include all items
    if (!filterDate && !filterMonth && !filterYear) return true;
    
    const [year, month, day] = dateToUse.split("-");
    
    if (filterDate) {
      const normalizedFilterDate = normalizeDate(filterDate);
      if (dateToUse !== normalizedFilterDate) return false;
    }
    if (filterMonth && month !== filterMonth) return false;
    if (filterYear && year !== filterYear) return false;
    
    return true;
  });

  const totalPages = Math.ceil(filteredSerials.length / perPage);
  const paginatedData = filteredSerials.slice((currentPage - 1) * perPage, currentPage * perPage);

  return (
    <InspectionLayout header="List of Serials">
      <h2 className="text-2xl font-bold mb-2" style={{ color: '#004A98' }}>List of Serials</h2>
      <p className="text-sm text-gray-500 mb-6">
        Complete list of all received serials in the system.
      </p>

      <div className="bg-white rounded-2xl shadow-lg p-6 overflow-x-auto">
        {/* Date Filters */}
        <div className="mb-6 pb-6 border-b border-gray-300">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Filter by Date</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Specific Date</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => {
                  setFilterDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Month</label>
              <select
                value={filterMonth}
                onChange={(e) => {
                  setFilterMonth(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Months</option>
                <option value="01">January</option>
                <option value="02">February</option>
                <option value="03">March</option>
                <option value="04">April</option>
                <option value="05">May</option>
                <option value="06">June</option>
                <option value="07">July</option>
                <option value="08">August</option>
                <option value="09">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Year</label>
              <select
                value={filterYear}
                onChange={(e) => {
                  setFilterYear(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Years</option>
                <option value="2020">2020</option>
                <option value="2021">2021</option>
                <option value="2022">2022</option>
                <option value="2023">2023</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>
            </div>
          </div>
          {(filterDate || filterMonth || filterYear) && (
            <button
              onClick={() => {
                setFilterDate("");
                setFilterMonth("");
                setFilterYear("");
                setCurrentPage(1);
              }}
              className="mt-4 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading serials...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={fetchSerials}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        )}

        {/* Data Table */}
        {!loading && !error && (
          <>
            <table className="min-w-full text-base border-collapse">
              <thead>
                <tr className="text-gray-500 border-b border-gray-300">
                  <th className="text-left px-6 py-4">ISSN</th>
                  <th className="text-left px-6 py-4">SERIAL TITLE</th>
                  <th className="text-left px-6 py-4">SUPPLIER</th>
                  <th className="text-left px-6 py-4">RECEIVED DATE</th>
                  <th className="text-left px-6 py-4">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((item, index) => (
                    <tr key={item.id || index} className="border-b border-gray-200 last:border-0">
                      <td className="px-6 py-6 font-medium">{item.issn || 'N/A'}</td>
                      <td className="px-6 py-6">{item.serialTitle || 'N/A'}</td>
                      <td className="px-6 py-6">{item.supplierName || 'N/A'}</td>
                      <td className="px-6 py-6">{formatDateToWords(item.receivedDate || item.deliveryDate)}</td>
                      <td className="px-6 py-6">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadgeClass(item.inspection_status)}`}
                        >
                          {formatInspectionStatus(item.inspection_status)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-500">
                      No serials found for the selected filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div className="flex justify-end mt-4 gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1">{currentPage} / {totalPages || 1}</span>
              <button
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </InspectionLayout>
  );
}
