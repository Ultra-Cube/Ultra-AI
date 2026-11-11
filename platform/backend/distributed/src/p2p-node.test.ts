import { P2PNode, NetworkCoordinator, NodeConfig } from './p2p-node';

describe('P2PNode', () => {
  let node: P2PNode;

  beforeEach(() => {
    const config: NodeConfig = {
      nodeId: 'node-1',
      port: 5000,
      peers: [
        {
          nodeId: 'node-2',
          host: 'localhost',
          port: 5001,
          reputation: 80,
          available: true,
        },
        {
          nodeId: 'node-3',
          host: 'localhost',
          port: 5002,
          reputation: 60,
          available: true,
        },
      ],
      processingCapacity: 10,
    };

    node = new P2PNode(config);
  });

  it('creates a P2P node with configuration', () => {
    const info = (node as any).getNodeInfo?.();
    expect(info.nodeId).toBeTruthy();
    expect(info.peerCount).toBe(2);
    expect(info.capacity).toBe(10);
  });

  it('chunks data for distributed processing', () => {
    const input = 'a'.repeat(3000);
    const chunks = node.chunkData(input, 1024);

    expect(chunks.length).toBe(3);
    expect(chunks[0].sequence).toBe(0);
    expect(chunks[1].sequence).toBe(1);
    expect(chunks[2].sequence).toBe(2);
    expect(chunks.every((c) => c.status === 'pending')).toBe(true);
  });

  it('creates a distributed task', () => {
    const input = 'Process this content across the network';
    const task = node.createTask(input);

    expect(task.taskId).toBeTruthy();
    expect(task.status).toBe('pending');
    expect(task.chunks.length).toBeGreaterThan(0);
    expect(task.input).toBe(input);
  });

  it('distributes task chunks to available peers', async () => {
    const task = node.createTask('Distributed task input');
    const taskId = await node.distributeTask(task);

    expect(taskId).toBeTruthy();
    // Task should be in processing or completed state
    expect(['processing', 'completed']).toContain(task.status);
    // At least one chunk should have been distributed
    expect(task.chunks.some((c) => c.targetNodeId)).toBe(true);
  });

  it('aggregates results from processed chunks', async () => {
    const task = node.createTask('Test input for aggregation');
    await node.distributeTask(task);

    const aggregated = node.aggregateResults(task.taskId);

    expect(aggregated).toBeTruthy();
    expect(aggregated.includes('Processed')).toBe(true);
  });

  it('accepts chunks for processing', async () => {
    const input = 'Chunk to be processed';
    const chunks = node.chunkData(input);
    const chunk = chunks[0];

    await node.acceptChunk(chunk);

    expect(chunk.status).toBe('completed');
    expect(chunk.result).toBeTruthy();
  });

  it('returns node health status', async () => {
    // Process at least one chunk to get some metrics
    const chunks = node.chunkData('Test');
    await node.acceptChunk(chunks[0]);

    // Small delay to ensure uptime is > 0
    await new Promise((resolve) => setTimeout(resolve, 10));

    const health = (node as any).getHealth?.();

    expect(health.nodeId).toBeTruthy();
    expect(health.uptime).toBeGreaterThanOrEqual(0);
    expect(health.successRate).toBeGreaterThanOrEqual(0);
    expect(health.successRate).toBeLessThanOrEqual(1);
  });

  it('gets list of available peers', () => {
    const available = node.getAvailablePeers();

    expect(available.length).toBe(2);
    expect(available.every((p) => p.available)).toBe(true);
  });

  it('updates peer reputation', () => {
    const peers = node.getAvailablePeers();
    const peerId = peers[0].nodeId;
    const initialRep = peers[0].reputation;

    node.updatePeerReputation(peerId, true);
    expect(node.getAvailablePeers()[0].reputation).toBeGreaterThan(initialRep);

    node.updatePeerReputation(peerId, false);
    expect(node.getAvailablePeers()[0].reputation).toBeLessThan(initialRep + 5);
  });

  it('prunes unreliable peers', () => {
    const peers = node.getAvailablePeers();
    // Set low reputation
    for (let i = 0; i < 15; i++) {
      node.updatePeerReputation(peers[0].nodeId, false);
    }

    node.pruneUnreliablePeers(20);
    const availableAfter = node.getAvailablePeers();

    expect(availableAfter.some((p) => p.nodeId === peers[0].nodeId)).toBe(
      false
    );
  });

  it('throws error when no peers available for distribution', async () => {
    // Create node with no peers
    const config: NodeConfig = {
      nodeId: 'isolated-node',
      port: 5000,
      peers: [],
      processingCapacity: 10,
    };
    const isolatedNode = new P2PNode(config);
    const task = isolatedNode.createTask('Test');

    await expect(isolatedNode.distributeTask(task)).rejects.toThrow(
      'No available peers'
    );
  });
});

describe('NetworkCoordinator', () => {
  let coordinator: NetworkCoordinator;
  let node1: P2PNode;
  let node2: P2PNode;

  beforeEach(() => {
    coordinator = new NetworkCoordinator();

    const config1: NodeConfig = {
      nodeId: 'node-1',
      port: 5000,
      peers: [],
      processingCapacity: 10,
    };
    node1 = new P2PNode(config1);

    const config2: NodeConfig = {
      nodeId: 'node-2',
      port: 5001,
      peers: [],
      processingCapacity: 10,
    };
    node2 = new P2PNode(config2);

    coordinator.addNode(node1);
    coordinator.addNode(node2);
  });

  it('tracks multiple nodes in network', () => {
    const health = coordinator.getNetworkHealth();

    expect(health.totalNodes).toBe(2);
    expect(health.nodes.length).toBe(2);
  });

  it('calculates average network health', () => {
    const health = coordinator.getNetworkHealth();

    expect(health.avgSuccessRate).toBeGreaterThanOrEqual(0);
    expect(health.avgSuccessRate).toBeLessThanOrEqual(1);
  });
});
