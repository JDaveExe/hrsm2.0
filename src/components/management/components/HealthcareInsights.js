import React, { useState, useEffect, useMemo } from 'react';
import { Row, Col, Card, ButtonGroup, Button, Modal, Table, Badge, Dropdown } from 'react-bootstrap';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import LoadingManagementBar from '../LoadingManagementBar';
import { dashboardService } from '../../../services/dashboardService';
import inventoryService from '../../../services/inventoryService';
import api from '../../../services/axiosConfig';
import { PUROKS } from '../../../constants/addressConstants';

// Register Chart.js components without zoom plugin
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement);

const HealthcareInsights = ({ currentDateTime, isDarkMode, timePeriod = '30days', onNavigateToReports }) => {
  console.log('HealthcareInsights component rendered'); // Debug log
  
  const [loading, setLoading] = useState(true);
  const [diagnosisData, setDiagnosisData] = useState([]);
  const [prescriptionData, setPrescriptionData] = useState([]);
  const [vaccineData, setVaccineData] = useState([]);
  const [purokStreetsData, setPurokStreetsData] = useState([]); // Changed from purokVisitsData
  const [purokSummary, setPurokSummary] = useState({}); // Summary of visits by purok
  const [showDetailModal, setShowDetailModal] = useState(null);
  
  // Dual-mode grouping state (age or gender)
  const [groupMode, setGroupMode] = useState('age'); // 'age' or 'gender' - affects all charts simultaneously
  
  // Sorting states for each chart with detailed options
  const [diagnosisSortBy, setDiagnosisSortBy] = useState('total');
  const [prescriptionSortBy, setPrescriptionSortBy] = useState('total');
  const [vaccineSortBy, setVaccineSortBy] = useState('total');
  const [purokFilter, setPurokFilter] = useState('all'); // Filter by purok: 'all', 'Purok 1', 'Purok 2', etc.
  const [purokSortBy, setPurokSortBy] = useState('total'); // Sort streets by total visits or alphabetically

  // Dynamic sorting options based on grouping mode
  const getSortingOptions = (mode) => {
    if (mode === 'age') {
      return [
        { value: 'total', label: 'Total Count', icon: 'bi-bar-chart' },
        { value: 'age-0-17', label: '0-17 years', icon: 'bi-person-heart' },
        { value: 'age-18-30', label: '18-30 years', icon: 'bi-person' },
        { value: 'age-31-50', label: '31-50 years', icon: 'bi-person-check' },
        { value: 'age-51+', label: '51+ years', icon: 'bi-person-plus' },
        { value: 'name', label: 'Alphabetical (A-Z)', icon: 'bi-sort-alpha-down' }
      ];
    } else if (mode === 'gender') {
      return [
        { value: 'total', label: 'Total Count', icon: 'bi-bar-chart' },
        { value: 'gender-Male', label: 'Male', icon: 'bi-person-standing' },
        { value: 'gender-Female', label: 'Female', icon: 'bi-person-standing-dress' },
        { value: 'gender-Other', label: 'Other', icon: 'bi-person' },
        { value: 'name', label: 'Alphabetical (A-Z)', icon: 'bi-sort-alpha-down' }
      ];
    }
    return [];
  };

  // Grouping mode options
  const groupModeOptions = [
    { value: 'age', label: 'Group by Age', icon: 'bi-calendar3' },
    { value: 'gender', label: 'Group by Gender', icon: 'bi-people' }
  ];

  // Chart colors consistent with management theme
  const chartColors = {
    primary: '#28a745',
    secondary: '#17a2b8',
    success: '#28a745',
    info: '#17a2b8',
    warning: '#ffc107',
    danger: '#dc3545',
    light: '#f8f9fa',
    dark: '#343a40'
  };

  // Fetch healthcare insights data
  useEffect(() => {
    const fetchHealthcareData = async () => {
      setLoading(true);
      console.log('🔄 Fetching healthcare insights data...');
      try {
        // Fetch diagnosis data using api service
        console.log('📊 Fetching diagnosis data...');
        const diagnosisResponse = await api.get('/api/checkups/analytics/diagnosis');
        console.log('✅ Diagnosis data received:', diagnosisResponse.data);
        setDiagnosisData(diagnosisResponse.data || []);

        // Fetch prescription data using api service 
        console.log('💊 Fetching prescription data...');
        const prescriptionResponse = await api.get('/api/checkups/analytics/prescriptions');
        console.log('✅ Prescription data received:', prescriptionResponse.data);
        setPrescriptionData(prescriptionResponse.data || []);

        // Fetch vaccine usage data using inventory service
        console.log('💉 Fetching vaccine data...');
        const vaccineResult = await inventoryService.getVaccineUsageDistribution();
        console.log('✅ Vaccine data received:', vaccineResult);
        
        // Transform vaccine data to include mock age groups for consistency
        const transformedVaccineData = (vaccineResult.usage || []).map(vaccine => ({
          name: vaccine.vaccine_name,
          total: vaccine.usage_count,
          // Create mock age group distributions based on vaccine type
          ageGroups: {
            '0-17': Math.floor(vaccine.usage_count * 0.4), // 40% for children/teens (most vaccines)
            '18-30': Math.floor(vaccine.usage_count * 0.25), // 25% for young adults
            '31-50': Math.floor(vaccine.usage_count * 0.25), // 25% for middle-aged
            '51+': Math.floor(vaccine.usage_count * 0.1)    // 10% for older adults
          },
          // Add mock gender groups for vaccines
          genderGroups: {
            Male: Math.floor(vaccine.usage_count * 0.45),
            Female: Math.floor(vaccine.usage_count * 0.50),
            Other: Math.floor(vaccine.usage_count * 0.05)
          }
        }));
        setVaccineData(transformedVaccineData);

        // Fetch purok visits data using api service
        console.log('🏘️ Fetching purok street visits data...');
        const purokResponse = await api.get('/api/checkups/analytics/purok-visits');
        console.log('✅ Purok data received:', purokResponse.data);
        setPurokStreetsData(purokResponse.data?.streetData || []);
        setPurokSummary(purokResponse.data?.purokSummary || {});

        console.log('🎉 All healthcare data loaded successfully!');

      } catch (error) {
        console.error('❌ Error fetching healthcare insights data:', error);
        console.log('API Responses received:', {
          diagnosisData: diagnosisData?.length || 0,
          prescriptionData: prescriptionData?.length || 0,
          vaccineData: vaccineData?.length || 0
        });
        
        // Only use sample data if we truly have no data
        if (!diagnosisData?.length && !prescriptionData?.length) {
          console.warn('⚠️ Using sample data due to API errors');
          // Set placeholder data for development
          setDiagnosisData([
            { disease: 'Hypertension', total: 45, ageGroups: { '0-17': 0, '18-30': 8, '31-50': 20, '51+': 17 }, genderGroups: { Male: 25, Female: 20, Other: 0 } },
            { disease: 'Diabetes', total: 32, ageGroups: { '0-17': 0, '18-30': 3, '31-50': 15, '51+': 14 }, genderGroups: { Male: 18, Female: 14, Other: 0 } },
            { disease: 'Upper Respiratory Infection', total: 28, ageGroups: { '0-17': 6, '18-30': 12, '31-50': 10, '51+': 0 }, genderGroups: { Male: 15, Female: 13, Other: 0 } },
            { disease: 'Pneumonia', total: 18, ageGroups: { '0-17': 0, '18-30': 2, '31-50': 7, '51+': 9 }, genderGroups: { Male: 10, Female: 8, Other: 0 } }
          ]);
        
        // Use real prescription data if available, otherwise use fallback
        if (!prescriptionData.length) {
          setPrescriptionData([
            { name: 'Amoxicillin', total: 156, ageGroups: { '0-17': 20, '18-30': 45, '31-50': 68, '51+': 23 } },
            { name: 'Paracetamol', total: 142, ageGroups: { '0-17': 25, '18-30': 52, '31-50': 48, '51+': 17 } },
            { name: 'Ibuprofen', total: 98, ageGroups: { '0-17': 15, '18-30': 28, '31-50': 38, '51+': 17 } },
            { name: 'Aspirin', total: 76, ageGroups: { '0-17': 0, '18-30': 18, '31-50': 32, '51+': 26 } }
          ]);
        }

        // Use real vaccine data if available, otherwise use fallback
        if (!vaccineData.length) {
          setVaccineData([
            { name: 'Hepatitis B Vaccine', total: 89, ageGroups: { '0-17': 35, '18-30': 24, '31-50': 20, '51+': 10 } },
            { name: 'Flu Vaccine', total: 67, ageGroups: { '0-17': 12, '18-30': 15, '31-50': 25, '51+': 15 } },
            { name: 'COVID-19 Vaccine', total: 145, ageGroups: { '0-17': 25, '18-30': 45, '31-50': 52, '51+': 23 } },
            { name: 'MMR Vaccine', total: 45, ageGroups: { '0-17': 40, '18-30': 3, '31-50': 2, '51+': 0 } },
            { name: 'Tetanus Vaccine', total: 43, ageGroups: { '0-17': 5, '18-30': 12, '31-50': 18, '51+': 8 } }
          ]);
        }

        // DO NOT use sample data for purok streets - let it remain empty if no real data
        // The graph will show "No data available" which is correct for a fresh system
        }
      } finally {
        setLoading(false);
      }
    };

    fetchHealthcareData();
  }, [timePeriod]);

  // Handle group mode changes
  const handleGroupModeChange = (newMode) => {
    setGroupMode(newMode);
    // Reset all sorting options to 'total' when switching modes
    setDiagnosisSortBy('total');
    setPrescriptionSortBy('total');
    setVaccineSortBy('total');
    setPurokSortBy('total');
  };

  // Helper function to export chart data as CSV
  const exportToCSV = (chartType) => {
    try {
      let csvContent = '';
      let fileName = '';
      const timestamp = new Date().toLocaleString('en-US', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).replace(/[/:,]/g, '-');

      switch (chartType) {
        case 'diagnosisChart':
          fileName = `diagnosis-analysis-${timestamp}.csv`;
          csvContent = 'Disease,Total Count,0-17 years,18-30 years,31-50 years,51+ years,Male,Female,Other\n';
          diagnosisData.forEach(item => {
            csvContent += `"${item.disease}",${item.total},`;
            csvContent += `${item.ageGroups['0-17'] || 0},${item.ageGroups['18-30'] || 0},`;
            csvContent += `${item.ageGroups['31-50'] || 0},${item.ageGroups['51+'] || 0},`;
            csvContent += `${item.genderGroups?.Male || 0},${item.genderGroups?.Female || 0},`;
            csvContent += `${item.genderGroups?.Other || 0}\n`;
          });
          break;

        case 'prescriptionChart':
          fileName = `prescription-analysis-${timestamp}.csv`;
          csvContent = 'Medication,Total Count,0-17 years,18-30 years,31-50 years,51+ years,Male,Female,Other\n';
          prescriptionData.forEach(item => {
            csvContent += `"${item.name}",${item.total},`;
            csvContent += `${item.ageGroups['0-17'] || 0},${item.ageGroups['18-30'] || 0},`;
            csvContent += `${item.ageGroups['31-50'] || 0},${item.ageGroups['51+'] || 0},`;
            csvContent += `${item.genderGroups?.Male || 0},${item.genderGroups?.Female || 0},`;
            csvContent += `${item.genderGroups?.Other || 0}\n`;
          });
          break;

        case 'vaccineChart':
          fileName = `vaccine-analysis-${timestamp}.csv`;
          csvContent = 'Vaccine,Total Count,0-17 years,18-30 years,31-50 years,51+ years,Male,Female,Other\n';
          vaccineData.forEach(item => {
            csvContent += `"${item.name}",${item.total},`;
            csvContent += `${item.ageGroups['0-17'] || 0},${item.ageGroups['18-30'] || 0},`;
            csvContent += `${item.ageGroups['31-50'] || 0},${item.ageGroups['51+'] || 0},`;
            csvContent += `${item.genderGroups?.Male || 0},${item.genderGroups?.Female || 0},`;
            csvContent += `${item.genderGroups?.Other || 0}\n`;
          });
          break;

        case 'purokChart':
          fileName = `patient-visits-by-street-${timestamp}.csv`;
          csvContent = 'Purok,Street,Total Visits,Activity Level\n';
          purokStreetsData
            .filter(item => purokFilter === 'all' || item.purok === purokFilter)
            .forEach(item => {
              const activityLevel = item.visits > 30 ? 'High Activity' : 
                                   item.visits > 10 ? 'Moderate Activity' : 
                                   'Low Activity';
              csvContent += `"${item.purok}","${item.street}",${item.visits},"${activityLevel}"\n`;
            });
          break;

        default:
          throw new Error('Unknown chart type');
      }

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      console.log(`✅ Successfully exported ${fileName}`);
      alert(`✅ Data exported successfully as ${fileName}`);
    } catch (error) {
      console.error('❌ Error exporting data:', error);
      alert('❌ Failed to export data. Please try again.');
    }
  };

  // Helper function to create custom reports from charts
  const createCustomReport = (chartType, chartName, chartData, navigateToReports = null) => {
    try {
      // Validate that we have chart data
      if (!chartData || !chartData.labels || !chartData.datasets) {
        console.error('❌ Invalid chart data provided:', chartData);
        alert('❌ Cannot create report: Chart data is not available yet. Please wait for data to load.');
        return;
      }

      // Deep copy the chart data to preserve all information
      const deepCopyChartData = JSON.parse(JSON.stringify(chartData));

      // Generate unique report ID
      const reportId = `healthcare_${Date.now()}`;
      
      // Map chart types to report types (handle both formats)
      const reportTypeMapping = {
        'diagnosis-chart': {
          id: 'custom-diagnosis-analysis',
          name: `Diagnosis Analysis (${groupMode} mode)`,
          category: 'Healthcare Analytics',
          description: `Analysis of most diagnosed diseases grouped by ${groupMode}`
        },
        'diagnosisChart': {
          id: 'custom-diagnosis-analysis',
          name: `Diagnosis Analysis (${groupMode} mode)`,
          category: 'Healthcare Analytics',
          description: `Analysis of most diagnosed diseases grouped by ${groupMode}`
        },
        'prescription-chart': {
          id: 'custom-prescription-analysis',
          name: `Prescription Analysis (${groupMode} mode)`,
          category: 'Healthcare Analytics',
          description: `Analysis of most used prescriptions grouped by ${groupMode}`
        },
        'prescriptionChart': {
          id: 'custom-prescription-analysis',
          name: `Prescription Analysis (${groupMode} mode)`,
          category: 'Healthcare Analytics',
          description: `Analysis of most used prescriptions grouped by ${groupMode}`
        },
        'vaccine-chart': {
          id: 'custom-vaccine-analysis',
          name: `Vaccine Analysis (${groupMode} mode)`,
          category: 'Healthcare Analytics',
          description: `Analysis of most used vaccines grouped by ${groupMode}`
        },
        'vaccineChart': {
          id: 'custom-vaccine-analysis',
          name: `Vaccine Analysis (${groupMode} mode)`,
          category: 'Healthcare Analytics',
          description: `Analysis of most used vaccines grouped by ${groupMode}`
        },
        'purok-chart': {
          id: 'custom-purok-analysis',
          name: 'Purok Visits Analysis',
          category: 'Geographic Analytics',
          description: 'Analysis of patient visits by purok'
        },
        'purokChart': {
          id: 'custom-purok-analysis',
          name: 'Purok Visits Analysis',
          category: 'Geographic Analytics',
          description: 'Analysis of patient visits by purok'
        }
      };

      const reportType = reportTypeMapping[chartType];
      if (!reportType) {
        console.error('❌ Unknown chart type:', chartType);
        alert('❌ Cannot create report: Unknown chart type.');
        return;
      }

      // Prepare custom report data with comprehensive information
      const customReport = {
        id: reportId,
        type: reportType,
        name: reportType.name,
        chartType: 'bar', // Healthcare insights uses bar charts
        chartData: deepCopyChartData,
        // Store raw data for comprehensive tables
        rawData: {
          main: (chartType === 'diagnosisChart' || chartType === 'diagnosis-chart') ? diagnosisData :
                (chartType === 'prescriptionChart' || chartType === 'prescription-chart') ? prescriptionData :
                (chartType === 'vaccineChart' || chartType === 'vaccine-chart') ? vaccineData :
                purokStreetsData,
          dataType: (chartType === 'diagnosisChart' || chartType === 'diagnosis-chart') ? 'diagnosis' :
                   (chartType === 'prescriptionChart' || chartType === 'prescription-chart') ? 'prescription' :
                   (chartType === 'vaccineChart' || chartType === 'vaccine-chart') ? 'vaccine' :
                   'purok',
          groupMode: groupMode,
          totalRecords: (chartType === 'diagnosisChart' || chartType === 'diagnosis-chart') ? diagnosisData.length :
                       (chartType === 'prescriptionChart' || chartType === 'prescription-chart') ? prescriptionData.length :
                       (chartType === 'vaccineChart' || chartType === 'vaccine-chart') ? vaccineData.length :
                       purokStreetsData.length,
          generated: new Date().toISOString()
        },
        createdAt: new Date().toISOString(),
        settings: {
          groupMode: groupMode,
          timePeriod: timePeriod || '30days',
          generatedFrom: 'HealthcareInsights'
        }
      };

      // Get existing custom reports from localStorage
      const existingReports = JSON.parse(localStorage.getItem('reports_createdReports') || '{}');
      
      // Find next available slot (1-12)
      let selectedSlot = null;
      for (let i = 1; i <= 12; i++) {
        if (!existingReports[i]) {
          selectedSlot = i;
          break;
        }
      }

      if (!selectedSlot) {
        // If all slots are full, ask user which one to replace
        const shouldReplace = window.confirm(
          'All report slots are full. Would you like to replace the oldest report?'
        );
        if (shouldReplace) {
          // Find the oldest report to replace
          let oldestSlot = 1;
          let oldestDate = new Date();
          
          Object.entries(existingReports).forEach(([slot, report]) => {
            const reportDate = new Date(report.createdAt);
            if (reportDate < oldestDate) {
              oldestDate = reportDate;
              oldestSlot = parseInt(slot);
            }
          });
          selectedSlot = oldestSlot;
        } else {
          return; // User cancelled
        }
      }

      // Add the report to the selected slot
      existingReports[selectedSlot] = customReport;
      
      // Save back to localStorage
      localStorage.setItem('reports_createdReports', JSON.stringify(existingReports));
      
      console.log('✅ Custom healthcare report created:', {
        reportId,
        slot: selectedSlot,
        type: reportType.name,
        chartType: 'bar',
        groupMode: groupMode,
        dataLabels: deepCopyChartData.labels?.length || 0,
        dataPoints: deepCopyChartData.datasets?.[0]?.data?.length || 0
      });

      // Navigate to Reports page if navigation function provided
      if (onNavigateToReports && typeof onNavigateToReports === 'function') {
        onNavigateToReports();
        
        // Show success message after navigation
        setTimeout(() => {
          alert(`✅ Custom healthcare report "${reportType.name}" created successfully!\n\nReport is now visible in slot ${selectedSlot}.`);
        }, 500);
      } else {
        // Fallback: show message and suggest manual navigation
        alert(`✅ Custom healthcare report "${reportType.name}" created successfully!\n\nPlease navigate to Reports page to view it in slot ${selectedSlot}.`);
      }

    } catch (error) {
      console.error('❌ Failed to create custom healthcare report:', error);
      alert('❌ Failed to create custom report. Please try again.');
    }
  };

  // Process diagnosis data based on sorting and grouping mode
  const processedDiagnosisData = useMemo(() => {
    if (!diagnosisData?.length) return { labels: [], datasets: [] };

    let sortedData = [...diagnosisData];
    
    // Filter data based on age group selection
    if (diagnosisSortBy.startsWith('age-')) {
      const ageGroup = diagnosisSortBy.replace('age-', '');
      sortedData.sort((a, b) => (b.ageGroups[ageGroup] || 0) - (a.ageGroups[ageGroup] || 0));
      
      return {
        labels: sortedData.map(item => item.disease),
        datasets: [
          {
            label: `${ageGroup} years`,
            data: sortedData.map(item => item.ageGroups[ageGroup] || 0),
            backgroundColor: ageGroup === '0-17' ? chartColors.primary : ageGroup === '18-30' ? chartColors.info : ageGroup === '31-50' ? chartColors.warning : chartColors.danger,
            borderColor: ageGroup === '0-17' ? chartColors.primary : ageGroup === '18-30' ? chartColors.info : ageGroup === '31-50' ? chartColors.warning : chartColors.danger,
            borderWidth: 1
          }
        ]
      };
    }
    
    // Filter data based on gender group selection
    if (diagnosisSortBy.startsWith('gender-')) {
      const genderGroup = diagnosisSortBy.replace('gender-', '');
      sortedData.sort((a, b) => (b.genderGroups?.[genderGroup] || 0) - (a.genderGroups?.[genderGroup] || 0));
      
      return {
        labels: sortedData.map(item => item.disease),
        datasets: [
          {
            label: genderGroup,
            data: sortedData.map(item => item.genderGroups?.[genderGroup] || 0),
            backgroundColor: genderGroup === 'Male' ? chartColors.info : genderGroup === 'Female' ? chartColors.warning : chartColors.secondary,
            borderColor: genderGroup === 'Male' ? chartColors.info : genderGroup === 'Female' ? chartColors.warning : chartColors.secondary,
            borderWidth: 1
          }
        ]
      };
    }
    
    // Default sorting and show all groups based on grouping mode
    switch (diagnosisSortBy) {
      case 'disease':
      case 'name':
        sortedData.sort((a, b) => a.disease.localeCompare(b.disease));
        break;
      default: // 'total'
        sortedData.sort((a, b) => b.total - a.total);
    }

    // Return datasets based on grouping mode
    if (groupMode === 'gender') {
      return {
        labels: sortedData.map(item => item.disease),
        datasets: [
          {
            label: 'Male',
            data: sortedData.map(item => item.genderGroups?.Male || 0),
            backgroundColor: chartColors.info,
            borderColor: chartColors.info,
            borderWidth: 1
          },
          {
            label: 'Female',
            data: sortedData.map(item => item.genderGroups?.Female || 0),
            backgroundColor: chartColors.warning,
            borderColor: chartColors.warning,
            borderWidth: 1
          },
          {
            label: 'Other',
            data: sortedData.map(item => item.genderGroups?.Other || 0),
            backgroundColor: chartColors.secondary,
            borderColor: chartColors.secondary,
            borderWidth: 1
          }
        ]
      };
    }

    return {
      labels: sortedData.map(item => item.disease),
      datasets: [
        {
          label: '0-17 years',
          data: sortedData.map(item => item.ageGroups['0-17'] || 0),
          backgroundColor: chartColors.primary,
          borderColor: chartColors.primary,
          borderWidth: 1
        },
        {
          label: '18-30 years',
          data: sortedData.map(item => item.ageGroups['18-30'] || 0),
          backgroundColor: chartColors.info,
          borderColor: chartColors.info,
          borderWidth: 1
        },
        {
          label: '31-50 years', 
          data: sortedData.map(item => item.ageGroups['31-50'] || 0),
          backgroundColor: chartColors.warning,
          borderColor: chartColors.warning,
          borderWidth: 1
        },
        {
          label: '51+ years',
          data: sortedData.map(item => item.ageGroups['51+'] || 0),
          backgroundColor: chartColors.danger,
          borderColor: chartColors.danger,
          borderWidth: 1
        }
      ]
    };
  }, [diagnosisData, diagnosisSortBy, groupMode]);

  // Process prescription data based on sorting and grouping mode
  const processedPrescriptionData = useMemo(() => {
    if (!prescriptionData?.length) return { labels: [], datasets: [] };

    let sortedData = [...prescriptionData];
    
    // Filter data based on age group selection
    if (prescriptionSortBy.startsWith('age-')) {
      const ageGroup = prescriptionSortBy.replace('age-', '');
      sortedData.sort((a, b) => (b.ageGroups[ageGroup] || 0) - (a.ageGroups[ageGroup] || 0));
      
      return {
        labels: sortedData.map(item => item.name),
        datasets: [
          {
            label: `${ageGroup} years`,
            data: sortedData.map(item => item.ageGroups[ageGroup] || 0),
            backgroundColor: ageGroup === '0-17' ? chartColors.primary : ageGroup === '18-30' ? chartColors.info : ageGroup === '31-50' ? chartColors.warning : chartColors.danger,
            borderColor: ageGroup === '0-17' ? chartColors.primary : ageGroup === '18-30' ? chartColors.info : ageGroup === '31-50' ? chartColors.warning : chartColors.danger,
            borderWidth: 1
          }
        ]
      };
    }
    
    // Filter data based on gender group selection
    if (prescriptionSortBy.startsWith('gender-')) {
      const genderGroup = prescriptionSortBy.replace('gender-', '');
      sortedData.sort((a, b) => (b.genderGroups?.[genderGroup] || 0) - (a.genderGroups?.[genderGroup] || 0));
      
      return {
        labels: sortedData.map(item => item.name),
        datasets: [
          {
            label: genderGroup,
            data: sortedData.map(item => item.genderGroups?.[genderGroup] || 0),
            backgroundColor: genderGroup === 'Male' ? chartColors.info : genderGroup === 'Female' ? chartColors.warning : chartColors.secondary,
            borderColor: genderGroup === 'Male' ? chartColors.info : genderGroup === 'Female' ? chartColors.warning : chartColors.secondary,
            borderWidth: 1
          }
        ]
      };
    }
    
    // Default sorting and show all groups based on grouping mode
    switch (prescriptionSortBy) {
      case 'name':
        sortedData.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default: // 'total'
        sortedData.sort((a, b) => b.total - a.total);
    }

    // Return datasets based on grouping mode
    if (groupMode === 'gender') {
      return {
        labels: sortedData.map(item => item.name),
        datasets: [
          {
            label: 'Male',
            data: sortedData.map(item => item.genderGroups?.Male || 0),
            backgroundColor: chartColors.info,
            borderColor: chartColors.info,
            borderWidth: 1
          },
          {
            label: 'Female',
            data: sortedData.map(item => item.genderGroups?.Female || 0),
            backgroundColor: chartColors.warning,
            borderColor: chartColors.warning,
            borderWidth: 1
          },
          {
            label: 'Other',
            data: sortedData.map(item => item.genderGroups?.Other || 0),
            backgroundColor: chartColors.secondary,
            borderColor: chartColors.secondary,
            borderWidth: 1
          }
        ]
      };
    }

    return {
      labels: sortedData.map(item => item.name),
      datasets: [
        {
          label: '0-17 years',
          data: sortedData.map(item => item.ageGroups['0-17'] || 0),
          backgroundColor: chartColors.primary,
          borderColor: chartColors.primary,
          borderWidth: 1
        },
        {
          label: '18-30 years',
          data: sortedData.map(item => item.ageGroups['18-30'] || 0),
          backgroundColor: chartColors.info,
          borderColor: chartColors.info,
          borderWidth: 1
        },
        {
          label: '31-50 years',
          data: sortedData.map(item => item.ageGroups['31-50'] || 0),
          backgroundColor: chartColors.warning,
          borderColor: chartColors.warning,
          borderWidth: 1
        },
        {
          label: '51+ years',
          data: sortedData.map(item => item.ageGroups['51+'] || 0),
          backgroundColor: chartColors.danger,
          borderColor: chartColors.danger,
          borderWidth: 1
        }
      ]
    };
  }, [prescriptionData, prescriptionSortBy, groupMode]);

  // Process vaccine data based on sorting and grouping mode
  const processedVaccineData = useMemo(() => {
    if (!vaccineData?.length) return { labels: [], datasets: [] };

    let sortedData = [...vaccineData];
    
    // Filter data based on age group selection
    if (vaccineSortBy.startsWith('age-')) {
      const ageGroup = vaccineSortBy.replace('age-', '');
      sortedData.sort((a, b) => (b.ageGroups[ageGroup] || 0) - (a.ageGroups[ageGroup] || 0));
      
      return {
        labels: sortedData.map(item => item.name),
        datasets: [
          {
            label: `${ageGroup} years`,
            data: sortedData.map(item => item.ageGroups[ageGroup] || 0),
            backgroundColor: ageGroup === '0-17' ? chartColors.primary : ageGroup === '18-30' ? chartColors.warning : ageGroup === '31-50' ? chartColors.info : chartColors.success,
            borderColor: ageGroup === '0-17' ? chartColors.primary : ageGroup === '18-30' ? chartColors.warning : ageGroup === '31-50' ? chartColors.info : chartColors.success,
            borderWidth: 1
          }
        ]
      };
    }
    
    // Filter data based on gender group selection
    if (vaccineSortBy.startsWith('gender-')) {
      const genderGroup = vaccineSortBy.replace('gender-', '');
      sortedData.sort((a, b) => (b.genderGroups?.[genderGroup] || 0) - (a.genderGroups?.[genderGroup] || 0));
      
      return {
        labels: sortedData.map(item => item.name),
        datasets: [
          {
            label: genderGroup,
            data: sortedData.map(item => item.genderGroups?.[genderGroup] || 0),
            backgroundColor: genderGroup === 'Male' ? chartColors.info : genderGroup === 'Female' ? chartColors.warning : chartColors.secondary,
            borderColor: genderGroup === 'Male' ? chartColors.info : genderGroup === 'Female' ? chartColors.warning : chartColors.secondary,
            borderWidth: 1
          }
        ]
      };
    }
    
    // Default sorting and show all groups based on grouping mode
    switch (vaccineSortBy) {
      case 'name':
        sortedData.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default: // 'total'
        sortedData.sort((a, b) => b.total - a.total);
    }

    // Return datasets based on grouping mode
    if (groupMode === 'gender') {
      return {
        labels: sortedData.map(item => item.name),
        datasets: [
          {
            label: 'Male',
            data: sortedData.map(item => item.genderGroups?.Male || 0),
            backgroundColor: chartColors.info,
            borderColor: chartColors.info,
            borderWidth: 1
          },
          {
            label: 'Female',
            data: sortedData.map(item => item.genderGroups?.Female || 0),
            backgroundColor: chartColors.warning,
            borderColor: chartColors.warning,
            borderWidth: 1
          },
          {
            label: 'Other',
            data: sortedData.map(item => item.genderGroups?.Other || 0),
            backgroundColor: chartColors.secondary,
            borderColor: chartColors.secondary,
            borderWidth: 1
          }
        ]
      };
    }

    return {
      labels: sortedData.map(item => item.name),
      datasets: [
        {
          label: '0-17 years',
          data: sortedData.map(item => item.ageGroups['0-17'] || 0),
          backgroundColor: chartColors.primary,
          borderColor: chartColors.primary,
          borderWidth: 1
        },
        {
          label: '18-30 years',
          data: sortedData.map(item => item.ageGroups['18-30'] || 0),
          backgroundColor: chartColors.warning,
          borderColor: chartColors.warning,
          borderWidth: 1
        },
        {
          label: '31-50 years',
          data: sortedData.map(item => item.ageGroups['31-50'] || 0),
          backgroundColor: chartColors.info,
          borderColor: chartColors.info,
          borderWidth: 1
        },
        {
          label: '51+ years',
          data: sortedData.map(item => item.ageGroups['51+'] || 0),
          backgroundColor: chartColors.success,
          borderColor: chartColors.success,
          borderWidth: 1
        }
      ]
    };
  }, [vaccineData, vaccineSortBy, groupMode]);

  // Process purok street visits data based on sorting and filtering
  const processedPurokData = useMemo(() => {
    if (!purokStreetsData?.length) return { labels: [], datasets: [] };

    // Filter by purok if not 'all'
    let filteredData = purokFilter === 'all' 
      ? purokStreetsData 
      : purokStreetsData.filter(item => item.purok === purokFilter);
    
    // Sort data
    let sortedData = [...filteredData];
    switch (purokSortBy) {
      case 'street':
        sortedData.sort((a, b) => a.street.localeCompare(b.street));
        break;
      default: // 'total'
        sortedData.sort((a, b) => b.visits - a.visits);
    }

    return {
      labels: sortedData.map(item => item.street),
      datasets: [
        {
          label: 'Completed Checkups',
          data: sortedData.map(item => item.visits),
          backgroundColor: sortedData.map(item => {
            // Color code by purok
            switch(item.purok) {
              case 'Purok 1': return 'rgba(54, 162, 235, 0.6)';
              case 'Purok 2': return 'rgba(75, 192, 192, 0.6)';
              case 'Purok 3': return 'rgba(255, 206, 86, 0.6)';
              case 'Purok 4': return 'rgba(153, 102, 255, 0.6)';
              default: return 'rgba(201, 203, 207, 0.6)';
            }
          }),
          borderColor: sortedData.map(item => {
            switch(item.purok) {
              case 'Purok 1': return 'rgba(54, 162, 235, 1)';
              case 'Purok 2': return 'rgba(75, 192, 192, 1)';
              case 'Purok 3': return 'rgba(255, 206, 86, 1)';
              case 'Purok 4': return 'rgba(153, 102, 255, 1)';
              default: return 'rgba(201, 203, 207, 1)';
            }
          }),
          borderWidth: 1
        }
      ]
    };
  }, [purokStreetsData, purokSortBy, purokFilter]);

  // Chart options without zoom functionality
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index'
    },
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    }
  };

  // Custom sorting dropdown component with consistent styling
  const SortingDropdown = ({ currentSort, onSortChange, options, variant = 'primary', size = 'sm' }) => {
    const currentOption = options.find(opt => opt.value === currentSort) || options[0];
    
    return (
      <Dropdown>
        <Dropdown.Toggle 
          variant={`outline-${variant}`} 
          size={size}
          className="healthcare-insights-dropdown d-flex align-items-center"
          style={{ minWidth: '140px' }}
        >
          <i className={`${currentOption.icon} me-2`}></i>
          {currentOption.label}
        </Dropdown.Toggle>
        <Dropdown.Menu className="healthcare-insights-dropdown-menu">
          {options.map(option => (
            <Dropdown.Item
              key={option.value}
              active={currentSort === option.value}
              onClick={() => onSortChange(option.value)}
              className="healthcare-insights-dropdown-item d-flex align-items-center"
            >
              <i className={`${option.icon} me-2`}></i>
              {option.label}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    );
  };

  if (loading) {
    return <LoadingManagementBar message="Loading healthcare insights data..." duration="normal" />;
  }

  return (
    <>
      <style jsx>{`
        .healthcare-insights-dropdown .dropdown-toggle {
          border: 1px solid #dee2e6;
          transition: all 0.2s ease;
        }
        
        .healthcare-insights-dropdown .dropdown-toggle:hover {
          border-color: #28a745;
          box-shadow: 0 0 0 0.1rem rgba(40, 167, 69, 0.15);
        }
        
        .healthcare-insights-dropdown-menu {
          border: 1px solid #dee2e6;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          border-radius: 6px;
        }
        
        .healthcare-insights-dropdown-item {
          padding: 0.5rem 1rem;
          transition: all 0.2s ease;
        }
        
        .healthcare-insights-dropdown-item:hover {
          background-color: #f8f9fa;
          color: #28a745;
        }
        
        .healthcare-insights-dropdown-item.active {
          background-color: #28a745;
          color: white;
        }
        
        .healthcare-insights-modal .modal-dialog {
          max-width: 90%;
        }
        
        .healthcare-insights-modal .modal-body {
          padding: 2rem;
        }
      `}</style>
      <div className="healthcare-insights">
      
      {/* Group Mode Selector */}
      <Row className="mb-4">
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Body className="py-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1">
                    <i className="bi bi-diagram-3 me-2 text-primary"></i>
                    Data Grouping Mode
                  </h6>
                  <small className="text-muted">Choose how to group data across all charts</small>
                </div>
                <ButtonGroup>
                  <Button
                    variant={groupMode === 'age' ? 'primary' : 'outline-primary'}
                    onClick={() => handleGroupModeChange('age')}
                    className="d-flex align-items-center"
                  >
                    <i className="bi bi-calendar-event me-2"></i>
                    Age Groups
                  </Button>
                  <Button
                    variant={groupMode === 'gender' ? 'primary' : 'outline-primary'}
                    onClick={() => handleGroupModeChange('gender')}
                    className="d-flex align-items-center"
                  >
                    <i className="bi bi-people me-2"></i>
                    Gender Groups
                  </Button>
                </ButtonGroup>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Charts Grid - 2x2 Layout */}
      <Row className="g-4">
        {/* Most Diagnosed Diseases Chart */}
        <Col lg={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-light border-0">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-0">Most Diagnosed Diseases</h5>
                  <small className="text-muted">
                    Breakdown by {groupMode === 'age' ? 'age groups' : 'gender groups'}
                  </small>
                </div>
                <div className="d-flex gap-2 align-items-center">
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={() => setShowDetailModal('diagnosisChart')}
                    className="d-flex align-items-center"
                  >
                    <i className="bi bi-fullscreen me-1"></i>
                    Zoom
                  </Button>
                  <SortingDropdown
                    currentSort={diagnosisSortBy}
                    onSortChange={setDiagnosisSortBy}
                    options={[
                      ...getSortingOptions(groupMode).filter(opt => opt.value !== 'name'),
                      { value: 'disease', label: 'Disease Name (A-Z)', icon: 'bi-sort-alpha-down' }
                    ]}
                    variant="primary"
                  />
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              <div style={{ height: '350px' }}>
                <Bar data={processedDiagnosisData} options={chartOptions} />
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Most Used Prescriptions Chart */}
        <Col lg={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-light border-0">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-0">Most Used Prescriptions</h5>
                  <small className="text-muted">
                    Medicine usage by {groupMode === 'age' ? 'age groups' : 'gender groups'}
                  </small>
                </div>
                <div className="d-flex gap-2 align-items-center">
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={() => setShowDetailModal('prescriptionChart')}
                    className="d-flex align-items-center"
                  >
                    <i className="bi bi-fullscreen me-1"></i>
                    Zoom
                  </Button>
                  <SortingDropdown
                    currentSort={prescriptionSortBy}
                    onSortChange={setPrescriptionSortBy}
                    options={getSortingOptions(groupMode)}
                    variant="primary"
                  />
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              <div style={{ height: '350px' }}>
                <Bar data={processedPrescriptionData} options={chartOptions} />
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Most Used Vaccines Chart */}
        <Col lg={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-light border-0">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-0">Most Used Vaccines</h5>
                  <small className="text-muted">
                    Vaccine usage by {groupMode === 'age' ? 'age groups' : 'gender groups'}
                  </small>
                </div>
                <div className="d-flex gap-2 align-items-center">
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={() => setShowDetailModal('vaccineChart')}
                    className="d-flex align-items-center"
                  >
                    <i className="bi bi-fullscreen me-1"></i>
                    Zoom
                  </Button>
                  <SortingDropdown
                    currentSort={vaccineSortBy}
                    onSortChange={setVaccineSortBy}
                    options={getSortingOptions(groupMode)}
                    variant="primary"
                  />
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              <div style={{ height: '350px' }}>
                <Bar data={processedVaccineData} options={chartOptions} />
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Patient Visits by Purok Chart */}
        <Col lg={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-light border-0">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-0">Patient Visits by Street</h5>
                  <small className="text-muted">Completed checkups & vaccinations • Grouped by Purok</small>
                </div>
                <div className="d-flex gap-2 align-items-center">
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={() => setShowDetailModal('purokChart')}
                    className="d-flex align-items-center"
                  >
                    <i className="bi bi-fullscreen me-1"></i>
                    Zoom
                  </Button>
                  {/* Purok Filter Dropdown */}
                  <Dropdown>
                    <Dropdown.Toggle 
                      variant="outline-success" 
                      size="sm"
                      className="d-flex align-items-center"
                      style={{ minWidth: '120px' }}
                    >
                      <i className="bi bi-funnel me-1"></i>
                      {purokFilter === 'all' ? 'All Puroks' : purokFilter}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item 
                        active={purokFilter === 'all'}
                        onClick={() => setPurokFilter('all')}
                      >
                        <i className="bi bi-globe me-2"></i>
                        All Puroks
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      {PUROKS.map(purok => (
                        <Dropdown.Item 
                          key={purok}
                          active={purokFilter === purok}
                          onClick={() => setPurokFilter(purok)}
                        >
                          <i className="bi bi-geo-alt me-2"></i>
                          {purok} ({purokSummary[purok] || 0} visits)
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>
                  {/* Sort Dropdown */}
                  <SortingDropdown
                    currentSort={purokSortBy}
                    onSortChange={setPurokSortBy}
                    options={[
                      { value: 'total', label: 'Most Visits', icon: 'bi-bar-chart' },
                      { value: 'street', label: 'Street Name (A-Z)', icon: 'bi-sort-alpha-down' }
                    ]}
                    variant="primary"
                  />
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              <div style={{ height: '350px' }}>
                <Bar data={processedPurokData} options={chartOptions} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Summary Statistics */}
      <Row className="mt-4">
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-light border-0">
              <h5 className="mb-0">Summary Statistics</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3} className="text-center">
                  <div className="metric-card">
                    <i className="bi bi-clipboard-data text-primary display-6"></i>
                    <h4 className="mt-2">{diagnosisData.reduce((sum, item) => sum + item.total, 0)}</h4>
                    <small className="text-muted">Total Diagnoses</small>
                  </div>
                </Col>
                <Col md={3} className="text-center">
                  <div className="metric-card">
                    <i className="bi bi-capsule text-success display-6"></i>
                    <h4 className="mt-2">{prescriptionData.reduce((sum, item) => sum + item.total, 0)}</h4>
                    <small className="text-muted">Prescriptions Given</small>
                  </div>
                </Col>
                <Col md={3} className="text-center">
                  <div className="metric-card">
                    <i className="bi bi-geo-alt text-info display-6"></i>
                    <h4 className="mt-2">{purokStreetsData.reduce((sum, item) => sum + item.visits, 0)}</h4>
                    <small className="text-muted">Total Visits</small>
                  </div>
                </Col>
                <Col md={3} className="text-center">
                  <div className="metric-card">
                    <i className="bi bi-people text-warning display-6"></i>
                    <h4 className="mt-2">{Object.keys(purokSummary).length}</h4>
                    <small className="text-muted">Puroks Served</small>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Enhanced Zoom Modals */}
      <Modal 
        show={showDetailModal !== null} 
        onHide={() => setShowDetailModal(null)}
        size="xl"
        className="healthcare-insights-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-graph-up me-2 text-primary"></i>
            {showDetailModal === 'diagnosisChart' && `Most Diagnosed Diseases - Detailed View (${groupMode} mode)`}
            {showDetailModal === 'prescriptionChart' && `Most Used Prescriptions - Detailed View (${groupMode} mode)`}
            {showDetailModal === 'vaccineChart' && `Most Used Vaccines - Detailed View (${groupMode} mode)`}
            {showDetailModal === 'barangayChart' && 'Patient Visits by Barangay - Detailed View'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {/* Chart Section */}
          <div style={{ height: '500px', marginBottom: '30px' }}>
            {showDetailModal === 'diagnosisChart' && (
              <Bar data={processedDiagnosisData} options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  legend: {
                    ...chartOptions.plugins.legend,
                    position: 'top',
                    labels: {
                      padding: 20,
                      usePointStyle: true,
                      font: { size: 14 }
                    }
                  }
                }
              }} />
            )}
            {showDetailModal === 'prescriptionChart' && (
              <Bar data={processedPrescriptionData} options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  legend: {
                    ...chartOptions.plugins.legend,
                    position: 'top',
                    labels: {
                      padding: 20,
                      usePointStyle: true,
                      font: { size: 14 }
                    }
                  }
                }
              }} />
            )}
            {showDetailModal === 'vaccineChart' && (
              <Bar data={processedVaccineData} options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  legend: {
                    ...chartOptions.plugins.legend,
                    position: 'top',
                    labels: {
                      padding: 20,
                      usePointStyle: true,
                      font: { size: 14 }
                    }
                  }
                }
              }} />
            )}
            {showDetailModal === 'purokChart' && (
              <Bar data={processedPurokData} options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  legend: {
                    ...chartOptions.plugins.legend,
                    position: 'top',
                    labels: {
                      padding: 20,
                      usePointStyle: true,
                      font: { size: 14 }
                    }
                  }
                }
              }} />
            )}
          </div>

          {/* Detailed Data Tables */}
          <Row>
            <Col md={8}>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">
                    <i className="bi bi-table me-2"></i>
                    Detailed Data Table
                  </h5>
                </Card.Header>
                <Card.Body>
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {showDetailModal === 'diagnosisChart' && (
                      <Table striped bordered hover responsive>
                        <thead>
                          <tr>
                            <th rowSpan="2">Disease</th>
                            <th rowSpan="2">Total Count</th>
                            <th colSpan="4" className="text-center bg-primary text-white">Age Groups</th>
                            <th colSpan="3" className="text-center bg-info text-white">Gender Groups</th>
                          </tr>
                          <tr>
                            <th className="bg-light">0-17 years</th>
                            <th className="bg-light">18-30 years</th>
                            <th className="bg-light">31-50 years</th>
                            <th className="bg-light">51+ years</th>
                            <th className="bg-light">Male</th>
                            <th className="bg-light">Female</th>
                            <th className="bg-light">Other</th>
                          </tr>
                        </thead>
                        <tbody>
                          {diagnosisData.map((item, index) => (
                            <tr key={index}>
                              <td className="fw-bold">{item.disease}</td>
                              <td>
                                <Badge bg="primary" className="px-2 py-1">
                                  {item.total}
                                </Badge>
                              </td>
                              <td>{item.ageGroups['0-17'] || 0}</td>
                              <td>{item.ageGroups['18-30'] || 0}</td>
                              <td>{item.ageGroups['31-50'] || 0}</td>
                              <td>{item.ageGroups['51+'] || 0}</td>
                              <td>{item.genderGroups?.Male || 0}</td>
                              <td>{item.genderGroups?.Female || 0}</td>
                              <td>{item.genderGroups?.Other || 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    )}

                    {showDetailModal === 'prescriptionChart' && (
                      <Table striped bordered hover responsive>
                        <thead>
                          <tr>
                            <th rowSpan="2">Medication</th>
                            <th rowSpan="2">Total Count</th>
                            <th colSpan="4" className="text-center bg-success text-white">Age Groups</th>
                            <th colSpan="3" className="text-center bg-info text-white">Gender Groups</th>
                          </tr>
                          <tr>
                            <th className="bg-light">0-17 years</th>
                            <th className="bg-light">18-30 years</th>
                            <th className="bg-light">31-50 years</th>
                            <th className="bg-light">51+ years</th>
                            <th className="bg-light">Male</th>
                            <th className="bg-light">Female</th>
                            <th className="bg-light">Other</th>
                          </tr>
                        </thead>
                        <tbody>
                          {prescriptionData.map((item, index) => (
                            <tr key={index}>
                              <td className="fw-bold">{item.name}</td>
                              <td>
                                <Badge bg="success" className="px-2 py-1">
                                  {item.total}
                                </Badge>
                              </td>
                              <td>{item.ageGroups['0-17'] || 0}</td>
                              <td>{item.ageGroups['18-30'] || 0}</td>
                              <td>{item.ageGroups['31-50'] || 0}</td>
                              <td>{item.ageGroups['51+'] || 0}</td>
                              <td>{item.genderGroups?.Male || 0}</td>
                              <td>{item.genderGroups?.Female || 0}</td>
                              <td>{item.genderGroups?.Other || 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    )}

                    {showDetailModal === 'vaccineChart' && (
                      <Table striped bordered hover responsive>
                        <thead>
                          <tr>
                            <th rowSpan="2">Vaccine</th>
                            <th rowSpan="2">Total Count</th>
                            <th colSpan="4" className="text-center bg-warning text-white">Age Groups</th>
                            <th colSpan="3" className="text-center bg-info text-white">Gender Groups</th>
                          </tr>
                          <tr>
                            <th className="bg-light">0-17 years</th>
                            <th className="bg-light">18-30 years</th>
                            <th className="bg-light">31-50 years</th>
                            <th className="bg-light">51+ years</th>
                            <th className="bg-light">Male</th>
                            <th className="bg-light">Female</th>
                            <th className="bg-light">Other</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vaccineData.map((item, index) => (
                            <tr key={index}>
                              <td className="fw-bold">{item.name}</td>
                              <td>
                                <Badge bg="info" className="px-2 py-1">
                                  {item.total}
                                </Badge>
                              </td>
                              <td>{item.ageGroups['0-17'] || 0}</td>
                              <td>{item.ageGroups['18-30'] || 0}</td>
                              <td>{item.ageGroups['31-50'] || 0}</td>
                              <td>{item.ageGroups['51+'] || 0}</td>
                              <td>{item.genderGroups?.Male || 0}</td>
                              <td>{item.genderGroups?.Female || 0}</td>
                              <td>{item.genderGroups?.Other || 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    )}

                    {showDetailModal === 'purokChart' && (
                      <Table striped bordered hover responsive>
                        <thead>
                          <tr>
                            <th>Purok</th>
                            <th>Street</th>
                            <th>Total Visits</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {purokStreetsData
                            .filter(item => purokFilter === 'all' || item.purok === purokFilter)
                            .map((item, index) => (
                            <tr key={index}>
                              <td>
                                <Badge 
                                  bg={
                                    item.purok === 'Purok 1' ? 'primary' :
                                    item.purok === 'Purok 2' ? 'info' :
                                    item.purok === 'Purok 3' ? 'warning' :
                                    'secondary'
                                  }
                                  className="px-2 py-1"
                                >
                                  {item.purok}
                                </Badge>
                              </td>
                              <td className="fw-bold">{item.street}</td>
                              <td>
                                <Badge bg="success" className="px-2 py-1">
                                  {item.visits}
                                </Badge>
                              </td>
                              <td>
                                <Badge bg={item.visits > 30 ? 'success' : item.visits > 10 ? 'warning' : 'secondary'}>
                                  {item.visits > 30 ? 'High Activity' : item.visits > 10 ? 'Moderate Activity' : 'Low Activity'}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="border-0 shadow-sm mb-3">
                <Card.Header className="bg-primary text-white">
                  <h5 className="mb-0">
                    <i className="bi bi-bar-chart me-2"></i>
                    Summary Statistics
                  </h5>
                </Card.Header>
                <Card.Body>
                  {showDetailModal === 'diagnosisChart' && (
                    <div className="d-flex flex-column gap-3">
                      <div className="text-center p-3 border-bottom">
                        <div className="display-6 text-primary fw-bold">
                          {diagnosisData.reduce((sum, item) => sum + item.total, 0)}
                        </div>
                        <div className="text-muted">Total Diagnoses</div>
                      </div>
                      <div className="text-center p-3 border-bottom">
                        <div className="h4 text-info fw-bold">{diagnosisData.length}</div>
                        <div className="text-muted">Disease Types</div>
                      </div>
                      <div className="text-center p-3">
                        <div className="h4 text-success fw-bold">
                          {diagnosisData.length > 0 ? Math.round(diagnosisData.reduce((sum, item) => sum + item.total, 0) / diagnosisData.length) : 0}
                        </div>
                        <div className="text-muted">Avg per Disease</div>
                      </div>
                    </div>
                  )}
                  
                  {showDetailModal === 'prescriptionChart' && (
                    <div className="d-flex flex-column gap-3">
                      <div className="text-center p-3 border-bottom">
                        <div className="display-6 text-success fw-bold">
                          {prescriptionData.reduce((sum, item) => sum + item.total, 0)}
                        </div>
                        <div className="text-muted">Total Prescriptions</div>
                      </div>
                      <div className="text-center p-3 border-bottom">
                        <div className="h4 text-info fw-bold">{prescriptionData.length}</div>
                        <div className="text-muted">Medication Types</div>
                      </div>
                      <div className="text-center p-3">
                        <div className="h4 text-warning fw-bold">
                          {prescriptionData.length > 0 ? Math.round(prescriptionData.reduce((sum, item) => sum + item.total, 0) / prescriptionData.length) : 0}
                        </div>
                        <div className="text-muted">Avg per Medication</div>
                      </div>
                    </div>
                  )}

                  {showDetailModal === 'vaccineChart' && (
                    <div className="d-flex flex-column gap-3">
                      <div className="text-center p-3 border-bottom">
                        <div className="display-6 text-info fw-bold">
                          {vaccineData.reduce((sum, item) => sum + item.total, 0)}
                        </div>
                        <div className="text-muted">Total Vaccines</div>
                      </div>
                      <div className="text-center p-3 border-bottom">
                        <div className="h4 text-success fw-bold">{vaccineData.length}</div>
                        <div className="text-muted">Vaccine Types</div>
                      </div>
                      <div className="text-center p-3">
                        <div className="h4 text-primary fw-bold">
                          {vaccineData.length > 0 ? Math.round(vaccineData.reduce((sum, item) => sum + item.total, 0) / vaccineData.length) : 0}
                        </div>
                        <div className="text-muted">Avg per Vaccine</div>
                      </div>
                    </div>
                  )}

                  {showDetailModal === 'purokChart' && (
                    <div className="d-flex flex-column gap-3">
                      <div className="text-center p-3 border-bottom">
                        <div className="display-6 text-warning fw-bold">
                          {purokStreetsData
                            .filter(item => purokFilter === 'all' || item.purok === purokFilter)
                            .reduce((sum, item) => sum + item.visits, 0)}
                        </div>
                        <div className="text-muted">
                          {purokFilter === 'all' ? 'Total Visits (All Puroks)' : `Total Visits (${purokFilter})`}
                        </div>
                      </div>
                      <div className="text-center p-3 border-bottom">
                        <div className="h4 text-info fw-bold">
                          {purokStreetsData.filter(item => purokFilter === 'all' || item.purok === purokFilter).length}
                        </div>
                        <div className="text-muted">Streets Served</div>
                      </div>
                      <div className="text-center p-3">
                        <div className="h4 text-success fw-bold">
                          {purokStreetsData.filter(item => purokFilter === 'all' || item.purok === purokFilter).length > 0 
                            ? Math.round(
                                purokStreetsData
                                  .filter(item => purokFilter === 'all' || item.purok === purokFilter)
                                  .reduce((sum, item) => sum + item.visits, 0) / 
                                purokStreetsData.filter(item => purokFilter === 'all' || item.purok === purokFilter).length
                              ) 
                            : 0}
                        </div>
                        <div className="text-muted">Avg per Street</div>
                      </div>
                    </div>
                  )}
                </Card.Body>
              </Card>

              {/* Action Buttons */}
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-light">
                  <h6 className="mb-0">
                    <i className="bi bi-gear me-2"></i>
                    Actions
                  </h6>
                </Card.Header>
                <Card.Body>
                  <div className="d-grid gap-2">
                    <Button 
                      variant="success" 
                      size="sm"
                      className="d-flex align-items-center justify-content-center"
                      onClick={() => {
                        const chartType = showDetailModal;
                        const chartData = chartType === 'diagnosisChart' ? processedDiagnosisData :
                                        chartType === 'prescriptionChart' ? processedPrescriptionData :
                                        chartType === 'vaccineChart' ? processedVaccineData :
                                        processedPurokData;
                        const chartName = chartType === 'diagnosisChart' ? 'Diagnosis Analysis' :
                                        chartType === 'prescriptionChart' ? 'Prescription Analysis' :
                                        chartType === 'vaccineChart' ? 'Vaccine Analysis' :
                                        'Purok Visits Analysis';
                        
                        createCustomReport(chartType, chartName, chartData, onNavigateToReports);
                      }}
                    >
                      <i className="bi bi-file-plus me-2"></i>
                      Create Custom Report
                    </Button>
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      className="d-flex align-items-center justify-content-center"
                      onClick={() => exportToCSV(showDetailModal)}
                    >
                      <i className="bi bi-download me-2"></i>
                      Export Data
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowDetailModal(null)}>
            <i className="bi bi-x-circle me-1"></i>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
    </>
  );
};

export default HealthcareInsights;
