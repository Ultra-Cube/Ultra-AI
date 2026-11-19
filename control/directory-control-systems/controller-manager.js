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

/**
 * 🎛️ ULTRA-CORE CONTROLLER MANAGER
 * 
 * Master orchestrator for all specialized controllers
 * Provides unified interface and coordination between controllers
 * Enhanced for comprehensive platform component management
 * 
 * @file controller-manager.js
 * @version 2.0.0
 * @author Ultra-Core Team
 * @description Central management system for all Ultra-Core controllers
 * @updated September 5, 2025 - Enhanced platform integration
 */

const EventEmitter = require('events');
const path = require('path');

// Import all controllers
const { UltraCoreController } = require('./main');
const DevelopmentController = require('./dev-controller');
const DeploymentController = require('./deploy-controller');
const MonitoringController = require('./monitor-controller');
const DatabaseController = require('./database-controller');
const BuildController = require('./build-controller');
const envLoader = require('./env-loader');

// Import configuration managers
const MasterConfigManager = require('./config/master-config-manager');
const SystemConfig = require('./config/system-config');
const EnvironmentConfigManager = require('./config/environment-config-manager');

class ControllerManager extends EventEmitter {
    constructor() {
        super();
        this.controllers = new Map();
        this.activeControllers = new Set();
        this.configManagers = new Map();
        this.platformServices = new Map();
        this.isInitialized = false;
        
        // Initialize configuration managers
        this.masterConfig = new MasterConfigManager();
        this.systemConfig = new SystemConfig();
        this.envConfig = new EnvironmentConfigManager();
        
        this.managerConfig = this.loadManagerConfig();
        
        console.log('🎛️ Ultra-Core Controller Manager v2.0 Initialized');
        console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
        console.log('🔧 Platform Services: Backend, Frontend, Database, Blockchain, API Gateway, Mobile, DevTools, Testing');
        
        this.initializeManager();
    }

    /**
     * 🔧 Load Manager Configuration
     */
    loadManagerConfig() {
        return {
            controllers: {
                main: {
                    class: UltraCoreController,
                    enabled: true,
                    autoStart: true,
                    priority: 1,
                    description: 'Main production controller - central orchestration'
                },
                database: {
                    class: DatabaseController,
                    enabled: true,
                    autoStart: true,
                    priority: 2,
                    description: 'Database management and orchestration controller',
                    dependencies: ['main']
                },
                build: {
                    class: BuildController,
                    enabled: true,
                    autoStart: false,
                    priority: 3,
                    description: 'Build system and deployment orchestration',
                    dependencies: ['main', 'database']
                },
                development: {
                    class: DevelopmentController,
                    enabled: process.env.NODE_ENV === 'development',
                    autoStart: process.env.NODE_ENV === 'development',
                    priority: 4,
                    description: 'Development workflow and hot-reload controller'
                },
                deployment: {
                    class: DeploymentController,
                    enabled: true,
                    autoStart: false,
                    priority: 5,
                    description: 'Deployment and CI/CD controller'
                },
                monitoring: {
                    class: MonitoringController,
                    enabled: true,
                    autoStart: true,
                    priority: 6,
                    description: 'System monitoring, logging, and alerting'
                }
            },
            platformServices: {
                backend: {
                    path: 'platform/backend',
                    framework: 'nestjs',
                    port: 3001,
                    enabled: true,
                    controller: 'main'
                },
                frontend: {
                    path: 'platform/frontend',
                    framework: 'react-vite',
                    port: 3000,
                    enabled: true,
                    controller: 'main'
                },
                database: {
                    path: 'platform/database',
                    engines: ['mongodb', 'postgresql', 'redis'],
                    enabled: true,
                    controller: 'database'
                },
                blockchain: {
                    path: 'platform/blockchain',
                    networks: ['ethereum', 'stellar', 'tezos', 'algorand'],
                    enabled: true,
                    controller: 'main'
                },
                apiGateway: {
                    path: 'platform/api/gateway/api-gateway',
                    framework: 'express-typescript',
                    port: 3002,
                    enabled: true,
                    controller: 'main'
                },
                mobile: {
                    path: 'platform/apps/mobile',
                    framework: 'react-native',
                    platforms: ['android', 'ios'],
                    enabled: true,
                    controller: 'development'
                },
                devtools: {
                    path: 'platform/devtools/portal',
                    framework: 'nextjs',
                    port: 3003,
                    enabled: true,
                    controller: 'development'
                },
                testing: {
                    path: 'platform/testing',
                    frameworks: ['jest', 'playwright', 'k6'],
                    enabled: true,
                    controller: 'build'
                }
            },
            coordination: {
                eventBridge: true,
                sharedState: true,
                crossControllerCommunication: true
            },
            healthCheck: {
                interval: 60000, // 1 minute
                timeout: 30000,  // 30 seconds
                enabled: true
            }
        };
    }

    /**
     * 🌍 Initialize Manager
     */
    async initializeManager() {
        try {
            console.log('🌍 Initializing Enhanced Controller Manager...');
            
            // Load environment first
            await envLoader.load();
            
            // Initialize configuration managers
            await this.initializeConfigManagers();
            
            // Initialize platform services registry
            this.initializePlatformServices();
            
            // Initialize all configured controllers
            await this.initializeControllers();
            
            // Setup inter-controller communication
            this.setupControllerCommunication();
            
            // Start health monitoring
            this.startHealthMonitoring();
            
            // Auto-start enabled controllers
            await this.autoStartControllers();
            
            this.isInitialized = true;
            console.log('✅ Enhanced Controller Manager ready');
            console.log(`🎛️ Active Controllers: ${this.activeControllers.size}`);
            console.log(`🏗️ Platform Services: ${Object.keys(this.managerConfig.platformServices).length}`);
            this.emit('ready');
            
        } catch (error) {
            console.error(`💥 Controller Manager initialization failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * ⚙️ Initialize Configuration Managers
     */
    async initializeConfigManagers() {
        console.log('⚙️ Initializing configuration managers...');
        
        try {
            // Initialize master config manager
            await this.masterConfig.initialize();
            this.configManagers.set('master', this.masterConfig);
            
            // Initialize system config
            await this.systemConfig.initialize();
            this.configManagers.set('system', this.systemConfig);
            
            // Initialize environment config
            await this.envConfig.initialize();
            this.configManagers.set('environment', this.envConfig);
            
            console.log('✅ Configuration managers initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize configuration managers:', error.message);
            throw error;
        }
    }

    /**
     * 🏗️ Initialize Platform Services Registry
     */
    initializePlatformServices() {
        console.log('🏗️ Initializing platform services registry...');
        
        for (const [serviceName, config] of Object.entries(this.managerConfig.platformServices)) {
            if (config.enabled) {
                this.platformServices.set(serviceName, {
                    ...config,
                    status: 'registered',
                    healthStatus: 'unknown',
                    lastHealthCheck: null
                });
                
                console.log(`📦 Registered service: ${serviceName} (${config.framework || 'system'})`);
            }
        }
        
        console.log(`✅ Platform services registry initialized (${this.platformServices.size} services)`);
    }

    /**
     * 🏗️ Initialize Controllers
     */
    async initializeControllers() {
        console.log('🏗️ Initializing controllers by priority...');
        
        // Sort controllers by priority
        const sortedControllers = Object.entries(this.managerConfig.controllers)
            .filter(([, config]) => config.enabled)
            .sort(([, a], [, b]) => (a.priority || 999) - (b.priority || 999));
        
        for (const [name, config] of sortedControllers) {
            try {
                console.log(`🔧 Initializing ${name} controller (priority: ${config.priority || 'default'})...`);
                
                // Check dependencies
                if (config.dependencies) {
                    await this.waitForDependencies(config.dependencies);
                }
                
                // Create controller instance with enhanced initialization
                let controller;
                if (name === 'database') {
                    controller = new config.class(process.cwd());
                } else if (name === 'build') {
                    // Pass reference to main controller for build controller
                    const mainController = this.controllers.get('main')?.instance;
                    controller = new config.class(mainController);
                } else {
                    controller = new config.class();
                }
                
                // Store controller reference with enhanced metadata
                this.controllers.set(name, {
                    instance: controller,
                    config,
                    status: 'initialized',
                    startTime: null,
                    healthStatus: 'unknown',
                    priority: config.priority || 999,
                    dependencies: config.dependencies || []
                });
                
                // Setup event forwarding
                this.setupControllerEvents(name, controller);
                
                console.log(`✅ ${name} controller initialized`);
                
            } catch (error) {
                console.error(`❌ Failed to initialize ${name} controller: ${error.message}`);
                
                // Store failed controller info
                this.controllers.set(name, {
                    instance: null,
                    config,
                    status: 'failed',
                    error: error.message,
                    priority: config.priority || 999,
                    dependencies: config.dependencies || []
                });
            }
        }
        
        // Handle disabled controllers
        Object.entries(this.managerConfig.controllers)
            .filter(([, config]) => !config.enabled)
            .forEach(([name]) => console.log(`⏭️ ${name} controller disabled`));
        
        // Log initialization summary
        const initialized = Array.from(this.controllers.values()).filter(c => c.status === 'initialized').length;
        const failed = Array.from(this.controllers.values()).filter(c => c.status === 'failed').length;
        
        console.log(`✅ Controller initialization complete: ${initialized} initialized, ${failed} failed`);
    }

    /**
     * ⏳ Wait for Dependencies
     */
    async waitForDependencies(dependencies) {
        console.log(`⏳ Waiting for dependencies: ${dependencies.join(', ')}`);
        
        for (const dep of dependencies) {
            let attempts = 0;
            const maxAttempts = 30; // 30 seconds timeout
            
            while (attempts < maxAttempts) {
                const controller = this.controllers.get(dep);
                if (controller && controller.status === 'initialized') {
                    console.log(`✅ Dependency ${dep} ready`);
                    break;
                }
                
                await new Promise(resolve => setTimeout(resolve, 1000));
                attempts++;
            }
            
            if (attempts >= maxAttempts) {
                throw new Error(`Dependency ${dep} not ready after ${maxAttempts} seconds`);
            }
        }
    }

    /**
     * 🔗 Setup Controller Communication
     */
    setupControllerCommunication() {
        console.log('🔗 Setting up inter-controller communication...');
        
        if (this.managerConfig.coordination.eventBridge) {
            this.setupEventBridge();
        }
        
        if (this.managerConfig.coordination.sharedState) {
            this.setupSharedState();
        }
        
        console.log('✅ Controller communication established');
    }

    /**
     * 🌉 Setup Event Bridge
     */
    setupEventBridge() {
        // Create shared event bus for controllers
        this.eventBridge = new EventEmitter();
        
        // Forward events between controllers
        for (const [name, controllerData] of this.controllers) {
            if (controllerData.instance) {
                // Forward controller events to bridge
                controllerData.instance.on('*', (eventName, ...args) => {
                    this.eventBridge.emit(`${name}:${eventName}`, ...args);
                });
                
                // Allow controllers to listen to bridge events
                controllerData.instance.eventBridge = this.eventBridge;
            }
        }
    }

    /**
     * 🔄 Setup Shared State
     */
    setupSharedState() {
        // Create shared state object
        this.sharedState = {
            environment: envLoader.get('NODE_ENV'),
            deployment: {
                version: envLoader.get('VERSION'),
                buildDate: envLoader.get('BUILD_DATE')
            },
            system: {
                startTime: new Date(),
                uptime: 0
            },
            controllers: {}
        };
        
        // Make shared state available to all controllers
        for (const [name, controllerData] of this.controllers) {
            if (controllerData.instance) {
                controllerData.instance.sharedState = this.sharedState;
            }
        }
    }

    /**
     * 📡 Setup Controller Events
     */
    setupControllerEvents(name, controller) {
        // Forward important events
        const eventsToForward = ['ready', 'error', 'alert', 'status'];
        
        eventsToForward.forEach(eventName => {
            controller.on(eventName, (...args) => {
                this.emit(`controller:${name}:${eventName}`, ...args);
            });
        });
        
        // Handle controller-specific events
        controller.on('ready', () => {
            this.updateControllerStatus(name, 'ready');
        });
        
        controller.on('error', (error) => {
            this.updateControllerStatus(name, 'error', error.message);
        });
    }

    /**
     * 🚀 Auto-start Controllers
     */
    async autoStartControllers() {
        console.log('🚀 Auto-starting enabled controllers...');
        
        for (const [name, config] of Object.entries(this.managerConfig.controllers)) {
            if (config.enabled && config.autoStart) {
                await this.startController(name);
            }
        }
        
        console.log('✅ Auto-start completed');
    }

    /**
     * 🎮 Start Controller
     */
    async startController(name) {
        const controllerData = this.controllers.get(name);
        
        if (!controllerData) {
            throw new Error(`Controller not found: ${name}`);
        }
        
        if (!controllerData.instance) {
            throw new Error(`Controller ${name} failed to initialize`);
        }
        
        if (this.activeControllers.has(name)) {
            console.log(`ℹ️ Controller ${name} already active`);
            return;
        }
        
        try {
            console.log(`🚀 Starting ${name} controller...`);
            
            // Call start method if it exists
            if (typeof controllerData.instance.start === 'function') {
                await controllerData.instance.start();
            }
            
            this.activeControllers.add(name);
            this.updateControllerStatus(name, 'active');
            
            console.log(`✅ ${name} controller started`);
            this.emit('controllerStarted', name);
            
        } catch (error) {
            console.error(`❌ Failed to start ${name} controller: ${error.message}`);
            this.updateControllerStatus(name, 'failed', error.message);
            throw error;
        }
    }

    /**
     * 🛑 Stop Controller
     */
    async stopController(name) {
        const controllerData = this.controllers.get(name);
        
        if (!controllerData || !this.activeControllers.has(name)) {
            console.log(`ℹ️ Controller ${name} not active`);
            return;
        }
        
        try {
            console.log(`🛑 Stopping ${name} controller...`);
            
            // Call stop method if it exists
            if (typeof controllerData.instance.stop === 'function') {
                await controllerData.instance.stop();
            }
            
            this.activeControllers.delete(name);
            this.updateControllerStatus(name, 'stopped');
            
            console.log(`✅ ${name} controller stopped`);
            this.emit('controllerStopped', name);
            
        } catch (error) {
            console.error(`❌ Failed to stop ${name} controller: ${error.message}`);
            throw error;
        }
    }

    /**
     * 🔄 Restart Controller
     */
    async restartController(name) {
        console.log(`🔄 Restarting ${name} controller...`);
        
        if (this.activeControllers.has(name)) {
            await this.stopController(name);
        }
        
        // Wait a bit before restarting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await this.startController(name);
        
        console.log(`✅ ${name} controller restarted`);
    }

    /**
     * 📊 Update Controller Status
     */
    updateControllerStatus(name, status, error = null) {
        const controllerData = this.controllers.get(name);
        if (controllerData) {
            controllerData.status = status;
            controllerData.lastUpdate = new Date();
            
            if (error) {
                controllerData.error = error;
            }
            
            if (status === 'active') {
                controllerData.startTime = new Date();
            }
            
            // Update shared state
            if (this.sharedState) {
                this.sharedState.controllers[name] = {
                    status,
                    lastUpdate: controllerData.lastUpdate,
                    error
                };
            }
        }
    }

    /**
     * 🏥 Start Health Monitoring
     */
    startHealthMonitoring() {
        if (!this.managerConfig.healthCheck.enabled) return;
        
        console.log('🏥 Starting controller health monitoring...');
        
        this.healthInterval = setInterval(async () => {
            await this.performHealthChecks();
        }, this.managerConfig.healthCheck.interval);
        
        console.log(`✅ Health monitoring active (${this.managerConfig.healthCheck.interval}ms interval)`);
    }

    /**
     * 🔍 Perform Health Checks
     */
    async performHealthChecks() {
        for (const [name, controllerData] of this.controllers) {
            if (this.activeControllers.has(name) && controllerData.instance) {
                try {
                    // Call health check method if it exists
                    if (typeof controllerData.instance.performHealthCheck === 'function') {
                        const healthResult = await Promise.race([
                            controllerData.instance.performHealthCheck(),
                            new Promise((_, reject) => 
                                setTimeout(() => reject(new Error('Health check timeout')), 
                                this.managerConfig.healthCheck.timeout)
                            )
                        ]);
                        
                        controllerData.healthStatus = healthResult.healthy ? 'healthy' : 'unhealthy';
                        controllerData.healthDetails = healthResult;
                        
                    } else {
                        // Basic health check - just verify controller is responsive
                        controllerData.healthStatus = 'healthy';
                    }
                    
                } catch (error) {
                    console.error(`❌ Health check failed for ${name}: ${error.message}`);
                    controllerData.healthStatus = 'unhealthy';
                    controllerData.healthError = error.message;
                    
                    // Emit health alert
                    this.emit('healthAlert', { controller: name, error: error.message });
                }
            }
        }
    }

    /**
     * 📊 Get System Status
     */
    getSystemStatus() {
        const status = {
            manager: {
                initialized: this.isInitialized,
                uptime: this.isInitialized ? Date.now() - this.sharedState.system.startTime.getTime() : 0,
                environment: envLoader.get('NODE_ENV')
            },
            controllers: {},
            active: this.activeControllers.size,
            total: this.controllers.size,
            health: 'unknown'
        };
        
        let healthyControllers = 0;
        let totalActive = 0;
        
        for (const [name, controllerData] of this.controllers) {
            status.controllers[name] = {
                enabled: controllerData.config.enabled,
                status: controllerData.status,
                active: this.activeControllers.has(name),
                health: controllerData.healthStatus || 'unknown',
                startTime: controllerData.startTime,
                uptime: controllerData.startTime ? Date.now() - controllerData.startTime.getTime() : 0,
                error: controllerData.error
            };
            
            if (this.activeControllers.has(name)) {
                totalActive++;
                if (controllerData.healthStatus === 'healthy') {
                    healthyControllers++;
                }
            }
        }
        
        // Determine overall health
        if (totalActive === 0) {
            status.health = 'no-controllers';
        } else if (healthyControllers === totalActive) {
            status.health = 'healthy';
        } else if (healthyControllers > totalActive * 0.5) {
            status.health = 'degraded';
        } else {
            status.health = 'critical';
        }
        
        return status;
    }

    /**
     * 🛠️ Execute Controller Command
     */
    async executeControllerCommand(controllerName, command, ...args) {
        const controllerData = this.controllers.get(controllerName);
        
        if (!controllerData || !controllerData.instance) {
            throw new Error(`Controller ${controllerName} not available`);
        }
        
        const controller = controllerData.instance;
        
        if (typeof controller[command] !== 'function') {
            throw new Error(`Command ${command} not available on ${controllerName} controller`);
        }
        
        console.log(`🛠️ Executing ${command} on ${controllerName} controller...`);
        
        try {
            const result = await controller[command](...args);
            console.log(`✅ Command completed on ${controllerName}`);
            return result;
        } catch (error) {
            console.error(`❌ Command failed on ${controllerName}: ${error.message}`);
            throw error;
        }
    }

    /**
     * 🛑 Shutdown All Controllers
     */
    async shutdown() {
        console.log('🛑 Shutting down Controller Manager...');
        
        // Stop health monitoring
        if (this.healthInterval) {
            clearInterval(this.healthInterval);
        }
        
        // Stop all active controllers
        const stopPromises = Array.from(this.activeControllers).map(name => 
            this.stopController(name).catch(error => 
                console.error(`Failed to stop ${name}: ${error.message}`)
            )
        );
        
        await Promise.all(stopPromises);
        
        console.log('✅ Controller Manager shutdown complete');
    }

    // ===== PLATFORM SERVICE MANAGEMENT METHODS =====

    /**
     * 🏗️ Get Platform Service Status
     */
    getPlatformServiceStatus(serviceName) {
        const service = this.platformServices.get(serviceName);
        if (!service) {
            return { status: 'not-found', error: 'Service not registered' };
        }
        
        return {
            status: service.status,
            healthStatus: service.healthStatus,
            lastHealthCheck: service.lastHealthCheck,
            config: {
                path: service.path,
                framework: service.framework,
                port: service.port,
                enabled: service.enabled
            }
        };
    }

    /**
     * 📊 Get All Platform Services Status
     */
    getAllPlatformServicesStatus() {
        const services = {};
        
        for (const [name, service] of this.platformServices.entries()) {
            services[name] = {
                status: service.status,
                healthStatus: service.healthStatus,
                framework: service.framework,
                port: service.port,
                enabled: service.enabled
            };
        }
        
        return services;
    }

    /**
     * 🎯 Start Platform Service
     */
    async startPlatformService(serviceName) {
        const service = this.platformServices.get(serviceName);
        if (!service) {
            throw new Error(`Platform service '${serviceName}' not found`);
        }

        const controllerName = service.controller;
        const controller = this.controllers.get(controllerName);
        
        if (!controller || !controller.instance) {
            throw new Error(`Controller '${controllerName}' for service '${serviceName}' not available`);
        }

        console.log(`🚀 Starting platform service: ${serviceName}`);
        
        // Delegate to appropriate controller
        if (controller.instance.startService) {
            return await controller.instance.startService(serviceName);
        } else {
            console.log(`⚠️ Service startup delegated to ${controllerName} controller`);
            return { status: 'delegated', controller: controllerName };
        }
    }

    /**
     * 🛑 Stop Platform Service
     */
    async stopPlatformService(serviceName) {
        const service = this.platformServices.get(serviceName);
        if (!service) {
            throw new Error(`Platform service '${serviceName}' not found`);
        }

        const controllerName = service.controller;
        const controller = this.controllers.get(controllerName);
        
        if (!controller || !controller.instance) {
            throw new Error(`Controller '${controllerName}' for service '${serviceName}' not available`);
        }

        console.log(`🛑 Stopping platform service: ${serviceName}`);
        
        // Delegate to appropriate controller
        if (controller.instance.stopService) {
            return await controller.instance.stopService(serviceName);
        } else {
            console.log(`⚠️ Service shutdown delegated to ${controllerName} controller`);
            return { status: 'delegated', controller: controllerName };
        }
    }

    /**
     * 🔄 Restart Platform Service
     */
    async restartPlatformService(serviceName) {
        console.log(`🔄 Restarting platform service: ${serviceName}`);
        
        try {
            await this.stopPlatformService(serviceName);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
            await this.startPlatformService(serviceName);
            
            console.log(`✅ Successfully restarted ${serviceName}`);
            return { status: 'restarted', service: serviceName };
            
        } catch (error) {
            console.error(`❌ Failed to restart ${serviceName}: ${error.message}`);
            throw error;
        }
    }

    /**
     * 🌡️ Check Platform Service Health
     */
    async checkPlatformServiceHealth(serviceName) {
        const service = this.platformServices.get(serviceName);
        if (!service) {
            return { status: 'not-found', error: 'Service not registered' };
        }

        const healthCheck = {
            serviceName,
            timestamp: new Date().toISOString(),
            status: 'checking'
        };

        try {
            // Basic health check based on service type
            if (service.port) {
                const http = require('http');
                const url = `http://localhost:${service.port}/health`;
                
                const response = await new Promise((resolve, reject) => {
                    const req = http.get(url, { timeout: 5000 }, resolve);
                    req.on('error', reject);
                    req.on('timeout', () => reject(new Error('Health check timeout')));
                });
                
                healthCheck.status = response.statusCode === 200 ? 'healthy' : 'unhealthy';
                healthCheck.statusCode = response.statusCode;
                
            } else {
                // For services without HTTP endpoints, check if process is running
                healthCheck.status = service.status === 'running' ? 'healthy' : 'unknown';
            }
            
        } catch (error) {
            healthCheck.status = 'unhealthy';
            healthCheck.error = error.message;
        }

        // Update service health status
        service.healthStatus = healthCheck.status;
        service.lastHealthCheck = healthCheck.timestamp;

        return healthCheck;
    }

    /**
     * 📋 Get Enhanced System Status
     */
    getEnhancedSystemStatus() {
        const controllers = {};
        const platformServices = {};
        
        // Controller status
        for (const [name, controller] of this.controllers.entries()) {
            controllers[name] = {
                status: controller.status,
                healthStatus: controller.healthStatus,
                priority: controller.priority,
                dependencies: controller.dependencies,
                uptime: controller.startTime ? Date.now() - controller.startTime : null
            };
        }
        
        // Platform services status
        for (const [name, service] of this.platformServices.entries()) {
            platformServices[name] = {
                status: service.status,
                healthStatus: service.healthStatus,
                framework: service.framework,
                port: service.port,
                controller: service.controller,
                enabled: service.enabled
            };
        }
        
        return {
            managerStatus: this.isInitialized ? 'ready' : 'initializing',
            environment: process.env.NODE_ENV || 'development',
            uptime: process.uptime(),
            controllers,
            platformServices,
            configManagers: {
                master: this.configManagers.has('master'),
                system: this.configManagers.has('system'),
                environment: this.configManagers.has('environment')
            },
            timestamp: new Date().toISOString()
        };
    }
}

// CLI Interface
if (require.main === module) {
    const manager = new ControllerManager();
    
    const command = process.argv[2] || 'status';
    const controllerName = process.argv[3];
    
    switch (command) {
        case 'status':
            const status = manager.getSystemStatus();
            console.log(JSON.stringify(status, null, 2));
            break;
            
        case 'start':
            if (!controllerName) {
                console.error('❌ Please specify controller name');
                process.exit(1);
            }
            manager.startController(controllerName)
                .then(() => console.log(`✅ Started ${controllerName}`))
                .catch(error => {
                    console.error(`❌ Failed to start ${controllerName}: ${error.message}`);
                    process.exit(1);
                });
            break;
            
        case 'stop':
            if (!controllerName) {
                console.error('❌ Please specify controller name');
                process.exit(1);
            }
            manager.stopController(controllerName)
                .then(() => console.log(`✅ Stopped ${controllerName}`))
                .catch(error => {
                    console.error(`❌ Failed to stop ${controllerName}: ${error.message}`);
                    process.exit(1);
                });
            break;
            
        case 'restart':
            if (!controllerName) {
                console.error('❌ Please specify controller name');
                process.exit(1);
            }
            manager.restartController(controllerName)
                .then(() => console.log(`✅ Restarted ${controllerName}`))
                .catch(error => {
                    console.error(`❌ Failed to restart ${controllerName}: ${error.message}`);
                    process.exit(1);
                });
            break;
            
        case 'help':
            console.log(`
🎛️ Ultra-Core Controller Manager

Usage: node controller-manager.js [COMMAND] [CONTROLLER]

Commands:
  status                Show system status
  start <controller>    Start specific controller
  stop <controller>     Stop specific controller
  restart <controller>  Restart specific controller
  help                  Show this help

Available Controllers:
  main         - Main production controller
  development  - Development workflow controller
  deployment   - Deployment and CI/CD controller
  monitoring   - System monitoring and alerting

Examples:
  node controller-manager.js status
  node controller-manager.js start monitoring
  node controller-manager.js restart development
            `);
            break;
            
        default:
            console.error(`❌ Unknown command: ${command}`);
            console.log('Use "help" for usage information');
            process.exit(1);
    }
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Graceful shutdown initiated...');
        manager.shutdown().then(() => {
            process.exit(0);
        });
    });
}

module.exports = ControllerManager;
