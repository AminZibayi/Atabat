// In the Name of God, the Creative, the Originator
import type { IAtabatAdapter } from './adapter';
import type {
  TripData,
  TripSearchParams,
  PassengerInfo,
  ReservationResult,
  ReceiptData,
  ItineraryItem,
  PassengerReceiptItem,
} from './types';

/**
 * Mock implementation of IAtabatAdapter for testing environments.
 * Provides realistic test data without requiring Playwright or network access.
 */
export class MockAdapter implements IAtabatAdapter {
  private authenticated = false;
  private reservations: Map<string, { trip: TripData; passenger: PassengerInfo; createdAt: Date }> =
    new Map();

  // Sample trip data for testing
  private sampleTrips: TripData[] = [
    {
      rowIndex: '0',
      tripIdentifier: '1404/10/05|684|زاگرس',
      dayOfWeek: 'جمعه',
      departureDate: '1404/10/05',
      remainingCapacity: 5,
      tripType: 'هوایی 7 شب',
      cost: 34136479,
      departureLocation: 'تهران',
      city: 'تهران',
      provinceCode: '17',
      agentName: 'زاگرس',
      groupCode: '684',
      executorName: 'زاگرس',
      najafHotel: 'اسطوره',
      karbalaHotel: 'ملک',
      kazemainHotel: 'قرطاج',
      address: 'خیابان سپهبد قرنی، بالاتر از تقاطع طالقانی، پلاک 85',
      selectButtonScript: "javascript:__doPostBack('ctl00$cp1$grdKargroup','Select$0')",
    },
    {
      rowIndex: '1',
      tripIdentifier: '1404/10/10|126|خادمان حریم نینوا',
      dayOfWeek: 'پنجشنبه',
      departureDate: '1404/10/10',
      remainingCapacity: 3,
      tripType: 'زمینی 5 شب',
      cost: 15000000,
      departureLocation: 'اصفهان',
      city: 'اصفهان',
      provinceCode: '13',
      agentName: 'خادمان حریم نینوا',
      groupCode: '126',
      executorName: 'خادمان حریم نینوا',
      najafHotel: 'مدینه البشری',
      karbalaHotel: 'برج المرتضی',
      kazemainHotel: '-',
      address: 'خیابان چهارباغ بالا، نبش خیابان نظر غربی',
      selectButtonScript: "javascript:__doPostBack('ctl00$cp1$grdKargroup','Select$1')",
    },
    {
      rowIndex: '2',
      tripIdentifier: '1404/10/15|3267|دریای کرم حسین',
      dayOfWeek: 'شنبه',
      departureDate: '1404/10/15',
      remainingCapacity: 8,
      tripType: 'هوایی 5 شب',
      cost: 28500000,
      departureLocation: 'مشهد',
      city: 'مشهد',
      provinceCode: '19',
      agentName: 'دریای کرم حسین',
      groupCode: '3267',
      executorName: 'دریای کرم حسین',
      najafHotel: 'الحیدری',
      karbalaHotel: 'الکربلائی',
      kazemainHotel: 'الکاظمین',
      address: 'بلوار وکیل آباد، روبروی باغ ملی',
      selectButtonScript: "javascript:__doPostBack('ctl00$cp1$grdKargroup','Select$2')",
    },
    {
      rowIndex: '3',
      tripIdentifier: '1404/10/20|4455|راهیان نور',
      dayOfWeek: 'دوشنبه',
      departureDate: '1404/10/20',
      remainingCapacity: 20,
      tripType: 'زمینی 7 شب',
      cost: 12000000,
      departureLocation: 'قم',
      city: 'قم',
      provinceCode: '35',
      agentName: 'راهیان نور',
      groupCode: '4455',
      executorName: 'راهیان نور',
      najafHotel: 'البراق',
      karbalaHotel: 'الدرویش',
      kazemainHotel: '-',
      address: 'خیابان ارم',
      selectButtonScript: "javascript:__doPostBack('ctl00$cp1$grdKargroup','Select$3')",
    },
    {
      rowIndex: '4',
      tripIdentifier: '1404/10/25|8899|شاهچراغ',
      dayOfWeek: 'چهارشنبه',
      departureDate: '1404/10/25',
      remainingCapacity: 2,
      tripType: 'هوایی 4 شب',
      cost: 31000000,
      departureLocation: 'شیراز',
      city: 'شیراز',
      provinceCode: '24',
      agentName: 'شاهچراغ',
      groupCode: '8899',
      executorName: 'شاهچراغ',
      najafHotel: 'قصر الدر',
      karbalaHotel: 'جنه الحسین',
      kazemainHotel: 'الهدی',
      address: 'بلوار زند',
      selectButtonScript: "javascript:__doPostBack('ctl00$cp1$grdKargroup','Select$4')",
    },
  ];

  async searchTrips(params: TripSearchParams): Promise<TripData[]> {
    // Simulate network delay
    await this.delay(200);

    let results = [...this.sampleTrips];

    // Filter by date range
    if (params.dateFrom || params.dateTo) {
      results = results.filter(trip => {
        const tripDate = trip.departureDate;
        if (params.dateFrom && tripDate < params.dateFrom) return false;
        if (params.dateTo && tripDate > params.dateTo) return false;
        return true;
      });
    }

    // Filter by province
    if (params.provinceCode && params.provinceCode !== '-1' && params.provinceCode !== '1000') {
      const provinceMap: Record<string, string> = {
        '17': 'تهران',
        '13': 'اصفهان',
        '19': 'مشهد',
        '35': 'قم',
        '24': 'فارس', // Shiraz is in Fars province
        // Add more default mappings as needed
      };

      const targetCity = provinceMap[params.provinceCode];

      if (targetCity) {
        // If we have a mapping, filter match
        // Note: Real system might map province -> multiple cities, but for mock 1-1 is okay or acceptable
        // Actually, city field in TripData is usually the city name.
        // We will do a partial match or exact match depending on valid province mappings.
        // For 'Fars', city might be 'Shiraz'. This simple map isn't perfect for all cases but good for direct matches if city=province center.
        // Let's assume city in sample data is the province center for simplicity, or we map code directly to city name.

        // Special case handling for provinces where city name != province name
        if (params.provinceCode === '24') {
          results = results.filter(t => t.city === 'شیراز');
        } else {
          results = results.filter(t => t.city === targetCity);
        }
      } else {
        // If a province code is given but unknown to us, return NO results (strict filtering)
        return [];
      }
    }

    // Filter by border type (trip type)
    if (params.borderType && params.borderType !== '1000' && params.borderType !== '-1') {
      if (params.borderType === '2' || params.borderType === 'air') {
        results = results.filter(t => t.tripType.includes('هوایی'));
      } else if (params.borderType === '1' || params.borderType === 'land') {
        results = results.filter(t => t.tripType.includes('زمینی'));
      }
    }

    // Filter by capacity
    if (params.adultCount) {
      results = results.filter(t => t.remainingCapacity >= params.adultCount!);
    }

    return results;
  }

  async createReservation(
    tripData: TripData,
    passenger: PassengerInfo
  ): Promise<ReservationResult> {
    await this.delay(300);

    // Validate passenger data
    if (!passenger.nationalId || passenger.nationalId.length !== 10) {
      return {
        success: false,
        message: 'کد ملی باید ۱۰ رقم باشد',
      };
    }

    if (!passenger.birthdate || !/^\d{4}\/\d{2}\/\d{2}$/.test(passenger.birthdate)) {
      return {
        success: false,
        message: 'تاریخ تولد معتبر نیست',
      };
    }

    if (!passenger.phone || !/^09\d{9}$/.test(passenger.phone)) {
      return {
        success: false,
        message: 'شماره تلفن معتبر نیست',
      };
    }

    // Check capacity
    if (tripData.remainingCapacity < 1) {
      return {
        success: false,
        message: 'ظرفیت سفر تکمیل شده است',
      };
    }

    // Generate reservation ID
    const resId = this.generateUUID();

    // Store reservation
    this.reservations.set(resId, {
      trip: tripData,
      passenger,
      createdAt: new Date(),
    });

    return {
      success: true,
      reservationId: resId,
      warning: 'توجه: امکان لغو رزرو تا ۲۴ ساعت وجود ندارد',
    };
  }

  async getReceipt(resId: string): Promise<ReceiptData> {
    await this.delay(200);

    const reservation = this.reservations.get(resId);

    if (!reservation) {
      // Return sample receipt for testing
      return this.generateSampleReceipt(resId);
    }

    return this.generateReceiptFromReservation(resId, reservation);
  }

  async getPaymentUrl(resId: string): Promise<string | null> {
    await this.delay(100);

    // Generate mock payment URL
    const uid = this.generateUUID();
    return `https://atabatorg.haj.ir/epay/home/IndexEpay?resID=${resId}&ResIDStatus=1&App=atabatorg&UID=${uid}`;
  }

  async isAuthenticated(): Promise<boolean> {
    await this.delay(50);
    return this.authenticated;
  }

  async authenticate(): Promise<boolean> {
    await this.delay(500);
    this.authenticated = true;
    return true;
  }

  // Helper methods
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private generateSampleReceipt(resId: string): ReceiptData {
    const itinerary: ItineraryItem[] = [
      { row: 1, entryDate: '1404/10/05', city: 'کاظمین', hotel: 'قرطاج', exitDate: '1404/10/06' },
      { row: 2, entryDate: '1404/10/06', city: 'کربلا', hotel: 'ملک', exitDate: '1404/10/09' },
      { row: 3, entryDate: '1404/10/09', city: 'نجف', hotel: 'اسطوره', exitDate: '1404/10/12' },
      { row: 4, entryDate: '1404/10/06', city: 'سامرا', hotel: 'عبوری', exitDate: '1404/10/06' },
    ];

    const passengers: PassengerReceiptItem[] = [
      {
        id: '17775499',
        nationalId: '0820531261',
        firstName: 'امین',
        lastName: 'زیبایی',
        birthdate: '1382/02/27',
        cost: 34913604,
      },
    ];

    return {
      resId,
      expireDate: '1404/10/03',
      city: 'تهران',
      tripType: 'هوایی 7 شب',
      departureDate: '1404/10/05',
      agentName: 'زاگرس',
      agentPhone: '88820040',
      agentAddress: 'خیابان سپهبد قرنی، بالاتر از تقاطع طالقانی، پلاک 85',
      executorName: 'زاگرس',
      itinerary,
      passengers,
      paymentUrl: `https://atabatorg.haj.ir/epay/home/IndexEpay?resID=${resId}`,
    };
  }

  private generateReceiptFromReservation(
    resId: string,
    reservation: { trip: TripData; passenger: PassengerInfo; createdAt: Date }
  ): ReceiptData {
    const { trip, passenger } = reservation;

    return {
      resId,
      expireDate: this.calculateExpireDate(),
      city: trip.city,
      tripType: trip.tripType,
      departureDate: trip.departureDate,
      agentName: trip.agentName,
      agentPhone: '88820040',
      agentAddress: trip.address,
      executorName: trip.executorName,
      itinerary: [
        {
          row: 1,
          entryDate: trip.departureDate,
          city: 'نجف',
          hotel: trip.najafHotel,
          exitDate: '',
        },
        { row: 2, entryDate: '', city: 'کربلا', hotel: trip.karbalaHotel, exitDate: '' },
      ],
      passengers: [
        {
          id: Math.floor(Math.random() * 100000000).toString(),
          nationalId: passenger.nationalId,
          firstName: 'زائر',
          lastName: 'محترم',
          birthdate: passenger.birthdate,
          cost: trip.cost,
        },
      ],
      paymentUrl: `https://atabatorg.haj.ir/epay/home/IndexEpay?resID=${resId}`,
    };
  }

  private calculateExpireDate(): string {
    const now = new Date();
    now.setDate(now.getDate() + 3);
    // Simple Jalali approximation (not accurate, just for testing)
    const year = 1404;
    const month = 10;
    const day = now.getDate();
    return `${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
  }
}

// Singleton instance for mock adapter
let mockAdapterInstance: MockAdapter | null = null;

export function getMockAdapter(): MockAdapter {
  if (!mockAdapterInstance) {
    mockAdapterInstance = new MockAdapter();
  }
  return mockAdapterInstance;
}
