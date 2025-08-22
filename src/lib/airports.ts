export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
}

export const airports: Airport[] = [
  // United States
  { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'US' },
  { code: 'LGA', name: 'LaGuardia Airport', city: 'New York', country: 'US' },
  { code: 'EWR', name: 'Newark Liberty International Airport', city: 'New York', country: 'US' },
  { code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'US' },
  { code: 'SFO', name: 'San Francisco International Airport', city: 'San Francisco', country: 'US' },
  { code: 'ORD', name: 'O\'Hare International Airport', city: 'Chicago', country: 'US' },
  { code: 'MDW', name: 'Midway International Airport', city: 'Chicago', country: 'US' },
  { code: 'MIA', name: 'Miami International Airport', city: 'Miami', country: 'US' },
  { code: 'DFW', name: 'Dallas/Fort Worth International Airport', city: 'Dallas', country: 'US' },
  { code: 'DEN', name: 'Denver International Airport', city: 'Denver', country: 'US' },
  { code: 'ATL', name: 'Hartsfield-Jackson Atlanta International Airport', city: 'Atlanta', country: 'US' },
  { code: 'SEA', name: 'Seattle-Tacoma International Airport', city: 'Seattle', country: 'US' },
  { code: 'LAS', name: 'McCarran International Airport', city: 'Las Vegas', country: 'US' },
  { code: 'PHX', name: 'Phoenix Sky Harbor International Airport', city: 'Phoenix', country: 'US' },
  { code: 'BOS', name: 'Logan International Airport', city: 'Boston', country: 'US' },
  { code: 'MSP', name: 'Minneapolis-Saint Paul International Airport', city: 'Minneapolis', country: 'US' },
  { code: 'DTW', name: 'Detroit Metropolitan Wayne County Airport', city: 'Detroit', country: 'US' },
  { code: 'PHL', name: 'Philadelphia International Airport', city: 'Philadelphia', country: 'US' },
  { code: 'CLT', name: 'Charlotte Douglas International Airport', city: 'Charlotte', country: 'US' },
  { code: 'IAH', name: 'George Bush Intercontinental Airport', city: 'Houston', country: 'US' },
  { code: 'HOU', name: 'William P. Hobby Airport', city: 'Houston', country: 'US' },

  // International
  { code: 'LHR', name: 'London Heathrow Airport', city: 'London', country: 'UK' },
  { code: 'LGW', name: 'London Gatwick Airport', city: 'London', country: 'UK' },
  { code: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'FR' },
  { code: 'ORY', name: 'Orly Airport', city: 'Paris', country: 'FR' },
  { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'DE' },
  { code: 'AMS', name: 'Amsterdam Airport Schiphol', city: 'Amsterdam', country: 'NL' },
  { code: 'MAD', name: 'Madrid-Barajas Airport', city: 'Madrid', country: 'ES' },
  { code: 'BCN', name: 'Barcelona-El Prat Airport', city: 'Barcelona', country: 'ES' },
  { code: 'FCO', name: 'Leonardo da Vinci International Airport', city: 'Rome', country: 'IT' },
  { code: 'MXP', name: 'Malpensa Airport', city: 'Milan', country: 'IT' },
  { code: 'ZUR', name: 'Zurich Airport', city: 'Zurich', country: 'CH' },
  { code: 'VIE', name: 'Vienna International Airport', city: 'Vienna', country: 'AT' },
  { code: 'CPH', name: 'Copenhagen Airport', city: 'Copenhagen', country: 'DK' },
  { code: 'ARN', name: 'Stockholm Arlanda Airport', city: 'Stockholm', country: 'SE' },
  { code: 'OSL', name: 'Oslo Airport', city: 'Oslo', country: 'NO' },

  // Asia
  { code: 'NRT', name: 'Narita International Airport', city: 'Tokyo', country: 'JP' },
  { code: 'HND', name: 'Haneda Airport', city: 'Tokyo', country: 'JP' },
  { code: 'ICN', name: 'Incheon International Airport', city: 'Seoul', country: 'KR' },
  { code: 'PEK', name: 'Beijing Capital International Airport', city: 'Beijing', country: 'CN' },
  { code: 'PVG', name: 'Shanghai Pudong International Airport', city: 'Shanghai', country: 'CN' },
  { code: 'HKG', name: 'Hong Kong International Airport', city: 'Hong Kong', country: 'HK' },
  { code: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore', country: 'SG' },
  { code: 'BKK', name: 'Suvarnabhumi Airport', city: 'Bangkok', country: 'TH' },
  { code: 'KUL', name: 'Kuala Lumpur International Airport', city: 'Kuala Lumpur', country: 'MY' },

  // Canada
  { code: 'YYZ', name: 'Toronto Pearson International Airport', city: 'Toronto', country: 'CA' },
  { code: 'YVR', name: 'Vancouver International Airport', city: 'Vancouver', country: 'CA' },
  { code: 'YUL', name: 'Montreal-Pierre Elliott Trudeau International Airport', city: 'Montreal', country: 'CA' },

  // Australia
  { code: 'SYD', name: 'Sydney Kingsford Smith Airport', city: 'Sydney', country: 'AU' },
  { code: 'MEL', name: 'Melbourne Airport', city: 'Melbourne', country: 'AU' },
];

export function findAirportByInput(input: string): Airport | null {
  if (!input || input.trim().length === 0) return null;

  const searchTerm = input.trim().toLowerCase();

  const exactCodeMatch = airports.find(airport =>
    airport.code.toLowerCase() === searchTerm
  );
  if (exactCodeMatch) return exactCodeMatch;

  const cityMatch = airports.find(airport =>
    airport.city.toLowerCase() === searchTerm
  );
  if (cityMatch) return cityMatch;

  const partialCityMatch = airports.find(airport =>
    airport.city.toLowerCase().includes(searchTerm) ||
    searchTerm.includes(airport.city.toLowerCase())
  );
  if (partialCityMatch) return partialCityMatch;

  const nameMatch = airports.find(airport =>
    airport.name.toLowerCase().includes(searchTerm)
  );
  if (nameMatch) return nameMatch;

  return null;
}

export function getAirportSuggestions(input: string, limit: number = 5): Airport[] {
  if (!input || input.trim().length < 2) return [];

  const searchTerm = input.trim().toLowerCase();
  const suggestions: Airport[] = [];

  const exactCodeMatches = airports.filter(airport =>
    airport.code.toLowerCase().startsWith(searchTerm)
  );
  suggestions.push(...exactCodeMatches);

  const cityMatches = airports.filter(airport =>
    airport.city.toLowerCase().startsWith(searchTerm) &&
    !suggestions.some(s => s.code === airport.code)
  );
  suggestions.push(...cityMatches);

  const partialMatches = airports.filter(airport =>
    (airport.city.toLowerCase().includes(searchTerm) ||
     airport.name.toLowerCase().includes(searchTerm)) &&
    !suggestions.some(s => s.code === airport.code)
  );
  suggestions.push(...partialMatches);

  return suggestions.slice(0, limit);
}

export function validateAirportCode(code: string): boolean {
  return airports.some(airport => airport.code.toLowerCase() === code.toLowerCase());
}
