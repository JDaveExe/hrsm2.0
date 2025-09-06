import React, { useState } from 'react';
import './MedicationItem.css';

const MedicationItem = ({ medication, onSelect }) => {
  const [quantity, setQuantity] = useState(1);

  const getStockStatusClass = (stock, minStock) => {
    if (stock === 0) return 'out-of-stock';
    if (stock <= minStock) return 'low-stock';
    return 'in-stock';
  };

  const handleSelect = () => {
    if (quantity > 0 && quantity <= medication.unitsInStock) {
      onSelect(medication, quantity);
    }
  };

  return (
    <div className={`medication-item-panel ${getStockStatusClass(medication.unitsInStock, medication.minimumStock)}`}>
      <div className="medication-info-panel">
        <div className="medication-primary-panel">
          <h5>{medication.name}</h5>
          <span className="medication-strength-panel">{medication.strength}</span>
          <span className="medication-form-panel">{medication.form}</span>
        </div>
        <div className="medication-secondary-panel">
          <span className="generic-name-panel">Generic: {medication.genericName}</span>
          {medication.brandName && <span className="brand-name-panel">Brand: {medication.brandName}</span>}
        </div>
        <div className="medication-details-panel">
          <span className="category-panel">{medication.category}</span>
          {medication.indication && <span className="indication-panel">{medication.indication}</span>}
        </div>
      </div>
      
      <div className="stock-info-panel">
        <div className={`stock-level-panel ${getStockStatusClass(medication.unitsInStock, medication.minimumStock)}`}>
          <i className="bi bi-box"></i>
          <span className="stock-number-panel">{medication.unitsInStock}</span>
          <span className="stock-label-panel">in stock</span>
        </div>
        <div className="min-stock-panel">
          <span>Min: {medication.minimumStock}</span>
        </div>
      </div>
      
      <div className="quantity-selection-panel">
        <label>Quantity:</label>
        <div className="quantity-input-group-panel">
          <input
            type="number"
            min="1"
            max={medication.unitsInStock}
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            className="quantity-input-panel"
          />
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSelect}
            disabled={medication.unitsInStock === 0 || quantity > medication.unitsInStock}
          >
            <i className="bi bi-plus"></i>
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default MedicationItem;
