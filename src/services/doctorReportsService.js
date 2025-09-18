/**
 * Doctor Reports Service
 * Handles API calls for doctor performance metrics and analytics
 */

const API_BASE_URL = '/api/doctor/reports';

const doctorReportsService = {
  // Get doctor workload distribution data
  getDoctorWorkload: async (period = '30d') => {
    try {
      // Check if auth token is available
      if (!window.__authToken) {
        console.warn('⚠️ No auth token available for doctor workload request');
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/doctor-workload?period=${period}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${window.__authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch doctor workload data: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching doctor workload:', error);
      throw error;
    }
  },

  // Get doctor patient volume trends data
  getDoctorVolumeTrends: async (period = '30d', groupBy = 'day') => {
    try {
      // Check if auth token is available
      if (!window.__authToken) {
        console.warn('⚠️ No auth token available for doctor volume trends request');
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/doctor-volume-trends?period=${period}&groupBy=${groupBy}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${window.__authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch doctor volume trends: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching doctor volume trends:', error);
      throw error;
    }
  },

  // Transform workload data for charts
  transformWorkloadForChart: (data, chartType = 'bar') => {
    if (!data || !data.data) return null;

    const labels = data.data.map(item => item.doctorName);
    const values = data.data.map(item => item.completedCheckups);
    const percentages = data.data.map(item => parseFloat(item.percentage));

    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
      '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
    ];

    switch (chartType) {
      case 'pie':
        return {
          labels,
          datasets: [{
            data: values,
            backgroundColor: colors.slice(0, labels.length),
            borderWidth: 2,
            borderColor: '#fff'
          }]
        };
      
      case 'horizontal-bar':
      case 'bar':
        return {
          labels,
          datasets: [{
            label: 'Completed Checkups',
            data: values,
            backgroundColor: colors.slice(0, labels.length),
            borderColor: colors.slice(0, labels.length),
            borderWidth: 1
          }]
        };
      
      default:
        return {
          labels,
          datasets: [{
            label: 'Completed Checkups',
            data: values,
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 2
          }]
        };
    }
  },

  // Transform volume trends data for charts
  transformVolumeTrendsForChart: (data, chartType = 'line') => {
    if (!data || !data.data || !data.data.doctors) return null;

    const { doctors, dates } = data.data;
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
      '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
    ];

    const datasets = doctors.map((doctor, index) => ({
      label: doctor.doctorName,
      data: doctor.data.map(item => item.count),
      borderColor: colors[index % colors.length],
      backgroundColor: chartType === 'area' ? 
        colors[index % colors.length].replace('1)', '0.2)') : 
        colors[index % colors.length],
      fill: chartType === 'area',
      tension: 0.1,
      pointRadius: 4,
      pointHoverRadius: 6
    }));

    // Format dates for display
    const formattedDates = dates.map(date => {
      if (date.includes('-')) {
        const parts = date.split('-');
        if (parts.length === 3) {
          // Daily format: YYYY-MM-DD
          return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else if (parts.length === 2) {
          // Monthly format: YYYY-MM
          return new Date(`${date}-01`).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }
      }
      return date;
    });

    return {
      labels: formattedDates,
      datasets
    };
  },

  // Get chart options for different types
  getChartOptions: (chartType, title) => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: title,
          font: { size: 16, weight: 'bold' }
        },
        legend: {
          display: true,
          position: 'top'
        }
      }
    };

    switch (chartType) {
      case 'pie':
        return {
          ...baseOptions,
          plugins: {
            ...baseOptions.plugins,
            tooltip: {
              callbacks: {
                label: (context) => {
                  const label = context.label || '';
                  const value = context.parsed || 0;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${label}: ${value} (${percentage}%)`;
                }
              }
            }
          }
        };

      case 'horizontal-bar':
        return {
          ...baseOptions,
          indexAxis: 'y',
          scales: {
            x: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Number of Checkups'
              }
            },
            y: {
              title: {
                display: true,
                text: 'Doctors'
              }
            }
          }
        };

      case 'line':
      case 'area':
        return {
          ...baseOptions,
          scales: {
            x: {
              title: {
                display: true,
                text: 'Date'
              }
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Number of Patients'
              }
            }
          }
        };

      case 'bar':
      default:
        return {
          ...baseOptions,
          scales: {
            x: {
              title: {
                display: true,
                text: 'Doctors'
              }
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Number of Checkups'
              }
            }
          }
        };
    }
  }
};

export default doctorReportsService;