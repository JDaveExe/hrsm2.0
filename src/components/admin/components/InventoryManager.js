import React, { memo } from 'react';
import { Card } from 'react-bootstrap';

const InventoryManager = memo(({ currentPath }) => {
  const getTitle = () => {
    switch (currentPath) {
      case 'Prescription Inventory':
        return 'Prescription Inventory';
      case 'Vaccine Inventory':
        return 'Vaccine Inventory';
      default:
        return 'Inventory Manager';
    }
  };

  const getIcon = () => {
    switch (currentPath) {
      case 'Prescription Inventory':
        return 'bi-capsule';
      case 'Vaccine Inventory':
        return 'bi-shield-plus';
      default:
        return 'bi-box-seam';
    }
  };

  return (
    <div className="inventory-manager">
      <Card>
        <Card.Header>
          <h3><i className={`bi ${getIcon()} me-2`}></i>{getTitle()}</h3>
        </Card.Header>
        <Card.Body>
          <div className="coming-soon">
            <i className="bi bi-tools"></i>
            <h4>Component Under Construction</h4>
            <p>This optimized component is being developed...</p>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
});

InventoryManager.displayName = 'InventoryManager';

export default InventoryManager;
