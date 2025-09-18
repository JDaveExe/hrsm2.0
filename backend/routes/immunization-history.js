/**
 * Patient Immunization History Routes
 * 
 * Provides comprehensive immunization history for individual patients including:
 * - Complete vaccination records
 * - Upcoming due vaccines
 * - Missed/overdue vaccinations
 * - Vaccination schedule tracking
 * - Adverse reaction history
 */

const express = require('express');
const router = express.Router();
const { authenticateToken: auth } = require('../middleware/auth');

// Sample patient data with comprehensive immunization histories
const generatePatientImmunizationData = () => {
  const patients = [
    {
      id: 1,
      name: 'Emma Johnson',
      dateOfBirth: '2023-08-15',
      age: '1 year 1 month',
      gender: 'Female',
      guardianName: 'Sarah Johnson',
      guardianContact: '+1-555-0123',
      medicalRecordNumber: 'MRN-2023-001',
      bloodType: 'O+',
      allergies: ['None known'],
      currentWeight: '9.5 kg',
      currentHeight: '75 cm',
      immunizationStatus: 'Up to Date',
      nextDueDate: '2024-02-15',
      completionRate: 100,
      vaccinationHistory: [
        {
          id: 'v001',
          vaccineName: 'BCG (Bacillus Calmette-Guérin)',
          vaccineType: 'Live Attenuated',
          category: 'Birth Dose',
          dateAdministered: '2023-08-16T09:30:00Z',
          ageAtVaccination: '1 day',
          doseNumber: 1,
          totalDosesRequired: 1,
          batchNumber: 'BCG001-2023',
          manufacturer: 'Serum Institute',
          expiryDate: '2024-08-15',
          site: 'Left upper arm',
          route: 'Intradermal',
          administeredBy: 'Dr. Maria Santos',
          facility: 'City General Hospital',
          adverseReactions: 'None reported',
          notes: 'Administered within 24 hours of birth as recommended'
        },
        {
          id: 'v002',
          vaccineName: 'Hepatitis B Vaccine',
          vaccineType: 'Recombinant',
          category: 'Birth Dose',
          dateAdministered: '2023-08-16T10:00:00Z',
          ageAtVaccination: '1 day',
          doseNumber: 1,
          totalDosesRequired: 3,
          batchNumber: 'HB001-2023',
          manufacturer: 'GSK',
          expiryDate: '2025-03-20',
          site: 'Right thigh',
          route: 'Intramuscular',
          administeredBy: 'Nurse Jennifer Lee',
          facility: 'City General Hospital',
          adverseReactions: 'Mild redness at injection site (resolved in 2 days)',
          notes: 'First dose in 3-dose series'
        },
        {
          id: 'v003',
          vaccineName: 'Hepatitis B Vaccine',
          vaccineType: 'Recombinant',
          category: '6-week Dose',
          dateAdministered: '2023-09-26T14:20:00Z',
          ageAtVaccination: '6 weeks',
          doseNumber: 2,
          totalDosesRequired: 3,
          batchNumber: 'HB002-2023',
          manufacturer: 'GSK',
          expiryDate: '2025-04-15',
          site: 'Left thigh',
          route: 'Intramuscular',
          administeredBy: 'Dr. Robert Chen',
          facility: 'Community Health Center',
          adverseReactions: 'None reported',
          notes: 'Second dose in 3-dose series'
        },
        {
          id: 'v004',
          vaccineName: 'Pentavalent Vaccine (DTP-HepB-Hib)',
          vaccineType: 'Combined',
          category: '6-week Dose',
          dateAdministered: '2023-09-26T14:30:00Z',
          ageAtVaccination: '6 weeks',
          doseNumber: 1,
          totalDosesRequired: 3,
          batchNumber: 'PV001-2023',
          manufacturer: 'Serum Institute',
          expiryDate: '2024-12-31',
          site: 'Right thigh',
          route: 'Intramuscular',
          administeredBy: 'Dr. Robert Chen',
          facility: 'Community Health Center',
          adverseReactions: 'Mild fever (38.2°C) for 1 day, treated with acetaminophen',
          notes: 'First dose of pentavalent series'
        },
        {
          id: 'v005',
          vaccineName: 'Pneumococcal Conjugate Vaccine (PCV13)',
          vaccineType: 'Conjugate',
          category: '6-week Dose',
          dateAdministered: '2023-09-26T14:40:00Z',
          ageAtVaccination: '6 weeks',
          doseNumber: 1,
          totalDosesRequired: 3,
          batchNumber: 'PCV001-2023',
          manufacturer: 'Pfizer',
          expiryDate: '2025-01-30',
          site: 'Left upper arm',
          route: 'Intramuscular',
          administeredBy: 'Nurse Patricia Wilson',
          facility: 'Community Health Center',
          adverseReactions: 'None reported',
          notes: 'First dose of PCV series'
        }
      ],
      upcomingVaccinations: [
        {
          vaccineName: 'Hepatitis B Vaccine',
          doseNumber: 3,
          dueDate: '2024-02-15',
          category: '6-month Dose',
          status: 'Due Soon',
          daysUntilDue: 45,
          window: 'Can be given 6-18 months of age'
        },
        {
          vaccineName: 'Measles, Mumps, and Rubella (MMR)',
          doseNumber: 1,
          dueDate: '2024-08-15',
          category: '12-month Dose',
          status: 'Scheduled',
          daysUntilDue: 227,
          window: 'Can be given 12-15 months of age'
        }
      ],
      missedVaccinations: [],
      vaccinationSchedule: 'Philippine Expanded Program on Immunization (EPI)',
      riskFactors: ['None identified'],
      travelHistory: ['None'],
      specialConsiderations: ['None']
    },
    {
      id: 2,
      name: 'Marcus Thompson',
      dateOfBirth: '2019-03-22',
      age: '5 years 6 months',
      gender: 'Male',
      guardianName: 'Lisa Thompson',
      guardianContact: '+1-555-0456',
      medicalRecordNumber: 'MRN-2019-089',
      bloodType: 'A+',
      allergies: ['Eggs (mild)'],
      currentWeight: '18.2 kg',
      currentHeight: '110 cm',
      immunizationStatus: 'Overdue',
      nextDueDate: '2024-09-22',
      completionRate: 87,
      vaccinationHistory: [
        {
          id: 'v101',
          vaccineName: 'BCG (Bacillus Calmette-Guérin)',
          vaccineType: 'Live Attenuated',
          category: 'Birth Dose',
          dateAdministered: '2019-03-23T11:15:00Z',
          ageAtVaccination: '1 day',
          doseNumber: 1,
          totalDosesRequired: 1,
          batchNumber: 'BCG045-2019',
          manufacturer: 'Serum Institute',
          expiryDate: '2020-03-22',
          site: 'Left upper arm',
          route: 'Intradermal',
          administeredBy: 'Dr. Amanda Clark',
          facility: 'Metro General Hospital',
          adverseReactions: 'Small scar formation (normal)',
          notes: 'Standard BCG vaccination'
        },
        {
          id: 'v102',
          vaccineName: 'Pentavalent Vaccine (DTP-HepB-Hib)',
          vaccineType: 'Combined',
          category: '6-week Series',
          dateAdministered: '2019-05-03T10:30:00Z',
          ageAtVaccination: '6 weeks',
          doseNumber: 1,
          totalDosesRequired: 3,
          batchNumber: 'PV078-2019',
          manufacturer: 'Serum Institute',
          expiryDate: '2020-11-30',
          site: 'Right thigh',
          route: 'Intramuscular',
          administeredBy: 'Nurse David Kim',
          facility: 'Eastside Clinic',
          adverseReactions: 'Mild swelling and redness at injection site',
          notes: 'First dose completed successfully'
        },
        {
          id: 'v103',
          vaccineName: 'Measles, Mumps, and Rubella (MMR)',
          vaccineType: 'Live Attenuated',
          category: '12-month Dose',
          dateAdministered: '2020-03-25T13:45:00Z',
          ageAtVaccination: '12 months 3 days',
          doseNumber: 1,
          totalDosesRequired: 2,
          batchNumber: 'MMR022-2020',
          manufacturer: 'Merck',
          expiryDate: '2021-05-15',
          site: 'Left upper arm',
          route: 'Subcutaneous',
          administeredBy: 'Dr. Sarah Lopez',
          facility: 'Children\'s Health Center',
          adverseReactions: 'Low-grade fever for 2 days, mild rash',
          notes: 'Administered during COVID-19 pandemic with precautions'
        },
        {
          id: 'v104',
          vaccineName: 'COVID-19 Pediatric Vaccine (Pfizer)',
          vaccineType: 'mRNA',
          category: 'Emergency Use',
          dateAdministered: '2022-01-15T09:20:00Z',
          ageAtVaccination: '2 years 9 months',
          doseNumber: 1,
          totalDosesRequired: 2,
          batchNumber: 'COVID-PED-089',
          manufacturer: 'Pfizer-BioNTech',
          expiryDate: '2022-06-30',
          site: 'Left upper arm',
          route: 'Intramuscular',
          administeredBy: 'Dr. Michael Rodriguez',
          facility: 'City Vaccination Center',
          adverseReactions: 'Sore arm for 1 day',
          notes: 'Pediatric formulation (10 mcg dose)'
        }
      ],
      upcomingVaccinations: [
        {
          vaccineName: 'Influenza Vaccine (Annual)',
          doseNumber: 1,
          dueDate: '2024-10-01',
          category: 'Annual Dose',
          status: 'Due Soon',
          daysUntilDue: 15,
          window: 'Annual vaccination recommended'
        }
      ],
      missedVaccinations: [
        {
          vaccineName: 'MMR (Second Dose)',
          doseNumber: 2,
          originalDueDate: '2024-03-22',
          category: '5-year Booster',
          status: 'Overdue',
          daysOverdue: 180,
          urgency: 'High',
          notes: 'Recommended before school entry'
        },
        {
          vaccineName: 'DTP Booster',
          doseNumber: 4,
          originalDueDate: '2024-03-22',
          category: '5-year Booster',
          status: 'Overdue',
          daysOverdue: 180,
          urgency: 'High',
          notes: 'Pre-school booster dose'
        }
      ],
      vaccinationSchedule: 'Philippine Expanded Program on Immunization (EPI)',
      riskFactors: ['Egg allergy (contraindication for certain vaccines)'],
      travelHistory: ['Family trip to Japan (2023)'],
      specialConsiderations: ['Requires egg-free vaccine formulations when available']
    },
    {
      id: 3,
      name: 'Sofia Rodriguez',
      dateOfBirth: '1987-11-08',
      age: '36 years 10 months',
      gender: 'Female',
      guardianName: 'Self',
      guardianContact: '+1-555-0789',
      medicalRecordNumber: 'MRN-1987-234',
      bloodType: 'B-',
      allergies: ['Penicillin', 'Shellfish'],
      currentWeight: '62 kg',
      currentHeight: '165 cm',
      immunizationStatus: 'Current',
      nextDueDate: '2025-09-15',
      completionRate: 95,
      vaccinationHistory: [
        {
          id: 'v201',
          vaccineName: 'COVID-19 mRNA Vaccine (Moderna)',
          vaccineType: 'mRNA',
          category: 'Primary Series',
          dateAdministered: '2021-04-12T14:30:00Z',
          ageAtVaccination: '33 years 5 months',
          doseNumber: 1,
          totalDosesRequired: 2,
          batchNumber: 'MOD-VAC-4578',
          manufacturer: 'Moderna',
          expiryDate: '2021-10-15',
          site: 'Left upper arm',
          route: 'Intramuscular',
          administeredBy: 'Nurse Rebecca Martinez',
          facility: 'Regional Vaccination Site',
          adverseReactions: 'Fatigue and mild headache for 24 hours',
          notes: 'First dose of COVID-19 primary series'
        },
        {
          id: 'v202',
          vaccineName: 'COVID-19 mRNA Vaccine (Moderna)',
          vaccineType: 'mRNA',
          category: 'Primary Series',
          dateAdministered: '2021-05-10T11:45:00Z',
          ageAtVaccination: '33 years 6 months',
          doseNumber: 2,
          totalDosesRequired: 2,
          batchNumber: 'MOD-VAC-4612',
          manufacturer: 'Moderna',
          expiryDate: '2021-11-20',
          site: 'Right upper arm',
          route: 'Intramuscular',
          administeredBy: 'Dr. James Park',
          facility: 'Regional Vaccination Site',
          adverseReactions: 'Muscle aches, low-grade fever (37.8°C) for 2 days',
          notes: 'Completed primary series'
        },
        {
          id: 'v203',
          vaccineName: 'COVID-19 mRNA Vaccine Booster (Pfizer)',
          vaccineType: 'mRNA',
          category: 'Booster Dose',
          dateAdministered: '2021-11-15T16:20:00Z',
          ageAtVaccination: '34 years',
          doseNumber: 3,
          totalDosesRequired: 3,
          batchNumber: 'PFZ-BST-7834',
          manufacturer: 'Pfizer-BioNTech',
          expiryDate: '2022-04-30',
          site: 'Left upper arm',
          route: 'Intramuscular',
          administeredBy: 'Nurse Carol Thompson',
          facility: 'Community Health Center',
          adverseReactions: 'Sore arm for 2 days',
          notes: 'First booster dose'
        },
        {
          id: 'v204',
          vaccineName: 'Influenza Vaccine (Quadrivalent)',
          vaccineType: 'Inactivated',
          category: 'Annual Dose',
          dateAdministered: '2023-10-05T08:30:00Z',
          ageAtVaccination: '35 years 11 months',
          doseNumber: 1,
          totalDosesRequired: 1,
          batchNumber: 'FLU-2023-456',
          manufacturer: 'Sanofi Pasteur',
          expiryDate: '2024-06-30',
          site: 'Right upper arm',
          route: 'Intramuscular',
          administeredBy: 'Pharmacist John Wilson',
          facility: 'Downtown Pharmacy',
          adverseReactions: 'None reported',
          notes: '2023-2024 influenza season vaccine'
        },
        {
          id: 'v205',
          vaccineName: 'Tetanus-Diphtheria (Td) Booster',
          vaccineType: 'Toxoid',
          category: '10-year Booster',
          dateAdministered: '2022-07-20T13:15:00Z',
          ageAtVaccination: '34 years 8 months',
          doseNumber: 1,
          totalDosesRequired: 1,
          batchNumber: 'TD-2022-234',
          manufacturer: 'GSK',
          expiryDate: '2024-12-15',
          site: 'Left upper arm',
          route: 'Intramuscular',
          administeredBy: 'Dr. Elena Vasquez',
          facility: 'Primary Care Clinic',
          adverseReactions: 'Mild soreness at injection site',
          notes: 'Routine 10-year booster'
        }
      ],
      upcomingVaccinations: [
        {
          vaccineName: 'Influenza Vaccine (Annual)',
          doseNumber: 1,
          dueDate: '2024-10-01',
          category: 'Annual Dose',
          status: 'Due Soon',
          daysUntilDue: 15,
          window: 'Recommended annually'
        },
        {
          vaccineName: 'COVID-19 Updated Booster',
          doseNumber: 1,
          dueDate: '2025-01-15',
          category: 'Updated Booster',
          status: 'Scheduled',
          daysUntilDue: 121,
          window: 'Annual or as recommended'
        }
      ],
      missedVaccinations: [],
      vaccinationSchedule: 'Adult Immunization Schedule (CDC/ACIP)',
      riskFactors: ['Healthcare worker', 'Chronic asthma'],
      travelHistory: ['Europe (2023)', 'Southeast Asia (2022)'],
      specialConsiderations: ['Penicillin allergy documented', 'Prefers preservative-free vaccines when available']
    }
  ];

  return patients;
};

// @route   GET /api/immunization-history/patient/:patientId
// @desc    Get comprehensive immunization history for a specific patient
// @access  Private
router.get('/patient/:patientId', auth, async (req, res) => {
  try {
    const { patientId } = req.params;
    console.log(`📋 Fetching immunization history for patient ID: ${patientId}`);
    
    const patients = generatePatientImmunizationData();
    const patient = patients.find(p => p.id === parseInt(patientId));
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Calculate additional statistics
    const totalVaccinesReceived = patient.vaccinationHistory.length;
    const totalVaccinesScheduled = totalVaccinesReceived + patient.upcomingVaccinations.length + patient.missedVaccinations.length;
    const upToDatePercentage = ((totalVaccinesReceived / (totalVaccinesScheduled || 1)) * 100).toFixed(1);
    
    // Group vaccines by category
    const vaccinesByCategory = patient.vaccinationHistory.reduce((acc, vaccine) => {
      if (!acc[vaccine.category]) acc[vaccine.category] = [];
      acc[vaccine.category].push(vaccine);
      return acc;
    }, {});

    // Recent vaccinations (last 12 months)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const recentVaccinations = patient.vaccinationHistory.filter(vaccine => 
      new Date(vaccine.dateAdministered) > oneYearAgo
    );

    // Adverse reactions summary
    const adverseReactions = patient.vaccinationHistory
      .filter(vaccine => vaccine.adverseReactions && vaccine.adverseReactions !== 'None reported')
      .map(vaccine => ({
        vaccine: vaccine.vaccineName,
        date: vaccine.dateAdministered,
        reaction: vaccine.adverseReactions,
        severity: vaccine.adverseReactions.toLowerCase().includes('mild') ? 'Mild' : 
                 vaccine.adverseReactions.toLowerCase().includes('severe') ? 'Severe' : 'Moderate'
      }));

    const response = {
      success: true,
      patient: {
        demographics: {
          id: patient.id,
          name: patient.name,
          dateOfBirth: patient.dateOfBirth,
          age: patient.age,
          gender: patient.gender,
          medicalRecordNumber: patient.medicalRecordNumber,
          bloodType: patient.bloodType
        },
        contactInfo: {
          guardianName: patient.guardianName,
          guardianContact: patient.guardianContact
        },
        medicalInfo: {
          allergies: patient.allergies,
          currentWeight: patient.currentWeight,
          currentHeight: patient.currentHeight,
          riskFactors: patient.riskFactors,
          specialConsiderations: patient.specialConsiderations
        },
        immunizationSummary: {
          status: patient.immunizationStatus,
          completionRate: parseFloat(upToDatePercentage),
          totalVaccinesReceived,
          totalScheduled: totalVaccinesScheduled,
          nextDueDate: patient.nextDueDate,
          vaccinationSchedule: patient.vaccinationSchedule
        },
        vaccinationHistory: patient.vaccinationHistory,
        vaccinesByCategory,
        upcomingVaccinations: patient.upcomingVaccinations,
        missedVaccinations: patient.missedVaccinations,
        recentVaccinations,
        adverseReactions,
        travelHistory: patient.travelHistory
      },
      generatedAt: new Date().toISOString()
    };

    console.log('✅ Patient immunization history retrieved successfully');
    res.json(response);

  } catch (error) {
    console.error('❌ Error fetching patient immunization history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching patient immunization history',
      error: error.message
    });
  }
});

// @route   GET /api/immunization-history/patients
// @desc    Get immunization summary for all patients
// @access  Private
router.get('/patients', auth, async (req, res) => {
  try {
    console.log('📋 Fetching immunization summary for all patients...');
    
    const patients = generatePatientImmunizationData();
    
    const patientSummaries = patients.map(patient => ({
      id: patient.id,
      name: patient.name,
      age: patient.age,
      medicalRecordNumber: patient.medicalRecordNumber,
      immunizationStatus: patient.immunizationStatus,
      completionRate: patient.completionRate,
      totalVaccines: patient.vaccinationHistory.length,
      upcomingCount: patient.upcomingVaccinations.length,
      overdueCount: patient.missedVaccinations.length,
      nextDueDate: patient.nextDueDate,
      lastVaccination: patient.vaccinationHistory.length > 0 ? 
        patient.vaccinationHistory[patient.vaccinationHistory.length - 1].dateAdministered : null,
      riskLevel: patient.missedVaccinations.length > 0 ? 'High' : 
                patient.upcomingVaccinations.some(v => v.status === 'Due Soon') ? 'Medium' : 'Low'
    }));

    // Overall statistics
    const stats = {
      totalPatients: patients.length,
      upToDate: patients.filter(p => p.immunizationStatus === 'Up to Date' || p.immunizationStatus === 'Current').length,
      overdue: patients.filter(p => p.immunizationStatus === 'Overdue').length,
      dueSoon: patients.filter(p => p.upcomingVaccinations.some(v => v.status === 'Due Soon')).length,
      averageCompletionRate: (patients.reduce((sum, p) => sum + p.completionRate, 0) / patients.length).toFixed(1)
    };

    res.json({
      success: true,
      stats,
      patients: patientSummaries,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching patient immunization summaries:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching patient immunization summaries',
      error: error.message
    });
  }
});

// @route   GET /api/immunization-history/overdue
// @desc    Get patients with overdue vaccinations
// @access  Private
router.get('/overdue', auth, async (req, res) => {
  try {
    console.log('⚠️ Fetching patients with overdue vaccinations...');
    
    const patients = generatePatientImmunizationData();
    const overduePatients = patients.filter(patient => patient.missedVaccinations.length > 0);
    
    const overdueDetails = overduePatients.map(patient => ({
      id: patient.id,
      name: patient.name,
      age: patient.age,
      medicalRecordNumber: patient.medicalRecordNumber,
      contactInfo: {
        guardianName: patient.guardianName,
        guardianContact: patient.guardianContact
      },
      overdueVaccinations: patient.missedVaccinations.map(missed => ({
        ...missed,
        patientId: patient.id,
        patientName: patient.name
      })),
      totalOverdue: patient.missedVaccinations.length,
      mostUrgent: patient.missedVaccinations.reduce((prev, current) => 
        (prev.daysOverdue > current.daysOverdue) ? prev : current
      ),
      riskFactors: patient.riskFactors
    }));

    // Summary statistics
    const overdueSummary = {
      totalPatientsOverdue: overduePatients.length,
      totalOverdueVaccinations: overduePatients.reduce((sum, p) => sum + p.missedVaccinations.length, 0),
      highUrgency: overduePatients.filter(p => 
        p.missedVaccinations.some(v => v.urgency === 'High')
      ).length,
      averageDaysOverdue: overduePatients.length > 0 ? 
        Math.round(
          overduePatients.reduce((sum, p) => 
            sum + p.missedVaccinations.reduce((pSum, v) => pSum + v.daysOverdue, 0)
          , 0) / overduePatients.reduce((sum, p) => sum + p.missedVaccinations.length, 0)
        ) : 0
    };

    res.json({
      success: true,
      summary: overdueSummary,
      overduePatients: overdueDetails,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching overdue vaccinations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching overdue vaccinations',
      error: error.message
    });
  }
});

// @route   GET /api/immunization-history/schedule/:patientId
// @desc    Get vaccination schedule for a specific patient
// @access  Private
router.get('/schedule/:patientId', auth, async (req, res) => {
  try {
    const { patientId } = req.params;
    console.log(`📅 Fetching vaccination schedule for patient ID: ${patientId}`);
    
    const patients = generatePatientImmunizationData();
    const patient = patients.find(p => p.id === parseInt(patientId));
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Create a comprehensive schedule combining completed, upcoming, and missed
    const schedule = [
      ...patient.vaccinationHistory.map(vaccine => ({
        ...vaccine,
        status: 'Completed',
        scheduledDate: vaccine.dateAdministered,
        actualDate: vaccine.dateAdministered
      })),
      ...patient.upcomingVaccinations.map(vaccine => ({
        vaccineName: vaccine.vaccineName,
        doseNumber: vaccine.doseNumber,
        category: vaccine.category,
        status: vaccine.status,
        scheduledDate: vaccine.dueDate,
        daysUntilDue: vaccine.daysUntilDue,
        window: vaccine.window
      })),
      ...patient.missedVaccinations.map(vaccine => ({
        vaccineName: vaccine.vaccineName,
        doseNumber: vaccine.doseNumber,
        category: vaccine.category,
        status: 'Overdue',
        scheduledDate: vaccine.originalDueDate,
        daysOverdue: vaccine.daysOverdue,
        urgency: vaccine.urgency,
        notes: vaccine.notes
      }))
    ].sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));

    res.json({
      success: true,
      patient: {
        id: patient.id,
        name: patient.name,
        age: patient.age,
        vaccinationSchedule: patient.vaccinationSchedule
      },
      schedule,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching vaccination schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vaccination schedule',
      error: error.message
    });
  }
});

module.exports = router;