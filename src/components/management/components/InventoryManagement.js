import React, { useState } from 'react';
import { Tabs, Tab, ButtonGroup, Button } from 'react-bootstrap';
import PrescriptionInventory from './PrescriptionInventory';
import VaccineInventory from './VaccineInventory';
import MedicalSuppliesInventory from './MedicalSuppliesInventory';
import InventoryAnalysis from './InventoryAnalysis';
import '../styles/InventoryManagement.css';

const InventoryManagement = ({ currentDateTime, isDarkMode, onNavigateToReports }) => {
  const [activeTab, setActiveTab] = useState('prescriptions');
  const [timePeriod, setTimePeriod] = useState('30days');

  return (
    <div className="inventory-management">
      {/* Header with Tabs */}
      <div className="inventory-tabs-container">
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="inventory-tabs"
        >
          <Tab eventKey="prescriptions" title={
            <span>
              <i className="bi bi-capsule me-2"></i>
              Prescription Inventories
            </span>
          }>
          </Tab>

          <Tab eventKey="vaccines" title={
            <span>
              <i className="bi bi-shield-check me-2"></i>
              Vaccine Inventories
            </span>
          }>
          </Tab>

          <Tab eventKey="medical-supplies" title={
            <span>
              <i className="bi bi-bandaid me-2"></i>
              Medical Supplies
            </span>
          }>
          </Tab>

          <Tab eventKey="analysis" title={
            <span>
              <i className="bi bi-graph-up me-2"></i>
              Inventory Analysis
            </span>
          }>
          </Tab>
        </Tabs>


      </div>

      {/* Tab Content */}
      <div className="inventory-content">
        {activeTab === 'prescriptions' && (
          <PrescriptionInventory 
            currentDateTime={currentDateTime} 
            isDarkMode={isDarkMode}
          />
        )}
        {activeTab === 'vaccines' && (
          <VaccineInventory 
            currentDateTime={currentDateTime} 
            isDarkMode={isDarkMode}
          />
        )}
        {activeTab === 'medical-supplies' && (
          <MedicalSuppliesInventory 
            currentDateTime={currentDateTime} 
            isDarkMode={isDarkMode}
          />
        )}
        {activeTab === 'analysis' && (
          <InventoryAnalysis 
            currentDateTime={currentDateTime} 
            isDarkMode={isDarkMode}
            timePeriod={timePeriod}
            onNavigateToReports={onNavigateToReports}
          />
        )}
      </div>
    </div>
  );
};

export default InventoryManagement;
