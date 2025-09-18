import React, { useState, useEffect } from 'react';
import { Badge } from 'react-bootstrap';
import inventoryService from '../../../services/inventoryService';
import './styles/InventoryAlerts.css';

const InventoryAlerts = ({ onNavigateToInventory }) => {
  const [lowStockItems, setLowStockItems] = useState([]);
  const [emptyStockItems, setEmptyStockItems] = useState([]);
  const [expiringItems, setExpiringItems] = useState([]);
  const [expiredItems, setExpiredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [muteStates, setMuteStates] = useState({});
  const [showMuteOptions, setShowMuteOptions] = useState(null);

  useEffect(() => {
    loadInventoryAlerts();
    // Load mute states from localStorage
    const savedMuteStates = localStorage.getItem('inventoryAlertMutes');
    if (savedMuteStates) {
      setMuteStates(JSON.parse(savedMuteStates));
    }
  }, []);

  // Check if alert type is muted
  const isAlertMuted = (alertType) => {
    const muteInfo = muteStates[alertType];
    if (!muteInfo) return false;
    
    if (muteInfo.indefinite) return true;
    
    return new Date() < new Date(muteInfo.until);
  };

  const muteAlert = (alertType, duration) => {
    let muteUntil;
    let indefinite = false;

    switch (duration) {
      case '10min':
        muteUntil = new Date(Date.now() + 10 * 60 * 1000);
        break;
      case '30min':
        muteUntil = new Date(Date.now() + 30 * 60 * 1000);
        break;
      case '1hr':
        muteUntil = new Date(Date.now() + 60 * 60 * 1000);
        break;
      case 'indefinite':
        indefinite = true;
        break;
      default:
        return;
    }

    const newMuteStates = {
      ...muteStates,
      [alertType]: {
        until: muteUntil,
        indefinite
      }
    };

    setMuteStates(newMuteStates);
    localStorage.setItem('inventoryAlertMutes', JSON.stringify(newMuteStates));
    setShowMuteOptions(null);
  };

  const loadInventoryAlerts = async () => {
    try {
      setLoading(true);
      const [vaccines, medications] = await Promise.all([
        inventoryService.getAllVaccines(),
        inventoryService.getAllMedications()
      ]);

      // Process vaccines
      const vaccineAlerts = processItems(vaccines, 'vaccine');
      // Process medications
      const medicationAlerts = processItems(medications, 'medication');

      // Combine alerts
      setLowStockItems([...vaccineAlerts.lowStock, ...medicationAlerts.lowStock]);
      setEmptyStockItems([...vaccineAlerts.emptyStock, ...medicationAlerts.emptyStock]);
      setExpiringItems([...vaccineAlerts.expiring, ...medicationAlerts.expiring]);
      setExpiredItems([...vaccineAlerts.expired, ...medicationAlerts.expired]);
    } catch (error) {
      console.error('Error loading inventory alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const processItems = (items, type) => {
    const lowStock = [];
    const emptyStock = [];
    const expiring = [];
    const expired = [];

    items.forEach(item => {
      // Skip items with invalid/empty names
      if (!item.name || item.name.trim() === '') {
        console.warn(`Skipping item with missing name:`, item);
        return;
      }

      const stock = type === 'vaccine' ? item.dosesInStock : item.unitsInStock;
      const minStock = item.minimumStock || 0;

      // Check stock levels
      if (stock === 0) {
        emptyStock.push({ ...item, type, alertType: 'empty' });
      } else if (stock <= minStock) {
        lowStock.push({ ...item, type, alertType: 'low' });
      }

      // Check expiry dates - Enhanced logic
      if (item.expiryDate) {
        const expiryDate = new Date(item.expiryDate);
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        // Skip invalid dates
        if (isNaN(expiryDate.getTime())) {
          console.warn(`Invalid expiry date for ${item.name}: ${item.expiryDate}`);
          return;
        }

        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        
        // Categorize by expiry status
        if (expiryDate < today) {
          // Already expired
          expired.push({ 
            ...item, 
            type, 
            alertType: 'expired',
            daysUntilExpiry: 0,
            daysOverdue: Math.abs(daysUntilExpiry)
          });
        } else if (expiryDate <= thirtyDaysFromNow) {
          // Expiring within 30 days
          expiring.push({ 
            ...item, 
            type, 
            alertType: 'expiring',
            daysUntilExpiry: Math.max(0, daysUntilExpiry)
          });
        }
      }
    });

    return { lowStock, emptyStock, expiring, expired };
  };

  const renderAlert = (alert, alertCategory) => {
    const isVaccine = alert.type === 'vaccine';
    const stock = isVaccine ? alert.dosesInStock : alert.unitsInStock;
    const unit = isVaccine ? 'doses' : 'units';

    let alertTitle, alertMessage, alertVariant;
    
    switch (alertCategory) {
      case 'empty':
        alertTitle = 'Out of Stock';
        alertMessage = `${alert.name} is completely out of stock`;
        alertVariant = 'danger';
        break;
      case 'low':
        alertTitle = 'Low Stock';
        alertMessage = `${alert.name} has only ${stock} ${unit} remaining (minimum: ${alert.minimumStock})`;
        alertVariant = 'warning';
        break;
      case 'expired':
        alertTitle = 'EXPIRED';
        alertMessage = `${alert.name} expired ${alert.daysOverdue} day(s) ago - DO NOT USE`;
        alertVariant = 'danger';
        break;
      case 'expiring':
        alertTitle = 'Expiring Soon';
        if (alert.daysUntilExpiry <= 7) {
          alertMessage = `${alert.name} expires in ${alert.daysUntilExpiry} day(s)`;
          alertVariant = 'danger';
        } else {
          alertMessage = `${alert.name} expires in ${alert.daysUntilExpiry} day(s)`;
          alertVariant = 'warning';
        }
        break;
      default:
        return null;
    }

    return (
      <div key={`${alert.id}-${alertCategory}`} className="inventory-alert-item">
        <div className="alert-content">
          <div className="alert-icon">
            <i className={`bi ${
              alertCategory === 'empty' ? 'bi-exclamation-triangle-fill' :
              alertCategory === 'low' ? 'bi-exclamation-circle-fill' :
              'bi-clock-fill'
            }`}></i>
          </div>
          <div className="alert-details">
            <div className="alert-title">
              <Badge bg={alertVariant} className="me-2">{alertTitle}</Badge>
              <span className="item-type">{isVaccine ? 'Vaccine' : 'Medication'}</span>
            </div>
            <div className="alert-message">{alertMessage}</div>
            <div className="alert-meta">
              <small className="text-muted">
                Category: {alert.category} | 
                {alert.expiryDate && ` Expires: ${new Date(alert.expiryDate).toLocaleDateString()}`}
              </small>
            </div>
          </div>
        </div>
        <div className="alert-actions">
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={() => onNavigateToInventory && onNavigateToInventory(alertCategory)}
            title="View in inventory"
          >
            <i className="bi bi-eye"></i>
          </button>
          <div className="dropdown">
            <button
              className="btn btn-sm btn-outline-secondary dropdown-toggle"
              onClick={() => setShowMuteOptions(showMuteOptions === `${alert.id}-${alertCategory}` ? null : `${alert.id}-${alertCategory}`)}
              title="Mute alert"
            >
              <i className="bi bi-volume-mute"></i>
            </button>
            {showMuteOptions === `${alert.id}-${alertCategory}` && (
              <div className="dropdown-menu show">
                <button 
                  className="dropdown-item" 
                  onClick={() => muteAlert(`${alert.id}-${alertCategory}`, '10min')}
                >
                  10 minutes
                </button>
                <button 
                  className="dropdown-item" 
                  onClick={() => muteAlert(`${alert.id}-${alertCategory}`, '30min')}
                >
                  30 minutes
                </button>
                <button 
                  className="dropdown-item" 
                  onClick={() => muteAlert(`${alert.id}-${alertCategory}`, '1hr')}
                >
                  1 hour
                </button>
                <button 
                  className="dropdown-item" 
                  onClick={() => muteAlert(`${alert.id}-${alertCategory}`, 'indefinite')}
                >
                  Until resolved
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="inventory-alerts-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading alerts...</span>
        </div>
      </div>
    );
  }

  const totalAlerts = emptyStockItems.length + lowStockItems.length + expiringItems.length + expiredItems.length;
  const criticalAlerts = emptyStockItems.length + expiredItems.length + expiringItems.filter(item => item.daysUntilExpiry <= 7).length;

  if (totalAlerts === 0) {
    return (
      <div className="inventory-alerts-empty">
        <div className="text-success">
          <i className="bi bi-check-circle-fill me-2"></i>
          All inventory items are well-stocked and not expiring soon
        </div>
      </div>
    );
  }

  return (
    <div className="inventory-alerts">
      <div className="alerts-header">
        <h6 className="alerts-title">
          <i className="bi bi-exclamation-triangle me-2"></i>
          Inventory Alerts
          <Badge bg={criticalAlerts > 0 ? 'danger' : 'warning'} className="ms-2">
            {totalAlerts}
          </Badge>
        </h6>
        <button 
          className="btn btn-sm btn-outline-secondary"
          onClick={loadInventoryAlerts}
          title="Refresh alerts"
        >
          <i className="bi bi-arrow-clockwise"></i>
        </button>
      </div>

      <div className="alerts-content">
        {/* Expired Items Alerts (Highest Priority) */}
        {expiredItems.length > 0 && !isAlertMuted('expired') && (
          <div className="alert-section">
            <div className="section-header critical" style={{ backgroundColor: '#721c24', color: 'white' }}>
              <i className="bi bi-calendar-x-fill me-2"></i>
              EXPIRED - DO NOT USE ({expiredItems.length})
            </div>
            {expiredItems
              .sort((a, b) => b.daysOverdue - a.daysOverdue)
              .map(item => renderAlert(item, 'expired'))
            }
          </div>
        )}

        {/* Empty Stock Alerts (Critical) */}
        {emptyStockItems.length > 0 && !isAlertMuted('empty') && (
          <div className="alert-section">
            <div className="section-header critical">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              Out of Stock ({emptyStockItems.length})
            </div>
            {emptyStockItems.map(item => renderAlert(item, 'empty'))}
          </div>
        )}

        {/* Expiring Items (Critical if <= 7 days) */}
        {expiringItems.length > 0 && !isAlertMuted('expiring') && (
          <div className="alert-section">
            <div className="section-header warning">
              <i className="bi bi-clock-fill me-2"></i>
              Expiring Soon ({expiringItems.length})
            </div>
            {expiringItems
              .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
              .map(item => renderAlert(item, 'expiring'))
            }
          </div>
        )}

        {/* Low Stock Alerts */}
        {lowStockItems.length > 0 && !isAlertMuted('low') && (
          <div className="alert-section">
            <div className="section-header warning">
              <i className="bi bi-exclamation-circle-fill me-2"></i>
              Low Stock ({lowStockItems.length})
            </div>
            {lowStockItems.map(item => renderAlert(item, 'low'))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryAlerts;
