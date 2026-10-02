// ============================================================================
// FreeLLMClient: AI का "दिमाग" - यह फाइल AI से बात करने के लिए बनाई गई है
// ============================================================================
//
// यह क्लाइंट FreeLLMAPI (open-source) का उपयोग करता है, जो 34+ AI प्रोवाइडर्स
// के 635+ फ्री मॉडल्स को एक ही /v1 एंडपॉइंट पर लाता है।
// GitHub: https://github.com/tashfeenahmed/freellmapi
//
// बेस URL: http://localhost:3001/v1 (या आपका सेल्फ-होस्टेड URL)
// यूनिफाइड API Key: डैशबोर्ड के Keys पेज से मिलती है
//
// उदाहरण: base_url="http://localhost:3001/v1", api_key="freellmapi-your-unified-key"
// ============================================================================

// ---------------------------------------------------------------------------
// 1. टाइप डेफिनिशन (TypeScript के लिए)
// ---------------------------------------------------------------------------

/** चैट मैसेज का फॉर्मेट (OpenAI-compatible) */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** FreeLLMAPI चैट कम्पलीशन रिक्वेस्ट बॉडी */
export interface ChatCompletionRequest {
  model: string;           // "auto", "auto:smart", "auto:fast", या कोई मॉडल ID
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stream?: boolean;
  stop?: string | string[];
}

/** FreeLLMAPI चैट कम्पलीशन रिस्पॉन्स */
export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/** LLM कॉल के लिए ऑप्शंस */
export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;          // डिफ़ॉल्ट: "auto"
  systemPrompt?: string;   // AI को उसकी भूमिका बताने के लिए
  jsonMode?: boolean;      // अगर true, तो AI को JSON में जवाब देना है
  retries?: number;        // फेल होने पर कितनी बार रिट्राई करें (डिफ़ॉल्ट: 2)
}

/** Structured output के लिए टाइप */
export interface StructuredOutput {
  [key: string]: any;
}

// ---------------------------------------------------------------------------
// 2. डिफ़ॉल्ट कॉन्फ़िगरेशन
// ---------------------------------------------------------------------------

const DEFAULT_BASE_URL = 'http://localhost:3001/v1';
const DEFAULT_MODEL = 'auto';
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 2048;
const DEFAULT_RETRIES = 2;

// सेफ्टी प्रॉम्प्ट: AI को हमेशा प्रोफेशनल रहना है और डेटा का गलत इस्तेमाल नहीं करना है
const SAFETY_SYSTEM_PROMPT = `
You are an AI assistant for Bharat Pro Expert Home Services.
STRICT RULES:
1. Always behave professionally and politely.
2. NEVER misuse any customer, partner, or company data.
3. NEVER share personal information with unauthorized parties.
4. Always follow Indian laws (TRAI, DPDP Act 2023) for communications.
5. If unsure, ask for clarification instead of guessing.
6. Keep responses concise and helpful.
7. Do not generate harmful, discriminatory, or illegal content.
`;

// ---------------------------------------------------------------------------
// 3. मुख्य क्लास: FreeLLMClient
// ---------------------------------------------------------------------------

export class FreeLLMClient {
  private baseUrl: string;
  private apiKey: string;
  private defaultModel: string;

  constructor(config?: {
    baseUrl?: string;
    apiKey?: string;
    defaultModel?: string;
  }) {
    // Vite environment variable से URL और Key उठाएंगे
    this.baseUrl =
      config?.baseUrl ||
      (import.meta as any).env?.VITE_FREELLMAPI_URL ||
      DEFAULT_BASE_URL;

    this.apiKey =
      config?.apiKey ||
      (import.meta as any).env?.VITE_FREELLMAPI_KEY ||
      'freellmapi-your-unified-key'; // बिना key के भी localhost पर काम करेगा

    this.defaultModel = config?.defaultModel || DEFAULT_MODEL;
  }

  // -------------------------------------------------------------------------
  // 3.1. हेल्थ चेक: क्या API ज़िंदा है?
  // -------------------------------------------------------------------------

  /**
   * यह चेक करता है कि FreeLLMAPI सर्वर चल रहा है या नहीं।
   * @returns true अगर सर्वर ज़िंदा है
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: this.buildHeaders(),
      });
      return response.ok;
    } catch (error) {
      console.error('❌ FreeLLMAPI Health Check Failed:', error);
      return false;
    }
  }

  // -------------------------------------------------------------------------
  // 3.2. उपलब्ध मॉडल्स की लिस्ट
  // -------------------------------------------------------------------------

  /**
   * FreeLLMAPI से उपलब्ध सभी मॉडल्स की लिस्ट लाता है।
   * @returns मॉडल्स का array
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: this.buildHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data?.map((m: any) => m.id) || [];
    } catch (error) {
      console.error('❌ List Models Error:', error);
      return [];
    }
  }

  // -------------------------------------------------------------------------
  // 3.3. मुख्य जनरेट फंक्शन (टेक्स्ट के लिए)
  // -------------------------------------------------------------------------

  /**
   * AI से साधारण टेक्स्ट जनरेट करवाता है।
   *
   * @param prompt - जो बात AI से पूछनी है
   * @param options - वैकल्पिक सेटिंग्स (temperature, model, etc.)
   * @returns AI का जवाब (string)
   *
   * उदाहरण:
   *   const client = new FreeLLMClient();
   *   const answer = await client.generate("AC repair की कीमत क्या है?");
   */
  async generate(prompt: string, options?: LLMOptions): Promise<string> {
    const {
      temperature = DEFAULT_TEMPERATURE,
      maxTokens = DEFAULT_MAX_TOKENS,
      model = this.defaultModel,
      systemPrompt = '',
      retries = DEFAULT_RETRIES,
    } = options || {};

    // सिस्टम प्रॉम्प्ट तैयार करें (सेफ्टी + यूज़र का सिस्टम प्रॉम्प्ट)
    const finalSystemPrompt = `${SAFETY_SYSTEM_PROMPT}\n\n${systemPrompt}`.trim();

    // मैसेजेस बनाएं
    const messages: ChatMessage[] = [
      { role: 'system', content: finalSystemPrompt },
      { role: 'user', content: prompt },
    ];

    // रिक्वेस्ट बॉडी
    const requestBody: ChatCompletionRequest = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    };

    // रिट्राई लॉजिक के साथ API कॉल करें
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: this.buildHeaders(),
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `FreeLLMAPI Error ${response.status}: ${errorText}`
          );
        }

        const data: ChatCompletionResponse = await response.json();

        // रूटिंग हेडर लॉग करें (कौन सा मॉडल सर्व किया)
        const routedVia = response.headers.get('x-routed-via');
        if (routedVia) {
          console.log(`🤖 AI Routed via: ${routedVia}`);
        }

        // जवाब निकालें
        const content = data.choices?.[0]?.message?.content;
        if (!content) {
          throw new Error('AI ने खाली जवाब दिया');
        }

        return content.trim();
      } catch (error: any) {
        lastError = error;
        console.warn(
          `⚠️ LLM Attempt ${attempt + 1}/${retries + 1} failed: ${error.message}`
        );

        // आखिरी attempt नहीं है तो थोड़ा इंतज़ार करें (exponential backoff)
        if (attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s...
          await this.sleep(delay);
        }
      }
    }

    // सब attempts फेल हो गए
    console.error('❌ All LLM attempts failed:', lastError?.message);
    return `ERROR: AI से जवाब नहीं मिल पाया। कृपया FreeLLMAPI सर्वर चेक करें। (${lastError?.message || 'Unknown error'})`;
  }

  // -------------------------------------------------------------------------
  // 3.4. स्ट्रक्चर्ड JSON जनरेट फंक्शन
  // -------------------------------------------------------------------------

  /**
   * AI से strict JSON फॉर्मेट में जवाब मंगवाता है।
   * यह Agents के लिए बहुत ज़रूरी है ताकि डेटा parse किया जा सके।
   *
   * @param prompt - जो बात AI से पूछनी है
   * @param jsonSchema - JSON का expected फॉर्मेट (उदाहरण के लिए)
   * @param options - वैकल्पिक सेटिंग्स
   * @returns Parsed JSON object
   *
   * उदाहरण:
   *   const result = await client.generateStructured(
   *     "इस मैसेज से सर्विस टाइप और लोकेशन निकालो: 'मुझे कल AC ठीक करवाना है, Andheri में'",
   *     '{"service_type": "string", "location": "string"}'
   *   );
   */
  async generateStructured(
    prompt: string,
    jsonSchema: string,
    options?: LLMOptions
  ): Promise<StructuredOutput> {
    // JSON mode के लिए सिस्टम प्रॉम्प्ट
    const jsonSystemPrompt = `
You are a precise data extraction assistant for Bharat Pro Expert Home Services.
You MUST reply with ONLY a valid JSON object.
Do NOT include any markdown, code blocks, explanations, or extra text.
Do NOT wrap the JSON in \`\`\`.
The JSON must strictly follow this schema/example:
${jsonSchema}

If you cannot extract a field, use null for that field.
Always be accurate and never invent data.
`.trim();

    // JSON mode के साथ जनरेट करें
    const rawResponse = await this.generate(prompt, {
      ...options,
      systemPrompt: jsonSystemPrompt,
      temperature: 0.1, // कम temperature = ज़्यादा सटीक JSON
    });

    // JSON को साफ़ करें (कभी-कभी AI backticks भेज देता है)
    return this.parseJSON(rawResponse);
  }

  // -------------------------------------------------------------------------
  // 3.5. स्ट्रीमिंग जनरेट (रियल-टाइम टेक्स्ट के लिए)
  // -------------------------------------------------------------------------

  /**
   * AI से स्ट्रीमिंग जवाब लेता है (शब्द-दर-शब्द आता है)।
   * यह चैट इंटरफ़ेस के लिए उपयोगी है।
   *
   * @param prompt - जो बात AI से पूछनी है
   * @param onChunk - हर chunk आने पर callback
   * @param options - वैकल्पिक सेटिंग्स
   */
  async generateStream(
    prompt: string,
    onChunk: (text: string) => void,
    options?: LLMOptions
  ): Promise<void> {
    const {
      temperature = DEFAULT_TEMPERATURE,
      maxTokens = DEFAULT_MAX_TOKENS,
      model = this.defaultModel,
      systemPrompt = '',
    } = options || {};

    const finalSystemPrompt = `${SAFETY_SYSTEM_PROMPT}\n\n${systemPrompt}`.trim();

    const requestBody: ChatCompletionRequest = {
      model,
      messages: [
        { role: 'system', content: finalSystemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature,
      max_tokens: maxTokens,
      stream: true,
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const data = trimmed.slice(6); // "data: " हटाएं
          if (data === '[DONE]') return;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) onChunk(content);
          } catch {
            // अधूरा JSON, अगले chunk में पूरा होगा
          }
        }
      }
    } catch (error: any) {
      console.error('❌ Streaming Error:', error);
      onChunk(`\n[Error: ${error.message}]`);
    }
  }

  // -------------------------------------------------------------------------
  // 3.6. हेल्पर मेथड्स
  // -------------------------------------------------------------------------

  /** HTTP headers बनाएं */
  private buildHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  /** JSON को safely parse करें */
  private parseJSON(raw: string): StructuredOutput {
    try {
      // Markdown backticks हटाएं
      let cleaned = raw
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      // कभी-कभी AI "json" prefix लगा देता है
      if (cleaned.toLowerCase().startsWith('json')) {
        cleaned = cleaned.slice(4).trim();
      }

      return JSON.parse(cleaned);
    } catch (error) {
      console.error('❌ JSON Parse Error:', error);
      console.error('Raw response:', raw);
      return {
        error: 'Failed to parse JSON',
        raw_response: raw,
      };
    }
  }

  /** Sleep utility (retry backoff के लिए) */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ---------------------------------------------------------------------------
// 4. सिंगलटन इंस्टेंस (पूरे ऐप में एक ही क्लाइंट रहे)
// ---------------------------------------------------------------------------

let _defaultClient: FreeLLMClient | null = null;

/**
 * डिफ़ॉल्ट LLM क्लाइंट लौटाता है (सिंगलटन)।
 * बार-बार new FreeLLMClient() करने की ज़रूरत नहीं।
 */
export function getLLMClient(): FreeLLMClient {
  if (!_defaultClient) {
    _defaultClient = new FreeLLMClient();
  }
  return _defaultClient;
}

// ---------------------------------------------------------------------------
// 5. उपयोग के उदाहरण (Comments में)
// ---------------------------------------------------------------------------

/*

उदाहरण 1: साधारण टेक्स्ट जनरेट करना
─────────────────────────────────────
import { getLLMClient } from './llmClient';

const client = getLLMClient();
const answer = await client.generate(
  "AC repair की कीमत क्या है?",
  { systemPrompt: "तुम Bharat Pro Expert के customer support assistant हो।" }
);
console.log(answer);

उदाहरण 2: Structured JSON निकालना
────────────────────────────────────
const intent = await client.generateStructured(
  "इस मैसेज से डेटा निकालो: 'मुझे कल सुबह 10 बजे AC repair करवाना है, Andheri West में'",
  JSON.stringify({
    service_type: "string (AC Repair / Plumbing / Electrical / etc)",
    preferred_time: "string",
    location: "string",
    urgency: "emergency | today | this_week | flexible",
    language: "hindi | english | hinglish"
  })
);
console.log(intent.service_type); // "AC Repair"

उदाहरण 3: स्ट्रीमिंग (चैट UI के लिए)
───────────────────────────────────────
await client.generateStream(
  "Bharat Pro Expert के बारे में बताओ",
  (chunk) => {
    // हर chunk को UI में जोड़ें
    process.stdout.write(chunk);
  }
);

उदाहरण 4: Health Check
────────────────────────
const isAlive = await client.healthCheck();
if (!isAlive) {
  console.error("FreeLLMAPI सर्वर बंद है! Docker से start करें।");
}

*/

export default FreeLLMClient;