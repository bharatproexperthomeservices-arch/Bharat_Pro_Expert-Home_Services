// ============================================================================
// Agent #5: BookingExecutorAgent
// ============================================================================

import { BaseAgent } from '../BaseAgent';

export interface BookingData {
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  serviceType: string;
  location: string;
  coordinates?: { lat: number; lng: number };
  preferredTime: string;
  amount?: number;
  notes?: string;
}

export interface SimplePartner {
  id: string;
  name: string;
  phone: string;
  email?: string;
  rating: number;
  distanceKm: number;
}

export interface BookingResult {
  status: 'success' | 'error';
  bookingId?: string;
  bookingNumber?: string;
  message: string;
  partnerName?: string;
  partnerPhone?: string;
}

export class BookingExecutorAgent extends BaseAgent {
  constructor() {
    super(5, 'Booking Executor', 'Final booking को confirm और save करना');
  }

  async execute(
    bookingData: BookingData,
    partner: SimplePartner
  ): Promise<BookingResult> {
    console.log('📝 Executing booking for ' + bookingData.customerName);

    try {
      const bookingNumber = this.generateBookingNumber();

      // Founder को report भेजो
      await this.report(
        'New Booking: ' + bookingNumber + ' - ' + bookingData.serviceType,
        'low'
      );

      // Customer को confirmation email भेजो
      if (bookingData.customerEmail) {
        await this.sendCustomerConfirmation(
          bookingData,
          partner,
          bookingNumber
        );
      }

      console.log('✅ Booking confirmed: ' + bookingNumber);

      return {
        status: 'success',
        bookingNumber: bookingNumber,
        message: 'Booking ' + bookingNumber + ' confirmed with ' + partner.name,
        partnerName: partner.name,
        partnerPhone: partner.phone,
      };
    } catch (error: any) {
      await this.handleError(error, 'BookingExecutor.execute');
      return {
        status: 'error',
        message: 'Booking failed: ' + error.message,
      };
    }
  }

  private generateBookingNumber(): string {
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000);
    return 'BPE-' + yyyy + mm + dd + '-' + random;
  }

  private async sendCustomerConfirmation(
    bookingData: BookingData,
    partner: SimplePartner,
    bookingNumber: string
  ): Promise<void> {
    try {
      const message =
        'Namaste ' + bookingData.customerName + ',\n\n' +
        'Aapki booking confirm ho gayi hai!\n\n' +
        'Booking Number: ' + bookingNumber + '\n' +
        'Service: ' + bookingData.serviceType + '\n' +
        'Partner: ' + partner.name + '\n' +
        'Partner Phone: ' + partner.phone + '\n' +
        'Time: ' + bookingData.preferredTime + '\n' +
        'Address: ' + bookingData.location + '\n\n' +
        'Partner aapko 30 minute pehle call karega.\n\n' +
        'Dhanyavaad!\nBharat Pro Expert Home Services';

      await this.email.sendEmail(
        bookingData.customerEmail || '',
        'Booking Confirmed - ' + bookingData.serviceType,
        message
      );

      console.log('📧 Confirmation email sent to ' + bookingData.customerEmail);
    } catch (error: any) {
      console.error('❌ Customer email failed: ' + error.message);
    }
  }
}

export default BookingExecutorAgent;