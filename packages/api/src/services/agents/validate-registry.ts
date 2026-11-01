/**
 * Validation script for agent-registry.ts
 * Demonstrates registry functionality and validates structure
 */

import {
  AGENT_REGISTRY,
  REGISTRY_METADATA,
  getAgentById,
  getAgentsByTier,
  getAgentsByDepartment,
  getSubordinates,
  getEscalationChain,
} from './agent-registry';

console.log('='.repeat(80));
console.log('Ultra-AI Agent Registry Validation');
console.log('='.repeat(80));
console.log();

// Registry metadata
console.log('Registry Metadata:');
console.log(`  Total Agents: ${REGISTRY_METADATA.totalAgents}`);
console.log(`  Tier 1 (Leadership): ${REGISTRY_METADATA.tier1Count}`);
console.log(`  Tier 2 (Department Leads): ${REGISTRY_METADATA.tier2Count}`);
console.log(`  Tier 3 (Specialists): ${REGISTRY_METADATA.tier3Count}`);
console.log(`  Departments: ${REGISTRY_METADATA.departments.length}`);
console.log(`  Source: ${REGISTRY_METADATA.sourceDocument}`);
console.log();

// Tier 1 agents
console.log('Tier 1: Leadership & Strategic Direction');
console.log('-'.repeat(80));
const tier1 = getAgentsByTier(1);
tier1.forEach(agent => {
  console.log(`  ${agent.name} (${agent.id})`);
  console.log(`    Role: ${agent.role}`);
  console.log(`    Model: ${agent.model}`);
  console.log(`    Responsibilities: ${agent.responsibilities.length}`);
});
console.log();

// Tier 2 agents
console.log('Tier 2: Department Leads');
console.log('-'.repeat(80));
const tier2 = getAgentsByTier(2);
tier2.forEach(agent => {
  console.log(`  ${agent.name} (${agent.id})`);
  console.log(`    Department: ${agent.department}`);
  console.log(`    Escalates to: ${agent.escalatesTo}`);
  console.log(`    Consults with: ${agent.consultsWith.length} peers`);
});
console.log();

// Tier 3 agents by department
console.log('Tier 3: Specialists by Department');
console.log('-'.repeat(80));
const tier3Departments = Array.from(new Set(getAgentsByTier(3).map(a => a.department)));
tier3Departments.forEach(dept => {
  const agents = getAgentsByDepartment(dept).filter(a => a.tier === 3);
  if (agents.length > 0) {
    console.log(`  ${dept}: ${agents.length} specialists`);
    agents.forEach(agent => {
      console.log(`    - ${agent.name} (${agent.id}): ${agent.role}`);
    });
  }
});
console.log();

// Example: Backend engineering hierarchy
console.log('Example: Backend Engineering Hierarchy');
console.log('-'.repeat(80));
const backendLead = getAgentById('backend-lead');
if (backendLead) {
  console.log(`Lead: ${backendLead.name}`);
  const subordinates = getSubordinates('backend-lead');
  console.log(`Direct Reports: ${subordinates.length}`);
  subordinates.forEach(agent => {
    console.log(`  - ${agent.name} (${agent.role})`);
  });
}
console.log();

// Example: Escalation chain
console.log('Example: Escalation Chain (API Developer → Chief Architect)');
console.log('-'.repeat(80));
const chain = getEscalationChain('api-developer');
console.log(chain.map((agent, i) => `${'  '.repeat(i)}${agent.name} (Tier ${agent.tier})`).join('\n'));
console.log();

// Validation checks
console.log('Validation Checks:');
console.log('-'.repeat(80));

let validationPassed = true;

// Check 1: All agents have unique IDs
const ids = AGENT_REGISTRY.map(a => a.id);
const uniqueIds = new Set(ids);
if (ids.length === uniqueIds.size) {
  console.log('✓ All agent IDs are unique');
} else {
  console.log('✗ Duplicate agent IDs found');
  validationPassed = false;
}

// Check 2: All escalation paths are valid
const invalidEscalations = AGENT_REGISTRY.filter(agent => {
  if (!agent.escalatesTo) return false;
  return !getAgentById(agent.escalatesTo);
});
if (invalidEscalations.length === 0) {
  console.log('✓ All escalation paths reference valid agents');
} else {
  console.log(`✗ Invalid escalation paths found: ${invalidEscalations.length}`);
  validationPassed = false;
}

// Check 3: All consultation references are valid
let invalidConsults = 0;
AGENT_REGISTRY.forEach(agent => {
  agent.consultsWith.forEach(consultId => {
    if (!getAgentById(consultId)) {
      invalidConsults++;
    }
  });
});
if (invalidConsults === 0) {
  console.log('✓ All consultation references are valid');
} else {
  console.log(`✗ Invalid consultation references found: ${invalidConsults}`);
  validationPassed = false;
}

// Check 4: Tier 1 agents have no escalation path
const tier1WithEscalation = tier1.filter(a => a.escalatesTo);
if (tier1WithEscalation.length === 0) {
  console.log('✓ Tier 1 agents have no escalation paths (correct)');
} else {
  console.log(`✗ Tier 1 agents with escalation paths: ${tier1WithEscalation.length}`);
  validationPassed = false;
}

// Check 5: Tier 2 and 3 agents have escalation paths
const tier2And3 = [...getAgentsByTier(2), ...getAgentsByTier(3)];
const missingEscalation = tier2And3.filter(a => !a.escalatesTo);
if (missingEscalation.length === 0) {
  console.log('✓ All Tier 2 and Tier 3 agents have escalation paths');
} else {
  console.log(`✗ Agents missing escalation paths: ${missingEscalation.length}`);
  missingEscalation.forEach(a => console.log(`    - ${a.name} (${a.id})`));
  validationPassed = false;
}

// Check 6: Expected agent count (30+)
if (REGISTRY_METADATA.totalAgents >= 30) {
  console.log(`✓ Registry contains ${REGISTRY_METADATA.totalAgents} agents (target: 30+)`);
} else {
  console.log(`✗ Registry contains only ${REGISTRY_METADATA.totalAgents} agents (target: 30+)`);
  validationPassed = false;
}

console.log();
console.log('='.repeat(80));
if (validationPassed) {
  console.log('✓ ALL VALIDATION CHECKS PASSED');
  process.exit(0);
} else {
  console.log('✗ VALIDATION FAILED - See errors above');
  process.exit(1);
}
