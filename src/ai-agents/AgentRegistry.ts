// ============================================================================
// AgentRegistry: सारे 15 AI Agents का Central Manager
// ============================================================================

import { BaseAgent, AgentInfo } from './BaseAgent';

export class AgentRegistry {
  private agents: BaseAgent[] = [];
  private agentMap: Map<number, BaseAgent> = new Map();

  constructor() {
    console.log('📋 AgentRegistry initialized');
  }

  register(agent: BaseAgent): void {
    this.agents.push(agent);
    this.agentMap.set(agent.id, agent);
    console.log(`✅ Registered: Agent ${agent.id} - ${agent.name}`);
  }

  initializeAll(): void {
    console.log('🚀 Initializing all AI Agents...');
    console.log(`✅ Total ${this.agents.length} agents initialized`);
  }

  get(agentId: number): BaseAgent | undefined {
    return this.agentMap.get(agentId);
  }

  getByName(name: string): BaseAgent | undefined {
    return this.agents.find(
      (agent) => agent.name.toLowerCase() === name.toLowerCase()
    );
  }

  getAll(): BaseAgent[] {
    return this.agents;
  }

  getAllStatus(): AgentInfo[] {
    return this.agents.map((agent) => agent.getInfo());
  }

  checkAllHeartbeats(): void {
    this.agents.forEach((agent) => {
      const hb = agent.heartbeat();
      const diffSeconds = (Date.now() - hb.lastHeartbeat.getTime()) / 1000;

      if (diffSeconds > 600) {
        console.warn(`⚠️ Agent ${agent.id} (${agent.name}) - No heartbeat for ${Math.floor(diffSeconds / 60)} minutes`);
        agent.status = 'error';
      } else {
        console.log(`💚 Agent ${agent.id} (${agent.name}) - Healthy`);
      }
    });
  }

  async handleGlobalError(error: Error, context: string = ''): Promise<void> {
    console.error(`🚨 GLOBAL ERROR: ${error.message} | Context: ${context}`);

    for (const agent of this.agents) {
      try {
        await agent.handleError(error, context);
      } catch (e) {
        console.error(`❌ Agent ${agent.id} failed to handle global error`);
      }
    }
  }

  clear(): void {
    this.agents = [];
    this.agentMap.clear();
    console.log('🗑️ AgentRegistry cleared');
  }
}

export default AgentRegistry;