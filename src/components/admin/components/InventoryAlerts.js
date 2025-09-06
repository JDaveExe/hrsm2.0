import React, { useState, useEffect } from 'react';
import { Badge } from 'react-bootstrap';
import inventoryService from '../../../services/inventoryService';
import './styles/InventoryAlerts.css';

const InventoryAlerts = ({ onNavigateToInventory }) => {
  const [lowStockItems, setLowStockItems] = useState([]);
  const [emptyStockItems, setEmptyStockItems] = useState([]);
  const [expiringItems, setExpiringItems] = useState([]);
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

    items.forEach(item => {
      const stock = type === 'vaccine' ? item.dosesInStock : item.unitsInStock;
      const minStock = item.minimumStock || 0;

      // Check stock levels
      if (stock === 0) {
        emptyStock.push({ ...item, type, alertType: 'empty' });
      } else if (stock <= minStock) {
        lowStock.push({ ...item, type, alertType: 'low' });
      }

      // Check expiry (within 30 days)
      if (item.expiryDate) {
        const expiryDate = new Date(item.expiryDate);
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        if (expiryDate <= thirtyDaysFromNow) {
          expiring.push({ ...item, type, alertType: 'expiring' });
        }
      }
    });

    return { lowStock, emptyStock, expiring };
  };

  const handleAlertClick = (e, alertType) => {
    e.preventDefault();
    
    // Left click - show mute options
    if (e.button === 0) {
      setShowMuteOptions(showMuteOptions === alertType ? null : alertType);
      return;
    }
    
    // Right click or other - navigate to inventory
    onNavigateToInventory(alertType);
  };

  const handleNavigateClick = (e, alertType) => {
    e.stopPropagation();
    onNavigateToInventory(alertType);
    setShowMuteOptions(null);
  };

  if (loading) {
    return null; // Don't show anything while loading
  }

  const totalCriticalAlerts = emptyStockItems.length + lowStockItems.length;
  const totalAlerts = totalCriticalAlerts + expiringItems.length;

  if (totalAlerts === 0) {
    return null; // No alerts to show
  }

  return (
    <div className="inventory-alerts">
      {/* Critical Alerts (Empty + Low Stock) */}
      {totalCriticalAlerts > 0 && !isAlertMuted('critical') && (
        <div className="alert-container">
          <div 
            className="alert-badge critical"
            onMouseDown={(e) => handleAlertClick(e, 'critical')}
            title={`${totalCriticalAlerts} critical stock alerts - Left click to mute`}
          >
            {showMuteOptions === 'critical' ? (
              <div className="mute-content">
                <span>Mute this notification?</span>
              </div>
            ) : (
              <>
                <i className="bi bi-exclamation-triangle-fill"></i>
                <span className="alert-count">{totalCriticalAlerts}</span>
                <span className="alert-text">Critical Stock</span>
              </>
            )}
          </div>
          
          {showMuteOptions === 'critical' && (
            <div className="mute-options">
              <button onClick={() => muteAlert('critical', '10min')} className="mute-btn">10 min</button>
              <button onClick={() => muteAlert('critical', '30min')} className="mute-btn">30 min</button>
              <button onClick={() => muteAlert('critical', '1hr')} className="mute-btn">1 hr</button>
              <button onClick={() => muteAlert('critical', 'indefinite')} className="mute-btn">Indefinitely</button>
              <button onClick={(e) => handleNavigateClick(e, 'critical')} className="navigate-btn">
                <i className="bi bi-arrow-right"></i> View Items
              </button>
            </div>
          )}
        </div>
      )}

      {/* Expiring Items */}
      {expiringItems.length > 0 && !isAlertMuted('expiring') && (
        <div className="alert-container">
          <div 
            className="alert-badge warning"
            onMouseDown={(e) => handleAlertClick(e, 'expiring')}
            title={`${expiringItems.length} items expiring soon - Left click to mute`}
          >
            {showMuteOptions === 'expiring' ? (
              <div className="mute-content">
                <span>Mute this notification?</span>
              </div>
            ) : (
              <>
                <i className="bi bi-calendar-x"></i>
                <span className="alert-count">{expiringItems.length}</span>
                <span className="alert-text">Expiring Soon</span>
              </>
            )}
          </div>
          
          {showMuteOptions === 'expiring' && (
            <div className="mute-options">
              <button onClick={() => muteAlert('expiring', '10min')} className="mute-btn">10 min</button>
              <button onClick={() => muteAlert('expiring', '30min')} className="mute-btn">30 min</button>
              <button onClick={() => muteAlert('expiring', '1hr')} className="mute-btn">1 hr</button>
              <button onClick={() => muteAlert('expiring', 'indefinite')} className="mute-btn">Indefinitely</button>
              <button onClick={(e) => handleNavigateClick(e, 'expiring')} className="navigate-btn">
                <i className="bi bi-arrow-right"></i> View Items
              </button>
            </div>
          )}
        </div>
      )}

      {/* Details dropdown on hover */}
      <div className="alert-details">
        <div className="alert-section">
          <h6>Critical Stock Issues</h6>
          {emptyStockItems.slice(0, 3).map((item, index) => (
            <div key={index} className="alert-item empty">
              <span className="item-name">{item.name}</span>
              <Badge bg="danger">Out of Stock</Badge>
            </div>
          ))}
          {lowStockItems.slice(0, 3).map((item, index) => (
            <div key={index} className="alert-item low">
              <span className="item-name">{item.name}</span>
              <Badge bg="warning">Low Stock</Badge>
            </div>
          ))}
          {totalCriticalAlerts > 6 && (
            <div className="alert-more">
              +{totalCriticalAlerts - 6} more items
            </div>
          )}
        </div>

        {expiringItems.length > 0 && (
          <div className="alert-section">
            <h6>Expiring Soon</h6>
            {expiringItems.slice(0, 3).map((item, index) => (
              <div key={index} className="alert-item expiring">
                <span className="item-name">{item.name}</span>
                <span className="expiry-date">
                  {new Date(item.expiryDate).toLocaleDateString()}
                </span>
              </div>
            ))}
            {expiringItems.length > 3 && (
              <div className="alert-more">
                +{expiringItems.length - 3} more items
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryAlerts;
