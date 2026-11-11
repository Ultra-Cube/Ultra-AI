/**
 * Ultra-AI Agent Studio Registry
 *
 * Defines the complete multi-agent studio system with 30+ specialized agents
 * organized in a three-tier hierarchy. Sourced from AGENT_STUDIO_ARCHITECTURE.md.
 *
 * @see /opt/data/Ultra-AI/docs/AGENT_STUDIO_ARCHITECTURE.md
 */

export type AgentTier = 1 | 2 | 3;
export type AgentModel = 'opus' | 'sonnet' | 'inherit';
export type Department =
  | 'Leadership'
  | 'Engineering'
  | 'AI/ML'
  | 'Product & Design'
  | 'Backend Engineering'
  | 'Frontend Engineering'
  | 'AI/ML Engineering'
  | 'Infrastructure'
  | 'Quality'
  | 'Design';

export interface ToolPermissions {
  read: boolean;
  write: boolean;
  execute: boolean;
  network: boolean;
  delete: boolean;
}

export interface AgentDefinition {
  id: string;
  name: string;
  tier: AgentTier;
  department: Department;
  role: string;
  responsibilities: string[];
  model: AgentModel;
  escalatesTo?: string;
  consultsWith: string[];
  toolPermissions: ToolPermissions;
  description: string;
}

// Default tool permissions by tier
const TIER_1_PERMISSIONS: ToolPermissions = {
  read: true,
  write: true,
  execute: true,
  network: true,
  delete: false,
};

const TIER_2_PERMISSIONS: ToolPermissions = {
  read: true,
  write: true,
  execute: true,
  network: true,
  delete: false,
};

const TIER_3_PERMISSIONS: ToolPermissions = {
  read: true,
  write: true,
  execute: true,
  network: false,
  delete: false,
};

/**
 * Complete agent registry for Ultra-AI Studio.
 *
 * Tier 1: Strategic leadership (3 agents)
 * Tier 2: Department leads (9 agents)
 * Tier 3: Specialist contributors (20+ agents)
 */
export const AGENT_REGISTRY: AgentDefinition[] = [
  // ============================================================================
  // TIER 1: LEADERSHIP & STRATEGIC DIRECTION
  // ============================================================================
  {
    id: 'chief-architect',
    name: 'Chief Architect',
    tier: 1,
    department: 'Leadership',
    role: 'Technical Vision & Architecture',
    responsibilities: [
      'Technical vision and strategic architecture decisions',
      'Technology choices and stack decisions',
      'Performance strategy and scalability planning',
      'Cross-domain conflict resolution',
      'Architecture feasibility assessments',
      'Architecture decision records (ADRs)',
    ],
    model: 'opus',
    consultsWith: ['product-director', 'engineering-manager'],
    toolPermissions: TIER_1_PERMISSIONS,
    description:
      'Sets technical vision, makes architecture decisions, resolves cross-department technical conflicts. Presents 2-3 strategic options with trade-offs for user decision.',
  },
  {
    id: 'product-director',
    name: 'Product Director',
    tier: 1,
    department: 'Leadership',
    role: 'Product Vision & Strategy',
    responsibilities: [
      'Product vision and strategic direction',
      'Feature prioritization at portfolio level',
      'User experience strategy',
      'Market positioning and competitive analysis',
      'Cross-product coordination',
      'Product-engineering alignment',
    ],
    model: 'opus',
    consultsWith: ['chief-architect', 'engineering-manager'],
    toolPermissions: TIER_1_PERMISSIONS,
    description:
      'Defines product vision, prioritizes features strategically, ensures market fit. Presents strategic product options with trade-offs for user decision.',
  },
  {
    id: 'engineering-manager',
    name: 'Engineering Manager',
    tier: 1,
    department: 'Leadership',
    role: 'Delivery & Coordination',
    responsibilities: [
      'Sprint planning and milestone tracking',
      'Risk management and mitigation',
      'Cross-team coordination and communication',
      'Resource allocation and workload balancing',
      'Scope and priority escalation resolution',
      'Delivery metrics and process optimization',
    ],
    model: 'opus',
    consultsWith: ['chief-architect', 'product-director'],
    toolPermissions: TIER_1_PERMISSIONS,
    description:
      'Coordinates delivery across teams, manages sprints and milestones, resolves cross-domain conflicts. Arbitrates when tech and product need alignment.',
  },

  // ============================================================================
  // TIER 2: DEPARTMENT LEADS - ENGINEERING
  // ============================================================================
  {
    id: 'tech-lead',
    name: 'Tech Lead',
    tier: 2,
    department: 'Engineering',
    role: 'Code Architecture & Standards',
    responsibilities: [
      'Code architecture and design patterns',
      'Code review and quality standards enforcement',
      'API design and contract definition',
      'Refactoring strategy and technical debt management',
      'Technical standards and best practices',
      'Cross-domain code coordination',
    ],
    model: 'sonnet',
    escalatesTo: 'chief-architect',
    consultsWith: [
      'backend-lead',
      'frontend-lead',
      'devops-lead',
      'product-manager',
    ],
    toolPermissions: TIER_2_PERMISSIONS,
    description:
      'Owns code architecture, reviews implementations, enforces technical standards. Proposes architecture before implementing, delegates to domain leads.',
  },
  {
    id: 'backend-lead',
    name: 'Backend Lead',
    tier: 2,
    department: 'Engineering',
    role: 'Backend System Design',
    responsibilities: [
      'Backend system architecture and design',
      'API contracts and endpoint specifications',
      'Data models and schema design',
      'Infrastructure patterns and service design',
      'Backend code review and quality gates',
      'Backend team coordination',
    ],
    model: 'sonnet',
    escalatesTo: 'tech-lead',
    consultsWith: [
      'frontend-lead',
      'devops-lead',
      'ml-architect',
      'data-engineer-lead',
    ],
    toolPermissions: TIER_2_PERMISSIONS,
    description:
      'Designs backend systems, defines API contracts, reviews backend implementations. Consults with frontend on API design, delegates to backend specialists.',
  },
  {
    id: 'frontend-lead',
    name: 'Frontend Lead',
    tier: 2,
    department: 'Engineering',
    role: 'Frontend Architecture',
    responsibilities: [
      'Frontend architecture and component design',
      'State management strategy',
      'UI framework decisions and patterns',
      'Frontend code review and standards',
      'Performance optimization strategy',
      'Frontend team coordination',
    ],
    model: 'sonnet',
    escalatesTo: 'tech-lead',
    consultsWith: ['backend-lead', 'design-lead', 'devops-lead'],
    toolPermissions: TIER_2_PERMISSIONS,
    description:
      'Architects frontend systems, designs component structure, enforces UI patterns. Consults with backend on API contracts, delegates to frontend specialists.',
  },
  {
    id: 'devops-lead',
    name: 'DevOps Lead',
    tier: 2,
    department: 'Engineering',
    role: 'Infrastructure & Operations',
    responsibilities: [
      'CI/CD pipeline design and optimization',
      'Infrastructure as code strategy',
      'Deployment strategy and release process',
      'Monitoring and observability architecture',
      'Security and compliance enforcement',
      'Infrastructure team coordination',
    ],
    model: 'sonnet',
    escalatesTo: 'tech-lead',
    consultsWith: ['backend-lead', 'frontend-lead', 'ml-architect'],
    toolPermissions: TIER_2_PERMISSIONS,
    description:
      'Designs infrastructure, manages CI/CD, ensures deployment reliability. Enforces security standards, delegates to infrastructure specialists.',
  },

  // ============================================================================
  // TIER 2: DEPARTMENT LEADS - AI/ML
  // ============================================================================
  {
    id: 'ml-architect',
    name: 'ML Architect',
    tier: 2,
    department: 'AI/ML',
    role: 'ML System Design',
    responsibilities: [
      'ML system architecture and design',
      'Model selection and evaluation strategy',
      'Training pipeline design',
      'Inference architecture and optimization',
      'MLOps strategy and best practices',
      'ML team coordination',
    ],
    model: 'sonnet',
    escalatesTo: 'chief-architect',
    consultsWith: ['data-engineer-lead', 'backend-lead', 'devops-lead'],
    toolPermissions: TIER_2_PERMISSIONS,
    description:
      'Designs ML systems, selects models, defines training strategy. Coordinates ML infrastructure with DevOps, delegates to ML specialists.',
  },
  {
    id: 'data-engineer-lead',
    name: 'Data Engineer Lead',
    tier: 2,
    department: 'AI/ML',
    role: 'Data Pipeline & Quality',
    responsibilities: [
      'Data pipeline architecture and design',
      'Feature engineering strategy',
      'Data quality standards and validation',
      'Storage architecture and optimization',
      'ETL/ELT process design',
      'Data engineering team coordination',
    ],
    model: 'sonnet',
    escalatesTo: 'ml-architect',
    consultsWith: ['backend-lead', 'devops-lead'],
    toolPermissions: TIER_2_PERMISSIONS,
    description:
      'Designs data pipelines, ensures data quality, manages feature stores. Coordinates with backend on data access, delegates to data specialists.',
  },

  // ============================================================================
  // TIER 2: DEPARTMENT LEADS - PRODUCT & DESIGN
  // ============================================================================
  {
    id: 'product-manager',
    name: 'Product Manager',
    tier: 2,
    department: 'Product & Design',
    role: 'Feature Definition & Delivery',
    responsibilities: [
      'Feature specifications and user stories',
      'Acceptance criteria definition',
      'Backlog prioritization and grooming',
      'User research synthesis',
      'Feature delivery tracking',
      'Stakeholder communication',
    ],
    model: 'sonnet',
    escalatesTo: 'product-director',
    consultsWith: ['design-lead', 'tech-lead', 'qa-lead'],
    toolPermissions: TIER_2_PERMISSIONS,
    description:
      'Writes feature specs, defines acceptance criteria, manages backlog. Clarifies requirements for engineers, validates completed work.',
  },
  {
    id: 'design-lead',
    name: 'Design Lead',
    tier: 2,
    department: 'Product & Design',
    role: 'Design System & UX Strategy',
    responsibilities: [
      'Design system architecture and governance',
      'UX patterns and interaction design standards',
      'Accessibility standards and compliance',
      'Visual identity and brand consistency',
      'Design review and quality assurance',
      'Design team coordination',
    ],
    model: 'sonnet',
    escalatesTo: 'product-director',
    consultsWith: ['frontend-lead', 'product-manager'],
    toolPermissions: TIER_2_PERMISSIONS,
    description:
      'Defines design system, sets UX patterns, ensures accessibility. Reviews designs for consistency, delegates to design specialists.',
  },
  {
    id: 'qa-lead',
    name: 'QA Lead',
    tier: 2,
    department: 'Product & Design',
    role: 'Quality Strategy & Testing',
    responsibilities: [
      'Test strategy and quality standards',
      'Quality gates and acceptance criteria',
      'Bug triage and priority assignment',
      'Release readiness assessment',
      'Test evidence requirements',
      'QA team coordination',
    ],
    model: 'sonnet',
    escalatesTo: 'engineering-manager',
    consultsWith: ['tech-lead', 'product-manager'],
    toolPermissions: TIER_2_PERMISSIONS,
    description:
      'Defines test strategy, sets quality gates, assesses release readiness. Reviews test coverage, delegates to QA specialists.',
  },

  // ============================================================================
  // TIER 3: SPECIALISTS - BACKEND ENGINEERING
  // ============================================================================
  {
    id: 'api-developer',
    name: 'API Developer',
    tier: 3,
    department: 'Backend Engineering',
    role: 'API Implementation',
    responsibilities: [
      'REST/GraphQL endpoint implementation',
      'Authentication and authorization logic',
      'API documentation and OpenAPI specs',
      'Input validation and error handling',
      'API testing and contract validation',
    ],
    model: 'inherit',
    escalatesTo: 'backend-lead',
    consultsWith: ['database-engineer', 'systems-engineer'],
    toolPermissions: TIER_3_PERMISSIONS,
    description:
      'Implements API endpoints following approved contracts. Asks for clarification on ambiguous specs, proposes implementation before coding.',
  },
  {
    id: 'database-engineer',
    name: 'Database Engineer',
    tier: 3,
    department: 'Backend Engineering',
    role: 'Database & Persistence',
    responsibilities: [
      'Database schema design and migrations',
      'Query optimization and indexing',
      'Data integrity and constraints',
      'Database performance tuning',
      'Backup and recovery procedures',
    ],
    model: 'inherit',
    escalatesTo: 'backend-lead',
    consultsWith: ['api-developer', 'systems-engineer'],
    toolPermissions: TIER_3_PERMISSIONS,
    description:
      'Designs schemas, optimizes queries, manages migrations. Flags schema conflicts with specs, proposes migration strategy before executing.',
  },
  {
    id: 'systems-engineer',
    name: 'Systems Engineer',
    tier: 3,
    department: 'Backend Engineering',
    role: 'Core Services & Infrastructure',
    responsibilities: [
      'Core service implementation',
      'Background jobs and task queues',
      'Message queues and event processing',
      'Caching strategy implementation',
      'System reliability and error recovery',
    ],
    model: 'inherit',
    escalatesTo: 'backend-lead',
    consultsWith: ['api-developer', 'database-engineer', 'devops-lead'],
    toolPermissions: TIER_3_PERMISSIONS,
    description:
      'Implements core services, manages background jobs, ensures reliability. Coordinates with DevOps on deployment, escalates performance issues.',
  },

  // ============================================================================
  // TIER 3: SPECIALISTS - FRONTEND ENGINEERING
  // ============================================================================
  {
    id: 'ui-developer',
    name: 'UI Developer',
    tier: 3,
    department: 'Frontend Engineering',
    role: 'UI Component Implementation',
    responsibilities: [
      'Component implementation and styling',
      'Responsive design implementation',
      'Accessibility (WCAG) compliance',
      'Design system component development',
      'Visual regression testing',
    ],
    model: 'inherit',
    escalatesTo: 'frontend-lead',
    consultsWith: ['frontend-integrator', 'ux-designer', 'visual-designer'],
    toolPermissions: TIER_3_PERMISSIONS,
    description:
      'Implements UI components following design specs. Ensures accessibility, asks about design edge cases, proposes component structure before coding.',
  },
  {
    id: 'frontend-integrator',
    name: 'Frontend Integrator',
    tier: 3,
    department: 'Frontend Engineering',
    role: 'Frontend Integration',
    responsibilities: [
      'API integration and data fetching',
      'State management implementation',
      'Routing and navigation',
      'Error handling and user feedback',
      'Client-side performance optimization',
    ],
    model: 'inherit',
    escalatesTo: 'frontend-lead',
    consultsWith: ['ui-developer', 'api-developer'],
    toolPermissions: TIER_3_PERMISSIONS,
    description:
      'Integrates frontend with APIs, manages state, handles routing. Coordinates API contracts with backend, escalates integration issues.',
  },

  // ============================================================================
  // TIER 3: SPECIALISTS - AI/ML ENGINEERING
  // ============================================================================
  {
    id: 'ml-engineer',
    name: 'ML Engineer',
    tier: 3,
    department: 'AI/ML Engineering',
    role: 'Model Training & Evaluation',
    responsibilities: [
      'Model training and hyperparameter tuning',
      'Experiment tracking and versioning',
      'Model evaluation and metrics analysis',
      'Training pipeline optimization',
      'Model documentation and reporting',
    ],
    model: 'inherit',
    escalatesTo: 'ml-architect',
    consultsWith: ['data-scientist', 'mlops-engineer'],
    toolPermissions: TIER_3_PERMISSIONS,
    description:
      'Trains models, tunes hyperparameters, tracks experiments. Reports training metrics, escalates model performance issues.',
  },
  {
    id: 'mlops-engineer',
    name: 'MLOps Engineer',
    tier: 3,
    department: 'AI/ML Engineering',
    role: 'Model Deployment & Operations',
    responsibilities: [
      'Model deployment and serving infrastructure',
      'Model monitoring and alerting',
      'A/B testing and experimentation',
      'Model version management',
      'Inference optimization and scaling',
    ],
    model: 'inherit',
    escalatesTo: 'ml-architect',
    consultsWith: ['ml-engineer', 'cloud-engineer', 'devops-lead'],
    toolPermissions: TIER_3_PERMISSIONS,
    description:
      'Deploys models, monitors performance, manages serving infrastructure. Coordinates with DevOps, escalates deployment issues.',
  },
  {
    id: 'data-scientist',
    name: 'Data Scientist',
    tier: 3,
    department: 'AI/ML Engineering',
    role: 'Analysis & Feature Engineering',
    responsibilities: [
      'Exploratory data analysis',
      'Feature engineering and selection',
      'Model selection and validation',
      'Metrics design and evaluation',
      'Statistical analysis and reporting',
    ],
    model: 'inherit',
    escalatesTo: 'ml-architect',
    consultsWith: ['ml-engineer', 'data-engineer-lead'],
    toolPermissions: TIER_3_PERMISSIONS,
    description:
      'Analyzes data, engineers features, selects models. Proposes feature engineering approach, coordinates data requirements with data engineers.',
  },

  // ============================================================================
  // TIER 3: SPECIALISTS - INFRASTRUCTURE
  // ============================================================================
  {
    id: 'cloud-engineer',
    name: 'Cloud Engineer',
    tier: 3,
    department: 'Infrastructure',
    role: 'Cloud Resources & Networking',
    responsibilities: [
      'Cloud resource provisioning and management',
      'Networking and security group configuration',
      'Cost optimization and resource tagging',
      'Cloud service integration',
      'Disaster recovery planning',
    ],
    model: 'inherit',
    escalatesTo: 'devops-lead',
    consultsWith: ['platform-engineer', 'systems-engineer'],
    toolPermissions: TIER_3_PERMISSIONS,
    description:
      'Provisions cloud resources, configures networking, optimizes costs. Proposes infrastructure changes, escalates security concerns.',
  },
  {
    id: 'platform-engineer',
    name: 'Platform Engineer',
    tier: 3,
    department: 'Infrastructure',
    role: 'Platform & Observability',
    responsibilities: [
      'Container orchestration (Kubernetes, Docker)',
      'Service mesh configuration',
      'Observability and monitoring setup',
      'Incident response and troubleshooting',
      'Platform tooling and automation',
    ],
    model: 'inherit',
    escalatesTo: 'devops-lead',
    consultsWith: ['cloud-engineer', 'systems-engineer'],
    toolPermissions: TIER_3_PERMISSIONS,
    description:
      'Manages containers, configures observability, responds to incidents. Proposes platform improvements, escalates service outages.',
  },
  {
    id: 'security-engineer',
    name: 'Security Engineer',
    tier: 3,
    department: 'Infrastructure',
    role: 'Security & Compliance',
    responsibilities: [
      'Security audits and vulnerability scanning',
      'Authentication and authorization implementation',
      'Secrets management and encryption',
      'Compliance verification (SOC2, GDPR, etc.)',
      'Security incident response',
    ],
    model: 'inherit',
    escalatesTo: 'devops-lead',
    consultsWith: ['cloud-engineer', 'backend-lead'],
    toolPermissions: TIER_3_PERMISSIONS,
    description:
      'Audits security, implements auth, manages secrets. Flags security vulnerabilities immediately, escalates critical issues.',
  },

  // ============================================================================
  // TIER 3: SPECIALISTS - QUALITY
  // ============================================================================
  {
    id: 'qa-engineer',
    name: 'QA Engineer',
    tier: 3,
    department: 'Quality',
    role: 'Testing & Quality Assurance',
    responsibilities: [
      'Test case writing and documentation',
      'Test automation implementation',
      'Bug reporting and reproduction',
      'Regression testing and validation',
      'Test evidence collection',
    ],
    model: 'inherit',
    escalatesTo: 'qa-lead',
    consultsWith: ['api-developer', 'ui-developer', 'performance-engineer'],
    toolPermissions: TIER_3_PERMISSIONS,
    description:
      'Writes tests, automates testing, reports bugs. Documents test evidence, escalates test coverage gaps.',
  },
  {
    id: 'performance-engineer',
    name: 'Performance Engineer',
    tier: 3,
    department: 'Quality',
    role: 'Performance & Optimization',
    responsibilities: [
      'Load testing and stress testing',
      'Performance profiling and analysis',
      'Optimization recommendations',
      'Performance budget validation',
      'Scalability testing',
    ],
    model: 'inherit',
    escalatesTo: 'qa-lead',
    consultsWith: ['systems-engineer', 'qa-engineer'],
    toolPermissions: TIER_3_PERMISSIONS,
    description:
      'Tests performance, profiles bottlenecks, recommends optimizations. Reports performance metrics, escalates performance regressions.',
  },

  // ============================================================================
  // TIER 3: SPECIALISTS - DESIGN
  // ============================================================================
  {
    id: 'ux-designer',
    name: 'UX Designer',
    tier: 3,
    department: 'Design',
    role: 'User Experience Design',
    responsibilities: [
      'User flow design and wireframing',
      'Prototyping and interaction design',
      'Usability testing and research',
      'Information architecture',
      'User journey mapping',
    ],
    model: 'inherit',
    escalatesTo: 'design-lead',
    consultsWith: ['visual-designer', 'product-manager', 'ui-developer'],
    toolPermissions: TIER_3_PERMISSIONS,
    description:
      'Designs user flows, creates wireframes, conducts usability tests. Proposes UX solutions, coordinates with product on requirements.',
  },
  {
    id: 'visual-designer',
    name: 'Visual Designer',
    tier: 3,
    department: 'Design',
    role: 'Visual & Interface Design',
    responsibilities: [
      'UI mockups and high-fidelity designs',
      'Design system component design',
      'Iconography and illustration',
      'Visual identity and branding',
      'Design specification documentation',
    ],
    model: 'inherit',
    escalatesTo: 'design-lead',
    consultsWith: ['ux-designer', 'ui-developer'],
    toolPermissions: TIER_3_PERMISSIONS,
    description:
      'Creates UI mockups, designs components, maintains visual consistency. Proposes design options, coordinates with UX on flows.',
  },

  // ============================================================================
  // TIER 3: ADDITIONAL SPECIALISTS
  // ============================================================================
  {
    id: 'technical-writer',
    name: 'Technical Writer',
    tier: 3,
    department: 'Product & Design',
    role: 'Documentation & Communication',
    responsibilities: [
      'Technical documentation writing',
      'API documentation and guides',
      'User documentation and tutorials',
      'Architecture decision records (ADRs)',
      'Release notes and changelogs',
    ],
    model: 'inherit',
    escalatesTo: 'product-manager',
    consultsWith: ['tech-lead', 'product-manager'],
    toolPermissions: TIER_3_PERMISSIONS,
    description:
      'Writes documentation, maintains guides, creates ADRs. Asks engineers for technical details, proposes documentation structure.',
  },
  {
    id: 'devops-engineer',
    name: 'DevOps Engineer',
    tier: 3,
    department: 'Infrastructure',
    role: 'CI/CD & Automation',
    responsibilities: [
      'CI/CD pipeline implementation',
      'Build automation and scripting',
      'Deployment automation',
      'Infrastructure as code development',
      'Developer tooling and productivity',
    ],
    model: 'inherit',
    escalatesTo: 'devops-lead',
    consultsWith: ['cloud-engineer', 'platform-engineer'],
    toolPermissions: TIER_3_PERMISSIONS,
    description:
      'Implements CI/CD, automates deployments, writes infrastructure code. Proposes automation improvements, escalates pipeline failures.',
  },
  {
    id: 'backend-developer',
    name: 'Backend Developer',
    tier: 3,
    department: 'Backend Engineering',
    role: 'General Backend Development',
    responsibilities: [
      'General backend feature implementation',
      'Business logic development',
      'Service integration',
      'Code refactoring and maintenance',
      'Unit and integration testing',
    ],
    model: 'inherit',
    escalatesTo: 'backend-lead',
    consultsWith: ['api-developer', 'database-engineer', 'systems-engineer'],
    toolPermissions: TIER_3_PERMISSIONS,
    description:
      'Implements backend features, writes business logic, integrates services. Follows approved architecture, asks about ambiguous requirements.',
  },
  {
    id: 'frontend-developer',
    name: 'Frontend Developer',
    tier: 3,
    department: 'Frontend Engineering',
    role: 'General Frontend Development',
    responsibilities: [
      'General frontend feature implementation',
      'User interface development',
      'Client-side logic and validation',
      'Component refactoring and maintenance',
      'Unit and integration testing',
    ],
    model: 'inherit',
    escalatesTo: 'frontend-lead',
    consultsWith: ['ui-developer', 'frontend-integrator'],
    toolPermissions: TIER_3_PERMISSIONS,
    description:
      'Implements frontend features, builds UI components, writes client logic. Follows design system, asks about design edge cases.',
  },
  {
    id: 'data-engineer',
    name: 'Data Engineer',
    tier: 3,
    department: 'AI/ML Engineering',
    role: 'Data Pipeline Implementation',
    responsibilities: [
      'Data pipeline development',
      'ETL/ELT implementation',
      'Data transformation and validation',
      'Data quality monitoring',
      'Feature store maintenance',
    ],
    model: 'inherit',
    escalatesTo: 'data-engineer-lead',
    consultsWith: ['data-scientist', 'database-engineer'],
    toolPermissions: TIER_3_PERMISSIONS,
    description:
      'Builds data pipelines, implements ETL, validates data quality. Proposes pipeline architecture, coordinates with data scientists on features.',
  },
];

/**
 * Get agent definition by ID
 */
export function getAgentById(id: string): AgentDefinition | undefined {
  return AGENT_REGISTRY.find((agent) => agent.id === id);
}

/**
 * Get agents by tier
 */
export function getAgentsByTier(tier: AgentTier): AgentDefinition[] {
  return AGENT_REGISTRY.filter((agent) => agent.tier === tier);
}

/**
 * Get agents by department
 */
export function getAgentsByDepartment(
  department: Department
): AgentDefinition[] {
  return AGENT_REGISTRY.filter((agent) => agent.department === department);
}

/**
 * Get subordinate agents (agents that escalate to the given agent)
 */
export function getSubordinates(agentId: string): AgentDefinition[] {
  return AGENT_REGISTRY.filter((agent) => agent.escalatesTo === agentId);
}

/**
 * Get the escalation chain for an agent (from agent to top-level leadership)
 */
export function getEscalationChain(agentId: string): AgentDefinition[] {
  const chain: AgentDefinition[] = [];
  let currentId: string | undefined = agentId;

  while (currentId) {
    const agent = getAgentById(currentId);
    if (!agent) break;
    chain.push(agent);
    currentId = agent.escalatesTo;
  }

  return chain;
}

/**
 * Registry metadata
 */
export const REGISTRY_METADATA = {
  version: '1.0.0',
  totalAgents: AGENT_REGISTRY.length,
  tier1Count: AGENT_REGISTRY.filter((a) => a.tier === 1).length,
  tier2Count: AGENT_REGISTRY.filter((a) => a.tier === 2).length,
  tier3Count: AGENT_REGISTRY.filter((a) => a.tier === 3).length,
  departments: Array.from(new Set(AGENT_REGISTRY.map((a) => a.department))),
  sourceDocument: '/opt/data/Ultra-AI/docs/AGENT_STUDIO_ARCHITECTURE.md',
  lastUpdated: '2026-11-01',
};
