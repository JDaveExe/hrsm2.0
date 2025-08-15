import React, { useState, useEffect, useCallback } from 'react';
import { Form, InputGroup } from 'react-bootstrap';

const OptimizedNumberInput = React.memo(({
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  placeholder = '',
  prefix,
  suffix,
  required = false,
  disabled = false,
  className = '',
  id,
  decimals = false,
  onBlur,
  onFocus,
  ...props
}) => {
  const [inputValue, setInputValue] = useState(value?.toString() || '');
  const [isFocused, setIsFocused] = useState(false);

  // Update internal state when external value changes
  useEffect(() => {
    if (!isFocused) {
      setInputValue(value?.toString() || '');
    }
  }, [value, isFocused]);

  const handleInputChange = useCallback((e) => {
    const rawValue = e.target.value;
    
    // Allow empty input
    if (rawValue === '') {
      setInputValue('');
      onChange('');
      return;
    }

    // For decimal numbers
    if (decimals) {
      // Allow valid decimal input patterns
      if (/^\d*\.?\d*$/.test(rawValue)) {
        setInputValue(rawValue);
        const numValue = parseFloat(rawValue);
        if (!isNaN(numValue)) {
          onChange(numValue);
        }
      }
    } else {
      // For integers, only allow digits
      if (/^\d+$/.test(rawValue)) {
        setInputValue(rawValue);
        const numValue = parseInt(rawValue, 10);
        if (!isNaN(numValue)) {
          onChange(numValue);
        }
      }
    }
  }, [onChange, decimals]);

  const handleFocus = useCallback((e) => {
    setIsFocused(true);
    // Clear the field if it's 0 or empty to prevent 0100 issue
    if (inputValue === '0' || inputValue === '') {
      setInputValue('');
    }
    onFocus?.(e);
  }, [inputValue, onFocus]);

  const handleBlur = useCallback((e) => {
    setIsFocused(false);
    
    // If empty, set to 0 or keep empty based on requirement
    if (inputValue === '') {
      const defaultValue = required ? 0 : '';
      setInputValue(defaultValue.toString());
      onChange(defaultValue);
    } else {
      // Ensure the value is properly formatted
      const numValue = decimals ? parseFloat(inputValue) : parseInt(inputValue, 10);
      if (!isNaN(numValue)) {
        // Apply min/max constraints
        let constrainedValue = numValue;
        if (min !== undefined && numValue < min) constrainedValue = min;
        if (max !== undefined && numValue > max) constrainedValue = max;
        
        setInputValue(constrainedValue.toString());
        onChange(constrainedValue);
      }
    }
    onBlur?.(e);
  }, [inputValue, required, min, max, decimals, onChange, onBlur]);

  const inputElement = (
    <Form.Control
      type="number"
      value={inputValue}
      onChange={handleInputChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className={className}
      id={id}
      {...props}
    />
  );

  if (prefix || suffix) {
    return (
      <InputGroup>
        {prefix && <InputGroup.Text>{prefix}</InputGroup.Text>}
        {inputElement}
        {suffix && <InputGroup.Text>{suffix}</InputGroup.Text>}
      </InputGroup>
    );
  }

  return inputElement;
});

OptimizedNumberInput.displayName = 'OptimizedNumberInput';

export default OptimizedNumberInput;
