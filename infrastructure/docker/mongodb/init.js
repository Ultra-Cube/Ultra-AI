// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                                                                          ║
// ║ ██╗   ██╗ ██╗      ███████╗ ██████╗   █████╗                             ║
// ║ ██║   ██║ ██║      ╚══██╔══╝ ██╔══██╗ ██╔══██╗                           ║
// ║ ██║   ██║ ██║         ██║    ██████╔╝ ███████║                           ║
// ║ ╚██╗ ██╔╝ ██║         ██║    ██╔══██║ ██╔══██║                           ║
// ║  ╚████╔╝ ███████╗    ██║    ██║  ██║ ██║  ██║                            ║
// ║   ╚═══╝  ╚══════╝    ╚═╝    ╚═╝  ╚═╝ ╚═╝  ╚═╝                            ║
// ║                                                                          ║
// ║ Project   : Ultra AI — Proprietary AI Platform                           ║
// ║ Developer : Ultra Cube Tech — ucubetech.com                              ║
// ║ Team      : Ultra Zone Team — ultra-zone.ucubetech.com                   ║
// ║ GitHub Org: github.com/Ultra-Cube                                        ║
// ║ Repository: github.com/Ultra-Cube/Ultra-AI                               ║
// ║ Copyright : (c) Ultra Cube Tech — All rights reserved                    ║
// ║ [UCUBETECH-COPYRIGHT]                                                    ║
// ║                                                                          ║
// ╚══════════════════════════════════════════════════════════════════════════╝

// Ultra AI Platform - MongoDB Initialization Script

db = db.getSiblingDB('ultra_ai_db');

// Create collections
db.createCollection('conversations');
db.createCollection('messages');
db.createCollection('analytics_events');
db.createCollection('node_metrics');

// Create indexes

// Conversations indexes
db.conversations.createIndex({ user_id: 1, created_at: -1 });
db.conversations.createIndex({ status: 1 });

// Messages indexes
db.messages.createIndex({ conversation_id: 1, created_at: 1 });
db.messages.createIndex({ user_id: 1, created_at: -1 });

// Analytics indexes
db.analytics_events.createIndex({ event_type: 1, timestamp: -1 });
db.analytics_events.createIndex({ user_id: 1, timestamp: -1 });

// Node metrics indexes
db.node_metrics.createIndex({ node_id: 1, timestamp: -1 });
db.node_metrics.createIndex({ timestamp: -1 });

print('MongoDB initialization completed successfully');
