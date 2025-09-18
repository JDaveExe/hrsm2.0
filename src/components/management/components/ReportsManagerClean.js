import React, { useState, useMemo, useEffect } from 'react';
import { Card, Row, Col, Tabs, Tab } from 'react-bootstrap';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement, ArcElement } from 'chart.js';
import { Line, Pie, Bar } from 'react-chartjs-2';
import inventoryService from '../../../services/inventoryService';
import LoadingManagementBar from '../LoadingManagementBar';
import '../styles/ReportsManager.css';

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
  const [activeTab, setActiveTab] = useState('generate');
  const [showReportCenterModal, setShowReportCenterModal] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [currentModifyReport, setCurrentModifyReport] = useState(null);
  const [selectedChartType, setSelectedChartType] = useState('bar');
  const [showGeneratedChart, setShowGeneratedChart] = useState(false);
  const [generatedChartData, setGeneratedChartData] = useState(null);
  
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [reportStats, setReportStats] = useState({});
  const [inventoryData, setInventoryData] = useState({
    medications: [],
    vaccines: []
  });
  const [prescriptionAnalytics, setPrescriptionAnalytics] = useState({});

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setIsLoadingData(true);
      
      // Fetch analytics data
      const [medicationsData, vaccinesData, prescriptionData] = await Promise.all([
        inventoryService.getMedications(),
        inventoryService.getVaccines(),
        inventoryService.getPrescriptionAnalytics()
      ]);
      
      setInventoryData({
        medications: Array.isArray(medicationsData) ? medicationsData : [],
        vaccines: Array.isArray(vaccinesData) ? vaccinesData : []
      });
      
      setPrescriptionAnalytics(prescriptionData);
      
      // Calculate report statistics
      calculateReportStats(medicationsData, vaccinesData, prescriptionData);
      
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const calculateReportStats = (medications, vaccines, prescriptions) => {
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

    // Calculate expiring items
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
      
    const expiringSoon = expiringMedications + expiringVaccines;

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
        {/* Header Section */}
        <div className="reports-header-main">
          <h2>
            <i className="bi bi-file-earmark-bar-graph me-3"></i>
            Management Reports
          </h2>
          <p>Create, customize, and manage your inventory reports</p>
          
          {/* Header Actions */}
          <div className="reports-header-actions">
            <button 
              className="btn btn-primary btn-sm me-2"
              onClick={() => setShowReportCenterModal(true)}
            >
              <i className="bi bi-gear me-1"></i>
              Report Center
            </button>
            <button className="btn btn-success btn-sm" onClick={exportAllReports}>
              <i className="bi bi-download me-1"></i>
              Export All Reports
            </button>
          </div>
        </div>

        {/* Reports Tabs */}
        <div className="reports-tabs-container">
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
        </div>

        {/* Tab Content */}
        <div className="tab-content-wrapper">
          {activeTab === 'generate' && (
            <div className="generate-reports-content">
              {/* 3x3 Reports Grid */}
              <div className="reports-grid-3x3">
                {Array.from({ length: 9 }, (_, index) => (
                  <div key={index} className="report-slot">
                    <div className="report-slot-content">
                      <div className="slot-placeholder">
                        <i className="bi bi-plus-circle-dotted"></i>
                        <h4>Create Report</h4>
                        <p>Click to add a new report to this slot</p>
                        <button className="btn btn-outline-primary btn-sm">
                          <i className="bi bi-plus me-1"></i>
                          Add Report
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
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
      </div>
    </div>
  );
};

export default ReportsManager;
