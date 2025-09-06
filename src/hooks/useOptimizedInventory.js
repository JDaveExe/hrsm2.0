import React, { useMemo, useCallback } from 'react';

// Optimized filtering hook with debouncing
export const useOptimizedInventoryFilter = (items, searchTerm, filterOptions = {}) => {
  return useMemo(() => {
    if (!Array.isArray(items)) return [];
    
    if (!searchTerm.trim()) return items;
    
    const lowercaseSearchTerm = searchTerm.toLowerCase();
    
    return items.filter(item => {
      // Check multiple fields for matches
      const searchFields = [
        item.name,
        item.genericName,
        item.brandName,
        item.manufacturer,
        item.category,
        item.batchNumber
      ].filter(Boolean);
      
      return searchFields.some(field => 
        field.toLowerCase().includes(lowercaseSearchTerm)
      );
    });
  }, [items, searchTerm]);
};

// Optimized inventory calculations
export const useInventoryCalculations = (items, itemType = 'medication') => {
  return useMemo(() => {
    if (!Array.isArray(items)) {
      return {
        totalItems: 0,
        totalStock: 0,
        lowStockCount: 0,
        expiringSoonCount: 0,
        outOfStockCount: 0,
        totalValue: 0
      };
    }

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    let totalStock = 0;
    let lowStockCount = 0;
    let expiringSoonCount = 0;
    let outOfStockCount = 0;
    let totalValue = 0;
    
    for (const item of items) {
      const stock = itemType === 'vaccine' ? (item.dosesInStock || 0) : (item.unitsInStock || 0);
      const minimumStock = item.minimumStock || 0;
      const cost = itemType === 'vaccine' ? (item.costPerDose || 0) : (item.costPerUnit || 0);
      
      totalStock += stock;
      totalValue += stock * cost;
      
      if (stock === 0) {
        outOfStockCount++;
      } else if (stock <= minimumStock) {
        lowStockCount++;
      }
      
      if (item.expiryDate) {
        const expiryDate = new Date(item.expiryDate);
        if (expiryDate <= thirtyDaysFromNow && expiryDate > now) {
          expiringSoonCount++;
        }
      }
    }
    
    return {
      totalItems: items.length,
      totalStock,
      lowStockCount,
      expiringSoonCount,
      outOfStockCount,
      totalValue
    };
  }, [items, itemType]);
};

// Optimized pagination hook
export const usePagination = (items, itemsPerPage = 10, currentPage = 1) => {
  return useMemo(() => {
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageItems = items.slice(startIndex, endIndex);
    
    return {
      totalItems,
      totalPages,
      currentPageItems,
      startIndex,
      endIndex,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1
    };
  }, [items, itemsPerPage, currentPage]);
};

// Optimized form handlers
export const useOptimizedFormHandlers = () => {
  const createFormHandler = React.useCallback((setFormData) => {
    return (field, value) => {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    };
  }, []);

  const createResetHandler = React.useCallback((setFormData, initialData) => {
    return () => {
      setFormData(initialData);
    };
  }, []);

  return { createFormHandler, createResetHandler };
};

// Debounced search hook with immediate reset capability
export const useDebouncedSearch = (searchTerm, delay = 300) => {
  const [debouncedTerm, setDebouncedTerm] = React.useState(searchTerm);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, delay]);

  // Immediate update function for clearing searches
  const setImmediateTerm = React.useCallback((term) => {
    setDebouncedTerm(term);
  }, []);

  return [debouncedTerm, setImmediateTerm];
};

// Virtual list optimization hook
export const useVirtualListOptimization = (items, itemHeight = 200, containerHeight = 600) => {
  return React.useMemo(() => {
    const totalHeight = items.length * itemHeight;
    const visibleItems = Math.ceil(containerHeight / itemHeight);
    const overscan = 5; // Render extra items for smoother scrolling
    
    return {
      totalHeight,
      visibleItems,
      overscan,
      shouldVirtualize: items.length > 50, // Auto-enable for large lists
      estimatedItemSize: itemHeight
    };
  }, [items.length, itemHeight, containerHeight]);
};

// Memoized item renderer factory
export const createMemoizedItemRenderer = (Component) => {
  return React.memo(({ index, style, data }) => {
    const item = data.items[index];
    return (
      <div style={style}>
        <Component item={item} {...data.componentProps} />
      </div>
    );
  });
};

// Optimized sort function
export const useOptimizedSort = (items, sortField, sortDirection = 'asc') => {
  return useMemo(() => {
    if (!sortField || !Array.isArray(items)) return items;
    
    return [...items].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Handle different data types
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [items, sortField, sortDirection]);
};

// Performance monitoring hook
export const usePerformanceMonitor = (componentName) => {
  const renderCount = React.useRef(0);
  
  React.useEffect(() => {
    renderCount.current++;
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} rendered ${renderCount.current} times`);
    }
  });
  
  return renderCount.current;
};

export default {
  useOptimizedInventoryFilter,
  useInventoryCalculations,
  usePagination,
  useOptimizedFormHandlers,
  useDebouncedSearch,
  useOptimizedSort,
  usePerformanceMonitor
};
