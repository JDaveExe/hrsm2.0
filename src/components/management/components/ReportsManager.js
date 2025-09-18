import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Card, Row, Col, Tabs, Tab } from 'react-bootstrap';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement, ArcElement } from 'chart.js';
import { Line, Pie, Bar } from 'react-chartjs-2';
import inventoryService from '../../../services/inventoryService';
import { dashboardService } from '../../../services/dashboardService';
import doctorReportsService from '../../../services/doctorReportsService';
import LoadingManagementBar from '../LoadingManagementBar';
import '../styles/ReportsManager.css';

// Error boundary for crash loop protection
class ReportsErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    // Log error
    console.error('ReportsErrorBoundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="reports-error-boundary">
          <h3>Something went wrong in Reports.</h3>
          <pre style={{ color: 'red' }}>{this.state.error?.message || 'Unknown error'}</pre>
          <button onClick={() => window.location.reload()}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const ReportsManager = ({ isDarkMode }) => {
  // Helper function to deserialize reports with proper Date objects
  const deserializeReports = useCallback((reportsData) => {
    if (!reportsData) return {};
    
    const reports = {};
    Object.entries(reportsData).forEach(([key, report]) => {
      reports[key] = {
        ...report,
        createdAt: report.createdAt ? new Date(report.createdAt) : new Date()
      };
    });
    return reports;
  }, []);

  // useRef guards to prevent duplicate useEffect calls
  const mountedRef = useRef(false);
  const dataLoadedRef = useRef(false);
    // Remove errorBoundaryRef (unused)
  
  // Persistent state with localStorage backup
  const [activeTab, setActiveTab] = useState(() => {
    try {
      return localStorage.getItem('reports_activeTab') || 'generate';
    } catch (error) {
      console.warn('Failed to load activeTab from localStorage:', error);
      return 'generate';
    }
  });
  
  const [showReportCenterModal, setShowReportCenterModal] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [currentModifyReport, setCurrentModifyReport] = useState(null);
  const [selectedChartType, setSelectedChartType] = useState('bar');
  const [showGeneratedChart, setShowGeneratedChart] = useState(false);
  const [generatedChartData, setGeneratedChartData] = useState(null);
  
  // New state for report creation flow with persistence
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [currentStep, setCurrentStep] = useState('confirm');
  const [selectedReportType, setSelectedReportType] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [createdReports, setCreatedReports] = useState(() => {
    try {
      const saved = localStorage.getItem('reports_createdReports');
      return saved ? deserializeReports(JSON.parse(saved)) : {};
    } catch (error) {
      console.warn('Failed to load createdReports from localStorage:', error);
      return {};
    }
  });
    // Always rehydrate createdReports from localStorage on mount
    useEffect(() => {
      try {
        const saved = localStorage.getItem('reports_createdReports');
        if (saved) setCreatedReports(deserializeReports(JSON.parse(saved)));
      } catch (error) {
        console.warn('Failed to rehydrate createdReports from localStorage:', error);
      }
    }, [deserializeReports]);

    // Listen for custom report creation events
    useEffect(() => {
      const handleCustomReportCreated = (event) => {
        console.log('📊 Custom report created event received:', event.detail);
        
        // Refresh createdReports from localStorage
        try {
          const saved = localStorage.getItem('reports_createdReports');
          if (saved) {
            const updatedReports = deserializeReports(JSON.parse(saved));
            setCreatedReports(updatedReports);
            console.log('✅ Reports refreshed after custom report creation');
          }
        } catch (error) {
          console.warn('Failed to refresh reports after custom creation:', error);
        }
      };

      window.addEventListener('customReportCreated', handleCustomReportCreated);
      
      return () => {
        window.removeEventListener('customReportCreated', handleCustomReportCreated);
      };
    }, [deserializeReports]);
  
  // Zoom modal state
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [zoomedReport, setZoomedReport] = useState(null);
  
  // Remove modal state
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [reportToRemove, setReportToRemove] = useState(null);
  
  // Error state management
  const [error, setError] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(() => {
    // Only show loading if we don't have cached data
    try {
      const cachedData = localStorage.getItem('reports_cachedData');
      return !cachedData;
    } catch {
      return true;
    }
  });
  const [reportStats, setReportStats] = useState(() => {
    try {
      const saved = localStorage.getItem('reports_stats');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.warn('Failed to load reportStats from localStorage:', error);
      return {};
    }
  });
  // Persistent data states with localStorage backup
  const [inventoryData, setInventoryData] = useState(() => {
    try {
      const saved = localStorage.getItem('reports_inventoryData');
      return saved ? JSON.parse(saved) : { medications: [], vaccines: [] };
    } catch (error) {
      console.warn('Failed to load inventoryData from localStorage:', error);
      return { medications: [], vaccines: [] };
    }
  });
  
  const [prescriptionAnalytics, setPrescriptionAnalytics] = useState(() => {
    try {
      const saved = localStorage.getItem('reports_prescriptionAnalytics');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.warn('Failed to load prescriptionAnalytics from localStorage:', error);
      return {};
    }
  });
  
  const [patientAnalytics, setPatientAnalytics] = useState(() => {
    try {
      const saved = localStorage.getItem('reports_patientAnalytics');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.warn('Failed to load patientAnalytics from localStorage:', error);
      return {};
    }
  });
  
  const [dashboardStats, setDashboardStats] = useState(() => {
    try {
      const saved = localStorage.getItem('reports_dashboardStats');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.warn('Failed to load dashboardStats from localStorage:', error);
      return {};
    }
  });
  
  const [doctorReportsData, setDoctorReportsData] = useState(() => {
    try {
      const saved = localStorage.getItem('reports_doctorReportsData');
      return saved ? JSON.parse(saved) : { workload: null, volumeTrends: null };
    } catch (error) {
      console.warn('Failed to load doctorReportsData from localStorage:', error);
      return { workload: null, volumeTrends: null };
    }
  });

  // Report types configuration
  const reportTypes = [
    // Patient Analytics
    { 
      id: 'patient-demographics', 
      name: 'Patient Demographics', 
      category: 'Patient Analytics',
      description: 'Age groups and gender distribution',
      recommendedCharts: ['pie', 'doughnut', 'bar']
    },
    { 
      id: 'patient-registration', 
      name: 'Daily Checkup Trends', 
      category: 'Patient Analytics',
      description: 'Weekly checkup completion trends',
      recommendedCharts: ['line', 'bar', 'area']
    },
    { 
      id: 'patient-frequency', 
      name: 'Age Distribution', 
      category: 'Patient Analytics',
      description: 'Patient age group distribution',
      recommendedCharts: ['bar', 'horizontal-bar', 'pie']
    },
    
    // Doctor Performance & Analytics
    { 
      id: 'doctor-workload', 
      name: 'Doctor Workload Distribution', 
      category: 'Doctor Performance',
      description: 'Checkups per doctor',
      recommendedCharts: ['bar', 'horizontal-bar', 'pie']
    },

    { 
      id: 'doctor-volume', 
      name: 'Doctor Patient Volume Trends', 
      category: 'Doctor Performance',
      description: 'Patients seen over time',
      recommendedCharts: ['line', 'area', 'bar']
    },
    
    // Inventory & Medication Management
    { 
      id: 'prescription-usage', 
      name: 'Prescription Usage Trends', 
      category: 'Inventory Management',
      description: 'Most prescribed medications',
      recommendedCharts: ['bar', 'pie', 'line']
    },
    { 
      id: 'vaccine-distribution', 
      name: 'Vaccine Distribution Analytics', 
      category: 'Inventory Management',
      description: 'Vaccination rates and trends',
      recommendedCharts: ['line', 'bar', 'pie']
    },
    { 
      id: 'expiry-management', 
      name: 'Expiry Date Management', 
      category: 'Inventory Management',
      description: 'Waste reduction metrics',
      recommendedCharts: ['bar', 'line', 'pie']
    },

  ];

  const chartTypes = [
    { id: 'bar', name: 'Bar Chart', icon: 'bi-bar-chart' },
    { id: 'line', name: 'Line Chart', icon: 'bi-graph-up' },
    { id: 'pie', name: 'Pie Chart', icon: 'bi-pie-chart' },
    { id: 'doughnut', name: 'Doughnut Chart', icon: 'bi-circle' },
    { id: 'horizontal-bar', name: 'Horizontal Bar', icon: 'bi-bar-chart-line' },
    { id: 'area', name: 'Area Chart', icon: 'bi-graph-up-arrow' },
    { id: 'radar', name: 'Radar Chart', icon: 'bi-pentagon' },
    { id: 'scatter', name: 'Scatter Plot', icon: 'bi-dots' }
  ];

  // useEffect with proper guards and error handling
  useEffect(() => {
    // Guard against duplicate calls
    if (mountedRef.current || dataLoadedRef.current) {
      console.log('🔒 ReportsManager: useEffect blocked - already mounted or data loaded');
      return;
    }
    
    mountedRef.current = true;
    console.log('🚀 ReportsManager: Initial mount - fetching analytics data');
    
    const initializeData = async () => {
      try {
        setError(null);
        await fetchAnalyticsData();
        dataLoadedRef.current = true;
      } catch (error) {
        console.error('❌ ReportsManager: Failed to initialize data:', error);
        setError(`Failed to load reports: ${error.message}`);
      }
    };
    
    initializeData();
    
    // Cleanup function
    return () => {
      console.log('🧹 ReportsManager: Cleanup');
      mountedRef.current = false;
    };
  }, []); // Empty dependency array - only run once
  
  // Save state to localStorage when it changes
  useEffect(() => {
    if (dataLoadedRef.current) {
      try {
        localStorage.setItem('reports_activeTab', activeTab);
      } catch (error) {
        console.warn('Failed to save activeTab to localStorage:', error);
      }
    }
  }, [activeTab]);
  
  useEffect(() => {
    if (dataLoadedRef.current && Object.keys(createdReports).length > 0) {
      try {
        localStorage.setItem('reports_createdReports', JSON.stringify(createdReports));
      } catch (error) {
        console.warn('Failed to save createdReports to localStorage:', error);
      }
    }
  }, [createdReports]);
    // Save to localStorage on change
    useEffect(() => {
      try {
        localStorage.setItem('reports_createdReports', JSON.stringify(createdReports));
      } catch (error) {
        console.warn('Failed to save createdReports to localStorage:', error);
      }
    }, [createdReports]);
  
  useEffect(() => {
    if (dataLoadedRef.current && Object.keys(reportStats).length > 0) {
      try {
        localStorage.setItem('reports_stats', JSON.stringify(reportStats));
      } catch (error) {
        console.warn('Failed to save reportStats to localStorage:', error);
      }
    }
  }, [reportStats]);



  // useCallback memoization for generateChartData function
  const generateChartData = useCallback((reportType, chartType) => {
    const baseColors = ['#28a745', '#17a2b8', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14'];
    
    console.log(`📈 Generating chart data for ${reportType.id} (${chartType})`);
    console.log('Current loading state:', isLoadingData);
    console.log('Available data:', {
      dashboardStats: !!dashboardStats && Object.keys(dashboardStats),
      patientAnalytics: !!patientAnalytics && Object.keys(patientAnalytics),
      dashboardStatsPatients: dashboardStats?.patients,
      dashboardStatsAgeDistribution: dashboardStats?.ageDistribution
    });
    
    // If data is still loading, return placeholder
    if (isLoadingData) {
      console.log('⏳ Still loading data, returning placeholder...');
      return {
        labels: ['Loading...'],
        datasets: [{
          data: [1],
          backgroundColor: ['#e0e0e0'],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      };
    }
    
    switch (reportType.id) {
      case 'patient-demographics':
        console.log('🎯 Patient Demographics case triggered');
        console.log('Chart type:', chartType);
        console.log('Dashboard stats:', dashboardStats);
        console.log('Dashboard stats patients:', dashboardStats?.patients);
        console.log('Dashboard stats age distribution:', dashboardStats?.ageDistribution);
        
        if (chartType === 'pie' || chartType === 'doughnut') {
          // Use real gender distribution from dashboard stats
          if (dashboardStats?.patients && (dashboardStats.patients.male || dashboardStats.patients.female)) {
            const genderData = {
              Male: dashboardStats.patients.male || 0,
              Female: dashboardStats.patients.female || 0
            };
            console.log('✅ Using real gender data:', genderData);
            return {
              labels: Object.keys(genderData),
              datasets: [{
                data: Object.values(genderData),
                backgroundColor: baseColors.slice(0, 2),
                borderWidth: 2,
                borderColor: '#fff'
              }]
            };
          } else {
            console.log('⚠️ Using fallback gender data - dashboardStats.patients:', dashboardStats?.patients);
            return {
              labels: ['Male', 'Female'],
              datasets: [{
                data: [45, 52],
                backgroundColor: baseColors.slice(0, 2),
                borderWidth: 2,
                borderColor: '#fff'
              }]
            };
          }
        } else {
          // Use real age distribution from dashboard stats
          if (dashboardStats?.ageDistribution && dashboardStats.ageDistribution.length > 0) {
            const ageData = dashboardStats.ageDistribution;
            console.log('✅ Using real age data:', ageData);
            return {
              labels: ageData.map(item => item.ageGroup),
              datasets: [{
                label: 'Patients by Age Group',
                data: ageData.map(item => item.count),
                backgroundColor: baseColors[0],
                borderColor: baseColors[0],
                borderWidth: 2
              }]
            };
          } else {
            console.log('⚠️ Using fallback age data - dashboardStats.ageDistribution:', dashboardStats?.ageDistribution);
            return {
              labels: ['0-18', '19-35', '36-50', '51-65', '65+'],
              datasets: [{
                label: 'Patients by Age Group',
                data: [12, 35, 28, 18, 15],
                backgroundColor: baseColors[0],
                borderColor: baseColors[0],
                borderWidth: 2
              }]
            };
          }
        }

      case 'patient-registration':
        // Use real checkup trends from dashboard stats (as requested to change registration analytics)
        if (dashboardStats?.checkupTrends && dashboardStats.checkupTrends.length > 0) {
          const checkupData = dashboardStats.checkupTrends;
          return {
            labels: checkupData.map(item => item.dayName),
            datasets: [{
              label: 'Daily Checkup Trends',
              data: checkupData.map(item => item.completedCheckups),
              backgroundColor: chartType === 'line' ? 'transparent' : baseColors[1],
              borderColor: baseColors[1],
              borderWidth: 3,
              fill: chartType === 'area',
              tension: 0.4
            }]
          };
        } else {
          return {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
              label: 'Daily Checkup Trends',
              data: [25, 32, 28, 41, 35, 45, 30],
              backgroundColor: chartType === 'line' ? 'transparent' : baseColors[1],
              borderColor: baseColors[1],
              borderWidth: 3,
              fill: chartType === 'area',
              tension: 0.4
            }]
          };
        }

      case 'patient-frequency':
        // Use real age distribution from dashboard stats (as requested to change frequency patient)
        if (dashboardStats?.ageDistribution && dashboardStats.ageDistribution.length > 0) {
          const ageData = dashboardStats.ageDistribution;
          return {
            labels: ageData.map(item => item.ageGroup),
            datasets: [{
              label: 'Age Distribution',
              data: ageData.map(item => item.count),
              backgroundColor: baseColors.slice(0, ageData.length),
              borderColor: '#fff',
              borderWidth: 2
            }]
          };
        } else {
          return {
            labels: ['0-10', '11-20', '21-30', '31-40', '41-50', '51-60', '61+'],
            datasets: [{
              label: 'Age Distribution',
              data: [8, 12, 15, 20, 18, 14, 10],
              backgroundColor: baseColors.slice(0, 7),
              borderColor: '#fff',
              borderWidth: 2
            }]
          };
        }

      case 'doctor-workload':
        if (doctorReportsData.workload) {
          const transformedData = doctorReportsService.transformWorkloadForChart(
            doctorReportsData.workload, 
            chartType
          );
          if (transformedData) {
            return transformedData;
          }
        }
        // Fallback to sample data if no real data available
        return {
          labels: ['Dr. Smith', 'Dr. Johnson', 'Dr. Williams', 'Dr. Brown'],
          datasets: [{
            label: 'Completed Checkups',
            data: [8, 12, 6, 10],
            backgroundColor: baseColors[2],
            borderColor: baseColors[2],
            borderWidth: 2
          }]
        };

      case 'doctor-volume':
        if (doctorReportsData.volumeTrends) {
          const transformedData = doctorReportsService.transformVolumeTrendsForChart(
            doctorReportsData.volumeTrends, 
            chartType
          );
          if (transformedData) {
            return transformedData;
          }
        }
        // Fallback to sample data if no real data available
        const sampleDates = ['Jan 15', 'Jan 16', 'Jan 17', 'Jan 18', 'Jan 19', 'Jan 20', 'Jan 21'];
        return {
          labels: sampleDates,
          datasets: [{
            label: 'Dr. Smith',
            data: [8, 12, 10, 14, 9, 11, 13],
            borderColor: baseColors[0],
            backgroundColor: chartType === 'area' ? baseColors[0].replace('1)', '0.2)') : baseColors[0],
            fill: chartType === 'area',
            tension: 0.1
          }, {
            label: 'Dr. Johnson',
            data: [6, 9, 11, 8, 12, 10, 15],
            borderColor: baseColors[1],
            backgroundColor: chartType === 'area' ? baseColors[1].replace('1)', '0.2)') : baseColors[1],
            fill: chartType === 'area',
            tension: 0.1
          }]
        };

      case 'prescription-usage':
        return {
          labels: ['Amoxicillin', 'Ibuprofen', 'Paracetamol', 'Aspirin', 'Metformin'],
          datasets: [{
            label: 'Prescriptions Count',
            data: [85, 72, 95, 48, 63],
            backgroundColor: baseColors.slice(0, 5),
            borderColor: '#fff',
            borderWidth: 2
          }]
        };

      case 'vaccine-distribution':
        return {
          labels: ['COVID-19', 'Flu', 'Hepatitis B', 'MMR', 'Tetanus'],
          datasets: [{
            label: 'Vaccines Administered',
            data: [120, 85, 45, 32, 28],
            backgroundColor: baseColors[3],
            borderColor: baseColors[3],
            borderWidth: 2
          }]
        };

      case 'expiry-management':
        console.log('🎯 Expiry Management case triggered');
        console.log('Report stats:', reportStats);
        
        // Use real expiry data from reportStats
        if (reportStats && Object.keys(reportStats).length > 0) {
          const expiryCategories = {
            'Medications Expiring Soon': reportStats.expiringMedications || 0,
            'Vaccines Expiring Soon': reportStats.expiringVaccines || 0,
            'Medications Expired': reportStats.expiredMedications || 0,
            'Vaccines Expired': reportStats.expiredVaccines || 0
          };
          
          // Filter out categories with zero values for cleaner chart
          const filteredCategories = Object.entries(expiryCategories)
            .filter(([key, value]) => value > 0);
          
          if (filteredCategories.length > 0) {
            console.log('✅ Using real expiry data:', Object.fromEntries(filteredCategories));
            return {
              labels: filteredCategories.map(([label]) => label),
              datasets: [{
                label: 'Items Count',
                data: filteredCategories.map(([, value]) => value),
                backgroundColor: [
                  '#ffc107', // Yellow for expiring soon
                  '#fd7e14', // Orange for vaccines expiring soon  
                  '#dc3545', // Red for expired medications
                  '#6f42c1'  // Purple for expired vaccines
                ].slice(0, filteredCategories.length),
                borderColor: '#fff',
                borderWidth: 2
              }]
            };
          } else {
            console.log('ℹ️ No expiry issues found, showing empty state');
            return {
              labels: ['No Expiry Issues'],
              datasets: [{
                label: 'Status',
                data: [1],
                backgroundColor: ['#28a745'], // Green for all good
                borderColor: '#fff',
                borderWidth: 2
              }]
            };
          }
        } else {
          console.log('⚠️ No report stats available, using fallback data');
          return {
            labels: ['Loading Expiry Data...'],
            datasets: [{
              label: 'Loading',
              data: [1],
              backgroundColor: ['#6c757d'], // Gray for loading
              borderColor: '#fff', 
              borderWidth: 2
            }]
          };
        }

      // Custom reports from InventoryAnalysis
      case 'custom-stock-levels':
      case 'custom-category-distribution':
      case 'custom-prescription-usage':
      case 'custom-vaccine-usage':
      case 'custom-prescription-trends':
      case 'custom-generic':
        console.log('🎯 Custom report case triggered for:', reportType.id);
        
        // Find the report data for this custom report
        const reportId = Object.keys(createdReports).find(key => 
          createdReports[key]?.type?.id === reportType.id
        );
        
        if (reportId && createdReports[reportId]?.data) {
          const customData = createdReports[reportId].data;
          console.log('✅ Using custom report data:', {
            labels: customData.labels?.length || 0,
            datasets: customData.datasets?.length || 0
          });
          
          return {
            labels: customData.labels || ['No Data'],
            datasets: customData.datasets || [{
              label: 'No Data',
              data: [0],
              backgroundColor: ['#e0e0e0'],
              borderColor: '#fff',
              borderWidth: 2
            }]
          };
        } else {
          console.log('⚠️ Custom report data not found for:', reportType.id);
          return {
            labels: ['Custom Report Loading...'],
            datasets: [{
              label: 'Loading Custom Data',
              data: [1],
              backgroundColor: ['#17a2b8'],
              borderColor: '#fff',
              borderWidth: 2
            }]
          };
        }

      default:
        return {
          labels: ['Category A', 'Category B', 'Category C', 'Category D'],
          datasets: [{
            label: 'Sample Data',
            data: [30, 45, 35, 25],
            backgroundColor: baseColors[0],
            borderColor: baseColors[0],
            borderWidth: 2
          }]
        };
    }
  }, [isLoadingData, dashboardStats, patientAnalytics, doctorReportsData, reportStats, inventoryData, prescriptionAnalytics, createdReports]);

  // Render chart component based on type
  const renderChart = (chartType, data, isZoomed = false) => {
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: isZoomed ? 'top' : 'bottom',
          labels: {
            padding: isZoomed ? 20 : 10,
            font: { size: isZoomed ? 14 : 10 }
          }
        },
        title: {
          display: isZoomed,
          text: isZoomed && zoomedReport ? reportTypes.find(r => r.id === zoomedReport.type.id)?.name : '',
          font: { size: 18, weight: 'bold' },
          padding: 20
        }
      },
      scales: chartType !== 'pie' && chartType !== 'doughnut' ? {
        y: {
          beginAtZero: true,
          grid: { display: isZoomed },
          ticks: { font: { size: isZoomed ? 12 : 10 } }
        },
        x: {
          grid: { display: isZoomed },
          ticks: { font: { size: isZoomed ? 12 : 10 } }
        }
      } : {}
    };

    switch (chartType) {
      case 'bar':
      case 'horizontal-bar':
        return <Bar data={data} options={options} />;
      case 'line':
      case 'area':
        return <Line data={data} options={options} />;
      case 'pie':
        return <Pie data={data} options={options} />;
      case 'doughnut':
        return <Pie data={data} options={options} />;
      default:
        return <Bar data={data} options={options} />;
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      setIsLoadingData(true);
      
      console.log('🔄 Management Dashboard: Starting to fetch analytics data...');
      
      // Fetch analytics data including real dashboard stats and doctor reports
      const [medicationsData, vaccinesData, prescriptionData, patientData, dashboardData, doctorWorkloadData, doctorVolumeData] = await Promise.all([
        inventoryService.getAllMedications(),
        inventoryService.getAllVaccines(),
        dashboardService.getPrescriptionAnalytics(),
        dashboardService.getPatientAnalytics(),
        dashboardService.getStats(),
        doctorReportsService.getDoctorWorkload('30d').catch(err => {
          console.warn('⚠️ Failed to fetch doctor workload data:', err);
          return null;
        }),
        doctorReportsService.getDoctorVolumeTrends('30d', 'day').catch(err => {
          console.warn('⚠️ Failed to fetch doctor volume trends data:', err);
          return null;
        })
      ]);
      
      console.log('📊 Management Dashboard: Data fetched successfully!');
      console.log('  Medications:', Array.isArray(medicationsData) ? medicationsData.length : 'Not array');
      console.log('  Vaccines:', Array.isArray(vaccinesData) ? vaccinesData.length : 'Not array');
      console.log('  Prescription Analytics:', prescriptionData);
      console.log('  Patient Analytics:', patientData);
      console.log('  Dashboard Stats:', dashboardData);
      
      setInventoryData({
        medications: Array.isArray(medicationsData) ? medicationsData : [],
        vaccines: Array.isArray(vaccinesData) ? vaccinesData : []
      });
      
      setPrescriptionAnalytics(prescriptionData);
      setPatientAnalytics(patientData);
      setDashboardStats(dashboardData);
      
      // Set doctor reports data
      setDoctorReportsData({
        workload: doctorWorkloadData,
        volumeTrends: doctorVolumeData
      });
      
      console.log('✅ Management Dashboard: All state updated with real data');
      console.log('  Doctor Workload Data:', doctorWorkloadData ? 'Loaded successfully' : 'Failed to load');
      console.log('  Doctor Volume Trends Data:', doctorVolumeData ? 'Loaded successfully' : 'Failed to load');
      console.log('  Auth Token Available:', !!window.__authToken);
      
      // Calculate report statistics
      calculateReportStats(medicationsData, vaccinesData, prescriptionData, patientData, dashboardData);
      
    } catch (error) {
      console.error('❌ Management Dashboard: Error fetching analytics data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const calculateReportStats = (medications, vaccines, prescriptions, patients, dashboardData) => {
    const totalMedications = Array.isArray(medications) ? medications.length : 0;
    const totalVaccines = Array.isArray(vaccines) ? vaccines.length : 0;
    const totalInventoryItems = totalMedications + totalVaccines;
    
    // Calculate inventory value
    const medicationValue = Array.isArray(medications) 
      ? medications.reduce((sum, med) => sum + (parseFloat(med.price || 0) * parseInt(med.quantity || 0)), 0)
      : 0;
    const vaccineValue = Array.isArray(vaccines)
      ? vaccines.reduce((sum, vac) => sum + (parseFloat(vac.price || 0) * parseInt(vac.quantity || 0)), 0)  
      : 0;
    const totalInventoryValue = medicationValue + vaccineValue;

    // Calculate low stock items
    const lowStockMedications = Array.isArray(medications) 
      ? medications.filter(med => parseInt(med.quantity || 0) < 10).length 
      : 0;
    const lowStockVaccines = Array.isArray(vaccines)
      ? vaccines.filter(vac => parseInt(vac.quantity || 0) < 10).length
      : 0;
    const lowStockItems = lowStockMedications + lowStockVaccines;

    // Calculate expiring and expired items
    const today = new Date();
    const next30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const expiringMedications = Array.isArray(medications)
      ? medications.filter(med => {
          if (!med.expiryDate) return false;
          const expiryDate = new Date(med.expiryDate);
          return expiryDate <= next30Days && expiryDate >= today;
        }).length
      : 0;
      
    const expiringVaccines = Array.isArray(vaccines)
      ? vaccines.filter(vac => {
          if (!vac.expiryDate) return false;
          const expiryDate = new Date(vac.expiryDate);
          return expiryDate <= next30Days && expiryDate >= today;
        }).length
      : 0;
    
    // Calculate already expired items  
    const expiredMedications = Array.isArray(medications)
      ? medications.filter(med => {
          if (!med.expiryDate) return false;
          const expiryDate = new Date(med.expiryDate);
          return expiryDate < today;
        }).length
      : 0;
      
    const expiredVaccines = Array.isArray(vaccines)
      ? vaccines.filter(vac => {
          if (!vac.expiryDate) return false;
          const expiryDate = new Date(vac.expiryDate);
          return expiryDate < today;
        }).length
      : 0;
      
    const expiringSoon = expiringMedications + expiringVaccines;
    const totalExpired = expiredMedications + expiredVaccines;

    setReportStats({
      totalMedications,
      totalVaccines,
      totalInventoryItems,
      totalInventoryValue,
      medicationValue,
      lowStockItems,
      lowMedications: lowStockMedications,
      lowVaccines: lowStockVaccines,
      expiringSoon,
      expiringMedications,
      expiringVaccines,
      expiredMedications,
      expiredVaccines,
      totalExpired,
      next30Days: expiringSoon,
      totalPrescriptions: prescriptions?.totalPrescriptions || 0,
      medicationsDispensed: prescriptions?.medicationsDispensed || 0,
      topMedication: prescriptions?.topMedication || 'N/A',
      dailyAverage: prescriptions?.dailyAverage || 0,
      monthlyVolume: prescriptions?.monthlyVolume || 0,
      averageItemValue: totalInventoryItems > 0 ? Math.round(totalInventoryValue / totalInventoryItems) : 0,
      monthlyChange: prescriptions?.monthlyChange || 0,
      peakDay: prescriptions?.peakDay || 'N/A',
      efficiencyRate: prescriptions?.efficiencyRate || 0
    });
  };

  // Report creation flow functions
  const handleSlotClick = (slotIndex) => {
    const globalSlotIndex = (currentPage - 1) * 9 + slotIndex;
    const existingReport = createdReports[globalSlotIndex];
    
    if (existingReport) {
      // If report exists, show zoom modal
      setZoomedReport(existingReport);
      setShowZoomModal(true);
    } else {
      // If empty slot, start creation flow
      setSelectedSlot(globalSlotIndex);
      setCurrentStep('confirm');
      setShowCreateModal(true);
    }
  };

  const handleZoomClose = () => {
    setShowZoomModal(false);
    setZoomedReport(null);
  };

  const handleRemoveReport = (reportToRemove) => {
    setReportToRemove(reportToRemove);
    setShowRemoveModal(true);
  };

  const confirmRemoveReport = () => {
    if (reportToRemove) {
      // Find the slot index for the report to remove
      const slotIndex = Object.keys(createdReports).find(
        key => createdReports[key].id === reportToRemove.id
      );
      
      if (slotIndex !== undefined) {
        // Remove the report from the createdReports state
        setCreatedReports(prev => {
          const updated = { ...prev };
          delete updated[slotIndex];
          return updated;
        });
        
        // Close both modals
        setShowZoomModal(false);
        setZoomedReport(null);
        setShowRemoveModal(false);
        setReportToRemove(null);
        
        console.log('Report removed successfully');
      }
    }
  };

  const cancelRemoveReport = () => {
    setShowRemoveModal(false);
    setReportToRemove(null);
  };

  const handleCreateConfirm = () => {
    setCurrentStep('select-report');
  };

  const handleReportTypeSelect = (reportType) => {
    setSelectedReportType(reportType);
    setCurrentStep('select-chart');
  };

  const handleChartTypeSelect = (chartType) => {
    setSelectedChartType(chartType);
    setCurrentStep('final-confirm');
  };

  const handleFinalConfirm = () => {
    // Create the report
    const newReport = {
      id: `report_${Date.now()}`,
      type: selectedReportType,
      chartType: selectedChartType,
      createdAt: new Date(),
      slot: selectedSlot
    };

    setCreatedReports(prev => ({
      ...prev,
      [selectedSlot]: newReport
    }));

    // Close modal and reset
    setShowCreateModal(false);
    setCurrentStep('confirm');
    setSelectedReportType(null);
    setSelectedSlot(null);
    setSelectedChartType('bar');
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setCurrentStep('confirm');
    setSelectedReportType(null);
    setSelectedSlot(null);
    setSelectedChartType('bar');
  };

  const getTotalPages = () => {
    return Math.ceil(Object.keys(createdReports).length / 9) + 1;
  };

  const hasAllSlotsOnCurrentPage = () => {
    const startIndex = (currentPage - 1) * 9;
    for (let i = 0; i < 9; i++) {
      if (!createdReports[startIndex + i]) {
        return false;
      }
    }
    return true;
  };

  const generateReport = async (reportType, format) => {
    try {
      console.log(`Generating ${reportType} report in ${format} format`);
      
      let content = '';
      const timestamp = new Date().toLocaleString();
      
      switch (reportType) {
        case 'inventory-overview':
          content = `Inventory Overview Report - ${timestamp}\\n\\n`;
          content += `Total Medications: ${reportStats.totalMedications || 0}\\n`;
          content += `Total Vaccines: ${reportStats.totalVaccines || 0}\\n`;
          content += `Total Items: ${reportStats.totalInventoryItems || 0}\\n`;
          content += `Estimated Value: $${(reportStats.totalInventoryValue || 0).toLocaleString()}\\n`;
          break;
          
        case 'stock-levels':
          content = `Stock Levels Analysis - ${timestamp}\\n\\n`;
          content += `Low Stock Items: ${reportStats.lowStockItems || 0}\\n`;
          content += `Low Medications: ${reportStats.lowMedications || 0}\\n`;
          content += `Low Vaccines: ${reportStats.lowVaccines || 0}\\n`;
          break;
          
        case 'expiry-analysis':
          content = `Expiry Analysis Report - ${timestamp}\\n\\n`;
          content += `Items Expiring Soon: ${reportStats.expiringSoon || 0}\\n`;
          content += `Expiring Medications: ${reportStats.expiringMedications || 0}\\n`;
          content += `Expiring Vaccines: ${reportStats.expiringVaccines || 0}\\n`;
          break;
          
        default:
          content = `${reportType} Report - ${timestamp}\\n\\nReport data will be generated here.`;
      }
      
      if (format === 'pdf') {
        // Create PDF blob
        const blob = new Blob([content], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === 'excel') {
        // Create Excel-like CSV
        const blob = new Blob([content], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
      
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  const handleModifyReport = (reportType) => {
    setCurrentModifyReport(reportType);
    setShowModifyModal(true);
  };

  const exportAllReports = async () => {
    try {
      console.log('Exporting all reports...');
      const reportTypes = ['inventory-overview', 'stock-levels', 'expiry-analysis'];
      
      for (const reportType of reportTypes) {
        await generateReport(reportType, 'pdf');
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
    } catch (error) {
      console.error('Error exporting all reports:', error);
    }
  };

  if (isLoadingData) {
    return <LoadingManagementBar message="Loading reports data..." duration="normal" />;
  }

  return (
    <div className="management-reports-manager">
      <div className="reports-container">

        
        {/* Tabs and Controls */}
        <div className="tabs-controls-wrapper">
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="reports-tabs"
          >
            <Tab eventKey="generate" title={
              <span>
                <i className="bi bi-plus-circle me-2"></i>
                Create Reports
              </span>
            }>
            </Tab>

            <Tab eventKey="history" title={
              <span>
                <i className="bi bi-clock-history me-2"></i>
                Reports History
              </span>
            }>
            </Tab>
          </Tabs>

          {/* Pagination and Create Button */}
          {activeTab === 'generate' && (
            <div className="page-controls">
              {getTotalPages() > 1 && (
                <div className="pagination-controls">
                  <button 
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                  <span className="page-info">
                    Page {currentPage} of {getTotalPages()}
                  </span>
                  <button 
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setCurrentPage(prev => Math.min(getTotalPages(), prev + 1))}
                    disabled={currentPage === getTotalPages()}
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </div>
              )}
              
              {hasAllSlotsOnCurrentPage() && (
                <button 
                  className="btn btn-success btn-sm"
                  onClick={() => {
                    setSelectedSlot(currentPage * 9);
                    setCurrentStep('confirm');
                    setShowCreateModal(true);
                  }}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Create Report
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tab Content */}
        <div className="tab-content-wrapper">
          {activeTab === 'generate' && (
            <div className="generate-reports-content">
              {/* 3x3 Reports Grid */}
              <div className="reports-grid-3x3">
                {Array.from({ length: 9 }, (_, index) => {
                  const globalSlotIndex = (currentPage - 1) * 9 + index;
                  const existingReport = createdReports[globalSlotIndex];
                  
                  return (
                    <div 
                      key={index} 
                      className={`report-slot ${existingReport ? 'has-report' : ''}`}
                      onClick={() => handleSlotClick(index)}
                    >
                      <div className="report-slot-content">
                        {existingReport ? (
                          <div className="existing-report">
                            <div className="report-header-mini">
                              <h5>{reportTypes.find(r => r.id === existingReport.type.id)?.name}</h5>
                              <div className="header-icons">
                                <span className="chart-type-badge">
                                  <i className={chartTypes.find(c => c.id === existingReport.chartType)?.icon || 'bi-bar-chart'}></i>
                                </span>
                                <span className="zoom-indicator">
                                  <i className="bi bi-zoom-in"></i>
                                </span>
                              </div>
                            </div>
                            <div className="chart-container-mini">
                              {renderChart(
                                existingReport.chartType, 
                                generateChartData(existingReport.type, existingReport.chartType),
                                false
                              )}
                            </div>
                            <div className="report-footer-mini">
                              <small className="report-category">{existingReport.type.category}</small>
                              <small className="created-date">
                                {existingReport.createdAt.toLocaleDateString()}
                              </small>
                            </div>
                          </div>
                        ) : (
                          <div className="slot-placeholder">
                            <i className="bi bi-plus-circle-dotted"></i>
                            <h4>Create Report</h4>
                            <p>Click to add a new report to this slot</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="reports-history-content">
              <div className="history-placeholder">
                <i className="bi bi-file-earmark-text placeholder-icon"></i>
                <h4>No Reports Generated Yet</h4>
                <p>Your generated reports will appear here for easy access and download.</p>
                <p>Start by creating a report using the grid above!</p>
              </div>
            </div>
          )}
        </div>

        {/* Report Creation Modal */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={handleModalClose}>
            <div className="create-report-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>
                  {currentStep === 'confirm' && 'Create New Report'}
                  {currentStep === 'select-report' && 'Select Report Type'}
                  {currentStep === 'select-chart' && 'Choose Chart Type'}
                  {currentStep === 'final-confirm' && 'Confirm Report Creation'}
                </h3>
                <button className="close-btn" onClick={handleModalClose}>
                  <i className="bi bi-x"></i>
                </button>
              </div>

              <div className="modal-body">
                {currentStep === 'confirm' && (
                  <div className="confirm-step">
                    <div className="step-icon">
                      <i className="bi bi-question-circle"></i>
                    </div>
                    <p>Are you sure you want to create a new report in this slot?</p>
                    <div className="step-actions">
                      <button className="btn btn-secondary" onClick={handleModalClose}>
                        Cancel
                      </button>
                      <button className="btn btn-success" onClick={handleCreateConfirm}>
                        Yes, Continue
                      </button>
                    </div>
                  </div>
                )}

                {currentStep === 'select-report' && (
                  <div className="select-report-step">
                    <p className="step-description">Choose the type of report you want to create:</p>
                    <div className="report-categories">
                      {Object.entries(
                        reportTypes.reduce((acc, report) => {
                          if (!acc[report.category]) acc[report.category] = [];
                          acc[report.category].push(report);
                          return acc;
                        }, {})
                      ).map(([category, reports]) => (
                        <div key={category} className="category-group">
                          <h5 className="category-title">{category}</h5>
                          <div className="reports-list">
                            {reports.map(report => (
                              <div 
                                key={report.id}
                                className="report-option"
                                onClick={() => handleReportTypeSelect(report)}
                              >
                                <h6>{report.name}</h6>
                                <p>{report.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentStep === 'select-chart' && selectedReportType && (
                  <div className="select-chart-step">
                    <div className="selected-report-info">
                      <h5>Selected Report: {selectedReportType.name}</h5>
                      <p>{selectedReportType.description}</p>
                    </div>
                    <p className="step-description">Choose the best chart type for this data:</p>
                    <div className="chart-options">
                      <div className="recommended-charts">
                        <h6>Recommended Charts:</h6>
                        <div className="charts-grid">
                          {selectedReportType.recommendedCharts.map(chartId => {
                            const chart = chartTypes.find(c => c.id === chartId);
                            return (
                              <div 
                                key={chartId}
                                className="chart-option recommended"
                                onClick={() => handleChartTypeSelect(chartId)}
                              >
                                <i className={chart.icon}></i>
                                <span>{chart.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 'final-confirm' && selectedReportType && (
                  <div className="final-confirm-step">
                    <div className="step-icon">
                      <i className="bi bi-check-circle"></i>
                    </div>
                    <h5>Confirm Report Creation</h5>
                    <div className="report-summary">
                      <div className="summary-item">
                        <strong>Report Type:</strong> {selectedReportType.name}
                      </div>
                      <div className="summary-item">
                        <strong>Category:</strong> {selectedReportType.category}
                      </div>
                      <div className="summary-item">
                        <strong>Chart Type:</strong> {chartTypes.find(c => c.id === selectedChartType)?.name}
                      </div>
                      <div className="summary-item">
                        <strong>Description:</strong> {selectedReportType.description}
                      </div>
                    </div>
                    <div className="step-actions">
                      <button className="btn btn-secondary" onClick={handleModalClose}>
                        Cancel
                      </button>
                      <button className="btn btn-success" onClick={handleFinalConfirm}>
                        Create Report
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Chart Zoom Modal */}
        {showZoomModal && zoomedReport && (
          <div className="modal-overlay" onClick={handleZoomClose}>
            <div className="zoom-modal" onClick={(e) => e.stopPropagation()}>
              <div className="zoom-modal-header">
                <div className="zoom-modal-title">
                  <h3>{reportTypes.find(r => r.id === zoomedReport.type.id)?.name}</h3>
                  <div className="zoom-modal-badges">
                    <span className="category-badge">{zoomedReport.type.category}</span>
                    <span className="chart-type-badge-large">
                      <i className={chartTypes.find(c => c.id === zoomedReport.chartType)?.icon || 'bi-bar-chart'}></i>
                      {chartTypes.find(c => c.id === zoomedReport.chartType)?.name}
                    </span>
                  </div>
                </div>
                <button className="close-btn" onClick={handleZoomClose}>
                  <i className="bi bi-x"></i>
                </button>
              </div>

              <div className="zoom-modal-body">
                <div className="chart-container-zoom">
                  {renderChart(
                    zoomedReport.chartType, 
                    generateChartData(zoomedReport.type, zoomedReport.chartType),
                    true
                  )}
                </div>
                
                <div className="zoom-modal-info">
                  <div className="info-section">
                    <h6>Report Details</h6>
                    <p><strong>Description:</strong> {zoomedReport.type.description}</p>
                    <p><strong>Created:</strong> {zoomedReport.createdAt.toLocaleString()}</p>
                    <p><strong>Chart Type:</strong> {chartTypes.find(c => c.id === zoomedReport.chartType)?.name}</p>
                  </div>
                  
                  <div className="zoom-actions">
                    <button className="btn btn-outline-success">
                      <i className="bi bi-download me-2"></i>
                      Export Chart
                    </button>
                    <button className="btn btn-outline-primary">
                      <i className="bi bi-printer me-2"></i>
                      Print Report
                    </button>
                    <button 
                      className="btn btn-outline-danger"
                      onClick={() => handleRemoveReport(zoomedReport)}
                    >
                      <i className="bi bi-trash me-2"></i>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Remove Confirmation Modal */}
        {showRemoveModal && reportToRemove && (
          <div className="modal-overlay" onClick={cancelRemoveReport}>
            <div className="remove-modal" onClick={(e) => e.stopPropagation()}>
              <div className="remove-modal-header">
                <div className="remove-icon">
                  <i className="bi bi-exclamation-triangle"></i>
                </div>
                <h3>Remove Report</h3>
                <button className="close-btn" onClick={cancelRemoveReport}>
                  <i className="bi bi-x"></i>
                </button>
              </div>

              <div className="remove-modal-body">
                <div className="remove-warning">
                  <p>Are you sure you want to remove this report?</p>
                  <div className="report-info-remove">
                    <div className="report-details">
                      <h5>{reportTypes.find(r => r.id === reportToRemove.type.id)?.name}</h5>
                      <p className="report-category-remove">{reportToRemove.type.category}</p>
                      <p className="report-description-remove">{reportToRemove.type.description}</p>
                      <small className="created-date-remove">
                        Created: {reportToRemove.createdAt.toLocaleString()}
                      </small>
                    </div>
                    <div className="chart-preview-remove">
                      <i className={chartTypes.find(c => c.id === reportToRemove.chartType)?.icon || 'bi-bar-chart'}></i>
                    </div>
                  </div>
                  <div className="warning-text">
                    <i className="bi bi-info-circle"></i>
                    <span>This action cannot be undone. The report will be permanently deleted.</span>
                  </div>
                </div>

                <div className="remove-actions">
                  <button 
                    className="btn btn-secondary"
                    onClick={cancelRemoveReport}
                  >
                    <i className="bi bi-x-circle me-2"></i>
                    Cancel
                  </button>
                  <button 
                    className="btn btn-danger"
                    onClick={confirmRemoveReport}
                  >
                    <i className="bi bi-trash me-2"></i>
                    Remove Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Wrap with error boundary
const ReportsManagerWithErrorBoundary = (props) => (
  <ReportsErrorBoundary>
    <ReportsManager {...props} />
  </ReportsErrorBoundary>
);

export default ReportsManagerWithErrorBoundary;
