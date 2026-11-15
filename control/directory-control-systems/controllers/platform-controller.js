/**
 * 🚀 Platform Control System
 * ===========================
 * 
 * Manages all platform components including API, backend, frontend, blockchain,
 * database, enterprise services, applications, and shared services.
 * Integrates with master control for comprehensive platform orchestration.
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

class PlatformController {
  constructor(masterController = null) {
    this.masterController = masterController;
    this.projectRoot = masterController ? masterController.projectRoot : path.resolve(__dirname, '../..');
    this.platformPath = path.join(this.projectRoot, 'platform');
    
    this.components = {
      api: {
        name: 'API Gateway',
        path: path.join(this.platformPath, 'api'),
        description: 'Central API gateway and routing system',
        type: 'gateway',
        priority: 1,
        controller: 'api-controller'
      },
      backend: {
        name: 'Backend Services',
        path: path.join(this.platformPath, 'backend'),
        description: 'Core business logic and services',
        type: 'service',
        priority: 2,
        controller: 'backend-controller'
      },
      frontend: {
        name: 'Frontend Application',
        path: path.join(this.platformPath, 'frontend'),
        description: 'User interface and client application',
        type: 'application',
        priority: 3,
        controller: 'frontend-controller'
      },
      blockchain: {
        name: 'Blockchain Platform',
        path: path.join(this.platformPath, 'blockchain'),
        description: 'Blockchain integration, DeFi, and NFT services',
        type: 'service',
        priority: 4,
        controller: 'blockchain-controller'
      },
      database: {
        name: 'Database Infrastructure',
        path: path.join(this.platformPath, 'database'),
        description: 'Multi-database management and orchestration',
        type: 'infrastructure',
        priority: 1,
        controller: 'database-infrastructure-controller'
      },
      enterprise: {
        name: 'Enterprise Services',
        path: path.join(this.platformPath, 'enterprise'),
        description: 'Enterprise business services and integrations',
        type: 'service',
        priority: 5,
        controller: 'enterprise-services-controller'
      },
      testing: {
        name: 'Testing Framework',
        path: path.join(this.platformPath, 'testing'),
        description: 'Platform testing framework and tools',
        type: 'infrastructure',
        priority: 6,
        controller: 'testing-framework-controller'
      },
      apps: {
        name: 'Applications Suite',
        path: path.join(this.platformPath, 'apps'),
        description: 'Business applications (CRM, Analytics, ERP)',
        type: 'application',
        priority: 7,
        controller: 'applications-suite-controller'
      },
      services: {
        name: 'Shared Services',
        path: path.join(this.platformPath, 'services'),
        description: 'Common platform services and utilities',
        type: 'infrastructure',
        priority: 2,
        controller: 'shared-services-controller'
      },
      devtools: {
        name: 'DevTools Platform',
        path: path.join(this.platformPath, 'devtools'),
        description: 'Development tools and code generation',
        type: 'development',
        priority: 8,
        controller: 'devtools-controller'
      }
    };
    
    console.log('🚀 Platform Controller initialized');
    console.log(`📁 Platform Path: ${this.platformPath}`);
    console.log(`🧩 Components: ${Object.keys(this.components).length}`);
  }

  /**
   * 🏥 Health check for platform system
   */
  async healthCheck() {
    try {
      const health = {
        status: 'healthy',
        platform: {
          path: this.platformPath,
          components: {}
        },
        summary: {
          total: Object.keys(this.components).length,
          healthy: 0,
          degraded: 0,
          failed: 0
        },
        timestamp: new Date().toISOString()
      };

      // Check each platform component
      for (const [componentName, componentConfig] of Object.entries(this.components)) {
        try {
          await fs.access(componentConfig.path);
          const files = await fs.readdir(componentConfig.path);
          const stats = await fs.stat(componentConfig.path);
          
          // Check if component has essential files
          const hasPackageJson = files.includes('package.json');
          const hasIndexFile = files.some(f => f.startsWith('index.') || f.startsWith('main.'));
          const hasConfigFiles = files.some(f => f.includes('config') || f.endsWith('.config.js'));
          
          const componentHealth = {
            status: 'healthy',
            path: componentConfig.path,
            files: files.length,
            lastModified: stats.mtime,
            description: componentConfig.description,
            type: componentConfig.type,
            priority: componentConfig.priority,
            structure: {
              hasPackageJson,
              hasIndexFile,
              hasConfigFiles
            }
          };

          // Get controller status if available
          if (this.masterController && componentConfig.controller) {
            try {
              const controller = this.masterController.getController(componentName);
              if (controller) {
                componentHealth.controllerStatus = 'available';
                if (typeof controller.healthCheck === 'function') {
                  const controllerHealth = await controller.healthCheck();
                  componentHealth.controllerHealth = controllerHealth;
                }
              } else {
                componentHealth.controllerStatus = 'not_initialized';
              }
            } catch (error) {
              componentHealth.controllerStatus = 'error';
              componentHealth.controllerError = error.message;
            }
          }
          
          health.platform.components[componentName] = componentHealth;
          health.summary.healthy++;
        } catch (error) {
          health.platform.components[componentName] = {
            status: 'failed',
            error: error.message,
            path: componentConfig.path,
            type: componentConfig.type
          };
          health.summary.failed++;
          if (health.status === 'healthy') health.status = 'degraded';
        }
      }

      // Overall health assessment
      if (health.summary.failed > 0) {
        health.status = health.summary.failed >= health.summary.total / 2 ? 'critical' : 'degraded';
      }

      return health;
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 📋 Get platform status
   */
  async getStatus() {
    try {
      const status = {
        platform: {
          path: this.platformPath,
          components: {}
        },
        summary: {
          total: Object.keys(this.components).length,
          available: 0,
          configured: 0,
          running: 0
        },
        byType: {
          gateway: 0,
          service: 0,
          application: 0,
          infrastructure: 0,
          development: 0
        }
      };

      for (const [componentName, componentConfig] of Object.entries(this.components)) {
        try {
          await fs.access(componentConfig.path);
          status.summary.available++;
          status.byType[componentConfig.type]++;
          
          const files = await fs.readdir(componentConfig.path);
          
          // Check configuration
          const hasPackageJson = files.includes('package.json');
          const hasConfig = files.some(f => f.includes('config') || f.endsWith('.config.js'));
          
          if (hasPackageJson || hasConfig) {
            status.summary.configured++;
          }

          // Get package.json info if available
          let packageInfo = null;
          if (hasPackageJson) {
            try {
              const packagePath = path.join(componentConfig.path, 'package.json');
              const packageContent = await fs.readFile(packagePath, 'utf8');
              packageInfo = JSON.parse(packageContent);
            } catch (error) {
              // Package.json exists but is invalid
            }
          }

          // Check if component is running (via controller)
          let isRunning = false;
          let controllerInfo = null;
          
          if (this.masterController && componentConfig.controller) {
            try {
              const controller = this.masterController.getController(componentName);
              if (controller) {
                controllerInfo = {
                  available: true,
                  name: componentConfig.controller
                };
                
                if (typeof controller.getStatus === 'function') {
                  const controllerStatus = await controller.getStatus();
                  controllerInfo.status = controllerStatus;
                  if (controllerStatus && controllerStatus.running) {
                    isRunning = true;
                    status.summary.running++;
                  }
                }
              }
            } catch (error) {
              controllerInfo = {
                available: false,
                error: error.message
              };
            }
          }

          status.platform.components[componentName] = {
            ...componentConfig,
            status: 'available',
            files: files.length,
            fileList: files.slice(0, 10), // Show first 10 files
            packageInfo,
            isRunning,
            controllerInfo,
            structure: {
              hasPackageJson,
              hasConfig,
              mainFiles: files.filter(f => 
                f.startsWith('index.') || 
                f.startsWith('main.') || 
                f.startsWith('app.')
              )
            }
          };
        } catch (error) {
          status.platform.components[componentName] = {
            ...componentConfig,
            status: 'missing',
            error: error.message
          };
        }
      }

      return status;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * 🔄 Start platform component
   */
  async startComponent(componentName = 'all') {
    try {
      console.log(`🚀 Starting platform component: ${componentName}`);
      
      if (componentName === 'all') {
        return await this.startAllComponents();
      }

      if (!this.components[componentName]) {
        throw new Error(`Component '${componentName}' not found`);
      }

      const component = this.components[componentName];
      const result = {
        component: componentName,
        status: 'starting',
        timestamp: new Date().toISOString()
      };

      // Use master controller if available
      if (this.masterController && component.controller) {
        try {
          const controller = this.masterController.getController(componentName);
          if (controller && typeof controller.start === 'function') {
            const startResult = await controller.start();
            result.controllerResult = startResult;
            result.status = startResult.status || 'started';
          } else {
            result.status = 'no_controller';
            result.message = 'Component controller not available';
          }
        } catch (error) {
          result.status = 'error';
          result.error = error.message;
        }
      } else {
        // Fallback: Try to start via package.json scripts
        try {
          const packagePath = path.join(component.path, 'package.json');
          await fs.access(packagePath);
          
          const execAsync = promisify(exec);
          const { stdout, stderr } = await execAsync('npm start', { 
            cwd: component.path,
            timeout: 10000 
          });
          
          result.status = 'started';
          result.output = stdout;
          result.method = 'npm_start';
        } catch (error) {
          result.status = 'error';
          result.error = error.message;
          result.method = 'npm_start_failed';
        }
      }

      console.log(`${result.status === 'started' ? '✅' : '❌'} Component ${componentName}: ${result.status}`);
      return result;
    } catch (error) {
      console.error(`❌ Failed to start component ${componentName}:`, error.message);
      return {
        component: componentName,
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * 🚀 Start all platform components
   */
  async startAllComponents() {
    try {
      console.log('🚀 Starting all platform components...');
      
      const results = {
        operation: 'start_all',
        started: new Date().toISOString(),
        components: {},
        summary: {
          total: 0,
          successful: 0,
          failed: 0
        }
      };

      // Sort components by priority
      const sortedComponents = Object.entries(this.components)
        .sort(([,a], [,b]) => a.priority - b.priority);

      for (const [componentName, componentConfig] of sortedComponents) {
        console.log(`🔄 Starting ${componentName} (priority ${componentConfig.priority})...`);
        
        const componentResult = await this.startComponent(componentName);
        results.components[componentName] = componentResult;
        results.summary.total++;
        
        if (componentResult.status === 'started') {
          results.summary.successful++;
        } else {
          results.summary.failed++;
        }
        
        // Small delay between component starts
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      results.completed = new Date().toISOString();
      results.overallStatus = results.summary.failed === 0 ? 'success' : 'partial';

      console.log(`✅ Platform startup completed: ${results.summary.successful}/${results.summary.total} components started`);
      return results;
    } catch (error) {
      console.error(`❌ Failed to start platform components:`, error.message);
      return {
        operation: 'start_all',
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * 🛑 Stop platform component
   */
  async stopComponent(componentName = 'all') {
    try {
      console.log(`🛑 Stopping platform component: ${componentName}`);
      
      if (componentName === 'all') {
        return await this.stopAllComponents();
      }

      if (!this.components[componentName]) {
        throw new Error(`Component '${componentName}' not found`);
      }

      const component = this.components[componentName];
      const result = {
        component: componentName,
        status: 'stopping',
        timestamp: new Date().toISOString()
      };

      // Use master controller if available
      if (this.masterController && component.controller) {
        try {
          const controller = this.masterController.getController(componentName);
          if (controller && typeof controller.stop === 'function') {
            const stopResult = await controller.stop();
            result.controllerResult = stopResult;
            result.status = stopResult.status || 'stopped';
          } else {
            result.status = 'no_controller';
            result.message = 'Component controller not available';
          }
        } catch (error) {
          result.status = 'error';
          result.error = error.message;
        }
      } else {
        result.status = 'stopped';
        result.method = 'manual';
        result.message = 'No automatic stop method available';
      }

      console.log(`${result.status === 'stopped' ? '✅' : '❌'} Component ${componentName}: ${result.status}`);
      return result;
    } catch (error) {
      console.error(`❌ Failed to stop component ${componentName}:`, error.message);
      return {
        component: componentName,
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * 🛑 Stop all platform components
   */
  async stopAllComponents() {
    try {
      console.log('🛑 Stopping all platform components...');
      
      const results = {
        operation: 'stop_all',
        started: new Date().toISOString(),
        components: {},
        summary: {
          total: 0,
          successful: 0,
          failed: 0
        }
      };

      // Sort components by reverse priority (stop in reverse order)
      const sortedComponents = Object.entries(this.components)
        .sort(([,a], [,b]) => b.priority - a.priority);

      for (const [componentName, componentConfig] of sortedComponents) {
        console.log(`🔄 Stopping ${componentName}...`);
        
        const componentResult = await this.stopComponent(componentName);
        results.components[componentName] = componentResult;
        results.summary.total++;
        
        if (componentResult.status === 'stopped') {
          results.summary.successful++;
        } else {
          results.summary.failed++;
        }
      }

      results.completed = new Date().toISOString();
      results.overallStatus = results.summary.failed === 0 ? 'success' : 'partial';

      console.log(`✅ Platform shutdown completed: ${results.summary.successful}/${results.summary.total} components stopped`);
      return results;
    } catch (error) {
      console.error(`❌ Failed to stop platform components:`, error.message);
      return {
        operation: 'stop_all',
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * 🔧 Build platform component
   */
  async buildComponent(componentName = 'all') {
    try {
      console.log(`🔧 Building platform component: ${componentName}`);
      
      if (componentName === 'all') {
        return await this.buildAllComponents();
      }

      if (!this.components[componentName]) {
        throw new Error(`Component '${componentName}' not found`);
      }

      const component = this.components[componentName];
      const result = {
        component: componentName,
        status: 'building',
        timestamp: new Date().toISOString()
      };

      // Try to build via package.json scripts
      try {
        const packagePath = path.join(component.path, 'package.json');
        await fs.access(packagePath);
        
        const execAsync = promisify(exec);
        const { stdout, stderr } = await execAsync('npm run build', { 
          cwd: component.path,
          timeout: 120000 // 2 minutes timeout
        });
        
        result.status = 'built';
        result.output = stdout;
        result.method = 'npm_build';
      } catch (error) {
        result.status = 'error';
        result.error = error.message;
        result.method = 'npm_build_failed';
      }

      console.log(`${result.status === 'built' ? '✅' : '❌'} Component ${componentName}: ${result.status}`);
      return result;
    } catch (error) {
      console.error(`❌ Failed to build component ${componentName}:`, error.message);
      return {
        component: componentName,
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * 🔧 Build all platform components
   */
  async buildAllComponents() {
    try {
      console.log('🔧 Building all platform components...');
      
      const results = {
        operation: 'build_all',
        started: new Date().toISOString(),
        components: {},
        summary: {
          total: 0,
          successful: 0,
          failed: 0
        }
      };

      // Sort components by priority
      const sortedComponents = Object.entries(this.components)
        .sort(([,a], [,b]) => a.priority - b.priority);

      for (const [componentName, componentConfig] of sortedComponents) {
        console.log(`🔄 Building ${componentName}...`);
        
        const componentResult = await this.buildComponent(componentName);
        results.components[componentName] = componentResult;
        results.summary.total++;
        
        if (componentResult.status === 'built') {
          results.summary.successful++;
        } else {
          results.summary.failed++;
        }
      }

      results.completed = new Date().toISOString();
      results.overallStatus = results.summary.failed === 0 ? 'success' : 'partial';

      console.log(`✅ Platform build completed: ${results.summary.successful}/${results.summary.total} components built`);
      return results;
    } catch (error) {
      console.error(`❌ Failed to build platform components:`, error.message);
      return {
        operation: 'build_all',
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * 🎯 Start platform service
   */
  async start() {
    try {
      console.log('🚀 Starting Platform Controller...');
      
      // Initialize platform directory
      await fs.mkdir(this.platformPath, { recursive: true });
      
      // Initialize component directories
      for (const [componentName, componentConfig] of Object.entries(this.components)) {
        await fs.mkdir(componentConfig.path, { recursive: true });
      }
      
      console.log('✅ Platform Controller started successfully');
      return { 
        status: 'started',
        components: Object.keys(this.components),
        timestamp: new Date().toISOString() 
      };
    } catch (error) {
      console.error('❌ Failed to start Platform Controller:', error.message);
      return { status: 'error', error: error.message };
    }
  }

  /**
   * 🛑 Stop platform service
   */
  async stop() {
    try {
      console.log('🛑 Stopping Platform Controller...');
      
      // Stop all components first
      await this.stopAllComponents();
      
      console.log('✅ Platform Controller stopped successfully');
      return { status: 'stopped', timestamp: new Date().toISOString() };
    } catch (error) {
      console.error('❌ Failed to stop Platform Controller:', error.message);
      return { status: 'error', error: error.message };
    }
  }
}

module.exports = PlatformController;
