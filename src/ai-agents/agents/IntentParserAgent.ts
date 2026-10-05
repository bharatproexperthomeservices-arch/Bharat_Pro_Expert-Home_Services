// ============================================================================
// Agent #1: IntentParserAgent
// ============================================================================
// यह एजेंट कस्टमर के मैसेज को समझता है (Hindi/English/Urdu)
// और उसमें से service, time, location आदि निकालता है
// ============================================================================

import { BaseAgent } from '../BaseAgent';

export interface ParsedIntent {
  serviceType: string;
  preferredTime: string;
  location: string;
  urgency: 'emergency' | 'today' | 'this_week' | 'flexible';
  language: string;
  customerMood: string;
  budgetHint: string | null;
  specialNotes: string;
}

export class IntentParserAgent extends BaseAgent {
  constructor() {
    super(
      1,
      'Intent Parser',
      'कस्टमर के मैसेज को parse करके service की details निकालना'
    );
  }

  // -------------------------------------------------------------------------
  // मुख्य फंक्शन: मैसेज को parse करो
  // -------------------------------------------------------------------------
  async parse(customerMessage: string): Promise<ParsedIntent> {
    console.log(`🔍 Parsing message: "${customerMessage}"`);

    const prompt = `
You are an intent parser for a home services company (Bharat Pro Expert).

CUSTOMER MESSAGE: "${customerMessage}"

Extract the following as JSON:
{
    "serviceType": "AC Repair / Plumbing / Electrical / Cleaning / etc",
    "preferredTime": "date and time mentioned (or 'flexible' if not mentioned)",
    "location": "area/address mentioned",
    "urgency": "emergency OR today OR this_week OR flexible",
    "language": "hindi OR english OR urdu OR hinglish",
    "customerMood": "happy OR neutral OR frustrated OR urgent",
    "budgetHint": "any price mentioned or null",
    "specialNotes": "anything else important"
}

Return ONLY JSON. No explanation.
    `;

    const schema = `{
      "serviceType": "string",
      "preferredTime": "string",
      "location": "string",
      "urgency": "emergency | today | this_week | flexible",
      "language": "string",
      "customerMood": "string",
      "budgetHint": "string or null",
      "specialNotes": "string"
    }`;

    try {
      const result = await this.llm.generateStructured(prompt, schema);

      // जाँच करो कि ज़रूरी fields हैं या नहीं
      if (!result.serviceType || !result.location) {
        console.warn(`⚠️ Intent incomplete - missing service or location`);
        await this.report(`Incomplete intent from customer: ${customerMessage}`, 'low');
      }

      console.log(`✅ Intent parsed: ${result.serviceType} at ${result.location}`);

      return result as ParsedIntent;
    } catch (error: any) {
      await this.handleError(error, `IntentParser.parse(${customerMessage})`);
      
      // Fallback - खाली intent return करो
      return {
        serviceType: 'unknown',
        preferredTime: 'flexible',
        location: 'unknown',
        urgency: 'flexible',
        language: 'unknown',
        customerMood: 'neutral',
        budgetHint: null,
        specialNotes: `Parsing failed: ${error.message}`
      };
    }
  }

  // -------------------------------------------------------------------------
  // जाँच करो कि intent पूरा है या नहीं
  // -------------------------------------------------------------------------
  validate(intent: ParsedIntent): boolean {
    const required: (keyof ParsedIntent)[] = ['serviceType', 'location'];
    return required.every((field) => {
      const val = intent[field];
      return val && val !== 'unknown' && val !== '';
    });
  }
}

export default IntentParserAgent;