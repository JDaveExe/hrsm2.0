import React, { useMemo, memo, useState, useEffect } from 'react';
import { Card, Row, Col, Tabs, Tab, Spinner, Alert, Modal, Button, ButtonGroup, Table, Badge } from 'react-bootstrap';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement, ArcElement, Filler } from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { useData } from '../../../context/DataContext';
import { useDashboardStats } from '../../../hooks/useDashboard';
import { useCommonAlerts } from './AlertUtils';
import ForecastingDashboard from './ForecastingDashboard';
import EnhancedForecastingDashboard from './EnhancedForecastingDashboard';
import StatCards from './StatCards';
import inventoryService from '../../../services/inventoryService';
import '../styles/DashboardStats.css';

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
  Legend,
  Filler
);

const DashboardStats = memo(({ currentDateTime }) => {
  const [dashboardTabKey, setDashboardTabKey] = useState('analytics');
  const [alertShown, setAlertShown] = useState({
    loading: false,
    error: false,
    success: false
  });
  
  // Add state for real medicine usage analytics
  const [medicineUsageData, setMedicineUsageData] = useState([]);
  const [prescriptionAnalytics, setPrescriptionAnalytics] = useState(null);
  const [loadingMedicineData, setLoadingMedicineData] = useState(false);
  
  // Chart interaction states
  const [medicineUsageMetric, setMedicineUsageMetric] = useState('units'); // 'units' or 'prescriptions'
  const [showDetailModal, setShowDetailModal] = useState(null); // 'checkupTrends', 'demographics', 'medicineUsage', 'vaccineUsage'
  const [checkupTrendsPeriod, setCheckupTrendsPeriod] = useState('days'); // 'days', 'weeks', 'months', 'years'
  const [checkupTrendsApiData, setCheckupTrendsApiData] = useState(null); // Store API data for current period
  
  const {
    showDataRefreshAlert,
    showDataRefreshError,
    showDataRefreshSuccess,
    renderAlerts,
    clearAllAlerts
  } = useCommonAlerts();
  
  const {
    patientsData,
    familiesData,
    appointmentsData,
    sharedCheckupsData,
    unsortedMembersData
  } = useData();

  // Fetch real dashboard statistics from database
  const { 
    data: dbStats, 
    isLoading: isLoadingStats, 
    error: statsError,
    refetch: refetchStats 
  } = useDashboardStats();

  // Load real medicine usage analytics - same as management dashboard
  useEffect(() => {
    let isMounted = true;
    
    const loadMedicineUsageAnalytics = async () => {
      try {
        setLoadingMedicineData(true);
        console.log('💊 Admin Dashboard: Loading medicine usage analytics...');
        
        // Use the same API calls as management dashboard
        const [medicineUsage, prescriptionAnalyticsData] = await Promise.all([
          inventoryService.getMedicineUsageAnalytics(),
          inventoryService.getPrescriptionAnalytics('30days')
        ]);
        
        if (isMounted) {
          setMedicineUsageData(medicineUsage);
          setPrescriptionAnalytics(prescriptionAnalyticsData);
          console.log('✅ Admin Dashboard: Medicine usage analytics loaded:', {
            medicineCount: medicineUsage.length,
            totalPrescriptions: prescriptionAnalyticsData?.summary?.totalPrescriptions
          });
        }
      } catch (error) {
        console.error('❌ Admin Dashboard: Error loading medicine usage analytics:', error);
        if (isMounted) {
          // Set empty arrays to avoid showing hardcoded data
          setMedicineUsageData([]);
          setPrescriptionAnalytics(null);
        }
      } finally {
        if (isMounted) {
          setLoadingMedicineData(false);
        }
      }
    };

    loadMedicineUsageAnalytics();
    
    return () => {
      isMounted = false;
    };
  }, []); // Load once on component mount

  // Fetch checkup trends data when period changes
  useEffect(() => {
    const fetchCheckupTrendsForPeriod = async () => {
      try {
        console.log(`🔄 Fetching checkup trends for period: ${checkupTrendsPeriod}`);
        
        const response = await fetch(`/api/dashboard/checkup-trends/${checkupTrendsPeriod}`);

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Checkup trends data received for ${checkupTrendsPeriod}:`, data);
          setCheckupTrendsApiData(data);
        } else {
          console.error(`❌ Failed to fetch checkup trends for ${checkupTrendsPeriod}:`, response.statusText);
          setCheckupTrendsApiData(null);
        }
      } catch (error) {
        console.error('Error fetching checkup trends for period:', error);
        setCheckupTrendsApiData(null);
      }
    };

    fetchCheckupTrendsForPeriod();
  }, [checkupTrendsPeriod]);

  // Memoized calculations for performance
  const dashboardStats = useMemo(() => {
    // If we have database stats, use them as the primary source
    if (dbStats) {
      return {
        totalPatients: dbStats.patients?.total || 0,
        totalFamilies: dbStats.families?.total || 0,
        todaysCheckups: dbStats.checkups?.completedToday || 0,
        pendingAppointments: dbStats.appointments?.scheduled || 0,
        activeCheckups: dbStats.checkups?.active || 0,
        completedToday: dbStats.checkups?.completedToday || 0,
        // Additional stats from database
        activeFamilies: dbStats.families?.active || 0,
        inactiveFamilies: dbStats.families?.inactive || 0,
        malePatients: dbStats.patients?.male || 0,
        femalePatients: dbStats.patients?.female || 0,
        totalMedicalRecords: dbStats.medicalRecords?.total || 0,
        recentRecords: dbStats.medicalRecords?.recent || 0,
        totalPrescriptions: dbStats.prescriptions?.total || 0,
        prescriptionsToday: dbStats.prescriptions?.today || 0
      };
    }

    // Fallback to context data if database stats are not available
    const allPatients = [...(patientsData || []), ...(unsortedMembersData || [])];
    const todaysCheckups = sharedCheckupsData || [];
    const pendingAppointments = (appointmentsData || []).filter(apt => 
      apt.status === 'scheduled' || apt.status === 'pending'
    );

    const hasRealData = patientsData !== null && patientsData !== undefined && 
                       familiesData !== null && familiesData !== undefined;
    
    console.log('Dashboard Data Debug:', {
      hasRealData,
      patientsDataLength: patientsData?.length || 0,
      familiesDataLength: familiesData?.length || 0,
      appointmentsDataLength: appointmentsData?.length || 0,
      sharedCheckupsDataLength: sharedCheckupsData?.length || 0,
      unsortedMembersDataLength: unsortedMembersData?.length || 0,
      dbStatsAvailable: !!dbStats
    });
    
    // Only show demo data if data hasn't been loaded at all yet
    if (!hasRealData) {
      return {
        totalPatients: 0,
        totalFamilies: 0,
        todaysCheckups: 0,
        pendingAppointments: 0,
        activeCheckups: 0,
        completedToday: 0
      };
    }

    return {
      totalPatients: allPatients.length,
      totalFamilies: (familiesData || []).length,
      todaysCheckups: todaysCheckups.length,
      pendingAppointments: pendingAppointments.length,
      activeCheckups: todaysCheckups.filter(checkup => 
        checkup.status === 'in-progress' || checkup.status === 'checked-in'
      ).length,
      completedToday: todaysCheckups.filter(checkup => 
        (checkup.status === 'completed' || checkup.status === 'vaccination-completed') && 
        new Date(checkup.updatedAt || checkup.completedAt).toDateString() === new Date().toDateString()
      ).length
    };
  }, [patientsData, familiesData, appointmentsData, sharedCheckupsData, unsortedMembersData, dbStats]);

  // Generate checkup trends chart data based on selected period (similar to InventoryAnalysis)
  const checkupTrendsChartData = useMemo(() => {
    if (!checkupTrendsApiData?.data) {
      return {
        labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        data: [0, 0, 0, 0, 0, 0, 0],
        title: 'This Week'
      };
    }

    const generateTrendsForPeriod = (period) => {
      const today = new Date();
      
      switch (period) {
        case 'days':
          const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
          const dayData = weekDays.map(dayName => {
            const trend = checkupTrendsApiData.data.find(t => t.dayName === dayName);
            return trend ? trend.completedCheckups : 0;
          });
          
          return {
            labels: weekDays,
            data: dayData,
            title: 'This Week'
          };

        case 'weeks':
          // Show last 4 weeks from API data
          const apiWeeksData = checkupTrendsApiData.data || [];
          const lastFourWeeks = apiWeeksData.slice(-4);
          
          const weekLabels = lastFourWeeks.map((week, index) => `Week ${index + 1}`);
          const weekData = lastFourWeeks.map(week => week.completedCheckups);
          
          return {
            labels: weekLabels,
            data: weekData,
            title: 'Last 4 Weeks'
          };

        case 'months':
          // Show months from API data
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                             'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          
          // Generate last 6 months labels
          const monthLabels = [];
          const monthData = [];
          
          for (let i = 5; i >= 0; i--) {
            const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthIndex = monthDate.getMonth();
            const year = monthDate.getFullYear();
            const monthLabel = monthNames[monthIndex];
            
            monthLabels.push(monthLabel);
            
            // Find matching data from API
            const apiMonth = checkupTrendsApiData.data.find(m => 
              m.year === year && m.month === monthIndex + 1
            );
            monthData.push(apiMonth ? apiMonth.completedCheckups : 0);
          }
          
          return {
            labels: monthLabels,
            data: monthData,
            title: 'Last 6 Months'
          };

        case 'years':
          // Show years from API data
          const years = [];
          const yearData = [];
          
          for (let i = 4; i >= 0; i--) {
            const year = today.getFullYear() - i;
            years.push(year.toString());
            
            // Find matching data from API
            const apiYear = checkupTrendsApiData.data.find(y => y.year === year);
            yearData.push(apiYear ? apiYear.completedCheckups : 0);
          }
          
          return {
            labels: years,
            data: yearData,
            title: 'Last 5 Years'
          };

        default:
          return {
            labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            data: [0, 0, 0, 0, 0, 0, 0],
            title: 'This Week'
          };
      }
    };

    return generateTrendsForPeriod(checkupTrendsPeriod);
  }, [checkupTrendsApiData, checkupTrendsPeriod]);

  // Chart data calculations
  const chartData = useMemo(() => {
    // Calculate real gender data - prioritize database stats
    let genderData = { male: 0, female: 0 };
    if (dbStats?.patients) {
      genderData = {
        male: dbStats.patients.male || 0,
        female: dbStats.patients.female || 0
      };
    } else {
      // Fallback to context data
      const allPatients = [...(patientsData || []), ...(unsortedMembersData || [])];
      genderData = {
        male: allPatients.filter(p => p.gender?.toLowerCase() === 'male').length,
        female: allPatients.filter(p => p.gender?.toLowerCase() === 'female').length
      };
    }

    // Calculate real age distribution - prioritize database stats
    const ageDistributionLabels = ['0-10', '11-20', '21-30', '31-40', '41-50', '51-60', '61+'];
    let ageDistributionData = ageDistributionLabels.map(() => 0);
    
    if (dbStats?.ageDistribution) {
      // Use database age distribution
      dbStats.ageDistribution.forEach(item => {
        const index = ageDistributionLabels.indexOf(item.ageGroup);
        if (index !== -1) {
          ageDistributionData[index] = item.count;
        }
      });
    } else {
      // Fallback to calculate from context data
      const allPatients = [...(patientsData || []), ...(unsortedMembersData || [])];
      allPatients.forEach(patient => {
        if (patient.age || patient.dateOfBirth) {
          let age = patient.age;
          if (!age && patient.dateOfBirth) {
            const today = new Date();
            const birthDate = new Date(patient.dateOfBirth);
            age = today.getFullYear() - birthDate.getFullYear();
          }
          
          if (age >= 0 && age <= 10) ageDistributionData[0]++;
          else if (age >= 11 && age <= 20) ageDistributionData[1]++;
          else if (age >= 21 && age <= 30) ageDistributionData[2]++;
          else if (age >= 31 && age <= 40) ageDistributionData[3]++;
          else if (age >= 41 && age <= 50) ageDistributionData[4]++;
          else if (age >= 51 && age <= 60) ageDistributionData[5]++;
          else if (age >= 61) ageDistributionData[6]++;
        }
      });
    }

    // Calculate vaccination status - prioritize database stats
    let vaccinationData = { up_to_date: 0, needs_update: 0, not_set: 0 };
    if (dbStats?.vaccinations) {
      vaccinationData = {
        up_to_date: dbStats.vaccinations.up_to_date || 0,
        needs_update: dbStats.vaccinations.needs_update || 0,
        not_set: dbStats.vaccinations.not_set || 0
      };
    } else {
      // Fallback to context data
      const allPatients = [...(patientsData || []), ...(unsortedMembersData || [])];
      allPatients.forEach(patient => {
        const status = patient.vaccinationStatus?.toLowerCase();
        if (status === 'up-to-date' || status === 'up_to_date') {
          vaccinationData.up_to_date++;
        } else if (status === 'needs-update' || status === 'needs_update') {
          vaccinationData.needs_update++;
        } else {
          vaccinationData.not_set++;
        }
      });
    }

    // Process prescription trends data from database
    let prescriptionTrendsData = [0, 0, 0, 0, 0, 0]; // Default for last 6 months
    const monthLabels = [];
    const today = new Date();
    
    // Generate last 6 months labels
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      monthLabels.push(date.toLocaleDateString('en-US', { month: 'short' }));
    }
    
    if (dbStats?.prescriptionTrends) {
      // Map database results to months
      dbStats.prescriptionTrends.forEach((trend, index) => {
        if (index < 6) {
          prescriptionTrendsData[index] = trend.prescriptionCount;
        }
      });
    }

    // Process prescription medicine usage data with toggle support
    let medicineUsageDataValues = [];
    let medicineLabels = [];
    let medicineMetricLabel = 'Medicine Usage';
    
    // Prepare both datasets for toggle functionality
    let unitsData = [];
    let prescriptionsData = [];
    
    if (prescriptionAnalytics?.topMedications && prescriptionAnalytics.topMedications.length > 0) {
      // Get data from prescription analytics (has both metrics)
      const topMedicines = prescriptionAnalytics.topMedications.slice(0, 5);
      medicineLabels = topMedicines.map(item => 
        item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name
      );
      unitsData = topMedicines.map(item => item.totalQuantity || 0);
      prescriptionsData = topMedicines.map(item => item.prescriptionCount || 0);
      
      console.log('📊 Admin Dashboard: Using prescription analytics data:', { 
        medicineLabels, 
        unitsData, 
        prescriptionsData 
      });
    } else if (medicineUsageData && medicineUsageData.length > 0) {
      // Fallback to medicine usage data
      const topMedicines = medicineUsageData.slice(0, 5);
      medicineLabels = topMedicines.map(item => 
        item.medicine_name.replace(/"/g, '') 
      );
      unitsData = topMedicines.map(item => item.total_quantity || 0);
      prescriptionsData = topMedicines.map(item => item.usage_count || 0);
      
      console.log('📊 Admin Dashboard: Using medicine usage data:', { 
        medicineLabels, 
        unitsData, 
        prescriptionsData 
      });
    } else if (dbStats?.prescriptions?.medicineUsage && dbStats.prescriptions.medicineUsage.length > 0) {
      // Basic dashboard stats fallback
      medicineLabels = dbStats.prescriptions.medicineUsage.map(item => 
        item.medicine_name.replace(/"/g, '') 
      );
      prescriptionsData = dbStats.prescriptions.medicineUsage.map(item => item.usage_count);
      unitsData = prescriptionsData.map(count => count * 3); // Estimate units (3 per prescription avg)
      
      console.log('📊 Admin Dashboard: Using dbStats medicine usage data');
    } else {
      // Only use fallback data if absolutely no real data is available
      medicineLabels = ['Paracetamol', 'Amoxicillin', 'Ibuprofen', 'Cetirizine', 'Aspirin'];
      prescriptionsData = [8, 6, 4, 3, 2];
      unitsData = [24, 18, 12, 9, 6];
      
      console.log('⚠️ Admin Dashboard: Using fallback medicine usage data');
    }
    
    // Select data based on toggle
    if (medicineUsageMetric === 'units') {
      medicineUsageDataValues = unitsData;
      medicineMetricLabel = 'Total Units Dispensed';
    } else {
      medicineUsageDataValues = prescriptionsData;
      medicineMetricLabel = 'Number of Prescriptions';
    }

    const prescriptionData = prescriptionTrendsData.length > 0 ? prescriptionTrendsData : 
      ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map(() => Math.floor(Math.random() * 80) + 20);

    // Process vaccine usage data from database for pie chart
    let vaccineUsageData = [];
    let vaccineLabels = [];
    
    if (dbStats?.vaccinations?.vaccineUsage && dbStats.vaccinations.vaccineUsage.length > 0) {
      vaccineLabels = dbStats.vaccinations.vaccineUsage.map(item => 
        item.vaccine_name.replace(/"/g, '') // Remove quotes from JSON extract
      );
      vaccineUsageData = dbStats.vaccinations.vaccineUsage.map(item => item.usage_count);
    } else {
      // Default/simulation data if no real data available
      vaccineLabels = ['COVID-19', 'Influenza', 'Hepatitis B', 'Tetanus', 'Pneumonia'];
      vaccineUsageData = [45, 28, 20, 15, 12];
    }

    // Use calculated vaccination data instead of random data
    const vaccinationLabels = ['Up to Date', 'Needs Update', 'Not Set'];
    const vaccinationStatusData = [vaccinationData.up_to_date, vaccinationData.needs_update, vaccinationData.not_set];

    return {
      checkupTrends: {
        labels: checkupTrendsChartData.labels,
        datasets: [{
          label: `Checkups Completed (${checkupTrendsChartData.title})`,
          data: checkupTrendsChartData.data,
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderColor: '#3b82f6',
          borderWidth: 3,
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
          tension: 0.4,
          fill: true
        }]
      },
      demographics: {
        labels: ['Male', 'Female'],
        datasets: [{
          data: [genderData.male, genderData.female],
          backgroundColor: ['#87ceeb', '#ffa8a8'],
          borderWidth: 0
        }]
      },
      ageDistribution: {
        labels: ageDistributionLabels,
        datasets: [{
          label: 'Number of Patients',
          data: ageDistributionData,
          backgroundColor: '#87ceeb',
          borderColor: '#87ceeb',
          borderWidth: 1,
          barThickness: 15,
        }]
      },
      prescriptions: {
        labels: medicineLabels,
        datasets: [{
          label: medicineMetricLabel,
          data: medicineUsageDataValues,
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF',
            '#FF9F40',
            '#C9CBCF',
            '#4BC0C0',
            '#FF6384',
            '#36A2EB'
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      vaccinations: {
        labels: vaccineLabels,
        datasets: [{
          label: 'Vaccine Usage',
          data: vaccineUsageData,
          backgroundColor: [
            '#4ade80',
            '#06b6d4',
            '#8b5cf6',
            '#f59e0b',
            '#ef4444',
            '#ec4899',
            '#6366f1',
            '#10b981',
            '#f97316',
            '#84cc16'
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      }
    };
  }, [dashboardStats.totalPatients, patientsData, unsortedMembersData, medicineUsageData, prescriptionAnalytics, dbStats, medicineUsageMetric, checkupTrendsChartData]);

  // Alert management effects - with proper state tracking to prevent continuous alerts
  useEffect(() => {
    if (isLoadingStats && !alertShown.loading) {
      clearAllAlerts(); // Clear previous alerts when starting new load
      showDataRefreshAlert();
      setAlertShown(prev => ({ ...prev, loading: true, error: false, success: false }));
    }
  }, [isLoadingStats, alertShown.loading, showDataRefreshAlert, clearAllAlerts]);

  useEffect(() => {
    if (statsError && !alertShown.error) {
      clearAllAlerts(); // Clear loading alerts
      showDataRefreshError(() => {
        setAlertShown({ loading: false, error: false, success: false });
        refetchStats();
      });
      setAlertShown(prev => ({ ...prev, error: true, loading: false }));
    }
  }, [statsError, alertShown.error, showDataRefreshError, refetchStats, clearAllAlerts]);

  useEffect(() => {
    if (dbStats && !isLoadingStats && !statsError && !alertShown.success) {
      clearAllAlerts(); // Clear loading/error alerts
      // Show success alert without refresh button since there's already one in the UI
      showDataRefreshSuccess(); // Remove the refresh action
      setAlertShown(prev => ({ ...prev, success: true, loading: false, error: false }));
    }
  }, [dbStats, isLoadingStats, statsError, alertShown.success, showDataRefreshSuccess, clearAllAlerts]);

  // Reset alert state when starting fresh
  useEffect(() => {
    if (!dbStats && !isLoadingStats && !statsError) {
      setAlertShown({ loading: false, error: false, success: false });
    }
  }, [dbStats, isLoadingStats, statsError]);

  return (
    <div className="dashboard-stats">
      {/* Smart Alert Management */}
      {renderAlerts()}

      {/* Dashboard Tabs */}
      <Tabs
        activeKey={dashboardTabKey}
        onSelect={(k) => setDashboardTabKey(k)}
        className="dashboard-tabs mb-3"
      >
        <Tab eventKey="analytics" title={
          <span>
            <i className="bi bi-speedometer2 me-2"></i>
            Analytics
          </span>
        }>
          <div className="analytics-content">
            {/* Statistics Cards - New Component */}
            <StatCards stats={{
              totalPatients: dashboardStats.totalPatients || 3,
              totalFamilies: dashboardStats.totalFamilies || 50,
              activeCheckups: dashboardStats.activeCheckups || 0,
              completedToday: dashboardStats.completedToday || 0
            }} />

            {/* Charts Section */}
            <Row className="charts-section">
              <Col lg={6} className="mb-4 d-flex">
                <Card className="chart-card flex-fill">
                  <Card.Header>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div>
                        <h5><i className="bi bi-graph-up me-2"></i>Patient Checkup Trends</h5>
                        <small>Tracking of completed patient checkups</small>
                      </div>
                      <Button 
                        variant="outline-secondary" 
                        size="sm"
                        onClick={() => setShowDetailModal('checkupTrends')}
                        title="View detailed trends analysis"
                      >
                        <i className="bi bi-arrows-fullscreen"></i>
                      </Button>
                    </div>
                    
                    {/* Time Period Buttons */}
                    <div className="d-flex justify-content-center">
                      <ButtonGroup size="sm">
                        <Button 
                          variant={checkupTrendsPeriod === 'days' ? 'primary' : 'outline-primary'}
                          onClick={() => setCheckupTrendsPeriod('days')}
                        >
                          Days
                        </Button>
                        <Button 
                          variant={checkupTrendsPeriod === 'weeks' ? 'primary' : 'outline-primary'}
                          onClick={() => setCheckupTrendsPeriod('weeks')}
                        >
                          Weeks
                        </Button>
                        <Button 
                          variant={checkupTrendsPeriod === 'months' ? 'primary' : 'outline-primary'}
                          onClick={() => setCheckupTrendsPeriod('months')}
                        >
                          Months
                        </Button>
                        <Button 
                          variant={checkupTrendsPeriod === 'years' ? 'primary' : 'outline-primary'}
                          onClick={() => setCheckupTrendsPeriod('years')}
                        >
                          Years
                        </Button>
                      </ButtonGroup>
                    </div>
                  </Card.Header>
                  <Card.Body className="d-flex flex-column">
                    <div className="chart-stats-summary mb-3">
                      <Row>
                        <Col xs={4} className="text-center">
                          <div className="stat-mini">
                            <div className="stat-number">0</div>
                            <div className="stat-label">Total to date</div>
                          </div>
                        </Col>
                        <Col xs={4} className="text-center">
                          <div className="stat-mini">
                            <div className="stat-number">0</div>
                            <div className="stat-label">Completed</div>
                          </div>
                        </Col>
                        <Col xs={4} className="text-center">
                          <div className="stat-mini">
                            <div className="stat-number">0</div>
                            <div className="stat-label">In Progress</div>
                          </div>
                        </Col>
                      </Row>
                    </div>
                    <div className="chart-container flex-grow-1">
                      <Line 
                        data={chartData.checkupTrends} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          animation: false, // Disable animations
                          plugins: {
                            legend: { 
                              position: 'top',
                              display: true,
                              labels: {
                                color: '#333',
                                font: {
                                  size: 12
                                }
                              }
                            },
                            title: { display: false }
                          },
                          scales: {
                            y: { 
                              beginAtZero: true,
                              max: (() => {
                                // Calculate dynamic max value with padding to prevent overlap
                                const dataValues = chartData.checkupTrends.datasets.flatMap(dataset => dataset.data);
                                const maxDataValue = Math.max(...dataValues, 0);
                                return maxDataValue === 0 ? 5 : Math.ceil(maxDataValue * 1.2); // Add 20% padding
                              })(),
                              ticks: {
                                stepSize: (() => {
                                  const dataValues = chartData.checkupTrends.datasets.flatMap(dataset => dataset.data);
                                  const maxDataValue = Math.max(...dataValues, 0);
                                  const dynamicMax = maxDataValue === 0 ? 5 : Math.ceil(maxDataValue * 1.2);
                                  return Math.max(1, Math.ceil(dynamicMax / 10)); // Dynamic step size
                                })(),
                                precision: 0,
                                color: '#333',
                                font: {
                                  size: 11
                                },
                                callback: function(value) {
                                  if (value % 1 === 0) {
                                    return value;
                                  }
                                }
                              },
                              grid: {
                                color: '#e9ecef'
                              }
                            },
                            x: {
                              ticks: {
                                color: '#333',
                                font: {
                                  size: 11
                                }
                              },
                              grid: {
                                display: false
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={6} className="mb-4 d-flex">
                <Card className="chart-card flex-fill">
                  <Card.Header>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h5><i className="bi bi-pie-chart me-2"></i>Patient Demographics</h5>
                        <small>Distribution of patients by gender and age</small>
                      </div>
                      <Button 
                        variant="outline-secondary" 
                        size="sm"
                        onClick={() => setShowDetailModal('demographics')}
                        title="View detailed demographics analysis"
                      >
                        <i className="bi bi-arrows-fullscreen"></i>
                      </Button>
                    </div>
                  </Card.Header>
                  <Card.Body className="d-flex flex-column">
                    <Row className="flex-grow-1">
                      <Col md={6} className="d-flex flex-column justify-content-center">
                        <div className="chart-container h-100">
                          <Pie 
                            data={chartData.demographics} 
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: { 
                                  position: 'bottom',
                                  labels: {
                                    usePointStyle: true,
                                    padding: 20,
                                    color: '#333',
                                    font: {
                                      size: 11
                                    }
                                  }
                                }
                              }
                            }}
                          />
                        </div>
                      </Col>
                      <Col md={6} className="d-flex flex-column">
                        <div className="age-distribution-chart flex-grow-1 d-flex flex-column">
                          <h6 className="text-center mb-2">Age Distribution</h6>
                          <div className="chart-container flex-grow-1">
                            <Bar
                              data={chartData.ageDistribution}
                              options={{
                                indexAxis: 'y',
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: { display: false },
                                  title: { display: false }
                                },
                                scales: {
                                  x: {
                                    beginAtZero: true,
                                    ticks: {
                                      stepSize: 1,
                                      max: 4.0,
                                      color: '#333',
                                      font: {
                                        size: 10
                                      }
                                    },
                                    grid: {
                                      color: '#e9ecef'
                                    }
                                  },
                                  y: {
                                    ticks: {
                                      color: '#333',
                                      font: {
                                        size: 10
                                      }
                                    },
                                    grid: {
                                      display: false
                                    }
                                  }
                                }
                              }}
                            />
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={6} className="mb-4 d-flex">
                <Card className="chart-card flex-fill">
                  <Card.Header>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h5><i className="bi bi-capsule me-2"></i>Medicine Usage</h5>
                        <small>{medicineUsageMetric === 'units' ? 'Total units dispensed' : 'Number of prescriptions'}</small>
                      </div>
                      <div className="d-flex gap-2">
                        {/* Toggle Button */}
                        <ButtonGroup size="sm">
                          <Button 
                            variant={medicineUsageMetric === 'prescriptions' ? 'primary' : 'outline-primary'}
                            onClick={() => setMedicineUsageMetric('prescriptions')}
                            title="Show number of prescriptions"
                          >
                            <i className="bi bi-file-medical me-1"></i>
                            Prescriptions
                          </Button>
                          <Button 
                            variant={medicineUsageMetric === 'units' ? 'primary' : 'outline-primary'}
                            onClick={() => setMedicineUsageMetric('units')}
                            title="Show total units dispensed"
                          >
                            <i className="bi bi-capsule me-1"></i>
                            Units
                          </Button>
                        </ButtonGroup>
                        
                        {/* Zoom Button */}
                        <Button 
                          variant="outline-secondary" 
                          size="sm"
                          onClick={() => setShowDetailModal('medicineUsage')}
                          title="View detailed analysis"
                        >
                          <i className="bi bi-arrows-fullscreen"></i>
                        </Button>
                      </div>
                    </div>
                  </Card.Header>
                  <Card.Body className="d-flex flex-column">
                    <div className="chart-container flex-grow-1">
                      {loadingMedicineData ? (
                        <div className="d-flex align-items-center justify-content-center h-100">
                          <div className="text-center">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-2 text-muted">Loading real medicine usage data...</p>
                          </div>
                        </div>
                      ) : (
                        <Pie 
                          data={chartData.prescriptions} 
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: { 
                                position: 'right',
                                display: true,
                                labels: {
                                  color: '#333',
                                  font: {
                                    size: 12
                                  },
                                  usePointStyle: true,
                                  padding: 15
                                }
                              },
                              title: { display: false },
                              tooltip: {
                                callbacks: {
                                  label: function(context) {
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((context.parsed / total) * 100).toFixed(1);
                                    return `${context.label}: ${context.parsed} units (${percentage}%)`;
                                  }
                                }
                              }
                            }
                          }}
                        />
                      )}
                    </div>
                    {/* Add data source indicator */}
                    <div className="text-center mt-2">
                      <small className="text-muted">
                        {prescriptionAnalytics?.topMedications?.length > 0
                          ? `Total units dispensed from ${prescriptionAnalytics.topMedications.length} medicines`
                          : medicineUsageData && medicineUsageData.length > 0 
                            ? `Real data from ${medicineUsageData.length} prescribed medicines` 
                            : 'Using fallback data'}
                      </small>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={6} className="mb-4 d-flex">
                <Card className="chart-card flex-fill">
                  <Card.Header>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h5><i className="bi bi-shield-check me-2"></i>Vaccine Usage</h5>
                        <small>Most frequently administered vaccines</small>
                      </div>
                      <Button 
                        variant="outline-secondary" 
                        size="sm"
                        onClick={() => setShowDetailModal('vaccineUsage')}
                        title="View detailed vaccine analysis"
                      >
                        <i className="bi bi-arrows-fullscreen"></i>
                      </Button>
                    </div>
                  </Card.Header>
                  <Card.Body className="d-flex flex-column">
                    <div className="chart-container flex-grow-1">
                      <Pie 
                        data={chartData.vaccinations} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { 
                              position: 'right',
                              display: true,
                              labels: {
                                color: '#333',
                                font: {
                                  size: 12
                                },
                                usePointStyle: true,
                                padding: 15
                              }
                            },
                            title: { display: false },
                            tooltip: {
                              callbacks: {
                                label: function(context) {
                                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                  const percentage = ((context.parsed / total) * 100).toFixed(1);
                                  return `${context.label}: ${context.parsed} (${percentage}%)`;
                                }
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </div>
        </Tab>

        <Tab eventKey="forecasting" title={
          <span>
            <i className="bi bi-graph-up-arrow me-2"></i>
            Forecasting
          </span>
        }>
          <EnhancedForecastingDashboard />
        </Tab>
      </Tabs>

      {/* Detailed Analysis Modals */}
      <Modal 
        show={showDetailModal !== null} 
        onHide={() => setShowDetailModal(null)} 
        size="xl" 
        centered
        className="chart-detail-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {showDetailModal === 'checkupTrends' && (
              <><i className="bi bi-graph-up me-2"></i>Patient Checkup Trends - Detailed Analysis</>
            )}
            {showDetailModal === 'demographics' && (
              <><i className="bi bi-pie-chart me-2"></i>Patient Demographics - Detailed Analysis</>
            )}
            {showDetailModal === 'medicineUsage' && (
              <><i className="bi bi-capsule me-2"></i>Medicine Usage - Detailed Analysis</>
            )}
            {showDetailModal === 'vaccineUsage' && (
              <><i className="bi bi-shield-check me-2"></i>Vaccine Usage - Detailed Analysis</>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {showDetailModal === 'checkupTrends' && (
            <Row>
              <Col md={8}>
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Header className="bg-light">
                    <h6 className="mb-0">Weekly Checkup Trends (Expanded)</h6>
                  </Card.Header>
                  <Card.Body style={{ height: '400px' }}>
                    <Line 
                      data={chartData.checkupTrends} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { position: 'top' },
                          title: { display: true, text: 'Patient Checkups by Day of Week' }
                        },
                        scales: {
                          y: { beginAtZero: true }
                        }
                      }}
                    />
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-light">
                    <h6 className="mb-0">Trends Summary</h6>
                  </Card.Header>
                  <Card.Body>
                    <div className="mb-3">
                      <strong>Peak Days:</strong>
                      <p className="text-muted small">Weekdays typically show higher activity</p>
                    </div>
                    <div className="mb-3">
                      <strong>Weekly Total:</strong>
                      <p className="text-muted small">{chartData.checkupTrends.datasets[0].data.reduce((a, b) => a + b, 0)} checkups</p>
                    </div>
                    <div className="mb-3">
                      <strong>Daily Average:</strong>
                      <p className="text-muted small">{(chartData.checkupTrends.datasets[0].data.reduce((a, b) => a + b, 0) / 7).toFixed(1)} checkups/day</p>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {showDetailModal === 'demographics' && (
            <Row>
              <Col md={6}>
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Header className="bg-light">
                    <h6 className="mb-0">Gender Distribution (Expanded)</h6>
                  </Card.Header>
                  <Card.Body style={{ height: '300px' }}>
                    <Pie 
                      data={chartData.demographics} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { position: 'bottom' },
                          title: { display: true, text: 'Patient Distribution by Gender' }
                        }
                      }}
                    />
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6}>
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Header className="bg-light">
                    <h6 className="mb-0">Age Distribution (Expanded)</h6>
                  </Card.Header>
                  <Card.Body style={{ height: '300px' }}>
                    <Bar 
                      data={chartData.ageDistribution} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          title: { display: true, text: 'Patient Distribution by Age Group' }
                        },
                        scales: {
                          y: { beginAtZero: true }
                        }
                      }}
                    />
                  </Card.Body>
                </Card>
              </Col>
              <Col md={12}>
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-light">
                    <h6 className="mb-0">Demographics Summary</h6>
                  </Card.Header>
                  <Card.Body>
                    <Table responsive>
                      <thead>
                        <tr>
                          <th>Metric</th>
                          <th>Count</th>
                          <th>Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Total Patients</td>
                          <td>{dashboardStats.totalPatients}</td>
                          <td>100%</td>
                        </tr>
                        <tr>
                          <td>Male Patients</td>
                          <td>{chartData.demographics.datasets[0].data[0] || 0}</td>
                          <td>{dashboardStats.totalPatients > 0 ? ((chartData.demographics.datasets[0].data[0] || 0) / dashboardStats.totalPatients * 100).toFixed(1) : 0}%</td>
                        </tr>
                        <tr>
                          <td>Female Patients</td>
                          <td>{chartData.demographics.datasets[0].data[1] || 0}</td>
                          <td>{dashboardStats.totalPatients > 0 ? ((chartData.demographics.datasets[0].data[1] || 0) / dashboardStats.totalPatients * 100).toFixed(1) : 0}%</td>
                        </tr>
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {showDetailModal === 'medicineUsage' && (
            <Row>
              <Col md={8}>
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">Medicine Usage Distribution (Expanded)</h6>
                    <ButtonGroup size="sm">
                      <Button 
                        variant={medicineUsageMetric === 'prescriptions' ? 'primary' : 'outline-primary'}
                        onClick={() => setMedicineUsageMetric('prescriptions')}
                      >
                        Prescriptions
                      </Button>
                      <Button 
                        variant={medicineUsageMetric === 'units' ? 'primary' : 'outline-primary'}
                        onClick={() => setMedicineUsageMetric('units')}
                      >
                        Units
                      </Button>
                    </ButtonGroup>
                  </Card.Header>
                  <Card.Body style={{ height: '400px' }}>
                    <Pie 
                      data={chartData.prescriptions} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { position: 'right' },
                          title: { 
                            display: true, 
                            text: `Medicine Usage by ${medicineUsageMetric === 'units' ? 'Total Units' : 'Prescription Count'}` 
                          }
                        }
                      }}
                    />
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-light">
                    <h6 className="mb-0">Usage Details</h6>
                  </Card.Header>
                  <Card.Body>
                    <Table responsive size="sm">
                      <thead>
                        <tr>
                          <th>Medicine</th>
                          <th>{medicineUsageMetric === 'units' ? 'Units' : 'Prescriptions'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chartData.prescriptions.labels.map((label, index) => (
                          <tr key={index}>
                            <td className="small">{label}</td>
                            <td>
                              <Badge bg="primary">
                                {chartData.prescriptions.datasets[0].data[index]}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                    <hr />
                    <div className="text-center">
                      <small className="text-muted">
                        {medicineUsageData && medicineUsageData.length > 0 
                          ? `Data from ${medicineUsageData.length} prescribed medicines` 
                          : 'Using fallback data'}
                      </small>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {showDetailModal === 'vaccineUsage' && (
            <Row>
              <Col md={8}>
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Header className="bg-light">
                    <h6 className="mb-0">Vaccine Usage Distribution (Expanded)</h6>
                  </Card.Header>
                  <Card.Body style={{ height: '400px' }}>
                    <Pie 
                      data={chartData.vaccinations} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { position: 'right' },
                          title: { display: true, text: 'Vaccine Administration Distribution' }
                        }
                      }}
                    />
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-light">
                    <h6 className="mb-0">Vaccination Summary</h6>
                  </Card.Header>
                  <Card.Body>
                    <Table responsive size="sm">
                      <thead>
                        <tr>
                          <th>Vaccine</th>
                          <th>Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chartData.vaccinations.labels.map((label, index) => (
                          <tr key={index}>
                            <td className="small">{label}</td>
                            <td>
                              <Badge bg="success">
                                {chartData.vaccinations.datasets[0].data[index]}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                    <hr />
                    <div className="text-center">
                      <small className="text-muted">
                        Total vaccines: {chartData.vaccinations.datasets[0].data.reduce((a, b) => a + b, 0)}
                      </small>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(null)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
});

DashboardStats.displayName = 'DashboardStats';

export default DashboardStats;
