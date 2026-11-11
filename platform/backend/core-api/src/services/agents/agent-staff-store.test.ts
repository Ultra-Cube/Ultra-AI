import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { AgentStaffStore } from './agent-staff-store';

function tempStore(): { store: AgentStaffStore; file: string } {
  const file = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), 'agent-staff-')),
    'state.json'
  );
  return { store: new AgentStaffStore(file), file };
}

describe('AgentStaffStore', () => {
  it('seeds a default staff roster', () => {
    const { store } = tempStore();
    const agents = store.getAgents();
    expect(agents.length).toBeGreaterThanOrEqual(4);
    expect(agents[0].position).toHaveProperty('title');
    expect(agents[0].position).toHaveProperty('department');
    expect(agents[0].position).toHaveProperty('rank');
  });

  it('hires an agent with a position', () => {
    const { store } = tempStore();
    const agent = store.hireAgent({
      name: 'Nova',
      position: { title: 'QA Engineer', department: 'Quality', rank: 'senior' },
      capabilities: ['test', 'review'],
      model: 'gpt-5-mini',
    });
    expect(agent.id).toMatch(/^agent-/);
    expect(agent.name).toBe('Nova');
    expect(agent.position.title).toBe('QA Engineer');
    expect(store.getAgents().some((a) => a.id === agent.id)).toBe(true);
  });

  it('assigns a task to a specific agent and marks them busy', () => {
    const { store } = tempStore();
    const agent = store.hireAgent({
      name: 'Solo',
      position: { title: 'Writer', department: 'Content', rank: 'standard' },
      status: 'idle',
    });
    const task = store.assignTask({
      title: 'Draft the launch post',
      agentId: agent.id,
      priority: 'high',
    });
    expect(task).not.toBeNull();
    expect(task?.assignedAgentId).toBe(agent.id);
    expect(task?.status).toBe('queued');
    expect(store.getAgents().find((a) => a.id === agent.id)?.status).toBe(
      'busy'
    );
  });

  it('returns null when assigning to a missing agent', () => {
    const { store } = tempStore();
    expect(store.assignTask({ title: 'x', agentId: 'nope' })).toBeNull();
  });

  it('reassigns a task between agents', () => {
    const { store } = tempStore();
    const a = store.hireAgent({
      name: 'A',
      position: { title: 'T', department: 'D', rank: 'standard' },
    });
    const b = store.hireAgent({
      name: 'B',
      position: { title: 'T', department: 'D', rank: 'standard' },
    });
    const task = store.assignTask({ title: 'move me', agentId: a.id })!;
    const moved = store.reassignTask(task.id, b.id);
    expect(moved?.assignedAgentId).toBe(b.id);
  });

  it('moves a task through its lifecycle', () => {
    const { store } = tempStore();
    const a = store.hireAgent({
      name: 'A',
      position: { title: 'T', department: 'D', rank: 'standard' },
    });
    const task = store.assignTask({ title: 'ship it', agentId: a.id })!;
    expect(store.updateTaskStatus(task.id, 'in_progress')?.status).toBe(
      'in_progress'
    );
    const done = store.updateTaskStatus(task.id, 'done', 'completed ok');
    expect(done?.status).toBe('done');
    expect(done?.result).toBe('completed ok');
  });

  it('builds a roster with per-agent open task counts', () => {
    const { store } = tempStore();
    const a = store.hireAgent({
      name: 'A',
      position: { title: 'T', department: 'D', rank: 'standard' },
    });
    store.assignTask({ title: 't1', agentId: a.id });
    store.assignTask({ title: 't2', agentId: a.id });
    const roster = store.getRoster();
    const row = roster.find((r) => r.id === a.id);
    expect(row?.openTasks).toBe(2);
    expect(row?.tasks.length).toBe(2);
  });

  it('blocks tasks when their agent is removed', () => {
    const { store } = tempStore();
    const a = store.hireAgent({
      name: 'A',
      position: { title: 'T', department: 'D', rank: 'standard' },
    });
    const task = store.assignTask({ title: 'orphan me', agentId: a.id })!;
    expect(store.removeAgent(a.id)).toBe(true);
    const found = store.getTasks().find((t) => t.id === task.id);
    expect(found?.status).toBe('blocked');
    expect(found?.assignedAgentId).toBe('');
  });

  it('updates an agent position', () => {
    const { store } = tempStore();
    const a = store.hireAgent({
      name: 'A',
      position: { title: 'T', department: 'D', rank: 'trainee' },
    });
    const updated = store.setPosition(a.id, {
      title: 'Lead',
      department: 'Ops',
      rank: 'lead',
    });
    expect(updated?.position.rank).toBe('lead');
    expect(updated?.position.title).toBe('Lead');
  });

  it('persists state across store instances', () => {
    const { store, file } = tempStore();
    const a = store.hireAgent({
      name: 'Persist',
      position: { title: 'T', department: 'D', rank: 'standard' },
    });
    const reopened = new AgentStaffStore(file);
    expect(reopened.getAgents().some((x) => x.id === a.id)).toBe(true);
  });
});
