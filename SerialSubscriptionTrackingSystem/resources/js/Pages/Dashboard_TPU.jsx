import React, { useState, useEffect } from 'react';
import TPULayout from '@/Layouts/TPULayout';
import { 
  MdSearch, MdFilterList, MdFileDownload, MdCheckCircle, 
  MdTrendingUp, MdBarChart, MdCalendarToday,
  MdLocalShipping, MdCancel, MdInfo, MdDescription,
  MdExpandMore
} from "react-icons/md";
import { FaCalendarAlt, FaUserCheck } from "react-icons/fa";
// Removed: import { RiAddLargeFill } from "react-icons/ri";
// Recharts imports for data visualization
import { 
  BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  Cell, PieChart, Pie, AreaChart, Area, LineChart, Line
} from 'recharts';

// Received Items Component
function ReceivedItems() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [titleFilter, setTitleFilter] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [dashboardFilter, setDashboardFilter] = useState('all');
  const [selectedYear, setSelectedYear] = useState('2025');
  const [selectedTimeframe, setSelectedTimeframe] = useState('month');
  const [chartData, setChartData] = useState({
    monthlyTrends: [],
    supplierPerformance: [],
    deliveryStatus: [],
    yearlyComparison: [],
    categoryDistribution: []
  });
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const [activeChart, setActiveChart] = useState('monthly');

  // Comprehensive dummy data EXACTLY matching GSPS structure (2022-2025)
  const receivedData = [
    // 2025 Data - December (Matching GSPS exactly)
    {
      id: 1,
      serialTitle: 'Nature',
      supplierName: 'ABC Books Supplier',
      dateReceived: '2025-12-17',
      expectedDelivery: '2025-12-18',
      actualDelivery: '2025-12-17',
      deliveryStatus: 'Delivered',
      delay: -1,
      category: 'Science',
      year: 2025,
      month: 'December',
      volumeIssue: 'Vol 3 Issue 12',
      receivedBy: 'M. Santos',
      inspectionStatus: 'Inspected',
      notes: 'Complete set in excellent condition',
      location: 'Main Library',
      receiverDepartment: 'Science Department',
      condition: 'Excellent'
    },
    {
      id: 2,
      serialTitle: 'Science',
      supplierName: 'Global Periodicals Co.',
      dateReceived: '2025-12-15',
      expectedDelivery: '2025-12-12',
      actualDelivery: '2025-12-15',
      deliveryStatus: 'Delivered',
      delay: 3,
      category: 'Science',
      year: 2025,
      month: 'December',
      volumeIssue: 'Vol 4 Issue 11',
      receivedBy: 'L. Cruz',
      inspectionStatus: 'Inspected',
      notes: 'Complete set received, includes special supplement',
      location: 'Main Library',
      receiverDepartment: 'Science Department',
      condition: 'Good'
    },
    {
      id: 3,
      serialTitle: 'The Lancet',
      supplierName: 'MedJournal Suppliers Inc.',
      dateReceived: null,
      expectedDelivery: '2025-12-20',
      actualDelivery: null,
      deliveryStatus: 'Pending',
      delay: 2,
      category: 'Medical',
      year: 2025,
      month: 'December',
      volumeIssue: 'Vol 1 Issue 12',
      receivedBy: '',
      inspectionStatus: 'Pending',
      notes: 'Awaiting quality check',
      location: 'Processing Area',
      receiverDepartment: 'Medical College',
      condition: 'Pending Inspection'
    },
    {
      id: 4,
      serialTitle: 'National Geographic',
      supplierName: 'Global Periodicals Co.',
      dateReceived: null,
      expectedDelivery: '2025-12-08',
      actualDelivery: null,
      deliveryStatus: 'Overdue',
      delay: 7,
      category: 'Geography',
      year: 2025,
      month: 'December',
      volumeIssue: 'Vol 4 Issue 12',
      receivedBy: '',
      inspectionStatus: 'Pending',
      notes: 'Missing shipment, investigating',
      location: 'Distribution Center',
      receiverDepartment: 'Geography Department',
      condition: 'Pending'
    },
    {
      id: 5,
      serialTitle: 'Journal of Medicine',
      supplierName: 'Medical Publications Ltd',
      dateReceived: '2025-12-21',
      expectedDelivery: '2025-12-22',
      actualDelivery: '2025-12-21',
      deliveryStatus: 'Delivered',
      delay: -1,
      category: 'Medical',
      year: 2025,
      month: 'December',
      volumeIssue: 'Vol 3 Issue 11',
      receivedBy: 'K. Dela Rosa',
      inspectionStatus: 'Inspected',
      notes: 'Ready for distribution',
      location: 'Medical Library',
      receiverDepartment: 'Medical College',
      condition: 'Excellent'
    },
    // 2025 Data - November (Matching GSPS)
    {
      id: 6,
      serialTitle: 'Nature',
      supplierName: 'ABC Books Supplier',
      dateReceived: '2025-11-16',
      expectedDelivery: '2025-11-18',
      actualDelivery: '2025-11-16',
      deliveryStatus: 'Delivered',
      delay: -2,
      category: 'Science',
      year: 2025,
      month: 'November',
      volumeIssue: 'Vol 3 Issue 11',
      receivedBy: 'M. Santos',
      inspectionStatus: 'Inspected',
      notes: 'Regular delivery',
      location: 'Main Library',
      receiverDepartment: 'Science Department',
      condition: 'Good'
    },
    {
      id: 7,
      serialTitle: 'Harvard Business Review',
      supplierName: 'Business Publications Inc.',
      dateReceived: '2025-11-12',
      expectedDelivery: '2025-11-13',
      actualDelivery: '2025-11-12',
      deliveryStatus: 'Delivered',
      delay: -1,
      category: 'Business',
      year: 2025,
      month: 'November',
      volumeIssue: 'Vol 2 Issue 11',
      receivedBy: 'J. Ramos',
      inspectionStatus: 'Inspected',
      notes: 'Leadership edition',
      location: 'Business Library',
      receiverDepartment: 'Business School',
      condition: 'Excellent'
    },
    {
      id: 8,
      serialTitle: 'Physics Today',
      supplierName: 'Science Publishers Ltd',
      dateReceived: null,
      expectedDelivery: '2025-11-23',
      actualDelivery: null,
      deliveryStatus: 'Overdue',
      delay: 10,
      category: 'Physics',
      year: 2025,
      month: 'November',
      volumeIssue: 'Vol 5 Issue 10',
      receivedBy: '',
      inspectionStatus: 'Pending',
      notes: 'Delayed shipment',
      location: 'Science Library',
      receiverDepartment: 'Physics Department',
      condition: 'Pending'
    },
    // 2024 Data (Matching GSPS)
    {
      id: 9,
      serialTitle: 'Nature',
      supplierName: 'ABC Books Supplier',
      dateReceived: '2024-09-17',
      expectedDelivery: '2024-09-18',
      actualDelivery: '2024-09-17',
      deliveryStatus: 'Delivered',
      delay: -1,
      category: 'Science',
      year: 2024,
      month: 'September',
      volumeIssue: 'Vol 2 Issue 9',
      receivedBy: 'M. Santos',
      inspectionStatus: 'Inspected',
      notes: 'Year-end special edition',
      location: 'Main Library',
      receiverDepartment: 'Science Department',
      condition: 'Excellent'
    },
    {
      id: 10,
      serialTitle: 'Scientific American',
      supplierName: 'Global Periodicals Co.',
      dateReceived: '2024-08-15',
      expectedDelivery: '2024-08-13',
      actualDelivery: '2024-08-15',
      deliveryStatus: 'Delivered',
      delay: 2,
      category: 'Technology',
      year: 2024,
      month: 'August',
      volumeIssue: 'Vol 3 Issue 8',
      receivedBy: 'J. Ramos',
      inspectionStatus: 'Inspected',
      notes: 'Technology special issue',
      location: 'Tech Library',
      receiverDepartment: 'Engineering Department',
      condition: 'Good'
    },
    {
      id: 11,
      serialTitle: 'The Lancet',
      supplierName: 'MedJournal Suppliers Inc.',
      dateReceived: '2024-07-22',
      expectedDelivery: '2024-07-23',
      actualDelivery: '2024-07-22',
      deliveryStatus: 'Delivered',
      delay: -1,
      category: 'Medical',
      year: 2024,
      month: 'July',
      volumeIssue: 'Vol 1 Issue 7',
      receivedBy: 'L. Cruz',
      inspectionStatus: 'Inspected',
      notes: 'Medical research quarterly',
      location: 'Medical Library',
      receiverDepartment: 'Medical College',
      condition: 'Good'
    },
    // 2023 Data (Matching GSPS)
    {
      id: 12,
      serialTitle: 'Nature',
      supplierName: 'ABC Books Supplier',
      dateReceived: '2023-12-17',
      expectedDelivery: '2023-12-18',
      actualDelivery: '2023-12-17',
      deliveryStatus: 'Delivered',
      delay: -1,
      category: 'Science',
      year: 2023,
      month: 'December',
      volumeIssue: 'Vol 1 Issue 12',
      receivedBy: 'M. Santos',
      inspectionStatus: 'Inspected',
      notes: 'Annual review edition',
      location: 'Main Library',
      receiverDepartment: 'Science Department',
      condition: 'Good'
    },
    {
      id: 13,
      serialTitle: 'The Lancet',
      supplierName: 'MedJournal Suppliers Inc.',
      dateReceived: '2023-10-24',
      expectedDelivery: '2023-10-25',
      actualDelivery: '2023-10-24',
      deliveryStatus: 'Delivered',
      delay: -1,
      category: 'Medical',
      year: 2023,
      month: 'October',
      volumeIssue: 'Vol 1 Issue 10',
      receivedBy: 'L. Cruz',
      inspectionStatus: 'Inspected',
      notes: 'Medical research quarterly',
      location: 'Medical Library',
      receiverDepartment: 'Medical College',
      condition: 'Good'
    },
    {
      id: 14,
      serialTitle: 'Science',
      supplierName: 'Global Periodicals Co.',
      dateReceived: '2023-08-12',
      expectedDelivery: '2023-08-13',
      actualDelivery: '2023-08-12',
      deliveryStatus: 'Delivered',
      delay: -1,
      category: 'Science',
      year: 2023,
      month: 'August',
      volumeIssue: 'Vol 2 Issue 8',
      receivedBy: 'J. Ramos',
      inspectionStatus: 'Inspected',
      notes: 'Summer special edition',
      location: 'Main Library',
      receiverDepartment: 'Science Department',
      condition: 'Good'
    },
    // 2022 Data (Matching GSPS)
    {
      id: 15,
      serialTitle: 'Nature',
      supplierName: 'ABC Books Supplier',
      dateReceived: '2022-11-17',
      expectedDelivery: '2022-11-18',
      actualDelivery: '2022-11-17',
      deliveryStatus: 'Delivered',
      delay: -1,
      category: 'Science',
      year: 2022,
      month: 'November',
      volumeIssue: 'Vol 1 Issue 11',
      receivedBy: 'M. Santos',
      inspectionStatus: 'Inspected',
      notes: 'Climate change special',
      location: 'Main Library',
      receiverDepartment: 'Science Department',
      condition: 'Good'
    },
    {
      id: 16,
      serialTitle: 'The Lancet',
      supplierName: 'MedJournal Suppliers Inc.',
      dateReceived: '2022-09-12',
      expectedDelivery: '2022-09-13',
      actualDelivery: '2022-09-12',
      deliveryStatus: 'Delivered',
      delay: -1,
      category: 'Medical',
      year: 2022,
      month: 'September',
      volumeIssue: 'Vol 1 Issue 9',
      receivedBy: 'L. Cruz',
      inspectionStatus: 'Inspected',
      notes: 'Pandemic research edition',
      location: 'Medical Library',
      receiverDepartment: 'Medical College',
      condition: 'Good'
    },
    {
      id: 17,
      serialTitle: 'Science',
      supplierName: 'Global Periodicals Co.',
      dateReceived: '2022-07-22',
      expectedDelivery: '2022-07-23',
      actualDelivery: '2022-07-22',
      deliveryStatus: 'Delivered',
      delay: -1,
      category: 'Science',
      year: 2022,
      month: 'July',
      volumeIssue: 'Vol 1 Issue 7',
      receivedBy: 'J. Ramos',
      inspectionStatus: 'Inspected',
      notes: 'Space exploration special',
      location: 'Main Library',
      receiverDepartment: 'Science Department',
      condition: 'Good'
    },
  ];

  // Filter data based on selected year and dashboard filters
  const getFilteredData = () => {
    let filtered = receivedData.filter(item => item.year.toString() === selectedYear);
    
    if (dashboardFilter === 'delivered') {
      filtered = filtered.filter(item => item.deliveryStatus === 'Delivered');
    } else if (dashboardFilter === 'undelivered') {
      filtered = filtered.filter(item => item.deliveryStatus !== 'Delivered');
    }
    
    return filtered;
  };

  // Calculate stats for selected year (matching GSPS logic)
  const calculateStats = (data) => {
    const totalReceived = data.length;
    const totalInspected = data.filter(item => item.inspectionStatus === 'Inspected').length;
    const totalDelivered = data.filter(item => item.deliveryStatus === 'Delivered').length;
    const totalPending = data.filter(item => item.deliveryStatus === 'Pending').length;
    const totalOverdue = data.filter(item => item.deliveryStatus === 'Overdue').length;
    const totalUndelivered = totalPending + totalOverdue;
    const inspectionRate = totalReceived > 0 ? Math.round((totalInspected / totalReceived) * 100) : 0;
    const deliveryRate = totalReceived > 0 ? Math.round((totalDelivered / totalReceived) * 100) : 0;
    
    return { totalReceived, totalInspected, totalDelivered, totalUndelivered, totalPending, totalOverdue, inspectionRate, deliveryRate };
  };

  // Generate chart data based on selected timeframe (EXACTLY matching GSPS logic)
  const generateChartData = () => {
    const yearData = getFilteredData();
    
    if (selectedTimeframe === 'month') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months.map(month => {
        const monthItems = yearData.filter(item => {
          const itemDate = item.dateReceived || item.expectedDelivery;
          if (!itemDate) return false;
          const monthIndex = new Date(itemDate).getMonth();
          return months[monthIndex] === month;
        });
        
        const delivered = monthItems.filter(item => item.deliveryStatus === 'Delivered').length;
        const pending = monthItems.filter(item => item.deliveryStatus === 'Pending').length;
        const overdue = monthItems.filter(item => item.deliveryStatus === 'Overdue').length;
        
        return {
          period: month,
          delivered: delivered,
          pending: pending,
          overdue: overdue,
          total: monthItems.length
        };
      }).filter(item => item.total > 0);
    } else if (selectedTimeframe === 'quarter') {
      const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
      return quarters.map(quarter => {
        const quarterMonths = {
          'Q1': ['Jan', 'Feb', 'Mar'],
          'Q2': ['Apr', 'May', 'Jun'],
          'Q3': ['Jul', 'Aug', 'Sep'],
          'Q4': ['Oct', 'Nov', 'Dec']
        }[quarter];
        
        const quarterItems = yearData.filter(item => {
          const itemDate = item.dateReceived || item.expectedDelivery;
          if (!itemDate) return false;
          const month = new Date(itemDate).toLocaleString('default', { month: 'short' });
          return quarterMonths.includes(month);
        });
        
        const delivered = quarterItems.filter(item => item.deliveryStatus === 'Delivered').length;
        const pending = quarterItems.filter(item => item.deliveryStatus === 'Pending').length;
        const overdue = quarterItems.filter(item => item.deliveryStatus === 'Overdue').length;
        
        return {
          period: quarter,
          delivered: delivered,
          pending: pending,
          overdue: overdue,
          total: quarterItems.length
        };
      }).filter(item => item.total > 0);
    } else {
      // Weekly view (matching GSPS)
      const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      return weeks.map((week, index) => {
        const weekItems = yearData.filter(item => {
          const itemDate = item.dateReceived || item.expectedDelivery;
          if (!itemDate) return false;
          const date = new Date(itemDate);
          const weekNum = Math.ceil(date.getDate() / 7);
          return weekNum === index + 1;
        });
        
        const delivered = weekItems.filter(item => item.deliveryStatus === 'Delivered').length;
        const pending = weekItems.filter(item => item.deliveryStatus === 'Pending').length;
        const overdue = weekItems.filter(item => item.deliveryStatus === 'Overdue').length;
        
        return {
          period: week,
          delivered: delivered,
          pending: pending,
          overdue: overdue,
          total: weekItems.length
        };
      }).filter(item => item.total > 0);
    }
  };

  // Supplier performance data - UPDATED COLOR LOGIC
  const generateSupplierPerformanceData = () => {
    const yearData = getFilteredData();
    const suppliers = {};
    
    yearData.forEach(item => {
      if (!suppliers[item.supplierName]) {
        suppliers[item.supplierName] = { 
          deliveries: 0, 
          delivered: 0, 
          pending: 0, 
          overdue: 0 
        };
      }
      suppliers[item.supplierName].deliveries++;
      if (item.deliveryStatus === 'Delivered') {
        suppliers[item.supplierName].delivered++;
      } else if (item.deliveryStatus === 'Pending') {
        suppliers[item.supplierName].pending++;
      } else if (item.deliveryStatus === 'Overdue') {
        suppliers[item.supplierName].overdue++;
      }
    });
    
    // Transform data based on dashboard filter
    if (dashboardFilter === 'delivered') {
      // Only show delivered items - all green
      return Object.entries(suppliers).map(([name, data]) => ({
        name: name.length > 15 ? name.substring(0, 12) + '...' : name,
        delivered: data.delivered,
        fill: '#28a745' // Green for delivered
      })).filter(item => item.delivered > 0).sort((a, b) => b.delivered - a.delivered);
    } else if (dashboardFilter === 'undelivered') {
      // Only show undelivered items - all red
      return Object.entries(suppliers).map(([name, data]) => {
        const undelivered = data.pending + data.overdue;
        return {
          name: name.length > 15 ? name.substring(0, 12) + '...' : name,
          undelivered: undelivered,
          fill: '#dc3545' // Red for undelivered
        };
      }).filter(item => item.undelivered > 0).sort((a, b) => b.undelivered - a.undelivered);
    } else {
      // Show all items - color by status
      return Object.entries(suppliers).map(([name, data]) => ({
        name: name.length > 15 ? name.substring(0, 12) + '...' : name,
        delivered: data.delivered,
        pending: data.pending,
        overdue: data.overdue,
        accuracy: data.deliveries > 0 ? Math.round((data.delivered / data.deliveries) * 100) : 0,
      })).sort((a, b) => b.accuracy - a.accuracy);
    }
  };

  // Status distribution data (EXACTLY matching GSPS)
  const generateStatusDistributionData = () => {
    const yearData = getFilteredData();
    const delivered = yearData.filter(item => item.deliveryStatus === 'Delivered').length;
    const pending = yearData.filter(item => item.deliveryStatus === 'Pending').length;
    const overdue = yearData.filter(item => item.deliveryStatus === 'Overdue').length;
    
    return [
      { name: 'Delivered', value: delivered, color: '#28a745' },
      { name: 'Pending', value: pending, color: '#ffc107' },
      { name: 'Overdue', value: overdue, color: '#dc3545' },
    ];
  };

  // Yearly comparison data - CHANGED TO BAR CHART
  const generateYearlyComparisonData = () => {
    const years = ['2022', '2023', '2024', '2025'];
    return years.map(year => {
      const yearItems = receivedData.filter(item => item.year.toString() === year);
      const delivered = yearItems.filter(item => item.deliveryStatus === 'Delivered').length;
      const pending = yearItems.filter(item => item.deliveryStatus === 'Pending').length;
      const overdue = yearItems.filter(item => item.deliveryStatus === 'Overdue').length;
      const total = yearItems.length;
      const deliveryRate = total > 0 ? Math.round((delivered / total) * 100) : 0;
      
      return {
        year: year,
        delivered: delivered,
        pending: pending,
        overdue: overdue,
        total: total,
        deliveryRate: deliveryRate
      };
    });
  };

  // Prepare chart data
  useEffect(() => {
    const newChartData = {
      monthlyTrends: generateChartData(),
      supplierPerformance: generateSupplierPerformanceData(),
      deliveryStatus: generateStatusDistributionData(),
      yearlyComparison: generateYearlyComparisonData(),
    };
    
    setChartData(newChartData);
  }, [selectedYear, selectedTimeframe, dashboardFilter]);

  // Helper function for category colors
  const getCategoryColor = (category) => {
    const colors = {
      'Science': '#004A98',
      'Medical': '#dc3545',
      'Economics': '#ffc107',
      'Geography': '#28a745',
      'Technology': '#17a2b8',
      'Business': '#6f42c1',
      'Psychology': '#e83e8c',
      'Physics': '#20c997',
      'Arts': '#fd7e14',
      'Engineering': '#6610f2',
      'Education': '#6c757d'
    };
    return colors[category] || '#999';
  };

  // Get current filtered data
  const yearData = getFilteredData();
  const stats = calculateStats(yearData);

  // Filter received items for table (with search)
  const filteredItems = yearData.filter(item => {
    const matchesSearch = 
      item.serialTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.receivedBy.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || item.inspectionStatus === statusFilter;
    
    const matchesDate = !dateFilter || (item.dateReceived && item.dateReceived.includes(dateFilter));
    
    const matchesTitle = !titleFilter || item.serialTitle.toLowerCase().includes(titleFilter.toLowerCase());
    
    return matchesSearch && matchesStatus && matchesDate && matchesTitle;
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = a.dateReceived ? new Date(a.dateReceived) : new Date(a.expectedDelivery);
      const dateB = b.dateReceived ? new Date(b.dateReceived) : new Date(b.expectedDelivery);
      return dateB - dateA;
    }
    if (sortBy === 'title') return a.serialTitle.localeCompare(b.serialTitle);
    if (sortBy === 'status') return a.inspectionStatus.localeCompare(b.inspectionStatus);
    if (sortBy === 'delivery') return a.deliveryStatus.localeCompare(b.deliveryStatus);
    return 0;
  });

  const statsCards = [
    { 
      title: 'Total Received', 
      value: stats.totalReceived, 
      icon: <MdCheckCircle />,
      color: '#004A98',
      description: `Items received in ${selectedYear}`
    },
    { 
      title: 'Delivered', 
      value: stats.totalDelivered, 
      icon: <MdLocalShipping />,
      color: '#28a745',
      description: 'Items delivered'
    },
    { 
      title: 'Pending', 
      value: stats.totalPending, 
      icon: <MdCancel />,
      color: '#ffc107',
      description: 'Items pending delivery'
    },
    { 
      title: 'Overdue', 
      value: stats.totalOverdue, 
      icon: <MdCancel />,
      color: '#dc3545',
      description: 'Items overdue'
    },
    { 
      title: 'Delivery Rate', 
      value: `${stats.deliveryRate}%`, 
      icon: <FaUserCheck />,
      color: '#17a2b8',
      description: 'Delivery completion rate'
    },
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'Inspected': return '#d4edda';
      case 'Pending': return '#fff3cd';
      default: return '#e2e3e5';
    }
  };

  const getStatusTextColor = (status) => {
    switch(status) {
      case 'Inspected': return '#155724';
      case 'Pending': return '#856404';
      default: return '#383d41';
    }
  };

  const getDeliveryStatusColor = (status) => {
    switch(status) {
      case 'Delivered': return '#28a745';
      case 'Pending': return '#ffc107';
      case 'Overdue': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getDeliveryStatusTextColor = (status) => {
    switch(status) {
      case 'Delivered': return '#155724';
      case 'Pending': return '#856404';
      case 'Overdue': return '#721c24';
      default: return '#383d41';
    }
  };

  const handleMarkInspected = (id) => {
    if (window.confirm('Mark this item as inspected?')) {
      alert(`Item ${id} marked as inspected. In a real app, this would update the database.`);
    }
  };

  const handleMarkDelivered = (id) => {
    if (window.confirm('Mark this item as delivered?')) {
      alert(`Item ${id} marked as delivered. In a real app, this would update the database.`);
    }
  };

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setShowDetailsModal(true);
  };

  const handleGenerateReport = () => {
    const reportContent = `
TPU RECEIVED ITEMS REPORT - ${selectedYear}
Generated on: ${new Date().toLocaleDateString()}
Time Frame: ${selectedTimeframe}

YEAR ${selectedYear} SUMMARY:
- Total Items Received: ${stats.totalReceived}
- Delivered Items: ${stats.totalDelivered}
- Pending Delivery: ${stats.totalPending}
- Overdue: ${stats.totalOverdue}
- Delivery Rate: ${stats.deliveryRate}%

TOP PERFORMING SUPPLIERS:
${chartData.supplierPerformance.slice(0, 3).map((s, i) => `${i+1}. ${s.name}: ${s.accuracy || 0}% accuracy`).join('\n')}

DETAILED ITEM LIST:
${sortedItems.map((item, index) => `${index+1}. ${item.serialTitle} (${item.dateReceived || 'Pending'}): ${item.deliveryStatus} - ${item.category}`).join('\n')}
    `;
    
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TPU-Received-Items-${selectedYear}-Report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert(`Report for ${selectedYear} generated successfully! Check your downloads folder.`);
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'white',
          padding: '12px',
          border: '1px solid #ddd',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#004A98' }}>
            {label}
          </p>
          {payload.map((entry, index) => (
            <p key={index} style={{ 
              margin: '4px 0', 
              color: entry.color,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: '2px',
                background: entry.color
              }}></span>
              {entry.name}: <strong>{entry.value}</strong>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Insights narrative - UPDATED for better data alignment
  const getDashboardInsights = () => {
    const insights = [];
    
    insights.push(`In ${selectedYear}, ${stats.totalReceived} items were received with a ${stats.deliveryRate}% delivery rate.`);
    
    if (stats.totalDelivered === stats.totalReceived) {
      insights.push(`Excellent performance! All ${stats.totalReceived} items have been delivered successfully.`);
    } else if (stats.deliveryRate >= 75) {
      insights.push(`Good delivery rate. Focus on the ${stats.totalUndelivered} remaining items to improve efficiency.`);
    } else {
      insights.push(`Delivery performance needs attention. Consider reviewing the ${stats.totalUndelivered} pending and overdue items.`);
    }
    
    const topSupplier = chartData.supplierPerformance[0];
    if (topSupplier) {
      if (dashboardFilter === 'delivered' && topSupplier.delivered > 0) {
        insights.push(`${topSupplier.name} delivered ${topSupplier.delivered} items successfully.`);
      } else if (dashboardFilter === 'undelivered' && topSupplier.undelivered > 0) {
        insights.push(`${topSupplier.name} has ${topSupplier.undelivered} undelivered items requiring attention.`);
      } else if (topSupplier.accuracy === 100) {
        insights.push(`${topSupplier.name} achieved perfect delivery performance with ${topSupplier.delivered} out of ${topSupplier.delivered + topSupplier.pending + topSupplier.overdue} items delivered.`);
      } else if (topSupplier && topSupplier.accuracy >= 90) {
        insights.push(`${topSupplier.name} is the top performer with ${topSupplier.accuracy}% delivery accuracy.`);
      }
    }
    
    // Compare with previous year data
    const currentYearData = chartData.yearlyComparison.find(y => y.year === selectedYear);
    const prevYearData = chartData.yearlyComparison.find(y => y.year === (parseInt(selectedYear) - 1).toString());
    
    if (prevYearData && currentYearData) {
      if (currentYearData.deliveryRate > prevYearData.deliveryRate) {
        insights.push(`Delivery rate improved from ${prevYearData.deliveryRate}% in ${prevYearData.year} to ${currentYearData.deliveryRate}% this year.`);
      } else if (currentYearData.deliveryRate < prevYearData.deliveryRate) {
        insights.push(`Delivery rate decreased from ${prevYearData.deliveryRate}% in ${prevYearData.year} to ${currentYearData.deliveryRate}% this year.`);
      }
    }
    
    return insights;
  };

  const years = ['2022', '2023', '2024', '2025'];

  // Render supplier performance chart based on filter
  const renderSupplierPerformanceChart = () => {
    const data = chartData.supplierPerformance;
    
    if (dashboardFilter === 'delivered') {
      return (
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" stroke="#666" />
          <YAxis stroke="#666" />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="delivered" 
            name="Delivered Items"
            radius={[4, 4, 0, 0]}
            fill="#28a745"
          />
        </BarChart>
      );
    } else if (dashboardFilter === 'undelivered') {
      return (
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" stroke="#666" />
          <YAxis stroke="#666" />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="undelivered" 
            name="Undelivered Items"
            radius={[4, 4, 0, 0]}
            fill="#dc3545"
          />
        </BarChart>
      );
    } else {
      return (
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" stroke="#666" />
          <YAxis stroke="#666" />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="delivered" 
            name="Delivered"
            radius={[4, 4, 0, 0]}
            fill="#28a745"
          />
          <Bar 
            dataKey="pending" 
            name="Pending"
            radius={[4, 4, 0, 0]}
            fill="#ffc107"
          />
          <Bar 
            dataKey="overdue" 
            name="Overdue"
            radius={[4, 4, 0, 0]}
            fill="#dc3545"
          />
        </BarChart>
      );
    }
  };

  return (
    <div style={{ background: '#f0f4f8', minHeight: 'calc(100vh - 120px)', padding: '24px' }}>
      {/* Dashboard Filters */}
      <div style={{ 
        background: '#fff', 
        borderRadius: '12px', 
        padding: '20px', 
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)' 
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          marginBottom: '16px' 
        }}>
          <MdFilterList style={{ color: '#004A98', fontSize: '20px' }} />
          <h3 style={{ margin: 0, color: '#004A98', fontSize: '16px', fontWeight: '600' }}>
            Dashboard Filters
          </h3>
        </div>
        
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {/* Year Selection Dropdown */}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px', 
              color: '#666',
              fontWeight: '500'
            }}>
              Select Year
            </label>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <button
                onClick={() => setYearDropdownOpen(!yearDropdownOpen)}
                style={{
                  padding: '10px 40px 10px 16px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  background: '#fff',
                  color: '#333',
                  fontSize: '14px',
                  cursor: 'pointer',
                  minWidth: '120px',
                  textAlign: 'left',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                {selectedYear}
                <MdExpandMore style={{ 
                  position: 'absolute', 
                  right: '12px', 
                  transition: 'transform 0.2s',
                  transform: yearDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                }} />
              </button>
              
              {yearDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#fff',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  marginTop: '4px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  zIndex: 1000
                }}>
                  {years.map(year => (
                    <button
                      key={year}
                      onClick={() => {
                        setSelectedYear(year);
                        setYearDropdownOpen(false);
                      }}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '10px 16px',
                        border: 'none',
                        background: selectedYear === year ? '#f0f4f8' : 'transparent',
                        color: selectedYear === year ? '#004A98' : '#333',
                        fontSize: '14px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s'
                      }}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Timeframe Selection */}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px', 
              color: '#666',
              fontWeight: '500'
            }}>
              Timeframe
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['month', 'quarter', 'week'].map((timeframe) => (
                <button
                  key={timeframe}
                  onClick={() => setSelectedTimeframe(timeframe)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    background: selectedTimeframe === timeframe ? '#004A98' : '#f0f4f8',
                    color: selectedTimeframe === timeframe ? 'white' : '#666',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontWeight: '500',
                    textTransform: 'capitalize'
                  }}
                >
                  {timeframe}
                </button>
              ))}
            </div>
          </div>

          {/* Delivery Status Filter */}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px', 
              color: '#666',
              fontWeight: '500'
            }}>
              Delivery Status
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['all', 'delivered', 'undelivered'].map((status) => (
                <button
                  key={status}
                  onClick={() => setDashboardFilter(status)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    background: dashboardFilter === status ? 
                      (status === 'delivered' ? '#28a745' : 
                       status === 'undelivered' ? '#dc3545' : '#004A98') : '#f0f4f8',
                    color: dashboardFilter === status ? 'white' : '#666',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontWeight: '500',
                    textTransform: 'capitalize'
                  }}
                >
                  {status === 'all' ? 'All Items' : status}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Insights - UPDATED for better data alignment */}
      <div style={{ 
        background: '#fff', 
        borderRadius: '12px', 
        padding: '20px', 
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        borderLeft: '4px solid #004A98'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          marginBottom: '12px' 
        }}>
          <MdInfo style={{ color: '#004A98', fontSize: '20px' }} />
          <h3 style={{ margin: 0, color: '#004A98', fontSize: '16px', fontWeight: '600' }}>
            Dashboard Insights - {selectedYear}
          </h3>
        </div>
        <p style={{ margin: 0, color: '#666', fontSize: '14px', lineHeight: '1.6' }}>
          {getDashboardInsights().join(' ')}
        </p>
      </div>

      {/* Stats Cards - DATA ALIGNED */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '20px', 
        marginBottom: '30px' 
      }}>
        {statsCards.map((stat, index) => (
          <div
            key={index}
            style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              borderTop: `4px solid ${stat.color}`,
              position: 'relative',
              transition: 'transform 0.2s'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '14px', color: '#666', margin: '0 0 10px 0', fontWeight: '500' }}>
                  {stat.title}
                </h3>
                <p style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  margin: 0,
                  color: stat.color
                }}>
                  {stat.value}
                </p>
                <p style={{ fontSize: '12px', color: '#666', marginTop: '8px', marginBottom: 0 }}>
                  {stat.description}
                </p>
              </div>
              <div style={{
                color: stat.color,
                fontSize: '28px',
                opacity: '0.8'
              }}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section - UPDATED with correct color logic */}
      <div style={{ 
        background: '#fff', 
        borderRadius: '12px', 
        padding: '24px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        marginBottom: '30px'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '30px' 
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px' 
          }}>
            <MdBarChart style={{ color: '#004A98', fontSize: '24px' }} />
            <h3 style={{ margin: 0, color: '#004A98', fontSize: '18px', fontWeight: '600' }}>
              Delivery Analytics - {selectedYear}
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {[
              { id: 'monthly', label: `${selectedTimeframe.charAt(0).toUpperCase() + selectedTimeframe.slice(1)}ly Trend`, icon: <MdBarChart /> },
              { id: 'supplier', label: 'Supplier Performance', icon: <MdBarChart /> },
              { id: 'status', label: 'Status Distribution', icon: <MdBarChart /> },
              { id: 'yearly', label: 'Yearly Comparison', icon: <MdTrendingUp /> }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveChart(item.id)}
                style={{
                  padding: '10px 20px',
                  background: activeChart === item.id ? '#004A98' : '#fff',
                  color: activeChart === item.id ? '#fff' : '#666',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease'
                }}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ height: '400px' }}>
          <ResponsiveContainer width="100%" height="100%">
            {activeChart === 'monthly' && (
              <BarChart data={generateChartData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="period" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="delivered" 
                  name="Delivered"
                  fill="#28a745"
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="pending" 
                  name="Pending"
                  fill="#ffc107"
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="overdue" 
                  name="Overdue"
                  fill="#dc3545"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            )}
            
            {activeChart === 'supplier' && (
              renderSupplierPerformanceChart()
            )}
            
            {activeChart === 'status' && (
              <PieChart>
                <Pie
                  data={generateStatusDistributionData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {generateStatusDistributionData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            )}
            
            {activeChart === 'yearly' && (
              // CHANGED TO BAR CHART
              <BarChart data={generateYearlyComparisonData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="year" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="delivered" 
                  name="Delivered Items"
                  radius={[4, 4, 0, 0]}
                  fill="#28a745"
                />
                <Bar 
                  dataKey="pending" 
                  name="Pending Items"
                  radius={[4, 4, 0, 0]}
                  fill="#ffc107"
                />
                <Bar 
                  dataKey="overdue" 
                  name="Overdue Items"
                  radius={[4, 4, 0, 0]}
                  fill="#dc3545"
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Main Content Card */}
      <div style={{ 
        background: '#fff', 
        borderRadius: '12px', 
        padding: '24px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)' 
      }}>
        {/* Header with title and action buttons */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '24px' 
        }}>
          <div>
            <h2 style={{ 
              margin: 0, 
              color: '#004A98', 
              fontSize: '20px', 
              fontWeight: '600' 
            }}>
              Received Items - {selectedYear}
            </h2>
            <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '14px' }}>
              Manage and track all received serials and their delivery status for {selectedYear}
            </p>
          </div>
          <div>
            <button
              onClick={handleGenerateReport}
              style={{
                padding: '10px 20px',
                background: '#004A98',
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: '500'
              }}
            >
              <MdFileDownload /> Generate Report
            </button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '16px', 
          marginBottom: '24px',
          padding: '20px',
          background: '#f8f9fa',
          borderRadius: '8px'
        }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '250px' }}>
            <MdSearch style={{ 
              position: 'absolute', 
              left: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: '#666' 
            }} />
            <input
              type="text"
              placeholder="Search by title, supplier, or receiver..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 12px 12px 40px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '14px',
                background: '#fff'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Filter by title..."
                value={titleFilter}
                onChange={(e) => setTitleFilter(e.target.value)}
                style={{
                  padding: '12px 12px 12px 40px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  fontSize: '14px',
                  width: '180px'
                }}
              />
              <span style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#666'
              }}>
                📰
              </span>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '12px 36px 12px 12px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '14px',
                background: '#fff',
                cursor: 'pointer',
                minWidth: '160px'
              }}
            >
              <option value="All">All Status</option>
              <option value="Inspected">Inspected</option>
              <option value="Pending">Pending</option>
            </select>

            <div style={{ position: 'relative' }}>
              <FaCalendarAlt style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: '#666',
                zIndex: 1
              }} />
              <input
                type="text"
                placeholder="Filter by date..."
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                style={{
                  padding: '12px 12px 12px 40px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  fontSize: '14px',
                  width: '180px'
                }}
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '12px 36px 12px 12px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '14px',
                background: '#fff',
                cursor: 'pointer'
              }}
            >
              <option value="date">Sort by Date</option>
              <option value="title">Sort by Title</option>
              <option value="status">Sort by Status</option>
              <option value="delivery">Sort by Delivery</option>
            </select>
          </div>
        </div>

        {/* Received Items Table */}
        <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #eee' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ padding: '16px 12px', textAlign: 'left', borderBottom: '2px solid #ddd', color: '#004A98', fontWeight: '600', fontSize: '14px' }}>Serial Title</th>
                <th style={{ padding: '16px 12px', textAlign: 'left', borderBottom: '2px solid #ddd', color: '#004A98', fontWeight: '600', fontSize: '14px' }}>Supplier</th>
                <th style={{ padding: '16px 12px', textAlign: 'left', borderBottom: '2px solid #ddd', color: '#004A98', fontWeight: '600', fontSize: '14px' }}>Date Received</th>
                <th style={{ padding: '16px 12px', textAlign: 'left', borderBottom: '2px solid #ddd', color: '#004A98', fontWeight: '600', fontSize: '14px' }}>Category</th>
                <th style={{ padding: '16px 12px', textAlign: 'left', borderBottom: '2px solid #ddd', color: '#004A98', fontWeight: '600', fontSize: '14px' }}>Inspection Status</th>
                <th style={{ padding: '16px 12px', textAlign: 'left', borderBottom: '2px solid #ddd', color: '#004A98', fontWeight: '600', fontSize: '14px' }}>Delivery Status</th>
                <th style={{ padding: '16px 12px', textAlign: 'left', borderBottom: '2px solid #ddd', color: '#004A98', fontWeight: '600', fontSize: '14px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '16px 12px' }}>
                    <div>
                      <strong style={{ color: '#333', fontSize: '14px' }}>{item.serialTitle}</strong>
                      <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
                        {item.volumeIssue}
                      </div>
                      {item.expectedDelivery && (
                        <div style={{ color: '#999', fontSize: '11px', marginTop: '2px' }}>
                          Expected: {item.expectedDelivery}
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '16px 12px', color: '#666', fontSize: '14px' }}>
                    {item.supplierName}
                  </td>
                  <td style={{ padding: '16px 12px', color: '#666', fontSize: '14px' }}>
                    <div>{item.dateReceived || 'Not yet received'}</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      {item.receivedBy && `By: ${item.receivedBy}`}
                    </div>
                  </td>
                  <td style={{ padding: '16px 12px' }}>
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '500',
                      background: getCategoryColor(item.category) + '20',
                      color: getCategoryColor(item.category),
                      display: 'inline-block',
                      border: `1px solid ${getCategoryColor(item.category)}`
                    }}>
                      {item.category}
                    </span>
                  </td>
                  <td style={{ padding: '16px 12px' }}>
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '500',
                      background: getStatusColor(item.inspectionStatus),
                      color: getStatusTextColor(item.inspectionStatus),
                      display: 'inline-block'
                    }}>
                      {item.inspectionStatus}
                    </span>
                  </td>
                  <td style={{ padding: '16px 12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500',
                        background: getDeliveryStatusColor(item.deliveryStatus) + '20',
                        color: getDeliveryStatusColor(item.deliveryStatus),
                        display: 'inline-block',
                        width: 'fit-content',
                        border: `1px solid ${getDeliveryStatusColor(item.deliveryStatus)}`
                      }}>
                        {item.deliveryStatus}
                        {item.delay !== undefined && item.delay !== 0 && (
                          <span style={{ marginLeft: '6px', fontSize: '10px' }}>
                            ({item.delay > 0 ? `+${item.delay}` : item.delay} days)
                          </span>
                        )}
                      </span>
                      {item.actualDelivery && (
                        <span style={{ fontSize: '12px', color: '#666' }}>
                          Delivered: {item.actualDelivery}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '16px 12px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleViewDetails(item)}
                        style={{
                          padding: '6px 12px',
                          background: '#004A98',
                          border: 'none',
                          borderRadius: '4px',
                          color: 'white',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <MdDescription /> View
                      </button>
                      {item.inspectionStatus === 'Pending' && (
                        <button
                          onClick={() => handleMarkInspected(item.id)}
                          style={{
                            padding: '6px 12px',
                            background: '#28a745',
                            border: 'none',
                            borderRadius: '4px',
                            color: 'white',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Mark Inspected
                        </button>
                      )}
                      {item.deliveryStatus !== 'Delivered' && (
                        <button
                          onClick={() => handleMarkDelivered(item.id)}
                          style={{
                            padding: '6px 12px',
                            background: '#004A98',
                            border: 'none',
                            borderRadius: '4px',
                            color: 'white',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Mark Delivered
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer and Pagination */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid #eee'
        }}>
          <div style={{ color: '#666', fontSize: '14px' }}>
            Showing {sortedItems.length} of {yearData.length} items for {selectedYear}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              style={{
                padding: '8px 16px',
                background: '#f0f4f8',
                border: '1px solid #ddd',
                borderRadius: '4px',
                color: '#666',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Previous
            </button>
            <button
              style={{
                padding: '8px 16px',
                background: '#004A98',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              1
            </button>
            <button
              style={{
                padding: '8px 16px',
                background: '#f0f4f8',
                border: '1px solid #ddd',
                borderRadius: '4px',
                color: '#666',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              2
            </button>
            <button
              style={{
                padding: '8px 16px',
                background: '#f0f4f8',
                border: '1px solid #ddd',
                borderRadius: '4px',
                color: '#666',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Item Details Modal */}
      {showDetailsModal && selectedItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '24px'
            }}>
              <div>
                <h2 style={{ 
                  margin: 0, 
                  color: '#004A98', 
                  fontSize: '20px', 
                  fontWeight: '600',
                  marginBottom: '8px'
                }}>
                  {selectedItem.serialTitle}
                </h2>
                <p style={{ margin: 0, color: '#666', fontSize: '16px' }}>
                  {selectedItem.volumeIssue} • {selectedItem.category}
                </p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: '#666',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                ×
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              marginBottom: '24px'
            }}>
              <div>
                <h3 style={{ 
                  fontSize: '14px', 
                  color: '#666', 
                  margin: '0 0 8px 0',
                  fontWeight: '500'
                }}>
                  Supplier Information
                </h3>
                <div style={{
                  background: '#f8f9fa',
                  padding: '16px',
                  borderRadius: '8px'
                }}>
                  <p style={{ margin: '8px 0', color: '#333' }}>
                    <strong>Supplier:</strong> {selectedItem.supplierName}
                  </p>
                  <p style={{ margin: '8px 0', color: '#333' }}>
                    <strong>Category:</strong> {selectedItem.category}
                  </p>
                  <p style={{ margin: '8px 0', color: '#333' }}>
                    <strong>Year:</strong> {selectedItem.year}
                  </p>
                </div>
              </div>

              <div>
                <h3 style={{ 
                  fontSize: '14px', 
                  color: '#666', 
                  margin: '0 0 8px 0',
                  fontWeight: '500'
                }}>
                  Delivery Information
                </h3>
                <div style={{
                  background: '#f8f9fa',
                  padding: '16px',
                  borderRadius: '8px'
                }}>
                  <p style={{ margin: '8px 0', color: '#333' }}>
                    <strong>Received:</strong> {selectedItem.dateReceived || 'Not yet received'}
                  </p>
                  <p style={{ margin: '8px 0', color: '#333' }}>
                    <strong>Expected:</strong> {selectedItem.expectedDelivery || 'N/A'}
                  </p>
                  <p style={{ margin: '8px 0', color: '#333' }}>
                    <strong>Status:</strong> {selectedItem.deliveryStatus}
                    {selectedItem.delay !== undefined && selectedItem.delay !== 0 && (
                      <span style={{ marginLeft: '6px', color: selectedItem.delay < 0 ? '#28a745' : '#dc3545' }}>
                        ({selectedItem.delay > 0 ? `+${item.delay}` : item.delay} days {selectedItem.delay < 0 ? 'early' : 'late'})
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ 
                fontSize: '14px', 
                color: '#666', 
                margin: '0 0 8px 0',
                fontWeight: '500'
              }}>
                Additional Details
              </h3>
              <div style={{
                background: '#f8f9fa',
                padding: '16px',
                borderRadius: '8px'
              }}>
                <p style={{ margin: '8px 0', color: '#333' }}>
                  <strong>Received By:</strong> {selectedItem.receivedBy || 'Pending'}
                </p>
                <p style={{ margin: '8px 0', color: '#333' }}>
                  <strong>Location:</strong> {selectedItem.location}
                </p>
                <p style={{ margin: '8px 0', color: '#333' }}>
                  <strong>Receiver Department:</strong> {selectedItem.receiverDepartment}
                </p>
                <p style={{ margin: '8px 0', color: '#333' }}>
                  <strong>Condition:</strong> {selectedItem.condition}
                </p>
              </div>
            </div>

            <div>
              <h3 style={{ 
                fontSize: '14px', 
                color: '#666', 
                margin: '0 0 8px 0',
                fontWeight: '500'
              }}>
                Notes
              </h3>
              <div style={{
                background: '#f8f9fa',
                padding: '16px',
                borderRadius: '8px',
                minHeight: '80px'
              }}>
                <p style={{ margin: 0, color: '#333' }}>
                  {selectedItem.notes || 'No additional notes provided.'}
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              marginTop: '24px',
              paddingTop: '20px',
              borderTop: '1px solid #eee'
            }}>
              <button
                onClick={() => setShowDetailsModal(false)}
                style={{
                  padding: '10px 20px',
                  background: '#f0f4f8',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  color: '#666',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Close
              </button>
              {selectedItem.deliveryStatus !== 'Delivered' && (
                <button
                  onClick={() => {
                    handleMarkDelivered(selectedItem.id);
                    setShowDetailsModal(false);
                  }}
                  style={{
                    padding: '10px 20px',
                    background: '#004A98',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Mark as Delivered
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardTPUReceived() {
  return (
    <TPULayout title="Dashboard Overview">
      <ReceivedItems />
    </TPULayout>
  );
}