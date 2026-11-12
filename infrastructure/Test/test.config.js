// test.config.js — test environment configuration (PLACEHOLDER)
module.exports = {
  suites: ['unit', 'integration', 'e2e', 'performance', 'security', 'blockchain'],
  reports: { formats: ['json', 'html', 'junit'], dir: 'reports' },
  alerts: { channels: ['email', 'slack'] },
};
