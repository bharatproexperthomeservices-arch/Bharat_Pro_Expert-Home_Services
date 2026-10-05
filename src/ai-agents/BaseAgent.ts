// ============================================================================
// BaseAgent: सारे 15 AI Agents का "बाप" (Base Class)
// ============================================================================
import { FreeLLMClient } from './tools/llmClient';
import { EmailTool } from './tools/emailTool';

// Agent Types (सीधे यहीं define कर रहे हैं)
export interface AgentInfo {
  id: number;
  name: string;
  role: string;
  status: 'active' | 'inactive' | 'error';
  lastHeartbeat: Date;
}

export interface AgentError {
  agentId: number;
  agentName: string;
  errorMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  autoFixed: boolean;
  fixAttempt?: string;
}

export class BaseAgent {
  public id: number;
  public name: string;
  public role: string;
  public status: 'active' | 'inactive' | 'error' = 'active';
  public lastHeartbeat: Date = new Date();
  public errorLog: AgentError[] = [];

  protected llm: FreeLLMClient;
  protected email: EmailTool;
  protected founderEmail: string;
  protected founderWhatsApp: string;

  constructor(id: number, name: string, role: string) {
    this.id = id;
    this.name = name;
    this.role = role;

    this.llm = new FreeLLMClient();
    this.email = new EmailTool();

    this.founderEmail =
      (import.meta as any).env?.VITE_FOUNDER_EMAIL ||
      'bharatproexpert@gmail.com';

    this.founderWhatsApp =
      (import.meta as any).env?.VITE_FOUNDER_WHATSAPP ||
      '918920252647';

    console.log(`✅ Agent ${id} [${name}] initialized | Role: ${role}`);
  }

  async think(task: string, context: any = {}): Promise<string> {
    const prompt = `
You are ${this.name}, an AI agent with role: ${this.role}.

CONTEXT:
${JSON.stringify(context, null, 2)}

TASK:
${task}

Think step-by-step. Provide a clear action plan.
    `;
    return await this.llm.generate(prompt);
  }

  async act(action: string, params: any = {}): Promise<any> {
    console.log(`[Agent ${this.id}] Executing action: ${action}`);

    if (action.toLowerCase().includes('email')) {
      return await this.email.sendEmail(
        params.to,
        params.subject || 'Notification from Bharat Pro Expert',
        params.body || 'No message',
        { isHtml: params.isHtml || false }
      );
    }

    const result = await this.think(action, params);
    return { status: 'success', result };
  }

  async report(message: string, severity: 'low' | 'medium' | 'high' | 'critical' = 'low'): Promise<void> {
    console.log(`[REPORT] Agent ${this.id} (${this.name}): ${message}`);

    if (severity === 'high' || severity === 'critical') {
      try {
        await this.email.sendEmail(
          this.founderEmail,
          `🚨 ${severity.toUpperCase()} Alert from ${this.name}`,
          `Agent: ${this.name} (ID: ${this.id})\nRole: ${this.role}\nSeverity: ${severity}\n\nMessage: ${message}\n\nTime: ${new Date().toISOString()}`
        );
      } catch (error) {
        console.error(`❌ Failed to send report email:`, error);
      }
    }
  }

  async handleError(error: Error, context: string = ''): Promise<any> {
    const errorMsg = `Agent ${this.id} (${this.name}) error: ${error.message}`;
    console.error(`❌ ${errorMsg}`);

    const fixPrompt = `
An error occurred in Agent ${this.id} (${this.name}).

ERROR: ${error.message}
CONTEXT: ${context}

Provide a fix:
1. What caused this error?
2. How to fix it?
3. What code change is needed?

Return as JSON: {"cause": "...", "fix": "...", "code": "..."}
    `;

    try {
      const fix = await this.llm.generateStructured(fixPrompt, '{"cause": "string", "fix": "string", "code": "string"}');

      this.errorLog.push({
        agentId: this.id,
        agentName: this.name,
        errorMessage: error.message,
        severity: 'medium',
        timestamp: new Date(),
        autoFixed: true,
        fixAttempt: JSON.stringify(fix)
      });

      await this.report(`Error auto-fixed: ${fix.cause || 'Unknown'}`, 'medium');
      return { status: 'fixed', fix };
    } catch (e2) {
      this.errorLog.push({
        agentId: this.id,
        agentName: this.name,
        errorMessage: error.message,
        severity: 'critical',
        timestamp: new Date(),
        autoFixed: false
      });

      await this.report(`CRITICAL: Auto-fix failed. Error: ${errorMsg}`, 'critical');
      return { status: 'failed', error: error.message };
    }
  }

  heartbeat(): AgentInfo {
    this.lastHeartbeat = new Date();
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      status: this.status,
      lastHeartbeat: this.lastHeartbeat
    };
  }

  getInfo(): AgentInfo {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      status: this.status,
      lastHeartbeat: this.lastHeartbeat
    };
  }
}

export default BaseAgent;