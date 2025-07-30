// Mock data for development - replace with real API calls later
const mockUnsortedPatients = [
  {
    id: 101,
    firstName: 'Pedro',
    lastName: 'Cruz',
    age: 28,
    gender: 'Male',
    contactNumber: '09171234567',
    address: '789 Bambang St, Pasig City',
    createdAt: '2025-01-15T08:30:00Z',
    familyId: null
  },
  {
    id: 102,
    firstName: 'Rosa',
    lastName: 'Garcia',
    age: 34,
    gender: 'Female',
    contactNumber: '09181234568',
    address: '456 Rosario St, Pasig City',
    createdAt: '2025-01-18T10:15:00Z',
    familyId: null
  },
  {
    id: 103,
    firstName: 'Miguel',
    lastName: 'Santos',
    age: 42,
    gender: 'Male',
    contactNumber: '09191234569',
    address: '321 Maybunga Ave, Pasig City',
    createdAt: '2025-01-20T14:22:00Z',
    familyId: null
  },
  {
    id: 104,
    firstName: 'Carmen',
    lastName: 'Reyes',
    age: 29,
    gender: 'Female',
    contactNumber: '09201234570',
    address: '654 Kapitolyo St, Pasig City',
    createdAt: '2025-01-22T11:45:00Z',
    familyId: null
  }
];

const mockFamilies = [
  {
    id: 1,
    familyName: 'Santos Family',
    surname: 'Santos',
    headOfFamily: 'Juan Santos',
    contactNumber: '09123456790',
    address: '123 Maybunga St, Pasig City'
  },
  {
    id: 2,
    familyName: 'Reyes Family',
    surname: 'Reyes',
    headOfFamily: 'Ana Reyes',
    contactNumber: '09187654321',
    address: '45 E. Rodriguez Ave, Pasig City'
  },
  {
    id: 3,
    familyName: 'Mendoza Family',
    surname: 'Mendoza',
    headOfFamily: 'Carlos Mendoza',
    contactNumber: '09198765432',
    address: '67 Ortigas Ave, Pasig City'
  }
];

// Patient Services with mock data
export const patientService = {
  // Get all patients
  getAllPatients: async () => {
    // TODO: Replace with real API call
    return new Promise((resolve) => {
      setTimeout(() => resolve([]), 500);
    });
  },

  // Get unsorted patients (patients without family)
  getUnsortedPatients: async () => {
    // TODO: Replace with real API call
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockUnsortedPatients), 500);
    });
  },

  // Auto-sort patients by surname
  autosortPatients: async () => {
    // TODO: Replace with real API call
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock autosort results
        const results = {
          sorted: [
            {
              patient: { id: 103, firstName: 'Miguel', lastName: 'Santos' },
              assignedToFamily: 'Santos Family'
            }
          ],
          needsNewFamily: [
            { id: 101, firstName: 'Pedro', lastName: 'Cruz' },
            { id: 102, firstName: 'Rosa', lastName: 'Garcia' }
          ]
        };
        resolve(results);
      }, 1000);
    });
  },

  // Create families for unmatched patients
  createFamiliesForPatients: async (patientIds) => {
    // TODO: Replace with real API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const results = patientIds.map(id => {
          const patient = mockUnsortedPatients.find(p => p.id === id);
          return {
            patient: patient,
            newFamily: {
              id: Date.now() + Math.random(),
              familyName: `${patient.lastName} Family`
            }
          };
        });
        resolve(results);
      }, 1000);
    });
  },

  // Manually assign patient to family
  assignPatientToFamily: async (patientId, familyId) => {
    // TODO: Replace with real API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ msg: 'Patient assigned to family successfully' });
      }, 500);
    });
  },

  // Create new patient
  createPatient: async (patientData) => {
    // TODO: Replace with real API call
    return new Promise((resolve) => {
      setTimeout(() => resolve({ id: Date.now(), ...patientData }), 500);
    });
  },

  // Update patient
  updatePatient: async (patientId, patientData) => {
    // TODO: Replace with real API call
    return new Promise((resolve) => {
      setTimeout(() => resolve({ id: patientId, ...patientData }), 500);
    });
  },

  // Delete patient
  deletePatient: async (patientId) => {
    // TODO: Replace with real API call
    return new Promise((resolve) => {
      setTimeout(() => resolve({ msg: 'Patient deleted successfully' }), 500);
    });
  }
};

// Family Services with mock data
export const familyService = {
  // Get all families
  getAllFamilies: async () => {
    // TODO: Replace with real API call
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockFamilies), 500);
    });
  },

  // Create new family
  createFamily: async (familyData) => {
    // TODO: Replace with real API call
    return new Promise((resolve) => {
      setTimeout(() => resolve({ id: Date.now(), ...familyData }), 500);
    });
  },

  // Update family
  updateFamily: async (familyId, familyData) => {
    // TODO: Replace with real API call
    return new Promise((resolve) => {
      setTimeout(() => resolve({ id: familyId, ...familyData }), 500);
    });
  },

  // Delete family
  deleteFamily: async (familyId) => {
    // TODO: Replace with real API call
    return new Promise((resolve) => {
      setTimeout(() => resolve({ msg: 'Family deleted successfully' }), 500);
    });
  }
};

// Dashboard Services with mock data
export const dashboardService = {
  // Get dashboard statistics
  getStats: async () => {
    // TODO: Replace with real API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          totalPatients: 235,
          unsortedPatients: mockUnsortedPatients.length,
          totalFamilies: mockFamilies.length,
          activeCheckups: 12,
          pendingAppointments: 8,
          completedToday: 7
        });
      }, 500);
    });
  },

  // Get today's checkups
  getTodaysCheckups: async () => {
    // TODO: Replace with real API call
    return new Promise((resolve) => {
      setTimeout(() => resolve([]), 500);
    });
  }
};

export default {
  patientService,
  familyService,
  dashboardService
};
