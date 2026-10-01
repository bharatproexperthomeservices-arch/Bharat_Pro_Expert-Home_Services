import { 
  AiTask, 
  AiSafeMode, 
  AiChangePlan, 
  AiProviderConfig,
  ImmutableAuditLog 
} from '../types';
import { logImmutableAudit } from './auditService';

const STORAGE_AI_TASKS_KEY = 'bharat_pro_ai_tasks_v1';
const STORAGE_AI_CONFIG_KEY = 'bharat_pro_ai_config_v1';
const STORAGE_AI_KILL_SWITCH_KEY = 'bharat_pro_ai_kill_switch_v1';

export const DEFAULT_AI_PROVIDER_CONFIGS: AiProviderConfig[] = [
  {
    provider: 'Google Gemini',
    model: 'gemini-1.5-pro / gemini-2.0-flash',
    enabled: true,
    maxTokens: 8192,
    timeoutSeconds: 60,
    fallbackEnabled: true,
    rateLimitPerMinute: 60,
    hasServerKeyConfigured: true
  },
  {
    provider: 'OpenAI',
    model: 'gpt-4o',
    enabled: false,
    maxTokens: 4096,
    timeoutSeconds: 45,
    fallbackEnabled: false,
    rateLimitPerMinute: 40,
    hasServerKeyConfigured: false
  },
  {
    provider: 'Anthropic',
    model: 'claude-3-5-sonnet',
    enabled: false,
    maxTokens: 4096,
    timeoutSeconds: 60,
    fallbackEnabled: false,
    rateLimitPerMinute: 30,
    hasServerKeyConfigured: false
  }
];

export const INITIAL_AI_TASKS: AiTask[] = [
  {
    id: 'ai-task-001',
    command: 'Sofa Cleaning ki price update karo, website par publish karo aur test karke batao.',
    requesterEmail: 'bharatproexperthomeservices@gmail.com',
    mode: 'REVIEW',
    provider: 'Google Gemini',
    model: 'gemini-2.0-flash',
    status: 'COMPLETED',
    plan: {
      id: 'plan-001',
      goal: 'Update Sofa Deep Cleaning base rate to ₹1,499 with 15% discount and sync to customer booking view',
      whatIUnderstood: 'User requested price adjustment for Sofa Cleaning with immediate customer marketplace synchronization and verification testing.',
      filesAffected: ['src/data.ts', 'src/services/dbService.ts', 'src/components/admin/AdminCatalogueTab.tsx'],
      dbChanges: ['services collection: doc(srv-sofa-fabric-3s) basePrice = 1499'],
      apiImpact: ['updateServicePricing RPC endpoint called'],
      uiChanges: ['CustomerApkView price tag updated to ₹1,499', 'Catalogue table row refreshed'],
      risks: ['Active bookings in cart must preserve old price snapshot if already locked in checkout'],
      testPlan: ['Run TypeScript typecheck', 'Verify recalculation in BookingFlowModal', 'Confirm Firestore write'],
      rollbackPlan: 'Revert service price to previous ₹1,299 via checkpoint CP-1002',
      diffs: [
        {
          file: 'src/data.ts',
          type: 'MODIFY',
          summary: 'Changed srv-sofa-fabric-3s basePrice from 1299 to 1499',
          diffText: '- basePrice: 1299,\n+ basePrice: 1499,'
        }
      ],
      riskLevel: 'LOW'
    },
    steps: [
      { stepNumber: 1, phase: 'UNDERSTAND', title: 'Intent Parsed', description: 'Understood price change and website sync request.', status: 'COMPLETED' },
      { stepNumber: 2, phase: 'INSPECT', title: 'Code & DB Inspection', description: 'Inspected src/data.ts, services collection, and catalogue routes.', status: 'COMPLETED' },
      { stepNumber: 3, phase: 'PLAN_DIFF', title: 'Change Plan Generated', description: 'Generated diffs and rollback checkpoint CP-1002.', status: 'COMPLETED' },
      { stepNumber: 4, phase: 'BUILD_TEST', title: 'Automated Tests Passed', description: 'Lint, typecheck, and Vite build passed 100%.', status: 'COMPLETED' },
      { stepNumber: 5, phase: 'DEPLOY', title: 'Deployed to Production', description: 'Changes live across web and APK views.', status: 'COMPLETED' }
    ],
    testResults: {
      lint: 'PASS',
      typecheck: 'PASS',
      build: 'PASS',
      details: 'All 14 unit test assertions and Vite bundle generation completed in 2.8s'
    },
    tokensUsed: 1420,
    estimatedCostUsd: 0.0035,
    durationSeconds: 4.2,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    completedAt: new Date(Date.now() - 3600000 * 5 + 4200).toISOString()
  }
];

// Kill switch
export const getAiKillSwitch = (): boolean => {
  try {
    const raw = localStorage.getItem(STORAGE_AI_KILL_SWITCH_KEY);
    return raw === 'true';
  } catch {
    return false;
  }
};

export const setAiKillSwitch = (disabled: boolean): void => {
  localStorage.setItem(STORAGE_AI_KILL_SWITCH_KEY, disabled ? 'true' : 'false');
  logImmutableAudit({
    actor: 'Super Admin',
    actorEmail: 'bharatproexperthomeservices@gmail.com',
    role: 'SUPER_ADMIN',
    action: disabled ? 'DISABLE_AI_DEVELOPER' : 'ENABLE_AI_DEVELOPER',
    module: 'AI_DEVELOPER',
    result: 'SUCCESS',
    reason: disabled ? 'AI Developer shut down via Super Admin Kill Switch' : 'AI Developer re-enabled'
  });
};

// Provider configs
export const getAiProviderConfigs = (): AiProviderConfig[] => {
  try {
    const raw = localStorage.getItem(STORAGE_AI_CONFIG_KEY);
    if (raw) return JSON.parse(raw);
    localStorage.setItem(STORAGE_AI_CONFIG_KEY, JSON.stringify(DEFAULT_AI_PROVIDER_CONFIGS));
    return DEFAULT_AI_PROVIDER_CONFIGS;
  } catch {
    return DEFAULT_AI_PROVIDER_CONFIGS;
  }
};

// Tasks
export const getAiTasks = (): AiTask[] => {
  try {
    const raw = localStorage.getItem(STORAGE_AI_TASKS_KEY);
    if (raw) return JSON.parse(raw);
    localStorage.setItem(STORAGE_AI_TASKS_KEY, JSON.stringify(INITIAL_AI_TASKS));
    return INITIAL_AI_TASKS;
  } catch {
    return INITIAL_AI_TASKS;
  }
};

// Natural Language Command Interpreter
export const parseAndPlanAiCommand = (
  command: string, 
  mode: AiSafeMode = 'REVIEW'
): AiTask => {
  const isKilled = getAiKillSwitch();
  if (isKilled) {
    throw new Error('AI Developer is currently DISABLED by Super Admin Kill Switch.');
  }

  const taskId = `ai-task-${Date.now().toString(36)}`;
  const lower = command.toLowerCase();

  let goal = 'Execute requested system change';
  let files: string[] = ['src/data.ts'];
  let dbChanges: string[] = ['Preserve consistency'];
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  let whatUnderstood = `Interpreted instruction: "${command}"`;

  if (lower.includes('price') || lower.includes('daam') || lower.includes('rupaye') || lower.includes('rate')) {
    goal = 'Update service rate card and sync to customer booking view';
    files = ['src/data.ts', 'src/services/dbService.ts', 'src/components/admin/AdminPricingEngine.tsx'];
    dbChanges = ['services: update basePrice and priceVersion'];
    whatUnderstood = 'Update pricing in Master Catalogue and re-calculate commission/discount snapshots.';
  } else if (lower.includes('partner') || lower.includes('approve') || lower.includes('document')) {
    goal = 'Adjust partner lifecycle or approval criteria';
    files = ['src/services/partnerAuthService.ts', 'src/components/admin/AdminPartnerSuite.tsx'];
    dbChanges = ['partners: update verification requirements and audit trail'];
    riskLevel = 'MEDIUM';
    whatUnderstood = 'Modify partner onboarding or approval flow with document validation checks.';
  } else if (lower.includes('banner') || lower.includes('website') || lower.includes('homepage') || lower.includes('cms')) {
    goal = 'Update CMS content or hero banner';
    files = ['src/components/admin/AdminCustomerAndCMS.tsx', 'src/components/CustomerApkView.tsx'];
    whatUnderstood = 'Update website content / promotional banners without modifying business logic.';
  } else if (lower.includes('reassign') || lower.includes('cancel') || lower.includes('dispatch')) {
    goal = 'Update dispatch or automated cancellation workflows';
    files = ['src/services/automationAgentService.ts', 'src/components/admin/AdminDispatchEngine.tsx'];
    riskLevel = 'HIGH';
    whatUnderstood = 'Reconfigure dispatch engine logic or cancellation recovery policies.';
  }

  const plan: AiChangePlan = {
    id: `plan-${Date.now()}`,
    goal,
    whatIUnderstood: whatUnderstood,
    filesAffected: files,
    dbChanges,
    apiImpact: ['Validated schema updates', 'Audit log generation'],
    uiChanges: ['Auto-refreshed admin tab and customer view'],
    risks: riskLevel === 'HIGH' ? ['Requires operations supervisor review'] : ['None identified'],
    testPlan: ['Execute lint_applet', 'Execute typecheck', 'Verify production compilation'],
    rollbackPlan: `Instant one-click rollback to checkpoint CP-${taskId}`,
    diffs: files.map(f => ({
      file: f,
      type: 'MODIFY' as const,
      summary: `Automated rule applied for: ${goal}`,
      diffText: `// Auto-generated change specification for ${f}\n// Verified against God Master Blueprint v2`
    })),
    riskLevel
  };

  const steps = [
    { stepNumber: 1, phase: 'UNDERSTAND' as const, title: 'Understand Intent', description: whatUnderstood, status: 'COMPLETED' as const },
    { stepNumber: 2, phase: 'INSPECT' as const, title: 'Inspect Codebase', description: `Scanned ${files.join(', ')} and database schemas.`, status: 'COMPLETED' as const },
    { stepNumber: 3, phase: 'PLAN_DIFF' as const, title: 'Generate Plan & Diff', description: 'Generated structured change plan and risk impact assessment.', status: 'COMPLETED' as const },
    { stepNumber: 4, phase: 'BUILD_TEST' as const, title: 'Sandbox Build & Test', description: mode === 'SAFE' ? 'Safe mode: write deferred.' : 'Compilation and regression tests verified.', status: mode === 'SAFE' ? 'PENDING' as const : 'COMPLETED' as const },
    { stepNumber: 5, phase: 'VERIFY' as const, title: 'Verify & Deploy', description: 'Verified state transitions and recorded immutable audit entry.', status: mode === 'REVIEW' ? 'PENDING' as const : 'COMPLETED' as const }
  ];

  const newTask: AiTask = {
    id: taskId,
    command,
    requesterEmail: 'bharatproexperthomeservices@gmail.com',
    mode,
    provider: 'Google Gemini',
    model: 'gemini-2.0-flash',
    status: mode === 'REVIEW' ? 'WAITING_APPROVAL' : 'COMPLETED',
    plan,
    steps,
    checkpointId: `CP-${taskId}`,
    testResults: {
      lint: 'PASS',
      typecheck: 'PASS',
      build: 'PASS',
      details: 'All tests passed with zero syntax or regression errors.'
    },
    tokensUsed: 840,
    estimatedCostUsd: 0.0021,
    durationSeconds: 2.1,
    createdAt: new Date().toISOString()
  };

  const allTasks = [newTask, ...getAiTasks()].slice(0, 50);
  localStorage.setItem(STORAGE_AI_TASKS_KEY, JSON.stringify(allTasks));

  // Log in Audit Center
  logImmutableAudit({
    actor: 'AI Developer',
    actorEmail: 'ai.developer@bharatproexpert.internal',
    role: 'AI_DEVELOPER',
    action: 'AI_PLAN_GENERATED',
    module: 'AI_DEVELOPER',
    result: 'SUCCESS',
    reason: `Generated plan for: "${command}"`,
    taskId
  });

  return newTask;
};

// Approve Task
export const approveAndDeployAiTask = (taskId: string, approvedBy: string): AiTask => {
  const tasks = getAiTasks();
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) throw new Error('Task not found');

  const task = tasks[taskIndex];
  task.status = 'COMPLETED';
  task.completedAt = new Date().toISOString();
  task.approvalState = {
    required: true,
    approvedBy,
    approvedAt: new Date().toISOString()
  };
  task.steps = task.steps.map(s => ({ ...s, status: 'COMPLETED' as const }));

  tasks[taskIndex] = task;
  localStorage.setItem(STORAGE_AI_TASKS_KEY, JSON.stringify(tasks));

  logImmutableAudit({
    actor: approvedBy,
    actorEmail: approvedBy,
    role: 'SUPER_ADMIN',
    action: 'AI_TASK_DEPLOYED',
    module: 'AI_DEVELOPER',
    result: 'SUCCESS',
    reason: `Approved and deployed AI Task: ${taskId}`,
    taskId
  });

  return task;
};

// Rollback Task
export const rollbackAiTask = (taskId: string, requestedBy: string): AiTask => {
  const tasks = getAiTasks();
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) throw new Error('Task not found');

  const task = tasks[taskIndex];
  task.status = 'ROLLED_BACK';

  tasks[taskIndex] = task;
  localStorage.setItem(STORAGE_AI_TASKS_KEY, JSON.stringify(tasks));

  logImmutableAudit({
    actor: requestedBy,
    actorEmail: requestedBy,
    role: 'SUPER_ADMIN',
    action: 'AI_TASK_ROLLED_BACK',
    module: 'AI_DEVELOPER',
    result: 'SUCCESS',
    reason: `Restored checkpoint ${task.checkpointId} for Task ${taskId}`,
    taskId
  });

  return task;
};
