// In the Name of God, the Creative, the Originator

export interface TripData {
  rowIndex: string; // Ephemeral row index (e.g., "0", "35") - session-specific
  tripIdentifier: string; // Stable composite key: `${departureDate}|${groupCode}|${agentName}`
  dayOfWeek: string;
  departureDate: string;
  remainingCapacity: number;
  minCapacity: number; // Min passengers required (from Atabat's maxRequestCount JS var)
  tripType: string;
  cost: number;
  departureLocation: string;
  city: string;
  provinceCode?: string; // Province code used in original search
  agentName: string;
  groupCode: string;
  executorName: string;
  najafHotel: string;
  karbalaHotel: string;
  kazemainHotel: string;
  address: string;
  selectButtonScript?: string; // ASP.NET postback script (session-specific)
}

export interface TripSearchParams {
  dateFrom?: string; // YYYY/MM/DD
  dateTo?: string; // YYYY/MM/DD
  provinceCode?: string; // e.g., '17' for Tehran
  borderType?: string; // e.g., '2' for Air
  adultCount?: number;
  infantCount?: number; // Under 2 years
}

export interface PassengerInfo {
  nationalId: string;
  birthdate: string; // YYYY/MM/DD
  phone: string;
}

export interface AddPassengerResult {
  success: boolean;
  message?: string;
  nationalId: string; // The national ID of the passenger that was added (or failed)
}

export interface ReservationResult {
  success: boolean;
  message?: string;
  reservationId?: string; // The GUID from URL
  warning?: string;
  passengerResults?: AddPassengerResult[]; // Per-passenger results for multi-passenger flow
  minCapacity?: number; // Number of passengers required by the trip
}

export interface ReceiptData {
  resId?: string;
  expireDate?: string;
  city?: string;
  tripType?: string;
  departureDate?: string;
  agentName?: string;
  agentPhone?: string;
  agentAddress?: string;
  executorName?: string;
  itinerary: ItineraryItem[];
  passengers: PassengerReceiptItem[];
  paymentUrl?: string; // Extracted payment link
}

export interface ItineraryItem {
  row: number;
  entryDate: string;
  city: string;
  hotel: string;
  exitDate: string;
  stayDuration?: number;
}

export interface PassengerReceiptItem {
  id: string; // 'شناسه زائر'
  nationalId: string;
  firstName: string;
  lastName: string;
  birthdate: string;
  cost: number;
}

export interface AtabatReservationStatus {
  resId: string;
  status: 'pending' | 'registered' | 'paid' | 'cancelled' | 'unknown';
  registrationDate?: string;
  departureDate?: string;
  groupCode?: string;
  agentName?: string;
}
