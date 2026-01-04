import React, { useState, useEffect } from 'react';
import GSPSLayout from '@/Layouts/GSPSLayout';
import { 
  FiTrendingUp, FiTrendingDown, FiBarChart2, FiPieChart, 
  FiActivity, FiBell, FiCalendar, FiPackage, FiCheckCircle,
  FiClock, FiAlertCircle, FiSearch, FiFilter, FiDownload,
  FiEye, FiInfo
} from "react-icons/fi";
import { 
  MdLocalShipping, MdCancel, MdCheckCircle, MdInfo,
  MdNotifications, MdWarning, MdCalendarToday, MdExpandMore
} from "react-icons/md";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, ComposedChart
} from 'recharts';

function GSPSDashboard() {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [activeChart, setActiveChart] = useState('monthly');
  const [selectedYear, setSelectedYear] = useState('2025');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [upcomingFilter, setUpcomingFilter] = useState('all');
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Comprehensive Delivery Tracking Data (2022-2025) - UPDATED for consistency
  const deliveryTrackingData = [
    // 2025 Data - Complete set for all statuses
    {
      id: 1,
      serialTitle: 'Nature',
      supplier: 'ABC Books Supplier',
      dateReceived: '2025-12-17',
      expectedDelivery: '2025-12-18',
      actualDelivery: '2025-12-17',
      status: 'Delivered',
      delay: -1,
      category: 'Science',
      year: 2025,
      month: 'December',
      volumeIssue: 'Vol 3 Issue 12'
    },
    {
      id: 2,
      serialTitle: 'Science',
      supplier: 'Global Periodicals Co.',
      dateReceived: '2025-12-15',
      expectedDelivery: '2025-12-12',
      actualDelivery: '2025-12-15',
      status: 'Delivered',
      delay: 3,
      category: 'Science',
      year: 2025,
      month: 'December',
      volumeIssue: 'Vol 4 Issue 11'
    },
    {
      id: 3,
      serialTitle: 'The Lancet',
      supplier: 'MedJournal Suppliers Inc.',
      dateReceived: null,
      expectedDelivery: '2025-12-20',
      actualDelivery: null,
      status: 'Pending',
      delay: 2,
      category: 'Medical',
      year: 2025,
      month: 'December',
      volumeIssue: 'Vol 1 Issue 12'
    },
    {
      id: 4,
      serialTitle: 'National Geographic',
      supplier: 'Global Periodicals Co.',
      dateReceived: null,
      expectedDelivery: '2025-12-08',
      actualDelivery: null,
      status: 'Overdue',
      delay: 7,
      category: 'Geography',
      year: 2025,
      month: 'December',
      volumeIssue: 'Vol 4 Issue 12'
    },
    {
      id: 5,
      serialTitle: 'Journal of Medicine',
      supplier: 'Medical Publications Ltd',
      dateReceived: '2025-12-21',
      expectedDelivery: '2025-12-22',
      actualDelivery: '2025-12-21',
      status: 'Delivered',
      delay: -1,
      category: 'Medical',
      year: 2025,
      month: 'December',
      volumeIssue: 'Vol 3 Issue 11'
    },
    {
      id: 6,
      serialTitle: 'Nature',
      supplier: 'ABC Books Supplier',
      dateReceived: '2025-11-16',
      expectedDelivery: '2025-11-18',
      actualDelivery: '2025-11-16',
      status: 'Delivered',
      delay: -2,
      category: 'Science',
      year: 2025,
      month: 'November',
      volumeIssue: 'Vol 3 Issue 11'
    },
    {
      id: 7,
      serialTitle: 'Harvard Business Review',
      supplier: 'Business Publications Inc.',
      dateReceived: '2025-11-12',
      expectedDelivery: '2025-11-13',
      actualDelivery: '2025-11-12',
      status: 'Delivered',
      delay: -1,
      category: 'Business',
      year: 2025,
      month: 'November',
      volumeIssue: 'Vol 2 Issue 11'
    },
    {
      id: 8,
      serialTitle: 'Physics Today',
      supplier: 'Science Publishers Ltd',
      dateReceived: null,
      expectedDelivery: '2025-11-23',
      actualDelivery: null,
      status: 'Overdue',
      delay: 10,
      category: 'Physics',
      year: 2025,
      month: 'November',
      volumeIssue: 'Vol 5 Issue 10'
    },
    {
      id: 9,
      serialTitle: 'Art Review',
      supplier: 'Creative Publications',
      dateReceived: '2025-10-10',
      expectedDelivery: '2025-10-08',
      actualDelivery: '2025-10-10',
      status: 'Delivered',
      delay: 2,
      category: 'Arts',
      year: 2025,
      month: 'October',
      volumeIssue: 'Vol 7 Issue 9'
    },
    {
      id: 10,
      serialTitle: 'Journal of Psychology',
      supplier: 'Academic Press',
      dateReceived: '2025-10-14',
      expectedDelivery: '2025-10-15',
      actualDelivery: '2025-10-14',
      status: 'Delivered',
      delay: -1,
      category: 'Psychology',
      year: 2025,
      month: 'October',
      volumeIssue: 'Vol 4 Issue 8'
    },
    {
      id: 11,
      serialTitle: 'Nature',
      supplier: 'ABC Books Supplier',
      dateReceived: '2025-09-15',
      expectedDelivery: '2025-09-18',
      actualDelivery: '2025-09-15',
      status: 'Delivered',
      delay: -3,
      category: 'Science',
      year: 2025,
      month: 'September',
      volumeIssue: 'Vol 3 Issue 9'
    },
    {
      id: 12,
      serialTitle: 'Science',
      supplier: 'Global Periodicals Co.',
      dateReceived: '2025-08-12',
      expectedDelivery: '2025-08-15',
      actualDelivery: '2025-08-12',
      status: 'Delivered',
      delay: -3,
      category: 'Science',
      year: 2025,
      month: 'August',
      volumeIssue: 'Vol 4 Issue 8'
    },
    {
      id: 13,
      serialTitle: 'The Lancet',
      supplier: 'MedJournal Suppliers Inc.',
      dateReceived: null,
      expectedDelivery: '2025-07-25',
      actualDelivery: null,
      status: 'Pending',
      delay: 8,
      category: 'Medical',
      year: 2025,
      month: 'July',
      volumeIssue: 'Vol 1 Issue 7'
    },
    
    // 2024 Data - Consistent set
    {
      id: 14,
      serialTitle: 'Nature',
      supplier: 'ABC Books Supplier',
      dateReceived: '2024-09-17',
      expectedDelivery: '2024-09-18',
      actualDelivery: '2024-09-17',
      status: 'Delivered',
      delay: -1,
      category: 'Science',
      year: 2024,
      month: 'September',
      volumeIssue: 'Vol 2 Issue 9'
    },
    {
      id: 15,
      serialTitle: 'Scientific American',
      supplier: 'Global Periodicals Co.',
      dateReceived: '2024-08-15',
      expectedDelivery: '2024-08-13',
      actualDelivery: '2024-08-15',
      status: 'Delivered',
      delay: 2,
      category: 'Technology',
      year: 2024,
      month: 'August',
      volumeIssue: 'Vol 3 Issue 8'
    },
    {
      id: 16,
      serialTitle: 'The Lancet',
      supplier: 'MedJournal Suppliers Inc.',
      dateReceived: '2024-07-22',
      expectedDelivery: '2024-07-23',
      actualDelivery: '2024-07-22',
      status: 'Delivered',
      delay: -1,
      category: 'Medical',
      year: 2024,
      month: 'July',
      volumeIssue: 'Vol 1 Issue 7'
    },
    {
      id: 17,
      serialTitle: 'Harvard Business Review',
      supplier: 'Business Publications Inc.',
      dateReceived: '2024-07-03',
      expectedDelivery: '2024-06-18',
      actualDelivery: '2024-07-03',
      status: 'Delivered',
      delay: 15,
      category: 'Business',
      year: 2024,
      month: 'July',
      volumeIssue: 'Vol 1 Issue 6'
    },
    {
      id: 18,
      serialTitle: 'Journal of Engineering',
      supplier: 'Tech Publications Ltd',
      dateReceived: '2024-05-12',
      expectedDelivery: '2024-05-13',
      actualDelivery: '2024-05-12',
      status: 'Delivered',
      delay: -1,
      category: 'Engineering',
      year: 2024,
      month: 'May',
      volumeIssue: 'Vol 2 Issue 5'
    },
    {
      id: 19,
      serialTitle: 'National Geographic',
      supplier: 'Global Periodicals Co.',
      dateReceived: '2024-04-07',
      expectedDelivery: '2024-04-08',
      actualDelivery: '2024-04-07',
      status: 'Delivered',
      delay: -1,
      category: 'Geography',
      year: 2024,
      month: 'April',
      volumeIssue: 'Vol 3 Issue 4'
    },
    {
      id: 20,
      serialTitle: 'Science',
      supplier: 'Global Periodicals Co.',
      dateReceived: '2024-03-25',
      expectedDelivery: '2024-03-23',
      actualDelivery: '2024-03-25',
      status: 'Delivered',
      delay: 2,
      category: 'Science',
      year: 2024,
      month: 'March',
      volumeIssue: 'Vol 3 Issue 3'
    },
    {
      id: 21,
      serialTitle: 'Journal of Medicine',
      supplier: 'Medical Publications Ltd',
      dateReceived: null,
      expectedDelivery: '2024-02-15',
      actualDelivery: null,
      status: 'Pending',
      delay: 5,
      category: 'Medical',
      year: 2024,
      month: 'February',
      volumeIssue: 'Vol 3 Issue 2'
    },
    {
      id: 22,
      serialTitle: 'Art Monthly',
      supplier: 'Creative Publications',
      dateReceived: '2024-01-10',
      expectedDelivery: '2024-01-12',
      actualDelivery: '2024-01-10',
      status: 'Delivered',
      delay: -2,
      category: 'Arts',
      year: 2024,
      month: 'January',
      volumeIssue: 'Vol 6 Issue 1'
    },
    {
      id: 23,
      serialTitle: 'Physics Today',
      supplier: 'Science Publishers Ltd',
      dateReceived: null,
      expectedDelivery: '2024-11-15',
      actualDelivery: null,
      status: 'Overdue',
      delay: 10,
      category: 'Physics',
      year: 2024,
      month: 'November',
      volumeIssue: 'Vol 4 Issue 11'
    },
    
    // 2023 Data - Consistent set
    {
      id: 24,
      serialTitle: 'Nature',
      supplier: 'ABC Books Supplier',
      dateReceived: '2023-12-17',
      expectedDelivery: '2023-12-18',
      actualDelivery: '2023-12-17',
      status: 'Delivered',
      delay: -1,
      category: 'Science',
      year: 2023,
      month: 'December',
      volumeIssue: 'Vol 1 Issue 12'
    },
    {
      id: 25,
      serialTitle: 'The Lancet',
      supplier: 'MedJournal Suppliers Inc.',
      dateReceived: '2023-10-24',
      expectedDelivery: '2023-10-25',
      actualDelivery: '2023-10-24',
      status: 'Delivered',
      delay: -1,
      category: 'Medical',
      year: 2023,
      month: 'October',
      volumeIssue: 'Vol 1 Issue 10'
    },
    {
      id: 26,
      serialTitle: 'Science',
      supplier: 'Global Periodicals Co.',
      dateReceived: '2023-08-12',
      expectedDelivery: '2023-08-13',
      actualDelivery: '2023-08-12',
      status: 'Delivered',
      delay: -1,
      category: 'Science',
      year: 2023,
      month: 'August',
      volumeIssue: 'Vol 2 Issue 8'
    },
    {
      id: 27,
      serialTitle: 'Economist',
      supplier: 'Business Publications Inc.',
      dateReceived: '2023-06-17',
      expectedDelivery: '2023-06-18',
      actualDelivery: '2023-06-17',
      status: 'Delivered',
      delay: -1,
      category: 'Economics',
      year: 2023,
      month: 'June',
      volumeIssue: 'Vol 4 Issue 6'
    },
    {
      id: 28,
      serialTitle: 'National Geographic',
      supplier: 'Global Periodicals Co.',
      dateReceived: '2023-04-07',
      expectedDelivery: '2023-04-08',
      actualDelivery: '2023-04-07',
      status: 'Delivered',
      delay: -1,
      category: 'Geography',
      year: 2023,
      month: 'April',
      volumeIssue: 'Vol 2 Issue 4'
    },
    {
      id: 29,
      serialTitle: 'Journal of Engineering',
      supplier: 'Tech Publications Ltd',
      dateReceived: '2023-02-22',
      expectedDelivery: '2023-02-23',
      actualDelivery: '2023-02-22',
      status: 'Delivered',
      delay: -1,
      category: 'Engineering',
      year: 2023,
      month: 'February',
      volumeIssue: 'Vol 1 Issue 2'
    },
    {
      id: 30,
      serialTitle: 'Harvard Business Review',
      supplier: 'Business Publications Inc.',
      dateReceived: null,
      expectedDelivery: '2023-11-15',
      actualDelivery: null,
      status: 'Overdue',
      delay: 10,
      category: 'Business',
      year: 2023,
      month: 'November',
      volumeIssue: 'Vol 1 Issue 11'
    },
    {
      id: 31,
      serialTitle: 'Physics Today',
      supplier: 'Science Publishers Ltd',
      dateReceived: '2023-09-10',
      expectedDelivery: '2023-09-12',
      actualDelivery: '2023-09-10',
      status: 'Delivered',
      delay: -2,
      category: 'Physics',
      year: 2023,
      month: 'September',
      volumeIssue: 'Vol 4 Issue 9'
    },
    {
      id: 32,
      serialTitle: 'Journal of Psychology',
      supplier: 'Academic Press',
      dateReceived: null,
      expectedDelivery: '2023-07-20',
      actualDelivery: null,
      status: 'Pending',
      delay: 3,
      category: 'Psychology',
      year: 2023,
      month: 'July',
      volumeIssue: 'Vol 3 Issue 7'
    },
    
    // 2022 Data - Exactly 9 items: 7 Delivered, 1 Pending, 1 Overdue
    {
      id: 33,
      serialTitle: 'Nature',
      supplier: 'ABC Books Supplier',
      dateReceived: '2022-11-17',
      expectedDelivery: '2022-11-18',
      actualDelivery: '2022-11-17',
      status: 'Delivered',
      delay: -1,
      category: 'Science',
      year: 2022,
      month: 'November',
      volumeIssue: 'Vol 1 Issue 11'
    },
    {
      id: 34,
      serialTitle: 'The Lancet',
      supplier: 'MedJournal Suppliers Inc.',
      dateReceived: '2022-09-12',
      expectedDelivery: '2022-09-13',
      actualDelivery: '2022-09-12',
      status: 'Delivered',
      delay: -1,
      category: 'Medical',
      year: 2022,
      month: 'September',
      volumeIssue: 'Vol 1 Issue 9'
    },
    {
      id: 35,
      serialTitle: 'Science',
      supplier: 'Global Periodicals Co.',
      dateReceived: '2022-07-22',
      expectedDelivery: '2022-07-23',
      actualDelivery: '2022-07-22',
      status: 'Delivered',
      delay: -1,
      category: 'Science',
      year: 2022,
      month: 'July',
      volumeIssue: 'Vol 1 Issue 7'
    },
    {
      id: 36,
      serialTitle: 'Business Week',
      supplier: 'Business Publications Inc.',
      dateReceived: '2022-05-07',
      expectedDelivery: '2022-05-08',
      actualDelivery: '2022-05-07',
      status: 'Delivered',
      delay: -1,
      category: 'Business',
      year: 2022,
      month: 'May',
      volumeIssue: 'Vol 2 Issue 5'
    },
    {
      id: 37,
      serialTitle: 'Art Monthly',
      supplier: 'Creative Publications',
      dateReceived: '2022-03-17',
      expectedDelivery: '2022-03-18',
      actualDelivery: '2022-03-17',
      status: 'Delivered',
      delay: -1,
      category: 'Arts',
      year: 2022,
      month: 'March',
      volumeIssue: 'Vol 3 Issue 3'
    },
    {
      id: 38,
      serialTitle: 'Journal of Education',
      supplier: 'Academic Press',
      dateReceived: '2022-01-12',
      expectedDelivery: '2022-01-13',
      actualDelivery: '2022-01-12',
      status: 'Delivered',
      delay: -1,
      category: 'Education',
      year: 2022,
      month: 'January',
      volumeIssue: 'Vol 1 Issue 1'
    },
    {
      id: 39,
      serialTitle: 'National Geographic',
      supplier: 'Global Periodicals Co.',
      dateReceived: '2022-10-08',
      expectedDelivery: '2022-10-10',
      actualDelivery: '2022-10-08',
      status: 'Delivered',
      delay: -2,
      category: 'Geography',
      year: 2022,
      month: 'October',
      volumeIssue: 'Vol 2 Issue 10'
    },
    {
      id: 40,
      serialTitle: 'Journal of Medicine',
      supplier: 'Medical Publications Ltd',
      dateReceived: null,
      expectedDelivery: '2022-08-20',
      actualDelivery: null,
      status: 'Pending',
      delay: 5,
      category: 'Medical',
      year: 2022,
      month: 'August',
      volumeIssue: 'Vol 2 Issue 8'
    },
    {
      id: 41,
      serialTitle: 'Harvard Business Review',
      supplier: 'Business Publications Inc.',
      dateReceived: null,
      expectedDelivery: '2022-12-15',
      actualDelivery: null,
      status: 'Overdue',
      delay: 8,
      category: 'Business',
      year: 2022,
      month: 'December',
      volumeIssue: 'Vol 1 Issue 12'
    },
  ];

  // Upcoming serials data (2025-2026)
  const upcomingSerials = [
    {
      id: 1,
      title: 'Nature',
      supplier: 'ABC Books Supplier',
      expectedDate: '2025-12-28',
      volumeIssue: 'Vol 3 Issue 1',
      category: 'Science',
      year: 2025
    },
    {
      id: 2,
      title: 'Science',
      supplier: 'Global Periodicals Co.',
      expectedDate: '2025-12-30',
      volumeIssue: 'Vol 4 Issue 1',
      category: 'Science',
      year: 2025
    },
    {
      id: 3,
      title: 'The Lancet',
      supplier: 'MedJournal Suppliers Inc.',
      expectedDate: '2026-01-05',
      volumeIssue: 'Vol 2 Issue 1',
      category: 'Medical',
      year: 2026
    },
  ];

  // Calculate stats for selected year - USES SAME DATA AS EVERYTHING ELSE
  const calculateYearStats = () => {
    const yearData = deliveryTrackingData.filter(item => item.year.toString() === selectedYear);
    const total = yearData.length;
    const delivered = yearData.filter(item => item.status === 'Delivered').length;
    const pending = yearData.filter(item => item.status === 'Pending').length;
    const overdue = yearData.filter(item => item.status === 'Overdue').length;
    const deliveryRate = total > 0 ? Math.round((delivered / total) * 100) : 0;
    
    return { total, delivered, pending, overdue, deliveryRate };
  };

  const yearStats = calculateYearStats();

  // Filter delivery data based on selected year and status filter - FOR TABLE
  const filteredDeliveries = deliveryTrackingData.filter(item => {
    const matchesYear = item.year.toString() === selectedYear;
    const matchesSearch = 
      item.serialTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    
    return matchesYear && matchesSearch && matchesStatus;
  });

  // Chart Data Generator - Simplified for monthly, quarterly, weekly
  const generateChartData = (type = 'monthly') => {
    const yearData = deliveryTrackingData.filter(item => item.year.toString() === selectedYear);
    
    if (type === 'monthly') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months.map(month => {
        const monthItems = yearData.filter(item => {
          const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ];
          const itemMonthIndex = monthNames.findIndex(m => m === item.month);
          return months[itemMonthIndex] === month;
        });
        
        const delivered = monthItems.filter(item => item.status === 'Delivered').length;
        const pending = monthItems.filter(item => item.status === 'Pending').length;
        const overdue = monthItems.filter(item => item.status === 'Overdue').length;
        const total = delivered + pending + overdue;
        
        return {
          period: month,
          delivered: delivered,
          pending: pending,
          overdue: overdue,
          total: total
        };
      });
    } else if (type === 'quarterly') {
      const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
      const quarterMonths = {
        'Q1': ['Jan', 'Feb', 'Mar'],
        'Q2': ['Apr', 'May', 'Jun'],
        'Q3': ['Jul', 'Aug', 'Sep'],
        'Q4': ['Oct', 'Nov', 'Dec']
      };
      
      return quarters.map(quarter => {
        const quarterItems = yearData.filter(item => {
          const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ];
          const itemMonthIndex = monthNames.findIndex(m => m === item.month);
          const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][itemMonthIndex];
          return quarterMonths[quarter].includes(month);
        });
        
        const delivered = quarterItems.filter(item => item.status === 'Delivered').length;
        const pending = quarterItems.filter(item => item.status === 'Pending').length;
        const overdue = quarterItems.filter(item => item.status === 'Overdue').length;
        const total = delivered + pending + overdue;
        
        return {
          period: quarter,
          delivered: delivered,
          pending: pending,
          overdue: overdue,
          total: total
        };
      });
    } else if (type === 'weekly') {
      // Weekly trend - using 4 weeks for simplicity
      const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      return weeks.map((week, index) => {
        // Distribute items evenly across weeks for demo
        const weekItems = yearData.filter((item, idx) => {
          const weekNum = Math.floor((idx / yearData.length) * 4) + 1;
          return weekNum === index + 1;
        });
        
        const delivered = weekItems.filter(item => item.status === 'Delivered').length;
        const pending = weekItems.filter(item => item.status === 'Pending').length;
        const overdue = weekItems.filter(item => item.status === 'Overdue').length;
        const total = delivered + pending + overdue;
        
        return {
          period: week,
          delivered: delivered,
          pending: pending,
          overdue: overdue,
          total: total
        };
      });
    }
    
    // Default monthly
    return [];
  };

  // Supplier Performance Data - USES SAME DATA
  const getSupplierPerformanceData = () => {
    const yearData = deliveryTrackingData.filter(item => item.year.toString() === selectedYear);
    const suppliers = {};
    
    yearData.forEach(item => {
      if (!suppliers[item.supplier]) {
        suppliers[item.supplier] = { 
          items: 0, 
          delivered: 0,
          pending: 0,
          overdue: 0,
          accuracy: 0
        };
      }
      suppliers[item.supplier].items++;
      if (item.status === 'Delivered') {
        suppliers[item.supplier].delivered++;
      } else if (item.status === 'Pending') {
        suppliers[item.supplier].pending++;
      } else if (item.status === 'Overdue') {
        suppliers[item.supplier].overdue++;
      }
    });
    
    return Object.entries(suppliers).map(([name, data]) => ({
      name: name.length > 15 ? name.substring(0, 12) + '...' : name,
      items: data.items,
      delivered: data.delivered,
      pending: data.pending,
      overdue: data.overdue,
      accuracy: data.items > 0 ? Math.round((data.delivered / data.items) * 100) : 0,
      fill: getSupplierColor(name)
    })).sort((a, b) => b.accuracy - a.accuracy);
  };

  // Status Distribution Data - USES SAME DATA
  const statusDistributionData = () => {
    const yearData = deliveryTrackingData.filter(item => item.year.toString() === selectedYear);
    const delivered = yearData.filter(item => item.status === 'Delivered').length;
    const pending = yearData.filter(item => item.status === 'Pending').length;
    const overdue = yearData.filter(item => item.status === 'Overdue').length;
    const total = delivered + pending + overdue;
    
    return [
      { 
        name: 'Delivered', 
        value: delivered, 
        percentage: total > 0 ? Math.round((delivered / total) * 100) : 0,
        color: '#28a745' 
      },
      { 
        name: 'Pending', 
        value: pending, 
        percentage: total > 0 ? Math.round((pending / total) * 100) : 0,
        color: '#ffc107' 
      },
      { 
        name: 'Overdue', 
        value: overdue, 
        percentage: total > 0 ? Math.round((overdue / total) * 100) : 0,
        color: '#dc3545' 
      },
    ];
  };

  // Yearly Comparison Data - USES SAME DATA
  const yearlyComparisonData = () => {
    const years = ['2022', '2023', '2024', '2025'];
    return years.map(year => {
      const yearItems = deliveryTrackingData.filter(item => item.year.toString() === year);
      const delivered = yearItems.filter(item => item.status === 'Delivered').length;
      const pending = yearItems.filter(item => item.status === 'Pending').length;
      const overdue = yearItems.filter(item => item.status === 'Overdue').length;
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

  // Calculate year-over-year changes - USES SAME DATA
  const calculateTotalSerialsChange = () => {
    const currentYear = parseInt(selectedYear);
    const previousYear = currentYear - 1;
    
    const currentYearData = deliveryTrackingData.filter(item => item.year === currentYear);
    const currentTotal = currentYearData.length;
    
    const previousYearData = deliveryTrackingData.filter(item => item.year === previousYear);
    const previousTotal = previousYearData.length;
    
    if (previousTotal === 0) return { change: currentTotal, percent: 100, type: 'new' };
    
    const change = currentTotal - previousTotal;
    const percentChange = Math.round((change / previousTotal) * 100);
    
    return { 
      change: change, 
      percent: Math.abs(percentChange), 
      type: change > 0 ? 'increase' : change < 0 ? 'decrease' : 'same',
      previousTotal: previousTotal
    };
  };

  const calculateDeliveredChange = () => {
    const currentYear = parseInt(selectedYear);
    const previousYear = currentYear - 1;
    
    const currentYearData = deliveryTrackingData.filter(item => item.year === currentYear);
    const currentDelivered = currentYearData.filter(item => item.status === 'Delivered').length;
    
    const previousYearData = deliveryTrackingData.filter(item => item.year === previousYear);
    const previousDelivered = previousYearData.filter(item => item.status === 'Delivered').length;
    
    if (previousDelivered === 0) return { change: currentDelivered, percent: 100, type: 'new' };
    
    const change = currentDelivered - previousDelivered;
    const percentChange = Math.round((change / previousDelivered) * 100);
    
    return { 
      change: change, 
      percent: Math.abs(percentChange), 
      type: change > 0 ? 'increase' : change < 0 ? 'decrease' : 'same',
      previousDelivered: previousDelivered
    };
  };

  const calculatePendingChange = () => {
    const currentYear = parseInt(selectedYear);
    const previousYear = currentYear - 1;
    
    const currentYearData = deliveryTrackingData.filter(item => item.year === currentYear);
    const currentPending = currentYearData.filter(item => item.status === 'Pending').length;
    const currentOverdue = currentYearData.filter(item => item.status === 'Overdue').length;
    const currentTotalPending = currentPending + currentOverdue;
    
    const previousYearData = deliveryTrackingData.filter(item => item.year === previousYear);
    const previousPending = previousYearData.filter(item => item.status === 'Pending').length;
    const previousOverdue = previousYearData.filter(item => item.status === 'Overdue').length;
    const previousTotalPending = previousPending + previousOverdue;
    
    if (previousTotalPending === 0 && currentTotalPending > 0) return { change: currentTotalPending, percent: 100, type: 'new' };
    if (previousTotalPending === 0 && currentTotalPending === 0) return { change: 0, percent: 0, type: 'same' };
    
    const change = currentTotalPending - previousTotalPending;
    const percentChange = Math.round((change / previousTotalPending) * 100);
    
    return { 
      change: change, 
      percent: Math.abs(percentChange), 
      type: change > 0 ? 'increase' : change < 0 ? 'decrease' : 'same',
      previousTotalPending: previousTotalPending
    };
  };

  const calculateDeliveryRateChange = () => {
    const currentYear = parseInt(selectedYear);
    const previousYear = currentYear - 1;
    
    const currentYearData = deliveryTrackingData.filter(item => item.year === currentYear);
    const currentDelivered = currentYearData.filter(item => item.status === 'Delivered').length;
    const currentTotal = currentYearData.length;
    const currentRate = currentTotal > 0 ? Math.round((currentDelivered / currentTotal) * 100) : 0;
    
    const previousYearData = deliveryTrackingData.filter(item => item.year === previousYear);
    const previousDelivered = previousYearData.filter(item => item.status === 'Delivered').length;
    const previousTotal = previousYearData.length;
    const previousRate = previousTotal > 0 ? Math.round((previousDelivered / previousTotal) * 100) : 0;
    
    if (previousRate === 0) return { change: currentRate, percent: currentRate, type: 'new' };
    
    const change = currentRate - previousRate;
    
    return { 
      change: change, 
      percent: Math.abs(change), 
      type: change > 0 ? 'increase' : change < 0 ? 'decrease' : 'same',
      previousRate: previousRate
    };
  };

  // Calculate changes
  const totalSerialsChange = calculateTotalSerialsChange();
  const deliveredChange = calculateDeliveredChange();
  const pendingChange = calculatePendingChange();
  const deliveryRateChange = calculateDeliveryRateChange();

  // Helper functions
  const getStatusColor = (status) => {
    switch(status) {
      case 'Delivered': return '#28a745';
      case 'Pending': return '#ffc107';
      case 'Overdue': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Science': '#004A98',
      'Medical': '#dc3545',
      'Business': '#6f42c1',
      'Technology': '#17a2b8',
      'Engineering': '#6610f2',
      'Geography': '#28a745',
      'Economics': '#ffc107',
      'Arts': '#fd7e14',
      'Psychology': '#e83e8c',
      'Physics': '#20c997',
      'Education': '#6c757d'
    };
    return colors[category] || '#999';
  };

  const getSupplierColor = (supplier) => {
    const supplierColors = {
      'ABC Books Supplier': '#004A98',
      'MedJournal Suppliers Inc.': '#28a745',
      'Global Periodicals Co.': '#17a2b8',
      'Business Publications Inc.': '#ffc107',
      'Medical Publications Ltd': '#dc3545',
      'Science Publishers Ltd': '#20c997',
      'Creative Publications': '#fd7e14',
      'Academic Press': '#6c757d',
      'Tech Publications Ltd': '#6610f2'
    };
    return supplierColors[supplier] || '#999';
  };

  const cardStyle = (isHovered) => ({
    background: '#fff',
    borderRadius: 12,
    boxShadow: isHovered 
      ? '0 8px 25px rgba(0,0,0,0.15)' 
      : '0 2px 8px rgba(0,0,0,0.05)',
    padding: 24,
    flex: 1,
    position: 'relative',
    transition: 'all 0.3s ease',
    transform: isHovered ? 'translateY(-5px)' : 'none',
    cursor: 'pointer',
    borderTop: `4px solid ${isHovered ? '#004A98' : '#f0f4f8'}`,
    minHeight: '140px',
  });

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
            {label} - {selectedYear}
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

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div style={{
          background: 'white',
          padding: '16px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            marginBottom: '8px'
          }}>
            <span style={{
              display: 'inline-block',
              width: '16px',
              height: '16px',
              borderRadius: '4px',
              background: data.payload.color
            }}></span>
            <span style={{ fontWeight: '600', fontSize: '15px' }}>
              {data.name}
            </span>
          </div>
          <p style={{ margin: '4px 0', color: '#666', fontSize: '13px' }}>
            Count: <strong style={{ color: '#333' }}>{data.value}</strong>
          </p>
          <p style={{ margin: '4px 0', color: '#666', fontSize: '13px' }}>
            Percentage: <strong style={{ color: '#333' }}>{data.payload.percentage}%</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setShowDetailsModal(true);
  };

  const years = ['2022', '2023', '2024', '2025'];

  return (
    <div style={{ background: '#f0f4f8', minHeight: 'calc(100vh - 120px)', padding: '24px' }}>
      {/* Dashboard Overview */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 30, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <FiBarChart2 style={{ color: '#004A98', fontSize: '24px' }} />
          <h3 style={{ margin: 0, color: '#004A98', fontSize: '20px', fontWeight: '600' }}>
            Dashboard Overview
          </h3>
        </div>

        {/* Dashboard Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 40 }}>
          {/* Total Serials Card */}
          <div style={cardStyle(hoveredCard === 0)} onMouseEnter={() => setHoveredCard(0)} onMouseLeave={() => setHoveredCard(null)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: 14, color: '#666', margin: '0 0 12px 0', fontWeight: 500 }}>
                  Total Serials ({selectedYear})
                </h3>
                <p style={{ fontSize: 32, fontWeight: 'bold', margin: '0 0 8px 0', color: '#004A98' }}>
                  {yearStats.total}
                </p>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  fontSize: '13px', 
                  color: totalSerialsChange.type === 'increase' ? '#28a745' : totalSerialsChange.type === 'decrease' ? '#dc3545' : '#666'
                }}>
                  <FiTrendingUp style={{ 
                    transform: totalSerialsChange.type === 'decrease' ? 'rotate(180deg)' : 'none',
                    color: totalSerialsChange.type === 'increase' ? '#28a745' : totalSerialsChange.type === 'decrease' ? '#dc3545' : '#666'
                  }} />
                  {totalSerialsChange.type === 'new' ? (
                    <span>+{totalSerialsChange.change} (new)</span>
                  ) : totalSerialsChange.type === 'same' ? (
                    <span>No change from {Number(selectedYear)-1}</span>
                  ) : (
                    <span>
                      {totalSerialsChange.change > 0 ? '+' : ''}{totalSerialsChange.change} 
                      ({totalSerialsChange.change > 0 ? '+' : ''}{totalSerialsChange.percent}%) from {Number(selectedYear)-1}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ color: '#004A98', fontSize: 24, opacity: 0.8 }}>
                <FiTrendingUp />
              </div>
            </div>
          </div>

          {/* Delivered Card */}
          <div style={cardStyle(hoveredCard === 1)} onMouseEnter={() => setHoveredCard(1)} onMouseLeave={() => setHoveredCard(null)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: 14, color: '#666', margin: '0 0 12px 0', fontWeight: 500 }}>
                  Delivered ({selectedYear})
                </h3>
                <p style={{ fontSize: 32, fontWeight: 'bold', margin: '0 0 8px 0', color: '#28a745' }}>
                  {yearStats.delivered}
                </p>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  fontSize: '13px', 
                  color: deliveredChange.type === 'increase' ? '#28a745' : deliveredChange.type === 'decrease' ? '#dc3545' : '#666'
                }}>
                  <FiTrendingUp style={{ 
                    transform: deliveredChange.type === 'decrease' ? 'rotate(180deg)' : 'none',
                    color: deliveredChange.type === 'increase' ? '#28a745' : deliveredChange.type === 'decrease' ? '#dc3545' : '#666'
                  }} />
                  {deliveredChange.type === 'new' ? (
                    <span>+{deliveredChange.change} (new)</span>
                  ) : deliveredChange.type === 'same' ? (
                    <span>No change from {Number(selectedYear)-1}</span>
                  ) : (
                    <span>
                      {deliveredChange.change > 0 ? '+' : ''}{deliveredChange.change} 
                      ({deliveredChange.change > 0 ? '+' : ''}{deliveredChange.percent}%) from {Number(selectedYear)-1}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ color: '#28a745', fontSize: 24, opacity: 0.8 }}>
                <FiCheckCircle />
              </div>
            </div>
          </div>

          {/* Pending Delivery Card */}
          <div style={cardStyle(hoveredCard === 2)} onMouseEnter={() => setHoveredCard(2)} onMouseLeave={() => setHoveredCard(null)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: 14, color: '#666', margin: '0 0 12px 0', fontWeight: 500 }}>
                  Pending Delivery
                </h3>
                <p style={{ fontSize: 32, fontWeight: 'bold', margin: '0 0 8px 0', color: '#ffc107' }}>
                  {yearStats.pending + yearStats.overdue}
                </p>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  fontSize: '13px', 
                  color: pendingChange.type === 'increase' ? '#dc3545' : pendingChange.type === 'decrease' ? '#28a745' : '#666'
                }}>
                  <FiAlertCircle style={{ 
                    color: pendingChange.type === 'increase' ? '#dc3545' : pendingChange.type === 'decrease' ? '#28a745' : '#666'
                  }} />
                  {pendingChange.type === 'new' ? (
                    <span>+{pendingChange.change} (new)</span>
                  ) : pendingChange.type === 'same' ? (
                    <span>No change from {Number(selectedYear)-1}</span>
                  ) : (
                    <span>
                      {pendingChange.change > 0 ? '+' : ''}{pendingChange.change} 
                      ({pendingChange.change > 0 ? '+' : ''}{pendingChange.percent}%) from {Number(selectedYear)-1}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ color: '#ffc107', fontSize: 24, opacity: 0.8 }}>
                <FiClock />
              </div>
            </div>
          </div>

          {/* Delivery Rate Card */}
          <div style={cardStyle(hoveredCard === 3)} onMouseEnter={() => setHoveredCard(3)} onMouseLeave={() => setHoveredCard(null)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: 14, color: '#666', margin: '0 0 12px 0', fontWeight: 500 }}>
                  Delivery Rate ({selectedYear})
                </h3>
                <p style={{ fontSize: 32, fontWeight: 'bold', margin: '0 0 8px 0', color: '#28a745' }}>
                  {yearStats.deliveryRate}%
                </p>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  fontSize: '13px', 
                  color: deliveryRateChange.type === 'increase' ? '#28a745' : deliveryRateChange.type === 'decrease' ? '#dc3545' : '#666'
                }}>
                  <FiTrendingUp style={{ 
                    transform: deliveryRateChange.type === 'decrease' ? 'rotate(180deg)' : 'none',
                    color: deliveryRateChange.type === 'increase' ? '#28a745' : deliveryRateChange.type === 'decrease' ? '#dc3545' : '#666'
                  }} />
                  {deliveryRateChange.type === 'new' ? (
                    <span>+{deliveryRateChange.change}% (new)</span>
                  ) : deliveryRateChange.type === 'same' ? (
                    <span>No change from {Number(selectedYear)-1}</span>
                  ) : (
                    <span>
                      {deliveryRateChange.change > 0 ? '+' : ''}{deliveryRateChange.change}% 
                      from {Number(selectedYear)-1}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ color: '#28a745', fontSize: 24, opacity: 0.8 }}>
                <FiTrendingDown />
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Filters - Simplified */}
        <div style={{ 
          background: '#f8f9fa', 
          borderRadius: '8px', 
          padding: '20px', 
          marginBottom: '30px'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            marginBottom: '16px' 
          }}>
            <FiFilter style={{ color: '#004A98', fontSize: '20px' }} />
            <h3 style={{ margin: 0, color: '#004A98', fontSize: '16px', fontWeight: '600' }}>
              Dashboard Filters
            </h3>
          </div>
          
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Year Selection */}
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

            {/* Status Filter - Moved to where timeframe was */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                color: '#666',
                fontWeight: '500'
              }}>
                Delivery Status Filter
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['All', 'Delivered', 'Pending', 'Overdue'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: statusFilter === status ? getStatusColor(status) : '#f0f4f8',
                      color: statusFilter === status ? 'white' : '#666',
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontWeight: '500'
                    }}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div style={{ marginTop: '30px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '30px' 
          }}>
            <h3 style={{ color: '#004A98', margin: 0, fontSize: '18px', fontWeight: '600' }}>Delivery Analytics - {selectedYear}</h3>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {[
                { id: 'monthly', label: `Monthly Trend`, icon: <FiBarChart2 /> },
                { id: 'quarterly', label: 'Quarterly Trend', icon: <FiBarChart2 /> },
                { id: 'weekly', label: 'Weekly Trend', icon: <FiBarChart2 /> },
                { id: 'supplier', label: 'Supplier Performance', icon: <FiBarChart2 /> },
                { id: 'status', label: 'Status Distribution', icon: <FiPieChart /> },
                { id: 'yearly', label: 'Yearly Comparison', icon: <FiActivity /> }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveChart(item.id)}
                  style={{
                    padding: '10px 16px',
                    background: activeChart === item.id ? '#004A98' : '#fff',
                    color: activeChart === item.id ? '#fff' : '#666',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease',
                    whiteSpace: 'nowrap'
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
              {/* Monthly Trend Chart - Bar chart only, no lines */}
              {activeChart === 'monthly' && (
                <BarChart data={generateChartData('monthly')}>
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
                    barSize={30}
                  />
                  <Bar 
                    dataKey="pending" 
                    name="Pending"
                    fill="#ffc107"
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                  />
                  <Bar 
                    dataKey="overdue" 
                    name="Overdue"
                    fill="#dc3545"
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                  />
                </BarChart>
              )}

              {/* Quarterly Trend Chart - Bar chart only, no lines */}
              {activeChart === 'quarterly' && (
                <BarChart data={generateChartData('quarterly')}>
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
                    barSize={40}
                  />
                  <Bar 
                    dataKey="pending" 
                    name="Pending"
                    fill="#ffc107"
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  />
                  <Bar 
                    dataKey="overdue" 
                    name="Overdue"
                    fill="#dc3545"
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              )}

              {/* Weekly Trend Chart - Bar chart only, no lines */}
              {activeChart === 'weekly' && (
                <BarChart data={generateChartData('weekly')}>
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
                    barSize={40}
                  />
                  <Bar 
                    dataKey="pending" 
                    name="Pending"
                    fill="#ffc107"
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  />
                  <Bar 
                    dataKey="overdue" 
                    name="Overdue"
                    fill="#dc3545"
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              )}
              
              {/* Supplier Performance Chart - Bar chart only, no lines */}
              {activeChart === 'supplier' && (
                <BarChart data={getSupplierPerformanceData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="delivered" 
                    name="Delivered"
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                  >
                    {getSupplierPerformanceData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                  <Bar 
                    dataKey="pending" 
                    name="Pending"
                    fill="#ffc107"
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                  />
                  <Bar 
                    dataKey="overdue" 
                    name="Overdue"
                    fill="#dc3545"
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                  />
                </BarChart>
              )}
              
              {/* Status Distribution Chart */}
              {activeChart === 'status' && (
                <PieChart>
                  <Pie
                    data={statusDistributionData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value} (${entry.percentage}%)`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusDistributionData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Legend />
                </PieChart>
              )}
              
              {/* Yearly Comparison Chart - Bar chart only, no lines */}
              {activeChart === 'yearly' && (
                <BarChart data={yearlyComparisonData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="year" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="delivered" 
                    name="Delivered"
                    fill="#28a745"
                    radius={[4, 4, 0, 0]}
                    barSize={25}
                  />
                  <Bar 
                    dataKey="pending" 
                    name="Pending"
                    fill="#ffc107"
                    radius={[4, 4, 0, 0]}
                    barSize={25}
                  />
                  <Bar 
                    dataKey="overdue" 
                    name="Overdue"
                    fill="#dc3545"
                    radius={[4, 4, 0, 0]}
                    barSize={25}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Main Content Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30, marginBottom: 40 }}>
        {/* Delivery Tracking Table */}
        <div style={{ 
          background: '#fff', 
          borderRadius: 12, 
          padding: 24, 
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          height: '600px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: 20 
          }}>
            <h3 style={{ color: '#004A98', margin: 0, fontSize: 18, fontWeight: '600' }}>
              Delivery Tracking - {selectedYear} ({statusFilter === 'All' ? 'All Statuses' : statusFilter})
            </h3>
            <div style={{ position: 'relative' }}>
              <FiSearch style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: '#666' 
              }} />
              <input
                type="text"
                placeholder="Search deliveries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '8px 12px 8px 36px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  fontSize: '14px',
                  width: '250px'
                }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto', flex: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5', position: 'sticky', top: 0 }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '13px', borderBottom: '2px solid #ddd' }}>Serial Title</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '13px', borderBottom: '2px solid #ddd' }}>Category</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '13px', borderBottom: '2px solid #ddd' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '13px', borderBottom: '2px solid #ddd' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeliveries.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>
                      <div>
                        <strong style={{ color: '#333', fontSize: '14px' }}>{item.serialTitle}</strong>
                        <div style={{ color: '#666', fontSize: '12px', marginTop: '2px' }}>
                          {item.supplier}
                        </div>
                        <div style={{ color: '#999', fontSize: '11px', marginTop: '2px' }}>
                          Expected: {item.expectedDelivery}
                        </div>
                        {item.dateReceived && (
                          <div style={{ color: '#999', fontSize: '11px', marginTop: '2px' }}>
                            Received: {item.dateReceived}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '500',
                        background: getCategoryColor(item.category) + '20',
                        color: getCategoryColor(item.category),
                        display: 'inline-block',
                        border: `1px solid ${getCategoryColor(item.category)}`
                      }}>
                        {item.category}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{
                        padding: '6px 12px',
                        background: getStatusColor(item.status) + '20',
                        color: getStatusColor(item.status),
                        borderRadius: '20px',
                        fontWeight: 500,
                        fontSize: '12px',
                        display: 'inline-block',
                        border: `1px solid ${getStatusColor(item.status)}`
                      }}>
                        {item.status}
                        {item.delay !== 0 && item.status !== 'Pending' && (
                          <span style={{ marginLeft: '6px', fontSize: '11px' }}>
                            ({item.delay > 0 ? `+${item.delay}` : item.delay} days)
                          </span>
                        )}
                        {item.status === 'Pending' && item.delay > 0 && (
                          <span style={{ marginLeft: '6px', fontSize: '11px' }}>
                            (+{item.delay} days)
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
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
                          <FiEye />
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, color: '#666', fontSize: 14 }}>
            <div>
              Showing {filteredDeliveries.length} of {statusFilter === 'All' ? yearStats.total : 
                statusFilter === 'Delivered' ? yearStats.delivered : 
                statusFilter === 'Pending' ? yearStats.pending : 
                yearStats.overdue} deliveries for {selectedYear}
            </div>
          </div>
        </div>

        {/* Upcoming Serials */}
        <div style={{ 
          background: '#fff', 
          borderRadius: 12, 
          padding: 24, 
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          height: '600px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: 20 
          }}>
            <h3 style={{ color: '#004A98', margin: 0, fontSize: 18, fontWeight: '600' }}>Upcoming Serials (2025-2026)</h3>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {upcomingSerials.map((serial) => (
                <div
                  key={serial.id}
                  style={{
                    padding: '16px',
                    border: '1px solid #eee',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#004A98'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#eee'}
                  onClick={() => handleViewDetails(serial)}
                >
                  <div>
                    <div style={{ marginBottom: '8px' }}>
                      <strong style={{ color: '#333', fontSize: '15px' }}>{serial.title}</strong>
                    </div>
                    <div style={{ color: '#666', fontSize: '13px', marginBottom: '4px' }}>
                      Supplier: {serial.supplier}
                    </div>
                    <div style={{ color: '#666', fontSize: '13px' }}>
                      Expected: {serial.expectedDate}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#004A98', fontSize: '12px', fontWeight: '500' }}>
                      {serial.volumeIssue}
                    </div>
                    <div style={{ 
                      color: '#666', 
                      fontSize: '11px', 
                      background: '#f8f9fa',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      marginTop: '4px'
                    }}>
                      {serial.category}
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
          zIndex: 2000
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
                  {selectedItem.serialTitle || selectedItem.title}
                </h2>
                <p style={{ margin: 0, color: '#666', fontSize: '16px' }}>
                  {selectedItem.volumeIssue || ''}
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
                  {selectedItem.supplier ? 'Supplier Information' : 'Serial Information'}
                </h3>
                <div style={{
                  background: '#f8f9fa',
                  padding: '16px',
                  borderRadius: '8px'
                }}>
                  <p style={{ margin: '8px 0', color: '#333' }}>
                    <strong>{selectedItem.supplier ? 'Supplier:' : 'Title:'}</strong> {selectedItem.supplier || selectedItem.title}
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
                  {selectedItem.dateReceived ? 'Delivery Information' : 'Schedule Information'}
                </h3>
                <div style={{
                  background: '#f8f9fa',
                  padding: '16px',
                  borderRadius: '8px'
                }}>
                  {selectedItem.dateReceived ? (
                    <>
                      <p style={{ margin: '8px 0', color: '#333' }}>
                        <strong>Volume/Issue:</strong> {selectedItem.volumeIssue || 'N/A'}
                      </p>
                      <p style={{ margin: '8px 0', color: '#333' }}>
                        <strong>Expected:</strong> {selectedItem.expectedDelivery || selectedItem.expectedDate}
                      </p>
                      <p style={{ margin: '8px 0', color: '#333' }}>
                        <strong>Received:</strong> {selectedItem.dateReceived}
                      </p>
                      <p style={{ margin: '8px 0', color: '#333' }}>
                        <strong>Status:</strong> {selectedItem.status}
                      </p>
                    </>
                  ) : selectedItem.serialTitle ? (
                    <>
                      <p style={{ margin: '8px 0', color: '#333' }}>
                        <strong>Volume/Issue:</strong> {selectedItem.volumeIssue || 'N/A'}
                      </p>
                      <p style={{ margin: '8px 0', color: '#333' }}>
                        <strong>Expected Delivery:</strong> {selectedItem.expectedDelivery}
                      </p>
                      <p style={{ margin: '8px 0', color: '#333' }}>
                        <strong>Status:</strong> {selectedItem.status}
                      </p>
                    </>
                  ) : (
                    <>
                      <p style={{ margin: '8px 0', color: '#333' }}>
                        <strong>Volume/Issue:</strong> {selectedItem.volumeIssue}
                      </p>
                      <p style={{ margin: '8px 0', color: '#333' }}>
                        <strong>Expected Date:</strong> {selectedItem.expectedDate}
                      </p>
                    </>
                  )}
                </div>
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
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default function DashboardGSPS() {
  return (
    <GSPSLayout title="Dashboard Overview">
      <GSPSDashboard />
    </GSPSLayout>
  );
}