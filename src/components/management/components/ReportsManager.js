import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Card, Row, Col, Tabs, Tab } from 'react-bootstrap';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement, ArcElement } from 'chart.js';
import { Line, Pie, Bar, Doughnut } from 'react-chartjs-2';
import inventoryService from '../../../services/inventoryService';
import { dashboardService } from '../../../services/dashboardService';
import doctorReportsService from '../../../services/doctorReportsService';
import LoadingManagementBar from '../LoadingManagementBar';
import { useAuth } from '../../../context/AuthContext';
import sealMainImage from '../../../images/sealmain.png';
import sealGovImage from '../../../images/sealgov.png';
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
  // Get user info from AuthContext
  const { user } = useAuth();
  
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
  const [activeDataTab, setActiveDataTab] = useState('chart'); // For comprehensive data tabs
  
  // Reports History state
  const [historyFilter, setHistoryFilter] = useState('all');
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
  
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

    // Healthcare Analytics (Custom Reports)
    { 
      id: 'custom-diagnosis-analysis', 
      name: 'Diagnosis Analysis Report', 
      category: 'Healthcare Analytics',
      description: 'Analysis of most diagnosed diseases with demographic breakdown',
      recommendedCharts: ['bar', 'pie', 'horizontal-bar']
    },
    { 
      id: 'custom-prescription-analysis', 
      name: 'Prescription Analysis Report', 
      category: 'Healthcare Analytics',
      description: 'Analysis of most prescribed medications with demographic breakdown',
      recommendedCharts: ['bar', 'pie', 'horizontal-bar']
    },
    { 
      id: 'custom-vaccine-analysis', 
      name: 'Vaccine Analysis Report', 
      category: 'Healthcare Analytics',
      description: 'Analysis of vaccination patterns with demographic breakdown',
      recommendedCharts: ['bar', 'pie', 'horizontal-bar']
    },
    { 
      id: 'custom-barangay-analysis', 
      name: 'Barangay Visits Analysis Report', 
      category: 'Healthcare Analytics',
      description: 'Analysis of patient visits by geographic location',
      recommendedCharts: ['bar', 'pie', 'horizontal-bar']
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
        const isAreaChart = chartType === 'area';
        
        return {
          labels: sampleDates,
          datasets: [{
            label: 'Dr. Smith',
            data: [8, 12, 10, 14, 9, 11, 13],
            borderColor: baseColors[0],
            backgroundColor: isAreaChart ? 
              baseColors[0].replace('rgb(', 'rgba(').replace(')', ', 0.3)') : 
              (chartType === 'bar' ? baseColors[0] : 'transparent'),
            fill: isAreaChart,
            tension: 0.4,
            pointBackgroundColor: baseColors[0],
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          }, {
            label: 'Dr. Johnson',
            data: [6, 9, 11, 8, 12, 10, 15],
            borderColor: baseColors[1],
            backgroundColor: isAreaChart ? 
              baseColors[1].replace('rgb(', 'rgba(').replace(')', ', 0.3)') : 
              (chartType === 'bar' ? baseColors[1] : 'transparent'),
            fill: isAreaChart,
            tension: 0.4,
            pointBackgroundColor: baseColors[1],
            pointBorderColor: '#fff',
            pointBorderWidth: 2
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
        const vaccineData = {
          labels: ['COVID-19', 'Flu', 'Hepatitis B', 'MMR', 'Tetanus'],
          data: [120, 85, 45, 32, 28]
        };
        
        return {
          labels: vaccineData.labels,
          datasets: [{
            label: 'Vaccines Administered',
            data: vaccineData.data,
            backgroundColor: chartType === 'pie' || chartType === 'doughnut' ? 
              baseColors.slice(0, vaccineData.labels.length) : 
              baseColors[3],
            borderColor: chartType === 'pie' || chartType === 'doughnut' ? '#fff' : baseColors[3],
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

      // Custom reports from HealthcareInsights
      case 'custom-diagnosis-analysis':
      case 'custom-prescription-analysis':
      case 'custom-vaccine-analysis':
      case 'custom-barangay-analysis':
      case 'custom-purok-analysis': // Added purok analysis case
        console.log('🎯 Healthcare analytics report case triggered for:', reportType.id);
        
        // Find the healthcare report data for this custom report
        const healthcareReportId = Object.keys(createdReports).find(key => 
          createdReports[key]?.type?.id === reportType.id
        );
        
        if (healthcareReportId && createdReports[healthcareReportId]?.chartData) {
          const healthcareData = createdReports[healthcareReportId].chartData;
          console.log('✅ Using healthcare custom report data:', {
            labels: healthcareData.labels?.length || 0,
            datasets: healthcareData.datasets?.length || 0,
            rawData: createdReports[healthcareReportId]?.rawData?.totalRecords || 0
          });
          
          return {
            labels: healthcareData.labels || ['No Data'],
            datasets: healthcareData.datasets || [{
              label: 'No Data',
              data: [0],
              backgroundColor: ['#e0e0e0'],
              borderColor: '#fff',
              borderWidth: 2
            }]
          };
        } else {
          console.log('⚠️ Healthcare custom report data not found for:', reportType.id);
          // Return a meaningful placeholder for healthcare reports
          return {
            labels: ['Healthcare Data Loading...'],
            datasets: [{
              label: 'Loading Healthcare Data',
              data: [1],
              backgroundColor: ['#28a745'],
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

    // Add horizontal bar specific options
    if (chartType === 'horizontal-bar') {
      options.indexAxis = 'y';
      options.scales = {
        y: {
          beginAtZero: true,
          grid: { display: isZoomed },
          ticks: { font: { size: isZoomed ? 12 : 10 } }
        },
        x: {
          beginAtZero: true,
          grid: { display: isZoomed },
          ticks: { font: { size: isZoomed ? 12 : 10 } }
        }
      };
    }

    switch (chartType) {
      case 'bar':
        return <Bar data={data} options={options} />;
      case 'horizontal-bar':
        return <Bar data={data} options={options} />;
      case 'line':
      case 'area':
        return <Line data={data} options={options} />;
      case 'pie':
        return <Pie data={data} options={options} />;
      case 'doughnut':
        return <Doughnut data={data} options={options} />;
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
      setActiveDataTab('chart'); // Reset to first tab
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
    setActiveDataTab('chart'); // Reset tab when closing
  };

  // Export chart functionality
  const handleExportChart = () => {
    if (!zoomedReport) return;
    
    try {
      // Get the chart canvas element
      const chartContainer = document.querySelector('.zoom-modal .chart-container-zoom canvas');
      if (!chartContainer) {
        alert('Chart not found for export');
        return;
      }

      // Create download link
      const link = document.createElement('a');
      link.download = `${zoomedReport.type.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().getTime()}.png`;
      link.href = chartContainer.toDataURL();
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('Chart exported successfully');
      
      // Log export to audit trail
      const token = localStorage.getItem('token') || window.__authToken;
      fetch('/api/audit/log-report', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reportType: 'Chart Export',
          reportDetails: {
            reportName: `${zoomedReport.type.name} - Export`,
            format: 'PNG',
            reportId: `export_${Date.now()}`,
            action: 'exported'
          }
        })
      }).catch(err => console.warn('Failed to log chart export:', err));
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export chart. Please try again.');
    }
  };

  // Print report functionality
  const handlePrintReport = () => {
    if (!zoomedReport) return;
    
    try {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      const chartContainer = document.querySelector('.zoom-modal .chart-container-zoom canvas');
      
      if (!chartContainer) {
        alert('Chart not found for printing');
        return;
      }

      const chartImageUrl = chartContainer.toDataURL();
      
      // Generate automated summary based on chart data
      const generateSummary = () => {
        if (!zoomedReport.rawData) return 'No data available for automated summary.';
        
        const data = zoomedReport.rawData;
        let summary = '';
        
        // Get total records
        const totalRecords = data.totalRecords || 0;
        
        // Generate summary based on report type
        switch(zoomedReport.type.id) {
          case 'patient-demographics':
            summary = `This report shows the demographic distribution of ${totalRecords} patients. `;
            if (data.genderBreakdown) {
              const male = data.genderBreakdown.male || 0;
              const female = data.genderBreakdown.female || 0;
              summary += `The gender distribution consists of ${male} male patients (${((male/totalRecords)*100).toFixed(1)}%) and ${female} female patients (${((female/totalRecords)*100).toFixed(1)}%). `;
            }
            summary += 'This demographic data helps in understanding patient population characteristics for better healthcare planning.';
            break;
            
          case 'patient-registration':
            summary = `This report displays the daily checkup trends showing healthcare utilization patterns. `;
            summary += `A total of ${totalRecords} checkups were recorded during the reporting period. `;
            summary += 'The trend analysis helps identify peak healthcare demand periods and optimize resource allocation.';
            break;
            
          case 'patient-frequency':
            summary = `This report presents the age distribution across ${totalRecords} patient records. `;
            summary += 'Understanding age demographics is crucial for age-specific health program planning and preventive care strategies.';
            break;
            
          case 'doctor-workload':
            summary = `This report analyzes doctor workload distribution across ${totalRecords} completed checkups. `;
            summary += 'Workload analysis helps ensure balanced task distribution among healthcare providers and identify staffing needs.';
            break;
            
          case 'doctor-volume':
            summary = `This report tracks doctor patient volume trends over time, covering ${totalRecords} patient encounters. `;
            summary += 'Volume trend analysis assists in capacity planning and identifying patterns in healthcare delivery.';
            break;
            
          case 'prescription-usage':
            summary = `This report shows prescription usage patterns with ${totalRecords} medication records analyzed. `;
            summary += 'Understanding prescription trends supports inventory management and formulary optimization.';
            break;
            
          case 'vaccine-distribution':
            summary = `This report displays vaccine distribution analytics across ${totalRecords} vaccination records. `;
            summary += 'Vaccination trend analysis is essential for immunization program monitoring and disease prevention planning.';
            break;
            
          case 'custom-diagnosis-analysis':
            summary = `This custom report analyzes diagnosed diseases across ${totalRecords} diagnosis records with demographic breakdown. `;
            summary += 'Disease pattern analysis helps identify health priorities and guide targeted intervention programs.';
            break;
            
          case 'custom-prescription-analysis':
            summary = `This custom report examines prescription patterns across ${totalRecords} medication records with demographic segmentation. `;
            summary += 'Medication usage analysis supports evidence-based prescribing practices and drug utilization review.';
            break;
            
          case 'custom-vaccine-analysis':
            summary = `This custom report evaluates vaccination patterns across ${totalRecords} immunization records with demographic details. `;
            summary += 'Comprehensive vaccine coverage analysis ensures equitable access to immunization services.';
            break;
            
          case 'custom-barangay-analysis':
            summary = `This custom report maps patient visits by geographic location across ${totalRecords} visit records. `;
            summary += 'Geographic distribution analysis aids in community health planning and service accessibility assessment.';
            break;
            
          case 'custom-purok-analysis':
            summary = `This custom report analyzes patient visits by street location across ${totalRecords} geographic records, grouped by Purok. `;
            summary += 'Street-level visit tracking helps identify high-activity areas and supports targeted community health outreach programs.';
            break;
            
          default:
            summary = `This report provides analytical insights based on ${totalRecords} records. `;
            summary += 'The data visualization helps healthcare administrators make informed decisions for improving service delivery.';
        }
        
        return summary;
      };
      
      const automatedSummary = generateSummary();
      const currentUser = user ? `${user.firstName} ${user.lastName}` : 'Management User';
      const currentUserRole = user?.role || 'Management';
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${zoomedReport.type.name} - Report</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body { 
              font-family: Arial, sans-serif; 
              margin: 0;
              padding: 20mm;
              color: #333;
              line-height: 1.6;
            }
            
            /* Government Header - Matching Homepage Style */
            .government-header {
              text-align: center;
              padding: 20px 0;
              border-bottom: 4px solid #28a745;
              margin-bottom: 30px;
              background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            }
            
            .government-header-content {
              display: flex;
              align-items: center;
              justify-content: space-between;
              max-width: 900px;
              margin: 0 auto;
              padding: 0 20px;
            }
            
            .government-seal, .barangay-seal {
              width: 80px;
              height: 80px;
              object-fit: contain;
            }
            
            .government-text {
              flex: 1;
              text-align: center;
              padding: 0 20px;
            }
            
            .government-title {
              font-size: 28px;
              font-weight: bold;
              color: #1a472a;
              margin-bottom: 5px;
              letter-spacing: 1px;
            }
            
            .government-subtitle {
              font-size: 20px;
              font-weight: 600;
              color: #28a745;
              margin-bottom: 5px;
            }
            
            .government-tagline {
              font-size: 13px;
              color: #666;
              font-style: italic;
            }
            
            /* Report Header */
            .report-header { 
              text-align: center; 
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #dee2e6;
            }
            
            .report-header h1 { 
              color: #28a745; 
              margin: 10px 0;
              font-size: 26px;
            }
            
            .report-header .report-subtitle { 
              color: #666; 
              margin: 5px 0;
              font-size: 15px;
            }
            
            .report-header .report-date {
              color: #888;
              font-size: 13px;
              margin-top: 10px;
            }
            
            /* Automated Summary Section */
            .summary-section {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              border-left: 4px solid #28a745;
              margin-bottom: 30px;
            }
            
            .summary-section h3 {
              color: #28a745;
              margin-bottom: 15px;
              font-size: 18px;
            }
            
            .summary-section p {
              color: #495057;
              line-height: 1.8;
              text-align: justify;
              font-size: 14px;
            }
            
            /* Chart Section */
            .chart-section { 
              text-align: center; 
              margin: 30px 0;
              page-break-inside: avoid;
            }
            
            .chart-section h3 {
              color: #28a745;
              margin-bottom: 15px;
              font-size: 18px;
            }
            
            .chart-section img { 
              max-width: 100%; 
              height: auto;
              border: 2px solid #dee2e6;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              padding: 10px;
              background: white;
            }
            
            /* Details Section */
            .details-section {
              margin-top: 30px;
              background: #fff;
              padding: 20px;
              border: 1px solid #dee2e6;
              border-radius: 8px;
              page-break-inside: avoid;
            }
            
            .details-section h3 {
              color: #28a745;
              margin-bottom: 15px;
              font-size: 18px;
              border-bottom: 2px solid #28a745;
              padding-bottom: 8px;
            }
            
            .detail-item {
              margin: 12px 0;
              font-size: 14px;
              padding: 8px 0;
            }
            
            .detail-label {
              font-weight: bold;
              color: #495057;
              display: inline-block;
              min-width: 120px;
            }
            
            .detail-value {
              color: #666;
            }
            
            /* Data Summary Grid */
            ${zoomedReport.rawData ? `
            .data-summary {
              margin-top: 20px;
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              border: 1px solid #dee2e6;
              page-break-inside: avoid;
            }
            
            .data-summary h4 {
              color: #28a745;
              margin-top: 0;
              margin-bottom: 15px;
              font-size: 16px;
            }
            
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
              gap: 15px;
            }
            
            .summary-item {
              text-align: center;
              padding: 15px;
              background: white;
              border-radius: 6px;
              border: 1px solid #dee2e6;
            }
            
            .summary-item .value {
              font-size: 20px;
              font-weight: bold;
              color: #28a745;
              display: block;
              margin-bottom: 5px;
            }
            
            .summary-item .label {
              font-size: 12px;
              color: #666;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            ` : ''}
            
            /* Signature Section */
            .signature-section {
              margin-top: 50px;
              padding-top: 30px;
              border-top: 2px solid #dee2e6;
              page-break-inside: avoid;
            }
            
            .signature-row {
              display: flex;
              justify-content: space-between;
              margin-top: 20px;
              gap: 40px;
            }
            
            .signature-box {
              flex: 1;
              text-align: center;
            }
            
            .signature-label {
              font-size: 13px;
              color: #666;
              font-weight: bold;
              margin-bottom: 8px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .signature-line {
              border-bottom: 2px solid #333;
              margin: 40px 20px 8px 20px;
              min-height: 60px;
            }
            
            .signature-name {
              font-size: 15px;
              font-weight: bold;
              color: #333;
              margin-top: 8px;
            }
            
            .signature-role {
              font-size: 13px;
              color: #666;
              font-style: italic;
            }
            
            .signature-date {
              font-size: 12px;
              color: #888;
              margin-top: 5px;
            }
            
            /* Print Optimizations */
            @media print {
              @page {
                margin-header: 0;
                margin-footer: 0;
              }

              body { 
                margin: 0;
                padding: 15mm;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              
              .government-header {
                page-break-after: avoid;
              }
              
              .chart-section {
                page-break-before: avoid;
                page-break-after: avoid;
              }
              
              .signature-section {
                page-break-before: avoid;
              }
            }
            
            @page {
              size: A4;
              margin: 15mm;
            }
          </style>
        </head>
        <body>
          <!-- Government Header -->
          <div class="government-header">
            <div class="government-header-content">
              <div class="government-seal-container">
                <img src="${sealGovImage}" alt="Government Seal" class="government-seal" />
              </div>
              <div class="government-text">
                <h1 class="government-title">BARANGAY MAYBUNGA</h1>
                <h2 class="government-subtitle">HEALTHCARE MANAGEMENT SYSTEM</h2>
                <p class="government-tagline">Digital Health Services for the Community</p>
              </div>
              <div class="barangay-seal-container">
                <img src="${sealMainImage}" alt="Barangay Maybunga Seal" class="barangay-seal" />
              </div>
            </div>
          </div>
          
          <!-- Report Header -->
          <div class="report-header">
            <h1>${zoomedReport.type.name}</h1>
            <p class="report-subtitle">${zoomedReport.type.description}</p>
            <p class="report-date">Generated on: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
          </div>
          
          <!-- Automated Summary Section -->
          <div class="summary-section">
            <h3>📊 Executive Summary</h3>
            <p>${automatedSummary}</p>
          </div>
          
          <!-- Chart Section -->
          <div class="chart-section">
            <h3>Data Visualization</h3>
            <img src="${chartImageUrl}" alt="${zoomedReport.type.name} Chart" />
          </div>
          
          <!-- Details Section -->
          <div class="details-section">
            <h3>Report Details</h3>
            <div class="detail-item">
              <span class="detail-label">Report Type:</span>
              <span class="detail-value">${zoomedReport.type.name}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Category:</span>
              <span class="detail-value">${zoomedReport.type.category || 'N/A'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Chart Type:</span>
              <span class="detail-value">${chartTypes.find(c => c.id === zoomedReport.chartType)?.name || 'N/A'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Report Created:</span>
              <span class="detail-value">${zoomedReport.createdAt.toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</span>
            </div>
            
            ${zoomedReport.rawData ? `
            <div class="data-summary">
              <h4>Statistical Overview</h4>
              <div class="summary-grid">
                <div class="summary-item">
                  <span class="value">${zoomedReport.rawData.totalRecords || 0}</span>
                  <span class="label">Total Records</span>
                </div>
                <div class="summary-item">
                  <span class="value">${zoomedReport.rawData.groupMode || 'N/A'}</span>
                  <span class="label">Group Mode</span>
                </div>
                <div class="summary-item">
                  <span class="value">${zoomedReport.rawData.dataType || 'N/A'}</span>
                  <span class="label">Data Type</span>
                </div>
              </div>
            </div>
            ` : ''}
          </div>
          
          <!-- Signature Section -->
          <div class="signature-section">
            <div class="signature-row">
              <div class="signature-box">
                <div class="signature-label">Created By</div>
                <div class="signature-line"></div>
                <div class="signature-name">${currentUser}</div>
                <div class="signature-role">${currentUserRole}</div>
                <div class="signature-date">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
              
              <div class="signature-box">
                <div class="signature-label">Approved By</div>
                <div class="signature-line"></div>
                <div class="signature-name">_______________________</div>
                <div class="signature-role">Authorized Signature</div>
                <div class="signature-date">Date: __________________</div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `);
      
      printWindow.document.close();
      
      // Wait for images and content to load then print
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }, 1000);
      
      console.log('Print dialog opened successfully');
      
      // Log print to audit trail
      const token = localStorage.getItem('token') || window.__authToken;
      fetch('/api/audit/log-report', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reportType: 'Report Print',
          reportDetails: {
            reportName: `${zoomedReport.type.name} - Print`,
            format: 'PDF/Print',
            reportId: `print_${Date.now()}`,
            action: 'printed'
          }
        })
      }).catch(err => console.warn('Failed to log report print:', err));
    } catch (error) {
      console.error('Print failed:', error);
      alert('Failed to print report. Please try again.');
    }
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
        
        // Log removal to audit trail
        const token = localStorage.getItem('token') || window.__authToken;
        fetch('/api/audit/log-report', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            reportType: 'Report Removal',
            reportDetails: {
              reportName: `${reportToRemove.type.name} - Removed`,
              format: 'N/A',
              reportId: reportToRemove.id,
              action: 'removed',
              slot: slotIndex
            }
          })
        }).catch(err => console.warn('Failed to log report removal:', err));
        
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

    // Log report creation to audit trail
    const token = localStorage.getItem('token') || window.__authToken;
    fetch('/api/audit/log-report', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reportType: selectedReportType?.name || 'Unknown Report',
        reportDetails: {
          reportName: selectedReportType?.name || 'Unknown Report',
          format: selectedChartType,
          reportId: newReport.id,
          category: selectedReportType?.category,
          slot: selectedSlot
        }
      })
    }).catch(err => console.warn('Failed to log report creation:', err));

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
      
      // Log report generation to audit trail
      const token = localStorage.getItem('token') || window.__authToken;
      fetch('/api/audit/log-report', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reportType: reportType,
          reportDetails: {
            reportName: reportType,
            format: format,
            reportId: `report_${Date.now()}`,
            stats: reportStats
          }
        })
      }).catch(err => console.warn('Failed to log report generation:', err));
      
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

  // Generate reports history from created reports
  const getReportsHistory = () => {
    const allReports = Object.values(createdReports).filter(report => report && report.id);
    
    // Filter by time period
    const now = new Date();
    const filteredReports = allReports.filter(report => {
      const reportDate = new Date(report.createdAt);
      
      switch (historyFilter) {
        case 'today':
          return reportDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return reportDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return reportDate >= monthAgo;
        case 'year':
          const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          return reportDate >= yearAgo;
        case 'all':
        default:
          return true;
      }
    });
    
    // Sort by creation date (newest first)
    return filteredReports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  const reportsHistory = getReportsHistory();

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
              {/* History Filter Controls */}
              <div className="history-controls">
                <div className="history-filter-buttons">
                  {[
                    { id: 'today', label: 'Today', icon: 'bi-calendar-day' },
                    { id: 'week', label: 'This Week', icon: 'bi-calendar-week' },
                    { id: 'month', label: 'This Month', icon: 'bi-calendar-month' },
                    { id: 'year', label: 'This Year', icon: 'bi-calendar-range' },
                    { id: 'all', label: 'All Time', icon: 'bi-clock-history' }
                  ].map(filter => (
                    <button
                      key={filter.id}
                      className={`history-filter-btn ${historyFilter === filter.id ? 'active' : ''}`}
                      onClick={() => {
                        setHistoryFilter(filter.id);
                        setHistoryCurrentPage(1); // Reset to first page when filter changes
                      }}
                    >
                      <i className={`bi ${filter.icon} me-2`}></i>
                      {filter.label}
                    </button>
                  ))}
                </div>
                
                <div className="history-stats">
                  <span className="history-count">
                    {reportsHistory.length} {reportsHistory.length === 1 ? 'report' : 'reports'} found
                  </span>
                </div>
              </div>

              {/* Reports History Grid (3x3 with Pagination) */}
              <div className="history-reports-grid">
                {reportsHistory.length > 0 ? (
                  <>
                    <div className="reports-grid-3x3">
                      {(() => {
                        const startIndex = (historyCurrentPage - 1) * 9;
                        const endIndex = startIndex + 9;
                        const pageReports = reportsHistory.slice(startIndex, endIndex);
                        
                        return Array.from({ length: 9 }, (_, index) => {
                          const report = pageReports[index];
                          
                          return (
                            <div 
                              key={index} 
                              className={`report-slot ${report ? 'has-report' : 'empty-slot'}`}
                              onClick={() => report && (() => {
                                setZoomedReport(report);
                                setActiveDataTab('chart');
                                setShowZoomModal(true);
                              })()}
                            >
                              <div className="report-slot-content">
                                {report ? (
                                  <div className="existing-report">
                                    <div className="report-header-mini">
                                      <h5>{report.type.name}</h5>
                                      <div className="header-icons">
                                        <span className="chart-type-badge">
                                          <i className={chartTypes.find(c => c.id === report.chartType)?.icon || 'bi-bar-chart'}></i>
                                        </span>
                                        <span className="zoom-indicator">
                                          <i className="bi bi-zoom-in"></i>
                                        </span>
                                      </div>
                                    </div>
                                    <div className="chart-container-mini">
                                      {renderChart(
                                        report.chartType, 
                                        generateChartData(report.type, report.chartType),
                                        false
                                      )}
                                    </div>
                                    <div className="report-footer-mini">
                                      <small className="report-category">{report.type.category}</small>
                                      <small className="created-date">
                                        {new Date(report.createdAt).toLocaleDateString()}
                                      </small>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="slot-placeholder empty">
                                    <div className="empty-slot-content">
                                      <i className="bi bi-file-earmark-text-fill"></i>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                    
                    {/* History Pagination */}
                    {Math.ceil(reportsHistory.length / 9) > 1 && (
                      <div className="history-pagination">
                        <button 
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setHistoryCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={historyCurrentPage === 1}
                        >
                          <i className="bi bi-chevron-left"></i>
                          Previous
                        </button>
                        
                        <span className="page-info">
                          Page {historyCurrentPage} of {Math.ceil(reportsHistory.length / 9)}
                        </span>
                        
                        <button 
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setHistoryCurrentPage(prev => Math.min(Math.ceil(reportsHistory.length / 9), prev + 1))}
                          disabled={historyCurrentPage === Math.ceil(reportsHistory.length / 9)}
                        >
                          Next
                          <i className="bi bi-chevron-right"></i>
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="history-empty-state">
                    <i className="bi bi-file-earmark-text empty-icon"></i>
                    <h4>No Reports Found</h4>
                    <p>
                      {historyFilter === 'all' 
                        ? 'No reports have been generated yet.'
                        : `No reports found for ${
                            historyFilter === 'today' ? 'today' :
                            historyFilter === 'week' ? 'this week' :
                            historyFilter === 'month' ? 'this month' :
                            historyFilter === 'year' ? 'this year' : 'this period'
                          }.`
                      }
                    </p>
                    <p>Start by creating a report using the "Create Reports" tab!</p>
                  </div>
                )}
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
                
                {/* Enhanced data display for healthcare reports */}
                {zoomedReport.rawData && (
                  <div className="comprehensive-data-section">
                    <div className="data-tabs">
                      <div className="tab-headers">
                        <button 
                          className={`tab-header ${activeDataTab === 'chart' ? 'active' : ''}`}
                          onClick={() => setActiveDataTab('chart')}
                        >
                          <i className="bi bi-bar-chart me-2"></i>
                          Chart Data
                        </button>
                        <button 
                          className={`tab-header ${activeDataTab === 'detailed' ? 'active' : ''}`}
                          onClick={() => setActiveDataTab('detailed')}
                        >
                          <i className="bi bi-table me-2"></i>
                          Detailed Breakdown
                        </button>
                      </div>
                      
                      <div className="tab-content">
                        <div className={`tab-pane ${activeDataTab === 'chart' ? 'active' : ''}`}>
                          <div className="data-summary-cards">
                            <div className="summary-card">
                              <div className="summary-icon">
                                <i className="bi bi-clipboard-data"></i>
                              </div>
                              <div className="summary-info">
                                <h6>Total Records</h6>
                                <span className="summary-value">{zoomedReport.rawData.totalRecords || 0}</span>
                              </div>
                            </div>
                            <div className="summary-card">
                              <div className="summary-icon">
                                <i className="bi bi-people"></i>
                              </div>
                              <div className="summary-info">
                                <h6>Group Mode</h6>
                                <span className="summary-value">{zoomedReport.rawData.groupMode || 'N/A'}</span>
                              </div>
                            </div>
                            <div className="summary-card">
                              <div className="summary-icon">
                                <i className="bi bi-calendar"></i>
                              </div>
                              <div className="summary-info">
                                <h6>Generated</h6>
                                <span className="summary-value">
                                  {zoomedReport.rawData.generated ? 
                                    new Date(zoomedReport.rawData.generated).toLocaleDateString() : 
                                    'N/A'
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className={`tab-pane ${activeDataTab === 'detailed' ? 'active' : ''}`}>
                          {/* Detailed breakdown table */}
                          <div className="detailed-breakdown">
                            <h6>Raw Data Analysis</h6>
                            {zoomedReport.rawData.main && zoomedReport.rawData.main.length > 0 ? (
                              <div className="breakdown-table-container">
                                <table className="breakdown-table">
                                  <thead>
                                    <tr>
                                      {/* Purok data has different structure */}
                                      {zoomedReport.rawData.dataType === 'purok' ? (
                                        <>
                                          <th>Purok</th>
                                          <th>Street</th>
                                          <th>Total Visits</th>
                                          <th>Activity Level</th>
                                        </>
                                      ) : (
                                        <>
                                          <th>Item</th>
                                          <th>Age Group</th>
                                          <th>Gender</th>
                                          <th>Count</th>
                                          {zoomedReport.rawData.dataType === 'diagnosis' && <th>Diagnosis</th>}
                                          {zoomedReport.rawData.dataType === 'prescription' && <th>Medication</th>}
                                          {zoomedReport.rawData.dataType === 'vaccine' && <th>Vaccine</th>}
                                          {zoomedReport.rawData.dataType === 'barangay' && <th>Location</th>}
                                        </>
                                      )}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {zoomedReport.rawData.dataType === 'purok' ? (
                                      // Purok-specific table rows
                                      zoomedReport.rawData.main.slice(0, 10).map((item, index) => {
                                        const activityLevel = item.visits > 30 ? 'High Activity' : 
                                                             item.visits > 10 ? 'Moderate Activity' : 
                                                             'Low Activity';
                                        return (
                                          <tr key={index}>
                                            <td>{item.purok || 'N/A'}</td>
                                            <td>{item.street || 'N/A'}</td>
                                            <td>{item.visits || 0}</td>
                                            <td>{activityLevel}</td>
                                          </tr>
                                        );
                                      })
                                    ) : (
                                      // Standard table rows for other data types
                                      zoomedReport.rawData.main.slice(0, 10).map((item, index) => (
                                        <tr key={index}>
                                          <td>{index + 1}</td>
                                          <td>{item.ageGroup || 'N/A'}</td>
                                          <td>{item.gender || 'N/A'}</td>
                                          <td>1</td>
                                          {zoomedReport.rawData.dataType === 'diagnosis' && <td>{item.diagnosis || 'N/A'}</td>}
                                          {zoomedReport.rawData.dataType === 'prescription' && <td>{item.medication_name || 'N/A'}</td>}
                                          {zoomedReport.rawData.dataType === 'vaccine' && <td>{item.vaccine_name || 'N/A'}</td>}
                                          {zoomedReport.rawData.dataType === 'barangay' && <td>{item.barangay || 'N/A'}</td>}
                                        </tr>
                                      ))
                                    )}
                                  </tbody>
                                </table>
                                {zoomedReport.rawData.main.length > 10 && (
                                  <div className="table-footer">
                                    <small className="text-muted">
                                      Showing first 10 of {zoomedReport.rawData.main.length} records
                                    </small>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="no-data-message">
                                <i className="bi bi-info-circle me-2"></i>
                                No detailed data available for this report
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="zoom-modal-info">
                  <div className="info-section">
                    <h6>Report Details</h6>
                    <p><strong>Description:</strong> {zoomedReport.type.description}</p>
                    <p><strong>Created:</strong> {zoomedReport.createdAt.toLocaleString()}</p>
                    <p><strong>Chart Type:</strong> {chartTypes.find(c => c.id === zoomedReport.chartType)?.name}</p>
                  </div>
                  
                  <div className="zoom-actions">
                    <button 
                      className="btn btn-outline-success"
                      onClick={handleExportChart}
                    >
                      <i className="bi bi-download me-2"></i>
                      Export Chart
                    </button>
                    <button 
                      className="btn btn-outline-primary"
                      onClick={handlePrintReport}
                    >
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
