import React, { useState } from 'react';
import OptimizedNumberInput from '../components/OptimizedNumberInput';

const NumberInputTest = () => {
  const [basicValue, setBasicValue] = useState(0);
  const [currencyValue, setCurrencyValue] = useState(0);
  const [stockValue, setStockValue] = useState(0);

  return (
    <div className="container mt-4">
      <h3>Number Input Optimization Test</h3>
      <p className="text-muted">
        This demonstrates the fix for the "0100" issue where typing numbers 
        in fields with placeholder="0" would append instead of replace.
      </p>

      <div className="row">
        <div className="col-md-4">
          <h5>Basic Number Input</h5>
          <p><strong>Current Value:</strong> {basicValue}</p>
          <OptimizedNumberInput
            value={basicValue}
            onChange={setBasicValue}
            min={0}
            placeholder="Enter number"
          />
          <small className="text-info">
            Try typing "100" - it should show "100", not "0100"
          </small>
        </div>

        <div className="col-md-4">
          <h5>Currency Input (Decimal)</h5>
          <p><strong>Current Value:</strong> ₱{currencyValue}</p>
          <OptimizedNumberInput
            value={currencyValue}
            onChange={setCurrencyValue}
            min={0}
            decimals={true}
            step={0.01}
            prefix="₱"
            placeholder="Enter amount"
          />
          <small className="text-info">
            Try typing "25.50" - should work smoothly
          </small>
        </div>

        <div className="col-md-4">
          <h5>Stock Input with Suffix</h5>
          <p><strong>Current Value:</strong> {stockValue} units</p>
          <OptimizedNumberInput
            value={stockValue}
            onChange={setStockValue}
            min={0}
            suffix="units"
            placeholder="Enter stock quantity"
            required
          />
          <small className="text-info">
            Focus and type - no "0" prefix issue
          </small>
        </div>
      </div>

      <div className="mt-4">
        <h5>Test Instructions:</h5>
        <ol>
          <li>Click on any input field that shows "0" or is empty</li>
          <li>Start typing a number (e.g., "100")</li>
          <li>Notice how it correctly shows "100" instead of "0100"</li>
          <li>Try clearing the field and typing again</li>
          <li>Test decimal inputs with the currency field</li>
        </ol>
      </div>

      <div className="mt-4 alert alert-success">
        <h6>✅ Fixed Issues:</h6>
        <ul className="mb-0">
          <li>No more "0100" when typing "100" in a field with value 0</li>
          <li>Proper handling of empty vs zero values</li>
          <li>Smart focus behavior that clears placeholder values</li>
          <li>Decimal support for currency inputs</li>
          <li>Min/max validation with user feedback</li>
        </ul>
      </div>
    </div>
  );
};

export default NumberInputTest;
