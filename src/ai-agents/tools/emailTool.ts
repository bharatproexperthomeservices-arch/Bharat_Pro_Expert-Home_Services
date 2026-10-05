// ============================================================================
// EmailTool: Web3Forms API का उपयोग करके ईमेल भेजने वाला टूल
// ============================================================================

export interface SendEmailResponse {
  status: 'success' | 'error';
  message?: string;
  error?: string;
}

export interface EmailToolConfig {
  accessKey?: string;
  fromName?: string;
}

const DEFAULT_FROM_NAME = 'Bharat Pro Expert Home Services';
const MAX_RETRIES = 3;

const SAFETY_FOOTER = `\n\n---\nयह ईमेल Bharat Pro Expert Home Services की तरफ से भेजा गया है।\nकिसी भी तरह के डेटा का गलत इस्तेमाल नहीं किया जाएगा।`;

export class EmailTool {
  private accessKey: string;
  private fromName: string;

  constructor(config?: EmailToolConfig) {
    this.accessKey =
      config?.accessKey ||
      (import.meta as any).env?.VITE_WEB3FORMS_ACCESS_KEY ||
      'YOUR_ACCESS_KEY_HERE';

    this.fromName = config?.fromName || DEFAULT_FROM_NAME;
  }

  async sendEmail(
    to: string,
    subject: string,
    body: string,
    options?: { cc?: string; bcc?: string; isHtml?: boolean; }
  ): Promise<SendEmailResponse> {
    const { isHtml = false } = options || {};

    const requestBody = {
      access_key: this.accessKey,
      subject: subject,
      from_name: this.fromName,
      to: to,
      message: body + SAFETY_FOOTER,
      is_html: isHtml
    };

    let lastError = '';

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (response.ok && data.success) {
          console.log(`✅ Email sent successfully to ${to}`);
          return { status: 'success', message: 'ईमेल भेज दिया गया' };
        } else {
          lastError = data.message || `HTTP ${response.status}`;
          console.warn(`⚠️ Email attempt ${attempt + 1}/${MAX_RETRIES + 1} failed: ${lastError}`);
        }
      } catch (error: any) {
        lastError = error.message;
        console.warn(`⚠️ Email attempt ${attempt + 1}/${MAX_RETRIES + 1} failed: ${lastError}`);
      }

      if (attempt < MAX_RETRIES) {
        const delay = Math.pow(2, attempt) * 1000;
        await this.sleep(delay);
      }
    }

    console.error('❌ All email attempts failed:', lastError);
    return { status: 'error', message: 'ईमेल भेजने में विफल', error: lastError };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async sendDailyReport(
    to: string,
    reportData: {
      bookings: number;
      customers: number;
      partners: number;
      revenue: number;
      errorsFixed: number;
      date: string;
    }
  ): Promise<SendEmailResponse> {
    const subject = `📊 Daily Report — ${reportData.date}`;

    const body = `
Namaste Founder,

Aaj ka report:

📋 Bookings Handled: ${reportData.bookings}
👥 Customers Served: ${reportData.customers}
🤝 Partners Onboarded: ${reportData.partners}
🐛 Errors Fixed: ${reportData.errorsFixed}
💰 Revenue: ₹${reportData.revenue.toLocaleString('en-IN')}

Sab kuch smoothly chal raha hai. Koi issue nahi hai.

- Orchestrator Agent (AI CEO)
Bharat Pro Expert Home Services
    `;

    return this.sendEmail(to, subject, body, { isHtml: false });
  }

  async sendErrorAlert(
    to: string,
    errorData: { agentName: string; errorMessage: string; severity: 'low' | 'medium' | 'high' | 'critical'; timestamp: string; }
  ): Promise<SendEmailResponse> {
    const subject = `🚨 ${errorData.severity.toUpperCase()} Alert — ${errorData.agentName}`;

    const body = `
🚨 Alert: ${errorData.severity.toUpperCase()}

Agent: ${errorData.agentName}
Error: ${errorData.errorMessage}
Time: ${errorData.timestamp}

Please check the AI Developer logs.
    `;

    return this.sendEmail(to, subject, body, { isHtml: false });
  }

  async sendBookingConfirmation(
    to: string,
    bookingData: { customerName: string; serviceType: string; partnerName: string; partnerPhone: string; preferredTime: string; address: string; }
  ): Promise<SendEmailResponse> {
    const subject = `✅ Booking Confirmed — ${bookingData.serviceType}`;

    const body = `
Namaste ${bookingData.customerName},

Aapki booking confirm ho gayi hai.

Service: ${bookingData.serviceType}
Partner: ${bookingData.partnerName}
Partner Phone: ${bookingData.partnerPhone}
Time: ${bookingData.preferredTime}
Address: ${bookingData.address}

Partner aapko 30 minute pehle call karega.

Dhanyavaad!
Bharat Pro Expert Home Services
    `;

    return this.sendEmail(to, subject, body, { isHtml: false });
  }
}

let _defaultEmailTool: EmailTool | null = null;

export function getEmailTool(): EmailTool {
  if (!_defaultEmailTool) _defaultEmailTool = new EmailTool();
  return _defaultEmailTool;
}

export default EmailTool;