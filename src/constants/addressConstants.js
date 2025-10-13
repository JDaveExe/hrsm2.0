/**
 * BARANGAY MAYBUNGA ADDRESS CONSTANTS
 * 
 * This file contains the official Purok and Street mapping for Barangay Maybunga.
 * 
 * Address Structure:
 * House No. > Barangay Maybunga > Purok > Street > Pasig City > Metro Manila
 */

// Purok to Street mapping for Barangay Maybunga
export const PUROK_TO_STREET = {
  'Purok 1': [
    'Bernardo St',
    'Harrison Bend',
    'E Rodriguez',
    'Liwayway St.',
    'M. Espitu St.',
    'Pag-asa St'
  ],
  'Purok 2': [
    'Blue St.',
    'Kalinangan St.',
    'Kawilihan St.',
    'Kamagong St.',
    'Orange St.'
  ],
  'Purok 3': [
    'C. Santos St.',
    'F. Legaspi St.',
    'M. Suarez Ave.'
  ],
  'Purok 4': [
    'Buong St.',
    'Carlo J. Caparas St.',
    'Dr. Sixto Antonio Avenue',
    'E. Santiago St.',
    'Francisco V. Legaspi St.',
    'Jose Cruz St.',
    'M Eusebio Avenue'
  ]
};

// Array of all Puroks for dropdown options
export const PUROKS = [
  'Purok 1',
  'Purok 2',
  'Purok 3',
  'Purok 4'
];

// Fixed values for address fields
export const BARANGAY = 'Barangay Maybunga';
export const CITY = 'Pasig City';
export const REGION = 'Metro Manila';

// Get streets for a specific purok
export const getStreetsForPurok = (purok) => {
  return PUROK_TO_STREET[purok] || [];
};

// Get purok for a specific street (reverse lookup)
export const getPurokForStreet = (street) => {
  for (const [purok, streets] of Object.entries(PUROK_TO_STREET)) {
    if (streets.includes(street)) {
      return purok;
    }
  }
  return null;
};

// Get all streets (flat array)
export const getAllStreets = () => {
  return Object.values(PUROK_TO_STREET).flat();
};

// Validate if street belongs to purok
export const isStreetInPurok = (street, purok) => {
  const streets = PUROK_TO_STREET[purok] || [];
  return streets.includes(street);
};

export default {
  PUROK_TO_STREET,
  PUROKS,
  BARANGAY,
  CITY,
  REGION,
  getStreetsForPurok,
  getPurokForStreet,
  getAllStreets,
  isStreetInPurok
};
