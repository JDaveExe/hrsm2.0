import { useState, useEffect } from 'react';
import simulationService from '../services/simulationService';

/**
 * Custom hook for components that need to be aware of simulation mode
 * @returns {Object} Simulation status and helper functions
 */
export const useSimulation = () => {
  const [simulationInfo, setSimulationInfo] = useState(() => 
    simulationService.getSimulationInfo()
  );

  useEffect(() => {
    const unsubscribe = simulationService.subscribe((status) => {
      setSimulationInfo(simulationService.getSimulationInfo());
    });

    return unsubscribe;
  }, []);

  return {
    isEnabled: simulationInfo.enabled,
    currentDate: simulationService.getCurrentEffectiveDate(),
    shouldMockSMS: simulationService.shouldMockSMS(),
    shouldMockEmail: simulationService.shouldMockEmail(),
    shouldGenerateTestData: simulationService.shouldGenerateTestData(),
    shouldSimulateCharts: simulationService.shouldSimulateCharts(),
    getTimeForFeature: simulationService.getTimeForFeature.bind(simulationService),
    generateSimulatedData: {
      patients: () => simulationService.generateSimulatedPatientData(),
      appointments: () => simulationService.generateSimulatedAppointmentData(),
      services: () => simulationService.generateSimulatedServiceData()
    },
    simulationInfo
  };
};

export default useSimulation;
