import React, { memo } from 'react';
import { Card } from 'react-bootstrap';

const SystemSettings = memo(() => {
  return (
    <div className="system-settings">
      <Card>
        <Card.Header>
          <h3><i className="bi bi-gear me-2"></i>System Settings</h3>
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

SystemSettings.displayName = 'SystemSettings';

export default SystemSettings;
