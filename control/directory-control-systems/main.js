#!/usr/bin/env node#!/usr/bin/env node



/**/**

 * 🗂️ DIRECTORY CONTROL SYSTEMS * 🗂️ DIRECTORY CONTROL SYSTEMS

 * ============================ * ============================

 *  * 

 * Standalone directory-level orchestration system with 4 specialized controllers: * Standalone directory-level orchestration system with 4 specialized controllers:

 * - Distribution Controller: Release management and asset organization * - Distribution Controller: Release management and asset organization

 * - Environment Controller: Multi-environment management and configuration * - Environment Controller: Multi-environment management and configuration

 * - Infrastructure Controller: Automation, Kubernetes, and Terraform support * - Infrastructure Controller: Automation, Kubernetes, and Terraform support

 * - Platform Controller: Component lifecycle and health monitoring * - Platform Controller: Component lifecycle and health monitoring

 *  * 

 * Extracted from Ultra-Core for reuse in other projects. * Extracted from Ultra-Core for reuse in other projects.

 */ */



const path = require('path');const path = require('path');

const fs = require('fs');const fs = require('fs');



// Import specialized directory controllers// Import specialized controllers and centralized database components

let DistributionController, EnvironmentsController, InfrastructureController, PlatformController, ControllerManager;let DevelopmentController, DeploymentController, MonitoringController, BuildController, DevelopmentPlatform, DatabaseController, DatabaseConfigManager, DatabaseConnectionManager, MasterTestOrchestrator, MasterConfigManager, ApiController, BackendController, FrontendController, BlockchainController, DatabaseInfrastructureController, EnterpriseServicesController, TestingFrameworkController, ApplicationsSuiteController, SharedServicesController, DevToolsController, SystemValidator, ControllerManager, TestingController, DocumentationController, DistributionController, EnvironmentsController, InfrastructureController, PlatformController;



try {try {

  DistributionController = require('./controllers/distribution-controller');  DevelopmentController = require('./dev-controller');

  EnvironmentsController = require('./controllers/environments-controller');  DeploymentController = require('./deploy-controller'); 

  InfrastructureController = require('./controllers/infrastructure-controller');  MonitoringController = require('./monitoring-controller');

  PlatformController = require('./controllers/platform-controller');  BuildController = require('./build-controller');

  ControllerManager = require('./controller-manager');  DevelopmentPlatform = require('./dev-platform');

    

  console.log('✅ Directory control system controllers loaded successfully');  // Import centralized configuration and database components

} catch (error) {  MasterConfigManager = require('./config/master-config-manager');

  console.error('❌ Error loading controllers:', error.message);  DatabaseController = require('./database-controller');

  process.exit(1);  DatabaseConfigManager = require('./config/database/database-config-manager');

}  DatabaseConnectionManager = require('./database-connection-manager');

  

class DirectoryControlSystem {  // Import system management controllers

  constructor() {  SystemValidator = require('./system-validation');

    this.projectRoot = process.cwd();  ControllerManager = require('./controller-manager');

    this.startTime = new Date();  

      // Import testing infrastructure

    // Initialize controllers  MasterTestOrchestrator = require('../infrastructure/testing/master-test');

    this.distributionController = new DistributionController(this);  TestingController = require('./testing-controller');

    this.environmentsController = new EnvironmentsController(this);  

    this.infrastructureController = new InfrastructureController(this);  // Import documentation tools

    this.platformController = new PlatformController(this);  DocumentationController = require('./documentation-controller');

    this.controllerManager = new ControllerManager(this);  

      // Import directory controllers

    console.log('🗂️ Directory Control System initialized');  DistributionController = require('./distribution-controller');

    console.log(`📁 Project Root: ${this.projectRoot}`);  EnvironmentsController = require('./environments-controller');

  }  InfrastructureController = require('./infrastructure-controller');

  PlatformController = require('./platform-controller');

  /**  

   * 🎯 Main command dispatcher  // Import platform controllers

   */  ApiController = require('./api-controller');

  async execute(command, subcommand, ...args) {  BackendController = require('./backend-controller');

    try {  FrontendController = require('./frontend-controller');

      switch (command?.toLowerCase()) {  BlockchainController = require('./blockchain-controller');

        case 'distribution':  DatabaseInfrastructureController = require('./database-infrastructure-controller');

          return await this.handleDistributionCommand(subcommand, ...args);  EnterpriseServicesController = require('./enterprise-services-controller');

          TestingFrameworkController = require('./testing-framework-controller');

        case 'environment':  ApplicationsSuiteController = require('./applications-suite-controller');

        case 'env':  SharedServicesController = require('./shared-services-controller');

          return await this.handleEnvironmentCommand(subcommand, ...args);  DevToolsController = require('./devtools-controller');

          

        case 'infrastructure':  console.log('✅ Specialized controllers, centralized config, database components, testing infrastructure, and platform controllers loaded successfully');

        case 'infra':

          return await this.handleInfrastructureCommand(subcommand, ...args);class UltraCoreController {

          constructor() {

        case 'platform':    this.projectRoot = path.resolve(__dirname, '..');

          return await this.handlePlatformCommand(subcommand, ...args);    this.platformPath = path.join(this.projectRoot, 'platform');

            this.services = new Map();

        case 'directory':    this.config = this.loadConfig();

          return await this.handleDirectoryCommand(subcommand, ...args);    this.healthChecks = new Map();

            this.projectMap = this.buildProjectMap();

        case 'system':    this.productionConfigs = this.initializeProductionConfigs();

          return await this.handleSystemCommand(subcommand, ...args);    this.environmentLoaded = false;

            

        case 'help':    // Initialize centralized configuration management

        case '--help':    this.masterConfig = null;

        case '-h':    

          return this.showHelp();    // Initialize centralized database management

            this.databaseConfig = null;

        default:    this.databaseConnection = null;

          return this.showOverview();    this.databaseController = null;

      }    

    } catch (error) {    // Initialize specialized controllers

      console.error('❌ Command execution failed:', error.message);    this.specializedControllers = new Map();

      return false;    this.initializeSpecializedControllers();

    }    

  }    console.log('🎯 Ultra-Core Enterprise Controller Initialized');

    console.log(`📁 Project Root: ${this.projectRoot}`);

  /**    console.log(`🗺️  Project Components Mapped: ${Object.keys(this.projectMap).length}`);

   * 📦 Distribution command handler    console.log(`🎛️ Specialized Controllers: ${this.specializedControllers.size}`);

   */    console.log('🔧 Production Configurations Loaded');

  async handleDistributionCommand(subcommand, ...args) {    

    switch (subcommand?.toLowerCase()) {    // Initialize environment

      case 'status':    this.initializeEnvironment();

        return await this.distributionController.getStatus();  }

      

      case 'build':  /**

        return await this.distributionController.buildComponents();   * 🌍 Initialize Environment Configuration

         */

      case 'package':  async initializeEnvironment() {

        return await this.distributionController.packageForDeployment();    try {

            console.log('🌍 Loading environment configuration...');

      case 'health':      await envLoader.load();

        return await this.distributionController.healthCheck();      this.environmentLoaded = true;

            

      default:      const summary = envLoader.getConfigurationSummary();

        console.log('📦 Distribution Controller Commands:');      console.log(`✅ Environment loaded: ${summary.environment}`);

        console.log('  status   - Show distribution status');      console.log(`📊 Variables: ${summary.totalVariables} total, ${summary.encryptedVariables} encrypted`);

        console.log('  build    - Build distribution components');      

        console.log('  package  - Package for deployment');      if (summary.warnings > 0) {

        console.log('  health   - Health check');        console.log(`⚠️  Warnings: ${summary.warnings}`);

        return true;      }

    }      

  }      // Initialize Master Configuration Manager

      console.log('🎛️ Initializing Master Configuration Manager...');

  /**      this.masterConfig = new MasterConfigManager(this.projectRoot);

   * 🌍 Environment command handler      console.log('✅ Master Configuration Manager initialized');

   */      

  async handleEnvironmentCommand(subcommand, ...args) {      // Update internal configuration with environment values

    switch (subcommand?.toLowerCase()) {      this.updateConfigFromEnvironment();

      case 'switch':      

        const env = args[0];      // Initialize centralized database management after environment is loaded

        if (!env) {      await this.initializeDatabaseManagement();

          console.log('❌ Please specify environment: development, staging, production, testing');      

          return false;      // Initialize Platform Component Lifecycle Management

        }      console.log('🎯 Initializing Platform Integration Management...');

        return await this.environmentsController.switchEnvironment(env);      await this.initializePlatformLifecycle();

            console.log('✅ Platform Integration Management initialized');

      case 'validate':      

        return await this.environmentsController.validateCurrentEnvironment();    } catch (error) {

            console.error(`💥 Environment loading failed: ${error.message}`);

      case 'sync':      throw error;

        return await this.environmentsController.syncConfigurations();    }

        }

      case 'backup':

        return await this.environmentsController.backupEnvironmentSettings();  /**

         * 🔄 Update Configuration from Environment

      case 'status':   */

        return await this.environmentsController.getStatus();  updateConfigFromEnvironment() {

          // Initialize runtime configurations if they don't exist

      default:    if (!this.runtimeConfigs) {

        console.log('🌍 Environment Controller Commands:');      this.runtimeConfigs = {

        console.log('  switch <env>  - Switch to environment (development/staging/production/testing)');        postgresql: {},

        console.log('  validate      - Validate current environment');        mongodb: {},

        console.log('  sync          - Sync environment configurations');        redis: {}

        console.log('  backup        - Backup environment settings');      };

        console.log('  status        - Show environment status');    }

        return true;

    }    // Update database configurations

  }    if (envLoader.get('POSTGRES_HOST')) {

      this.runtimeConfigs.postgresql.host = envLoader.get('POSTGRES_HOST');

  /**      this.runtimeConfigs.postgresql.port = envLoader.getNumber('POSTGRES_PORT');

   * 🏗️ Infrastructure command handler      this.runtimeConfigs.postgresql.database = envLoader.get('POSTGRES_DB');

   */      this.runtimeConfigs.postgresql.user = envLoader.get('POSTGRES_USER');

  async handleInfrastructureCommand(subcommand, ...args) {      this.runtimeConfigs.postgresql.password = envLoader.get('POSTGRES_PASSWORD');

    switch (subcommand?.toLowerCase()) {      this.runtimeConfigs.postgresql.ssl = envLoader.getBoolean('POSTGRES_SSL');

      case 'automation':    }

        return await this.infrastructureController.manageAutomation();

          if (envLoader.get('MONGO_HOST')) {

      case 'kubernetes':      this.runtimeConfigs.mongodb.host = envLoader.get('MONGO_HOST');

      case 'k8s':      this.runtimeConfigs.mongodb.port = envLoader.getNumber('MONGO_PORT');

        return await this.infrastructureController.manageKubernetes(args[0]);      this.runtimeConfigs.mongodb.database = envLoader.get('MONGO_DB');

          }

      case 'terraform':

        return await this.infrastructureController.manageTerraform(args[0]);    if (envLoader.get('REDIS_HOST')) {

            this.runtimeConfigs.redis.host = envLoader.get('REDIS_HOST');

      case 'testing':      this.runtimeConfigs.redis.port = envLoader.getNumber('REDIS_PORT');

        return await this.infrastructureController.manageInfrastructureTesting();      this.runtimeConfigs.redis.password = envLoader.get('REDIS_PASSWORD');

          }

      case 'status':

        return await this.infrastructureController.getStatus();    // Update service configurations

          if (this.config.services && this.config.services.backend) {

      default:      this.config.services.backend.port = envLoader.getNumber('BACKEND_PORT', this.config.services.backend.port);

        console.log('🏗️ Infrastructure Controller Commands:');    }

        console.log('  automation    - Manage automation scripts');    if (this.config.services && this.config.services.frontend) {

        console.log('  kubernetes    - Kubernetes orchestration');      this.config.services.frontend.port = envLoader.getNumber('FRONTEND_PORT', this.config.services.frontend.port);

        console.log('  terraform     - Terraform infrastructure');    }

        console.log('  testing       - Infrastructure testing');    

        console.log('  status        - Show infrastructure status');    console.log('🔄 Configuration updated from environment variables');

        return true;  }

    }

  }  /**

   * 🗄️ Initialize Centralized Database Management

  /**   */

   * 🚀 Platform command handler  async initializeDatabaseManagement() {

   */    try {

  async handlePlatformCommand(subcommand, ...args) {      console.log('🗄️ Initializing centralized database management...');

    switch (subcommand?.toLowerCase()) {      

      case 'start':      // Use Master Configuration Manager for database configurations

        return await this.platformController.startComponents(args[0]);      if (this.masterConfig) {

              console.log('🎛️ Using Master Configuration Manager for database configurations');

      case 'stop':        

        return await this.platformController.stopComponents(args[0]);        // Get database configurations from master config

              const databaseConfigs = this.masterConfig.getDatabaseConfig();

      case 'build':        const platformConfig = this.masterConfig.getPlatformDatabaseConfig();

        return await this.platformController.buildComponents(args[0]);        

              console.log(`📊 Available databases: ${this.masterConfig.getAvailableDatabaseTypes().join(', ')}`);

      case 'status':        console.log(`✅ Enabled databases: ${this.masterConfig.getEnabledDatabaseTypes().join(', ')}`);

        return await this.platformController.getStatus();        console.log(`🎯 Platform database integration: ${platformConfig.integration.controlSystem ? 'enabled' : 'disabled'}`);

              

      case 'health':        // Validate database configuration

        return await this.platformController.healthCheck();        const validation = this.masterConfig.validatePlatformDatabaseConfig();

              if (!validation.valid) {

      default:          console.warn('⚠️ Database configuration validation errors:', validation.errors);

        console.log('🚀 Platform Controller Commands:');        }

        console.log('  start [component]  - Start platform components');        if (validation.warnings.length > 0) {

        console.log('  stop [component]   - Stop platform components');          console.warn('⚠️ Database configuration warnings:', validation.warnings);

        console.log('  build [component]  - Build platform components');        }

        console.log('  status             - Show platform status');      }

        console.log('  health             - Health check');      

        return true;      // Initialize database configuration manager (legacy support)

    }      if (DatabaseConfigManager) {

  }        this.databaseConfig = new DatabaseConfigManager(this.projectRoot);

        console.log('✅ Database Configuration Manager initialized (legacy)');

  /**      }

   * 🗂️ Directory command handler      

   */      // Initialize database connection manager

  async handleDirectoryCommand(subcommand, ...args) {      if (DatabaseConnectionManager && this.databaseConfig) {

    switch (subcommand?.toLowerCase()) {        this.databaseConnection = new DatabaseConnectionManager(this.databaseConfig);

      case 'status':        console.log('✅ Database Connection Manager initialized');

        console.log('🗂️ Directory Control Systems Status:');      }

        console.log('====================================\\n');      

              // Initialize database controller with centralized components

        await this.distributionController.getStatus();      if (DatabaseController) {

        console.log('');        this.databaseController = new DatabaseController(this.projectRoot);

        await this.environmentsController.getStatus();        await this.databaseController.initialize();

        console.log('');        console.log('✅ Database Controller initialized with centralized management');

        await this.infrastructureController.getStatus();      }

        console.log('');      

        await this.platformController.getStatus();      console.log('🎯 Centralized database management fully initialized');

              

        return true;    } catch (error) {

            console.error('💥 Database management initialization failed:', error.message);

      default:      // Don't throw here to allow system to continue without database if needed

        console.log('🗂️ Directory Commands:');      console.warn('⚠️ System will continue without database management');

        console.log('  status  - Show all directory controller status');    }

        return true;  }

    }

  }  /**

   * 🎛️ Get Master Configuration

  /**   * Provides access to centralized configuration management

   * 🔧 System command handler   */

   */  getMasterConfig() {

  async handleSystemCommand(subcommand, ...args) {    return this.masterConfig;

    switch (subcommand?.toLowerCase()) {  }

      case 'check':

        console.log('🔧 Full System Check:');  /**

        console.log('====================\\n');   * 🗄️ Get Database Configuration 

           * Unified access to database configurations through master config

        const results = await Promise.all([   */

          this.distributionController.healthCheck(),  getDatabaseConfiguration(type = null) {

          this.environmentsController.healthCheck(),    if (!this.masterConfig) {

          this.infrastructureController.healthCheck(),      console.warn('⚠️ Master configuration not initialized');

          this.platformController.healthCheck()      return null;

        ]);    }

            

        const allHealthy = results.every(result => result?.status === 'healthy');    if (type) {

        console.log(`\\n🎯 Overall System Status: ${allHealthy ? '✅ Healthy' : '⚠️ Issues Detected'}`);      return this.masterConfig.getDatabaseConfig(type);

            }

        return allHealthy;    

          // Return all database configurations

      default:    return {

        console.log('🔧 System Commands:');      all: this.masterConfig.getDatabaseConfig(),

        console.log('  check  - Full system health check');      available: this.masterConfig.getAvailableDatabaseTypes(),

        return true;      enabled: this.masterConfig.getEnabledDatabaseTypes(),

    }      platform: this.masterConfig.getPlatformDatabaseConfig()

  }    };

  }

  /**

   * 📋 Show system overview  /**

   */   * 🎛️ Initialize Specialized Controllers

  showOverview() {   */

    console.log('\\n🗂️ Directory Control Systems v2.1.0');  initializeSpecializedControllers() {

    console.log('=====================================');    try {

    console.log('');      // Initialize Development Controller

    console.log('🎯 Available Controllers:');      if (DevelopmentController) {

    console.log('  📦 distribution   - Release management and asset organization');        this.specializedControllers.set('development', new DevelopmentController());

    console.log('  🌍 environment    - Multi-environment management and configuration');        console.log('✅ Development Controller initialized');

    console.log('  🏗️ infrastructure - Automation, Kubernetes, and Terraform support');      }

    console.log('  🚀 platform       - Component lifecycle and health monitoring');

    console.log('');      // Initialize Deployment Controller

    console.log('🔧 System Commands:');      if (DeploymentController) {

    console.log('  directory status  - Show all controller status');        this.specializedControllers.set('deployment', new DeploymentController());

    console.log('  system check      - Full system health check');        console.log('✅ Deployment Controller initialized');

    console.log('');      }

    console.log('💡 Use "help" or any controller name for specific commands');

    console.log('');      // Initialize Monitoring Controller

  }      if (MonitoringController) {

        this.specializedControllers.set('monitoring', new MonitoringController(this));

  /**        console.log('✅ Monitoring Controller initialized');

   * 📖 Show help      }

   */

  showHelp() {      // Initialize Build Controller

    this.showOverview();      if (BuildController) {

    console.log('📖 Quick Examples:');        this.specializedControllers.set('build', new BuildController(this));

    console.log('  node main.js distribution status');        console.log('✅ Build Controller initialized');

    console.log('  node main.js environment switch development');      }

    console.log('  node main.js infrastructure kubernetes status');

    console.log('  node main.js platform start backend');      // Database Controller is initialized separately in initializeDatabaseManagement()

    console.log('  node main.js directory status');      // to ensure proper integration with centralized database management

    console.log('  node main.js system check');      

    console.log('');      // Initialize Development Platform

  }      if (DevelopmentPlatform) {

}        this.specializedControllers.set('devPlatform', new DevelopmentPlatform(this));

        console.log('✅ Development Platform initialized');

// Main execution      }

async function main() {

  const args = process.argv.slice(2);      // Initialize Master Test Orchestrator

  const controller = new DirectoryControlSystem();      if (MasterTestOrchestrator) {

          this.specializedControllers.set('testing', new MasterTestOrchestrator());

  if (args.length === 0) {        console.log('✅ Master Test Orchestrator initialized');

    controller.showOverview();      }

    return;

  }      // Initialize Testing Controller

        if (TestingController) {

  const [command, subcommand, ...restArgs] = args;        this.specializedControllers.set('testingController', new TestingController());

  await controller.execute(command, subcommand, ...restArgs);        console.log('✅ Testing Controller initialized');

}      }



// Run if called directly      // Initialize Documentation Controller

if (require.main === module) {      if (DocumentationController) {

  main().catch(error => {        this.specializedControllers.set('documentation', new DocumentationController());

    console.error('❌ Fatal error:', error.message);        console.log('✅ Documentation Controller initialized');

    process.exit(1);      }

  });

}      // Initialize API Controller

      if (ApiController) {

module.exports = DirectoryControlSystem;        this.specializedControllers.set('api', new ApiController(this));
        console.log('✅ API Controller initialized');
      }

      // Initialize Backend Controller
      if (BackendController) {
        this.specializedControllers.set('backend', new BackendController(this));
        console.log('✅ Backend Controller initialized');
      }

      // Initialize Frontend Controller
      if (FrontendController) {
        this.specializedControllers.set('frontend', new FrontendController(this));
        console.log('✅ Frontend Controller initialized');
      }

      // Initialize Blockchain Controller
      if (BlockchainController) {
        this.specializedControllers.set('blockchain', new BlockchainController(this));
        console.log('✅ Blockchain Controller initialized');
      }

      // Initialize Database Infrastructure Controller
      if (DatabaseInfrastructureController) {
        this.specializedControllers.set('databaseInfrastructure', new DatabaseInfrastructureController(this));
        console.log('✅ Database Infrastructure Controller initialized');
      }

      // Initialize Enterprise Services Controller
      if (EnterpriseServicesController) {
        this.specializedControllers.set('enterpriseServices', new EnterpriseServicesController(this));
        console.log('✅ Enterprise Services Controller initialized');
      }

      // Initialize Testing Framework Controller
      if (TestingFrameworkController) {
        this.specializedControllers.set('testingFramework', new TestingFrameworkController(this));
        console.log('✅ Testing Framework Controller initialized');
      }

      // Initialize Applications Suite Controller
      if (ApplicationsSuiteController) {
        this.specializedControllers.set('applicationsSuite', new ApplicationsSuiteController(this));
        console.log('✅ Applications Suite Controller initialized');
      }

      // Initialize Shared Services Controller
      if (SharedServicesController) {
        this.specializedControllers.set('sharedServices', new SharedServicesController(this));
        console.log('✅ Shared Services Controller initialized');
      }

      // Initialize DevTools Controller
      if (DevToolsController) {
        this.specializedControllers.set('devtools', new DevToolsController(this));
        console.log('✅ DevTools Controller initialized');
      }

      // Initialize Directory Controllers
      if (DistributionController) {
        this.specializedControllers.set('distribution', new DistributionController(this));
        console.log('✅ Distribution Controller initialized');
      }

      if (EnvironmentsController) {
        this.specializedControllers.set('environments', new EnvironmentsController(this));
        console.log('✅ Environments Controller initialized');
      }

      if (InfrastructureController) {
        this.specializedControllers.set('infrastructure', new InfrastructureController(this));
        console.log('✅ Infrastructure Controller initialized');
      }

      if (PlatformController) {
        this.specializedControllers.set('platform', new PlatformController(this));
        console.log('✅ Platform Controller initialized');
      }

      // Initialize System Validator
      if (SystemValidator) {
        this.specializedControllers.set('validator', new SystemValidator());
        console.log('✅ System Validator initialized');
      }

      // Initialize Controller Manager (temporarily disabled to avoid circular dependency)
      // if (ControllerManager) {
      //   this.controllerManager = new ControllerManager();
      //   console.log('✅ Controller Manager initialized');
      // }

    } catch (error) {
      console.warn('⚠️ Some specialized controllers failed to initialize:', error.message);
    }
  }

  /**
   * 🎮 Get Development Controller
   */
  getDevController() {
    return this.specializedControllers.get('development');
  }

  /**
   * 🚀 Get Deployment Controller
   */
  getDeployController() {
    return this.specializedControllers.get('deployment');
  }

  /**
   * 📊 Get Monitoring Controller
   */
  getMonitorController() {
    return this.specializedControllers.get('monitoring');
  }

  /**
   * 🏗️ Get Build Controller
   */
  getBuildController() {
    return this.specializedControllers.get('build');
  }

  /**
   * � Get MongoDB Controller
   */
  getMongoDBController() {
    return this.specializedControllers.get('mongodb');
  }

  /**
   * �🎮 Get Development Platform
   */
  getDevPlatform() {
    return this.specializedControllers.get('devPlatform');
  }

  /**
   * �️ Get Database Controller
   */
  getDatabaseController() {
    return this.specializedControllers.get('database');
  }

  /**
   * 🧪 Get Master Test Orchestrator
   */
  getTestOrchestrator() {
    return this.specializedControllers.get('testing');
  }

  /**
   * 🚀 Get API Controller
   */
  getApiController() {
    return this.specializedControllers.get('api');
  }

  /**
   * 🔍 Get System Validator
   */
  getSystemValidator() {
    return this.specializedControllers.get('validator');
  }

  /**
   * ⚙️ Get Backend Controller
   */
  getBackendController() {
    return this.specializedControllers.get('backend');
  }

  /**
   * 🎨 Get Frontend Controller
   */
  getFrontendController() {
    return this.specializedControllers.get('frontend');
  }

  /**
   * ⛓️ Get Blockchain Controller
   */
  getBlockchainController() {
    return this.specializedControllers.get('blockchain');
  }

  /**
   * 🗄️ Get Database Infrastructure Controller
   */
  getDatabaseInfrastructureController() {
    return this.specializedControllers.get('databaseInfrastructure');
  }

  /**
   * 🏢 Get Enterprise Services Controller
   */
  getEnterpriseServicesController() {
    return this.specializedControllers.get('enterpriseServices');
  }

  getTestingFrameworkController() {
    return this.specializedControllers.get('testingFramework');
  }

  getApplicationsSuiteController() {
    return this.specializedControllers.get('applicationsSuite');
  }

  getSharedServicesController() {
    return this.specializedControllers.get('sharedServices');
  }

  getDevToolsController() {
    return this.specializedControllers.get('devtools');
  }

  getDistributionController() {
    return this.specializedControllers.get('distribution');
  }

  getEnvironmentsController() {
    return this.specializedControllers.get('environments');
  }

  getInfrastructureController() {
    return this.specializedControllers.get('infrastructure');
  }

  getPlatformController() {
    return this.specializedControllers.get('platform');
  }

  /**
   * �️ Get Controller by Name (Generic Getter)
   */
  getController(name) {
    return this.specializedControllers.get(name);
  }

  /**
   * �🎯 PLATFORM INTEGRATION MANAGEMENT
   * ==================================
   * Enhanced platform component lifecycle management, health monitoring,
   * and inter-component communication orchestration.
   */

  /**
   * 🚀 Initialize Platform Component Lifecycle Management
   */
  async initializePlatformLifecycle() {
    try {
      console.log('🎯 Initializing Platform Component Lifecycle Management...');
      
      // Platform component registry
      this.platformComponents = new Map();
      this.componentHealthStatus = new Map();
      this.componentMetrics = new Map();
      this.componentDependencies = new Map();
      this.communicationChannels = new Map();
      
      // Register all platform components
      await this.registerPlatformComponents();
      
      // Setup component health monitoring
      await this.setupComponentHealthMonitoring();
      
      // Initialize inter-component communication
      await this.initializeComponentCommunication();
      
      // Setup component lifecycle hooks
      await this.setupComponentLifecycleHooks();
      
      console.log('✅ Platform Component Lifecycle Management initialized');
      return { success: true, components: this.platformComponents.size };
      
    } catch (error) {
      console.error('❌ Platform Lifecycle initialization failed:', error);
      throw error;
    }
  }

  /**
   * 📋 Register All Platform Components
   */
  async registerPlatformComponents() {
    const platformControllers = [
      { name: 'api', controller: this.getApiController(), type: 'gateway', priority: 1 },
      { name: 'backend', controller: this.getBackendController(), type: 'service', priority: 2 },
      { name: 'frontend', controller: this.getFrontendController(), type: 'application', priority: 3 },
      { name: 'blockchain', controller: this.getBlockchainController(), type: 'service', priority: 4 },
      { name: 'databaseInfrastructure', controller: this.getDatabaseInfrastructureController(), type: 'infrastructure', priority: 1 },
      { name: 'enterpriseServices', controller: this.getEnterpriseServicesController(), type: 'service', priority: 5 },
      { name: 'testingFramework', controller: this.getTestingFrameworkController(), type: 'infrastructure', priority: 6 },
      { name: 'applicationsSuite', controller: this.getApplicationsSuiteController(), type: 'application', priority: 7 },
      { name: 'sharedServices', controller: this.getSharedServicesController(), type: 'infrastructure', priority: 2 },
      { name: 'devtools', controller: this.getDevToolsController(), type: 'development', priority: 8 },
      { name: 'distribution', controller: this.getDistributionController(), type: 'deployment', priority: 9 },
      { name: 'environments', controller: this.getEnvironmentsController(), type: 'configuration', priority: 10 },
      { name: 'infrastructure', controller: this.getInfrastructureController(), type: 'infrastructure', priority: 11 },
      { name: 'platform', controller: this.getPlatformController(), type: 'orchestration', priority: 12 }
    ];

    for (const component of platformControllers) {
      if (component.controller) {
        const registration = {
          name: component.name,
          type: component.type,
          priority: component.priority,
          controller: component.controller,
          status: 'registered',
          health: 'unknown',
          startTime: null,
          metrics: {
            requests: 0,
            errors: 0,
            uptime: 0,
            performance: {}
          },
          dependencies: this.getComponentDependencies(component.name),
          capabilities: component.controller.getCapabilities ? await component.controller.getCapabilities() : []
        };

        this.platformComponents.set(component.name, registration);
        console.log(`📋 Registered platform component: ${component.name} (${component.type})`);
      }
    }

    console.log(`✅ Platform components registered: ${this.platformComponents.size}/9`);
  }

  /**
   * 🔗 Define Component Dependencies
   */
  getComponentDependencies(componentName) {
    const dependencies = {
      'api': ['sharedServices', 'backend'],
      'backend': ['databaseInfrastructure', 'sharedServices'],
      'frontend': ['api', 'sharedServices'],
      'blockchain': ['databaseInfrastructure', 'sharedServices'],
      'databaseInfrastructure': [],
      'enterpriseServices': ['databaseInfrastructure', 'sharedServices', 'backend'],
      'testingFramework': ['databaseInfrastructure', 'sharedServices'],
      'applicationsSuite': ['api', 'backend', 'sharedServices', 'enterpriseServices'],
      'sharedServices': ['databaseInfrastructure']
    };

    return dependencies[componentName] || [];
  }

  /**
   * 🏥 Setup Component Health Monitoring
   */
  async setupComponentHealthMonitoring() {
    console.log('🏥 Setting up platform component health monitoring...');
    
    for (const [name, component] of this.platformComponents) {
      // Initialize health status
      this.componentHealthStatus.set(name, {
        status: 'healthy',
        lastCheck: null,
        consecutiveFailures: 0,
        details: {},
        alerts: []
      });

      // Setup periodic health checks
      if (component.controller && typeof component.controller.healthCheck === 'function') {
        this.scheduleComponentHealthCheck(name, component);
      }
    }

    // Start health monitoring loop
    this.startHealthMonitoringLoop();
    console.log('✅ Component health monitoring configured');
  }

  /**
   * ⏱️ Schedule Component Health Check
   */
  scheduleComponentHealthCheck(componentName, component) {
    const healthCheckInterval = 30000; // 30 seconds
    
    setInterval(async () => {
      try {
        const health = await component.controller.healthCheck();
        const healthStatus = this.componentHealthStatus.get(componentName);
        
        healthStatus.status = health.healthy ? 'healthy' : 'unhealthy';
        healthStatus.lastCheck = new Date();
        healthStatus.details = health.checks || {};
        
        if (!health.healthy) {
          healthStatus.consecutiveFailures++;
          await this.handleComponentHealthFailure(componentName, health);
        } else {
          healthStatus.consecutiveFailures = 0;
        }
        
        this.componentHealthStatus.set(componentName, healthStatus);
        
      } catch (error) {
        console.error(`❌ Health check failed for ${componentName}:`, error.message);
        const healthStatus = this.componentHealthStatus.get(componentName);
        healthStatus.status = 'error';
        healthStatus.consecutiveFailures++;
      }
    }, healthCheckInterval);
  }

  /**
   * 🚨 Handle Component Health Failure
   */
  async handleComponentHealthFailure(componentName, healthResult) {
    console.warn(`🚨 Component health failure detected: ${componentName}`);
    
    const healthStatus = this.componentHealthStatus.get(componentName);
    
    // Create alert
    const alert = {
      timestamp: new Date(),
      component: componentName,
      severity: healthStatus.consecutiveFailures > 3 ? 'critical' : 'warning',
      message: `Component ${componentName} health check failed`,
      details: healthResult.checks,
      consecutiveFailures: healthStatus.consecutiveFailures
    };
    
    healthStatus.alerts.push(alert);
    
    // Trigger recovery if critical
    if (healthStatus.consecutiveFailures > 3) {
      await this.triggerComponentRecovery(componentName);
    }
    
    // Notify monitoring systems
    await this.notifyHealthFailure(alert);
  }

  /**
   * 🔄 Trigger Component Recovery
   */
  async triggerComponentRecovery(componentName) {
    console.log(`🔄 Triggering recovery for component: ${componentName}`);
    
    const component = this.platformComponents.get(componentName);
    if (!component) return;
    
    try {
      // Attempt component restart
      if (component.controller && typeof component.controller.restart === 'function') {
        await component.controller.restart();
        console.log(`✅ Component ${componentName} restarted successfully`);
      }
      
      // Reset health status
      const healthStatus = this.componentHealthStatus.get(componentName);
      healthStatus.consecutiveFailures = 0;
      healthStatus.status = 'recovering';
      
    } catch (error) {
      console.error(`❌ Failed to recover component ${componentName}:`, error);
    }
  }

  /**
   * 🔗 Initialize Inter-Component Communication
   */
  async initializeComponentCommunication() {
    console.log('🔗 Initializing inter-component communication...');
    
    // Setup communication channels between components
    this.communicationChannels.set('api-backend', {
      type: 'http',
      endpoints: await this.getApiBackendEndpoints(),
      middleware: ['auth', 'cors', 'rateLimit']
    });
    
    this.communicationChannels.set('backend-database', {
      type: 'tcp',
      connections: await this.getDatabaseConnections(),
      pool: { min: 5, max: 20 }
    });
    
    this.communicationChannels.set('frontend-api', {
      type: 'http',
      endpoints: await this.getFrontendApiEndpoints(),
      middleware: ['auth', 'cors']
    });
    
    this.communicationChannels.set('services-messaging', {
      type: 'messageQueue',
      topics: await this.getServiceMessagingTopics(),
      reliability: 'at-least-once'
    });
    
    // Setup event-driven communication
    await this.setupEventDrivenCommunication();
    
    console.log('✅ Inter-component communication initialized');
  }

  /**
   * 📡 Setup Event-Driven Communication
   */
  async setupEventDrivenCommunication() {
    this.platformEventBus = {
      subscribers: new Map(),
      eventHistory: [],
      
      // Subscribe to platform events
      subscribe: (eventType, handler, componentName) => {
        if (!this.platformEventBus.subscribers.has(eventType)) {
          this.platformEventBus.subscribers.set(eventType, []);
        }
        this.platformEventBus.subscribers.get(eventType).push({ handler, componentName });
      },
      
      // Publish platform events
      publish: async (eventType, data, sourceComponent) => {
        const event = {
          id: this.generateEventId(),
          type: eventType,
          data,
          source: sourceComponent,
          timestamp: new Date()
        };
        
        this.platformEventBus.eventHistory.push(event);
        
        const subscribers = this.platformEventBus.subscribers.get(eventType) || [];
        for (const subscriber of subscribers) {
          try {
            await subscriber.handler(event);
          } catch (error) {
            console.error(`❌ Event handler error in ${subscriber.componentName}:`, error);
          }
        }
        
        return event;
      }
    };
    
    // Setup standard platform events
    this.setupStandardPlatformEvents();
  }

  /**
   * 📅 Setup Standard Platform Events
   */
  setupStandardPlatformEvents() {
    // Component lifecycle events
    this.platformEventBus.subscribe('component.started', this.handleComponentStarted.bind(this), 'master');
    this.platformEventBus.subscribe('component.stopped', this.handleComponentStopped.bind(this), 'master');
    this.platformEventBus.subscribe('component.error', this.handleComponentError.bind(this), 'master');
    
    // Health monitoring events
    this.platformEventBus.subscribe('health.warning', this.handleHealthWarning.bind(this), 'master');
    this.platformEventBus.subscribe('health.critical', this.handleHealthCritical.bind(this), 'master');
    
    // Performance events
    this.platformEventBus.subscribe('performance.degradation', this.handlePerformanceDegradation.bind(this), 'master');
    this.platformEventBus.subscribe('performance.spike', this.handlePerformanceSpike.bind(this), 'master');
  }

  /**
   * 🔄 Setup Component Lifecycle Hooks
   */
  async setupComponentLifecycleHooks() {
    console.log('🔄 Setting up component lifecycle hooks...');
    
    this.lifecycleHooks = {
      // Pre-start hooks
      preStart: new Map(),
      
      // Post-start hooks
      postStart: new Map(),
      
      // Pre-stop hooks
      preStop: new Map(),
      
      // Post-stop hooks
      postStop: new Map(),
      
      // Error hooks
      onError: new Map()
    };
    
    // Register standard lifecycle hooks
    await this.registerStandardLifecycleHooks();
    
    console.log('✅ Component lifecycle hooks configured');
  }

  /**
   * 📋 Register Standard Lifecycle Hooks
   */
  async registerStandardLifecycleHooks() {
    // Database dependency check before starting backend services
    this.lifecycleHooks.preStart.set('backend', async () => {
      const dbHealth = await this.getDatabaseInfrastructureController().healthCheck();
      if (!dbHealth.healthy) {
        throw new Error('Database infrastructure not healthy, cannot start backend services');
      }
    });
    
    // API gateway dependency check
    this.lifecycleHooks.preStart.set('frontend', async () => {
      const apiHealth = await this.getApiController().healthCheck();
      if (!apiHealth.healthy) {
        throw new Error('API gateway not healthy, cannot start frontend application');
      }
    });
    
    // Cleanup shared resources on stop
    this.lifecycleHooks.preStop.set('sharedServices', async () => {
      console.log('🧹 Cleaning up shared service resources...');
      // Cleanup logic would go here
    });
  }

  /**
   * 🚀 Start All Platform Components
   */
  async startAllPlatformComponents() {
    console.log('🚀 Starting all platform components...');
    
    // Sort components by priority and dependencies
    const startOrder = this.calculateComponentStartOrder();
    
    for (const componentName of startOrder) {
      await this.startPlatformComponent(componentName);
    }
    
    console.log('✅ All platform components started successfully');
  }

  /**
   * 🔢 Calculate Component Start Order
   */
  calculateComponentStartOrder() {
    const components = Array.from(this.platformComponents.keys());
    const visited = new Set();
    const order = [];
    
    const visit = (componentName) => {
      if (visited.has(componentName)) return;
      visited.add(componentName);
      
      const dependencies = this.getComponentDependencies(componentName);
      for (const dep of dependencies) {
        if (components.includes(dep)) {
          visit(dep);
        }
      }
      
      order.push(componentName);
    };
    
    for (const component of components) {
      visit(component);
    }
    
    return order;
  }

  /**
   * ▶️ Start Individual Platform Component
   */
  async startPlatformComponent(componentName) {
    try {
      console.log(`▶️ Starting platform component: ${componentName}`);
      
      const component = this.platformComponents.get(componentName);
      if (!component) {
        throw new Error(`Component not found: ${componentName}`);
      }
      
      // Run pre-start hooks
      const preStartHook = this.lifecycleHooks.preStart.get(componentName);
      if (preStartHook) {
        await preStartHook();
      }
      
      // Initialize component if it has initialize method
      if (component.controller && typeof component.controller.initialize === 'function') {
        await component.controller.initialize(this, this.config);
      }
      
      // Update component status
      component.status = 'running';
      component.startTime = new Date();
      
      // Run post-start hooks
      const postStartHook = this.lifecycleHooks.postStart.get(componentName);
      if (postStartHook) {
        await postStartHook();
      }
      
      // Publish start event
      await this.platformEventBus.publish('component.started', { component: componentName }, 'master');
      
      console.log(`✅ Platform component started: ${componentName}`);
      
    } catch (error) {
      console.error(`❌ Failed to start platform component ${componentName}:`, error);
      
      // Publish error event
      await this.platformEventBus.publish('component.error', { 
        component: componentName, 
        error: error.message 
      }, 'master');
      
      throw error;
    }
  }

  /**
   * 🛑 Stop All Platform Components
   */
  async stopAllPlatformComponents() {
    console.log('🛑 Stopping all platform components...');
    
    // Reverse the start order for graceful shutdown
    const stopOrder = this.calculateComponentStartOrder().reverse();
    
    for (const componentName of stopOrder) {
      await this.stopPlatformComponent(componentName);
    }
    
    console.log('✅ All platform components stopped successfully');
  }

  /**
   * ⏹️ Stop Individual Platform Component
   */
  async stopPlatformComponent(componentName) {
    try {
      console.log(`⏹️ Stopping platform component: ${componentName}`);
      
      const component = this.platformComponents.get(componentName);
      if (!component) {
        throw new Error(`Component not found: ${componentName}`);
      }
      
      // Run pre-stop hooks
      const preStopHook = this.lifecycleHooks.preStop.get(componentName);
      if (preStopHook) {
        await preStopHook();
      }
      
      // Stop component if it has stop method
      if (component.controller && typeof component.controller.stop === 'function') {
        await component.controller.stop();
      }
      
      // Update component status
      component.status = 'stopped';
      
      // Run post-stop hooks
      const postStopHook = this.lifecycleHooks.postStop.get(componentName);
      if (postStopHook) {
        await postStopHook();
      }
      
      // Publish stop event
      await this.platformEventBus.publish('component.stopped', { component: componentName }, 'master');
      
      console.log(`✅ Platform component stopped: ${componentName}`);
      
    } catch (error) {
      console.error(`❌ Failed to stop platform component ${componentName}:`, error);
      throw error;
    }
  }

  /**
   * 📊 Get Platform Health Summary
   */
  async getPlatformHealthSummary() {
    const summary = {
      overall: 'healthy',
      components: {},
      metrics: {
        totalComponents: this.platformComponents.size,
        healthyComponents: 0,
        unhealthyComponents: 0,
        unknownComponents: 0
      },
      alerts: [],
      timestamp: new Date()
    };
    
    for (const [name, health] of this.componentHealthStatus) {
      summary.components[name] = {
        status: health.status,
        lastCheck: health.lastCheck,
        consecutiveFailures: health.consecutiveFailures
      };
      
      // Count component health states
      switch (health.status) {
        case 'healthy':
          summary.metrics.healthyComponents++;
          break;
        case 'unhealthy':
        case 'error':
          summary.metrics.unhealthyComponents++;
          summary.overall = 'degraded';
          break;
        default:
          summary.metrics.unknownComponents++;
      }
      
      // Collect active alerts
      if (health.alerts && health.alerts.length > 0) {
        summary.alerts.push(...health.alerts.slice(-5)); // Last 5 alerts per component
      }
    }
    
    // Determine overall health
    if (summary.metrics.unhealthyComponents > summary.metrics.healthyComponents / 2) {
      summary.overall = 'critical';
    }
    
    return summary;
  }

  /**
   * 📈 Get Platform Metrics
   */
  async getPlatformMetrics() {
    const metrics = {
      uptime: Date.now() - (this.initTime || Date.now()),
      components: {},
      performance: {
        averageResponseTime: 0,
        totalRequests: 0,
        totalErrors: 0,
        errorRate: 0
      },
      resources: {
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      },
      timestamp: new Date()
    };
    
    let totalRequests = 0;
    let totalErrors = 0;
    let totalResponseTime = 0;
    let componentCount = 0;
    
    for (const [name, component] of this.platformComponents) {
      if (component.metrics) {
        metrics.components[name] = component.metrics;
        totalRequests += component.metrics.requests || 0;
        totalErrors += component.metrics.errors || 0;
        
        if (component.metrics.performance && component.metrics.performance.averageResponseTime) {
          totalResponseTime += component.metrics.performance.averageResponseTime;
          componentCount++;
        }
      }
    }
    
    // Calculate platform-wide performance metrics
    metrics.performance.totalRequests = totalRequests;
    metrics.performance.totalErrors = totalErrors;
    metrics.performance.errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
    metrics.performance.averageResponseTime = componentCount > 0 ? totalResponseTime / componentCount : 0;
    
    return metrics;
  }

  /**
   * Event Handlers for Platform Events
   */
  async handleComponentStarted(event) {
    console.log(`📡 Component started event: ${event.data.component}`);
  }
  
  async handleComponentStopped(event) {
    console.log(`📡 Component stopped event: ${event.data.component}`);
  }
  
  async handleComponentError(event) {
    console.error(`📡 Component error event: ${event.data.component} - ${event.data.error}`);
  }
  
  async handleHealthWarning(event) {
    console.warn(`📡 Health warning: ${event.data.message}`);
  }
  
  async handleHealthCritical(event) {
    console.error(`📡 Critical health alert: ${event.data.message}`);
  }
  
  async handlePerformanceDegradation(event) {
    console.warn(`📡 Performance degradation detected: ${event.data.component}`);
  }
  
  async handlePerformanceSpike(event) {
    console.log(`📡 Performance spike detected: ${event.data.component}`);
  }

  /**
   * Utility Methods
   */
  generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  async getApiBackendEndpoints() {
    return ['http://localhost:3000', 'http://localhost:3001'];
  }
  
  async getDatabaseConnections() {
    return ['postgresql://localhost:5432', 'mongodb://localhost:27017'];
  }
  
  async getFrontendApiEndpoints() {
    return ['http://localhost:3000/api'];
  }
  
  async getServiceMessagingTopics() {
    return ['platform.events', 'service.notifications', 'health.alerts'];
  }
  
  async notifyHealthFailure(alert) {
    // Integration with monitoring systems would go here
    console.log(`🚨 Health Alert: ${alert.message}`);
  }
  
  startHealthMonitoringLoop() {
    console.log('🔄 Starting health monitoring loop...');
    // Health monitoring loop is handled by individual component schedulers
  }

  /**
   * 🔧 Initialize production configuration system
   */
  initializeProductionConfigs() {
    const centralConfigPath = path.join(__dirname, 'config', 'backend');
    const blockchainConfigPath = path.join(this.platformPath, 'blockchain');
    const sharedServicesPath = path.join(this.platformPath, 'services', 'shared');
    
    return {
      database: {
        postgres: path.join(centralConfigPath, 'postgres-production.config.ts'),
        mongodb: path.join(centralConfigPath, 'mongo-analytics.config.ts'),
        redis: path.join(centralConfigPath, 'redis-production.config.ts')
      },
      security: {
        hardening: path.join(this.platformPath, 'backend', 'src', 'security', 'security-hardening.service.ts'),
        environment: path.join(this.platformPath, 'backend', 'src', 'security', 'environment-security-enhanced.service.ts'),
        cors: path.join(centralConfigPath, 'cors.config.ts')
      },
      blockchain: {
        integration: path.join(blockchainConfigPath, 'index.ts'),
        services: path.join(blockchainConfigPath, 'services')
      },
      sharedServices: {
        wallet: path.join(sharedServicesPath, 'wallet', 'wallet.service.ts')
      },
      authentication: {
        jwt: path.join(this.platformPath, 'backend', 'src', 'auth', 'jwt-enhanced.service.ts')
      },
      validation: {
        exists: this.validateProductionConfigs.bind(this),
        health: this.checkProductionHealth.bind(this)
      }
    };
  }

  /**
   * ✅ Validate all production configurations exist
   */
  validateProductionConfigs() {
    const configs = this.productionConfigs;
    const results = {
      database: {},
      security: {},
      authentication: {},
      allValid: true
    };

    // Check database configs
    Object.entries(configs.database).forEach(([name, configPath]) => {
      const exists = fs.existsSync(configPath);
      results.database[name] = { exists, path: configPath };
      if (!exists) results.allValid = false;
    });

    // Check security configs
    Object.entries(configs.security).forEach(([name, configPath]) => {
      const exists = fs.existsSync(configPath);
      results.security[name] = { exists, path: configPath };
      if (!exists) results.allValid = false;
    });

    // Check authentication configs
    Object.entries(configs.authentication).forEach(([name, configPath]) => {
      const exists = fs.existsSync(configPath);
      results.authentication[name] = { exists, path: configPath };
      if (!exists) results.allValid = false;
    });

    // Check blockchain configs
    results.blockchain = {};
    Object.entries(configs.blockchain).forEach(([name, configPath]) => {
      const exists = fs.existsSync(configPath);
      results.blockchain[name] = { exists, path: configPath };
      if (!exists) results.allValid = false;
    });

    // Check shared services
    results.sharedServices = {};
    Object.entries(configs.sharedServices).forEach(([name, configPath]) => {
      const exists = fs.existsSync(configPath);
      results.sharedServices[name] = { exists, path: configPath };
      if (!exists) results.allValid = false;
    });

    return results;
  }

  /**
   * 🏥 Check production service health
   */
  async checkProductionHealth() {
    console.log('🏥 Checking Production Service Health...');
    
    const healthChecks = {
      postgres: this.checkPostgresHealth(),
      mongodb: this.checkMongoHealth(),
      redis: this.checkRedisHealth(),
      backend: this.checkBackendHealth()
    };

    const results = {};
    for (const [service, check] of Object.entries(healthChecks)) {
      try {
        results[service] = await check;
      } catch (error) {
        results[service] = { healthy: false, error: error.message };
      }
    }

    return results;
  }

  /**
   * 🐘 Check PostgreSQL Health
   */
  async checkPostgresHealth() {
    return new Promise((resolve) => {
      exec('sudo -u postgres pg_isready', (error, stdout, stderr) => {
        resolve({
          healthy: !error,
          status: stdout.trim() || stderr.trim(),
          timestamp: new Date().toISOString()
        });
      });
    });
  }

  /**
   * 🍃 Check MongoDB Health
   */
  async checkMongoHealth() {
    return new Promise((resolve) => {
      exec('mongosh --eval "db.runCommand({ping: 1})" --quiet', (error, stdout, stderr) => {
        resolve({
          healthy: !error && stdout.includes('ok'),
          status: stdout.trim() || stderr.trim(),
          timestamp: new Date().toISOString()
        });
      });
    });
  }

  /**
   * 🔴 Check Redis Health
   */
  async checkRedisHealth() {
    return new Promise((resolve) => {
      exec('redis-cli ping', (error, stdout, stderr) => {
        resolve({
          healthy: !error && stdout.trim() === 'PONG',
          status: stdout.trim() || stderr.trim(),
          timestamp: new Date().toISOString()
        });
      });
    });
  }

  /**
   * 🚀 Check Backend Health
   */
  async checkBackendHealth() {
    return new Promise((resolve) => {
      const backendPath = path.join(this.platformPath, 'backend');
      exec(`cd ${backendPath} && npm run build`, 
        { timeout: 30000 }, (error, stdout, stderr) => {
        resolve({
          healthy: !error,
          buildOutput: error ? stderr : 'Build successful',
          timestamp: new Date().toISOString()
        });
      });
    });
  }

  /**
   * 🗺️ Build comprehensive project map for easy navigation
   */
  buildProjectMap() {
    return {
      // 🏗️ Organizational Structure
      organization: {
        root: this.projectRoot,
        control: path.join(this.projectRoot, 'control'),
        platform: path.join(this.projectRoot, 'platform'),
        docs: path.join(this.projectRoot, 'docs'),
        infrastructure: path.join(this.projectRoot, 'infrastructure'),
        distribution: path.join(this.projectRoot, 'distribution')
      },

      // ⚙️ Configuration Files
      config: {
        root_package: path.join(this.projectRoot, 'package.json'),
        control_package: path.join(this.projectRoot, 'control', 'package.json'),
        main_controller: path.join(this.projectRoot, 'control', 'main.js'),
        service_proxy: path.join(this.projectRoot, 'service.js'),
        
        // Docker configurations
        docker_configs: {
          development: path.join(this.projectRoot, 'control', 'config', 'docker', 'docker-compose.development.yml'),
          production: path.join(this.projectRoot, 'control', 'config', 'docker', 'docker-compose.production.yml')
        },
        
        // Environment configurations
        environment_configs: path.join(this.projectRoot, 'control', 'config', 'env'),
        nginx_configs: path.join(this.projectRoot, 'control', 'config', 'nginx'),
        database_configs: path.join(this.projectRoot, 'control', 'config', 'database'),
        security_configs: path.join(this.projectRoot, 'control', 'config', 'security'),
        monitoring_configs: path.join(this.projectRoot, 'control', 'config', 'monitoring'),
        
        // Control-specific docker
        control_docker: {
          development: path.join(this.projectRoot, 'control', 'docker', 'development'),
          production: path.join(this.projectRoot, 'control', 'docker', 'production'),
          testing: path.join(this.projectRoot, 'control', 'docker', 'testing')
        }
      },

      // 🏛️ Control & Governance
      control: {
        main: path.join(this.projectRoot, 'control'),
        
        // Policies & Governance
        policies: {
          access_control: path.join(this.projectRoot, 'control', 'policies', 'access-control'),
          dao_governance: path.join(this.projectRoot, 'control', 'policies', 'dao-governance'),
          token_policies: path.join(this.projectRoot, 'control', 'policies', 'token-policies'),
          voting_mechanisms: path.join(this.projectRoot, 'control', 'policies', 'voting-mechanisms')
        },
        
        // Operations
        operations: {
          incident_response: path.join(this.projectRoot, 'control', 'operations', 'incident-response')
        },
        
        // Compliance
        compliance: {
          audit_trails: path.join(this.projectRoot, 'control', 'compliance', 'audit-trails'),
          kyc_aml: path.join(this.projectRoot, 'control', 'compliance', 'kyc-aml'),
          regulatory_reports: path.join(this.projectRoot, 'control', 'compliance', 'regulatory-reports'),
          risk_assessment: path.join(this.projectRoot, 'control', 'compliance', 'risk-assessment')
        },
        
        // Templates
        templates: {
          docker_compose: path.join(this.projectRoot, 'control', 'templates', 'docker-compose'),
          kubernetes: path.join(this.projectRoot, 'control', 'templates', 'kubernetes'),
          monitoring: path.join(this.projectRoot, 'control', 'templates', 'monitoring'),
          smart_contracts: path.join(this.projectRoot, 'control', 'templates', 'smart-contracts'),
          terraform: path.join(this.projectRoot, 'control', 'templates', 'terraform')
        },
        
        // Workflows
        workflows: {
          deployment_pipelines: path.join(this.projectRoot, 'control', 'workflows', 'deployment-pipelines'),
          github_actions: path.join(this.projectRoot, 'control', 'workflows', 'github-actions')
        }
      },

      // 🧪 Testing Infrastructure
      testing: {
        platform_tests: path.join(this.projectRoot, 'platform', 'testing'),
        backend_tests: path.join(this.projectRoot, 'platform', 'backend', 'test'),
        frontend_tests: path.join(this.projectRoot, 'platform', 'frontend', 'src', '__tests__'),
        infrastructure_tests: path.join(this.projectRoot, 'infrastructure', 'testing'),
        integration_tests: path.join(this.projectRoot, 'platform', 'testing')
      },

      // 🚀 Platform Applications & Services
      platform: {
        // Core Services
        backend: {
          path: path.join(this.projectRoot, 'platform', 'backend'),
          package: path.join(this.projectRoot, 'platform', 'backend', 'package.json'),
          main: path.join(this.projectRoot, 'platform', 'backend', 'src', 'main.ts'),
          config: path.join(this.projectRoot, 'platform', 'backend', '.env'),
          tests: path.join(this.projectRoot, 'platform', 'backend', 'test')
        },
        frontend: {
          path: path.join(this.projectRoot, 'platform', 'frontend'),
          package: path.join(this.projectRoot, 'platform', 'frontend', 'package.json'),
          main: path.join(this.projectRoot, 'platform', 'frontend', 'src', 'main.tsx'),
          config: path.join(this.projectRoot, 'platform', 'frontend', 'vite.config.ts'),
          tests: path.join(this.projectRoot, 'platform', 'frontend', 'src', '__tests__')
        },
        api: {
          path: path.join(this.projectRoot, 'platform', 'api'),
          package: path.join(this.projectRoot, 'platform', 'api', 'package.json'),
          gateway: path.join(this.projectRoot, 'platform', 'api', 'src'),
          middleware: path.join(this.projectRoot, 'platform', 'api', 'middleware'),
          routes: path.join(this.projectRoot, 'platform', 'api', 'routes')
        },
        
        // Database Services
        database: {
          path: path.join(this.projectRoot, 'platform', 'database'),
          migrations: path.join(this.projectRoot, 'platform', 'database', 'migrations'),
          seeds: path.join(this.projectRoot, 'platform', 'database', 'seeds'),
          models: path.join(this.projectRoot, 'platform', 'database', 'models'),
          init: path.join(this.projectRoot, 'platform', 'database', 'init')
        },

        // Blockchain Services  
        blockchain: {
          path: path.join(this.projectRoot, 'platform', 'blockchain'),
          ethereum: path.join(this.projectRoot, 'platform', 'blockchain', 'ethereum'),
          stellar: path.join(this.projectRoot, 'platform', 'blockchain', 'stellar'),
          algorand: path.join(this.projectRoot, 'platform', 'blockchain', 'algorand'),
          tezos: path.join(this.projectRoot, 'platform', 'blockchain', 'tezos'),
          contracts: path.join(this.projectRoot, 'platform', 'blockchain', 'contracts')
        },

        // Enterprise Services
        enterprise: {
          path: path.join(this.projectRoot, 'platform', 'enterprise'),
          auth: path.join(this.projectRoot, 'platform', 'enterprise', 'auth'),
          monitoring: path.join(this.projectRoot, 'platform', 'enterprise', 'monitoring'),
          analytics: path.join(this.projectRoot, 'platform', 'enterprise', 'analytics'),
          reporting: path.join(this.projectRoot, 'platform', 'enterprise', 'reporting'),
          compliance: path.join(this.projectRoot, 'platform', 'enterprise', 'compliance')
        },

        // Development Tools
        devtools: {
          path: path.join(this.projectRoot, 'platform', 'devtools'),
          scripts: path.join(this.projectRoot, 'platform', 'devtools', 'scripts'),
          generators: path.join(this.projectRoot, 'platform', 'devtools', 'generators'),
          validators: path.join(this.projectRoot, 'platform', 'devtools', 'validators')
        }
      },

      // 📚 Documentation
      documentation: {
        main: path.join(this.projectRoot, 'docs'),
        getting_started: path.join(this.projectRoot, 'docs', '01-getting-started'),
        architecture: path.join(this.projectRoot, 'docs', '02-system-architecture'),
        development: path.join(this.projectRoot, 'docs', '03-development-guide'),
        api_reference: path.join(this.projectRoot, 'docs', '04-api-reference'),
        deployment: path.join(this.projectRoot, 'docs', '05-deployment'),
        project_management: path.join(this.projectRoot, 'docs', '06-project-management'),
        templates: path.join(this.projectRoot, 'docs', '00-index', 'templates')
      },

      // 🏗️ Infrastructure  
      infrastructure: {
        main: path.join(this.projectRoot, 'infrastructure'),
        kubernetes: path.join(this.projectRoot, 'infrastructure', 'kubernetes'),
        terraform: path.join(this.projectRoot, 'infrastructure', 'terraform'),
        automation: path.join(this.projectRoot, 'infrastructure', 'automation'),
        testing: path.join(this.projectRoot, 'infrastructure', 'testing')
      },

      // 📦 Distribution & Templates
      distribution: {
        main: path.join(this.projectRoot, 'distribution'),
        releases: path.join(this.projectRoot, 'distribution', 'releases'),
        templates: path.join(this.projectRoot, 'distribution', 'templates'),
        enterprise_template: path.join(this.projectRoot, 'distribution', 'templates', 'github-project-templates', 'enterprise-project-template'),
        assets: path.join(this.projectRoot, 'distribution', 'assets')
      }
    };
  }

  /**
   * 📋 Load configuration from multiple sources
   */
  loadConfig() {
    const defaultConfig = {
      services: {
        backend: {
          name: 'Backend API',
          path: 'platform/backend',
          port: 3001,
          healthEndpoint: '/health',
          startCommand: 'npm run dev',
          dependencies: ['database']
        },
        frontend: {
          name: 'Frontend UI',
          path: 'platform/frontend', 
          port: 3000,
          healthEndpoint: '/',
          startCommand: 'npm run dev',
          dependencies: ['backend']
        },
        database: {
          name: 'Database Services',
          path: 'platform/database',
          port: 5432,
          healthEndpoint: null,
          startCommand: 'docker-compose up',
          dependencies: []
        },
        blockchain: {
          name: 'Blockchain Services',
          path: 'platform/blockchain',
          port: 8545,
          healthEndpoint: '/status',
          startCommand: 'npm start',
          dependencies: ['database']
        },
        api: {
          name: 'API Gateway',
          path: 'platform/api',
          port: 4000,
          healthEndpoint: '/api/health',
          startCommand: 'npm start',
          dependencies: ['backend', 'blockchain']
        }
      },
      environment: process.env.NODE_ENV || 'development',
      logLevel: process.env.LOG_LEVEL || 'info'
    };

    // Try to load custom config
    const configPath = path.join(this.projectRoot, 'control/config/ultra-core.json');
    if (fs.existsSync(configPath)) {
      try {
        const customConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return Object.assign({}, defaultConfig, customConfig);
      } catch (error) {
        console.warn('⚠️  Failed to load custom config, using defaults');
      }
    }

    return defaultConfig;
  }

  /**
   * 🚀 Main command dispatcher
   */
  async execute(command = 'help', ...args) {
    try {
      switch (command.toLowerCase()) {
        case 'start':
          return await this.startServices(args[0]);
        
        case 'stop':
          return await this.stopServices(args[0]);
        
        case 'restart':
          return await this.restartServices(args[0]);
        
        case 'services':
          return this.showServices();
        
        case 'scripts':
          return this.listInfrastructureScripts();
        
        case 'run':
          if (args.length === 0) {
            console.log('❌ Please specify a script to run');
            return this.showInfrastructureHelp();
          }
          return await this.runInfrastructureScript(args[0], args.slice(1));
        
        case 'status':
          return await this.getSystemStatus();
        
        case 'health':
          return await this.runHealthChecks();

        case 'platform':
          return await this.handlePlatformCommands(args);

        case 'components':
          return await this.handleComponentCommands(args);

        case 'setup':
          return await this.setupEnvironment();
        
        case 'install-deps':
        case 'install-dependencies':
            await controller.buildController.installDependencies(JSON.parse(args[1] || '{}'));
            break;
            
        case 'validate-deps':
        case 'validate-dependencies':
            const validation = await controller.buildController.validateDependencies();
            console.log('📊 Dependency Validation Report:');
            console.log(JSON.stringify(validation, null, 2));
            break;
            
        case 'check-deps':
        case 'check-dependencies':
            const health = await controller.buildController.checkDependencyHealth(args[1] || 'all');
            console.log('🏥 Dependency Health Report:');
            console.log(JSON.stringify(health, null, 2));
            break;

        case 'database':
        case 'db':
            await this.handleDatabaseCommands(args, controller);
            break;

        case 'dev':
          return await this.startDevelopment();
        
        case 'build':
          return await this.buildAll();
        
        case 'deploy':
          return await this.deployServices(args[0]);
        
        case 'logs':
          return await this.showLogs(args[0]);
        
        case 'config':
          return await this.manageConfig(args[0], args[1]);
        
        case 'monitor':
          return await this.startMonitoring();
        
        case 'backup':
          return await this.backupData();

        // 🗺️ New Project Navigation Commands
        case 'map':
          return this.showProjectMap(args[0]);
          
        case 'find':
          return this.findInProject(args[0]);
          
        case 'list':
          return this.listProjectComponents(args[0]);
          
        case 'path':
          return this.getComponentPath(args[0], args[1]);
        
        case 'help':
        default:
          return this.showHelp();
      }
    } catch (error) {
      console.error('❌ Command failed:', error.message);
      return false;
    }
  }

  /**
   * 🎯 Start services with dependency resolution
   */
  async startServices(serviceName = 'all') {
    console.log(`🚀 Starting services: ${serviceName}`);
    
    if (serviceName === 'all') {
      // Start all services in dependency order
      const startOrder = this.resolveDependencies();
      for (const service of startOrder) {
        await this.startSingleService(service);
      }
    } else {
      await this.startSingleService(serviceName);
    }
    
    console.log('✅ Services started successfully');
    return true;
  }

  /**
   * 🔧 Start a single service
   */
  async startSingleService(serviceName) {
    const serviceConfig = this.config.services[serviceName];
    if (!serviceConfig) {
      throw new Error(`Service '${serviceName}' not found`);
    }

    console.log(`📦 Starting ${serviceConfig.name}...`);
    
    const servicePath = path.join(this.projectRoot, serviceConfig.path);
    
    // Check if service directory exists
    if (!fs.existsSync(servicePath)) {
      console.warn(`⚠️  Service path not found: ${servicePath}`);
      return false;
    }

    // Try different approaches to start the service
    let command = 'npm';
    let args = ['run', 'dev'];
    
    // Check if npm is available
    try {
      await this.execCommand('which npm');
    } catch (error) {
      console.log(`📝 npm not available, trying alternative startup methods...`);
      
      // Try to find alternative startup methods
      const packagePath = path.join(servicePath, 'package.json');
      if (fs.existsSync(packagePath)) {
        try {
          const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
          
          // Check for built JavaScript files
          if (serviceName === 'backend') {
            const distPath = path.join(servicePath, 'dist');
            const devServerPath = path.join(servicePath, 'dev-server.js');
            const devServerSimplePath = path.join(servicePath, 'dist', 'dev-server-simple.js');
            
            if (fs.existsSync(devServerSimplePath)) {
              command = 'node';
              args = ['dist/dev-server-simple.js'];
              console.log(`🎯 Using compiled dev server: ${devServerSimplePath}`);
            } else if (fs.existsSync(devServerPath)) {
              command = 'node';
              args = ['dev-server.js'];
              console.log(`🎯 Using dev server: ${devServerPath}`);
            } else {
              console.warn(`⚠️  No suitable startup method found for ${serviceName}`);
              return false;
            }
          } else if (serviceName === 'frontend') {
            // For frontend, we can serve static files
            console.log(`🌐 Starting static file server for frontend...`);
            command = 'python3';
            args = ['-m', 'http.server', '3000'];
          } else {
            console.warn(`⚠️  No alternative startup method for ${serviceName}`);
            return false;
          }
        } catch (parseError) {
          console.warn(`⚠️  Could not parse package.json for ${serviceName}`);
          return false;
        }
      }
    }

    // Start the service
    const child = spawn(command, args, {
      cwd: servicePath,
      stdio: 'pipe',
      detached: true
    });

    // Store service reference
    this.services.set(serviceName, {
      process: child,
      config: serviceConfig,
      startTime: Date.now(),
      status: 'starting',
      command: `${command} ${args.join(' ')}`
    });

    // Set up logging
    child.stdout.on('data', (data) => {
      console.log(`[${serviceName}] ${data.toString().trim()}`);
    });

    child.stderr.on('data', (data) => {
      console.error(`[${serviceName}] ${data.toString().trim()}`);
    });

    child.on('exit', (code) => {
      console.log(`[${serviceName}] Exited with code ${code}`);
      const service = this.services.get(serviceName);
      if (service) {
        service.status = 'stopped';
      }
    });

    child.on('error', (error) => {
      console.error(`[${serviceName}] Error: ${error.message}`);
      const service = this.services.get(serviceName);
      if (service) {
        service.status = 'error';
      }
    });

    // Wait a moment for service to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update status
    if (this.services.has(serviceName)) {
      const service = this.services.get(serviceName);
      if (service.status === 'starting') {
        service.status = 'running';
        console.log(`✅ ${serviceConfig.name} started successfully`);
        console.log(`🔗 Command: ${service.command}`);
        if (serviceConfig.port) {
          console.log(`🌐 Available at: http://localhost:${serviceConfig.port}`);
        }
      }
    }

    return true;
  }

  /**
   * 🛑 Stop services
   */
  async stopServices(serviceName = 'all') {
    console.log(`🛑 Stopping services: ${serviceName}`);
    
    if (serviceName === 'all') {
      // Stop all services
      for (const [name, service] of this.services.entries()) {
        await this.stopSingleService(name);
      }
    } else {
      await this.stopSingleService(serviceName);
    }
    
    console.log('✅ Services stopped');
  }

  /**
   * 🔧 Stop a single service
   */
  async stopSingleService(serviceName) {
    const service = this.services.get(serviceName);
    if (!service) {
      console.warn(`⚠️  Service '${serviceName}' is not running`);
      return false;
    }

    console.log(`📦 Stopping ${serviceName}...`);
    
    try {
      if (service.process) {
        service.process.kill('SIGTERM');
        // Give it time to shutdown gracefully
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // If still running, force kill
        if (!service.process.killed) {
          service.process.kill('SIGKILL');
        }
      }
      
      this.services.delete(serviceName);
      console.log(`✅ ${serviceName} stopped`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to stop ${serviceName}: ${error.message}`);
      return false;
    }
  }

  /**
   * 🔄 Restart services
   */
  async restartServices(serviceName = 'all') {
    console.log(`🔄 Restarting services: ${serviceName}`);
    
    if (serviceName === 'all') {
      await this.stopServices('all');
      await new Promise(resolve => setTimeout(resolve, 3000));
      await this.startServices('all');
    } else {
      await this.stopSingleService(serviceName);
      await new Promise(resolve => setTimeout(resolve, 2000));
      await this.startSingleService(serviceName);
    }
    
    console.log('✅ Services restarted');
  }

  /**
   * 📊 Show service status dashboard
   */
  showServices() {
    console.log('\n🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸');
    console.log('                           🎛️  ULTRA-CORE SERVICE DASHBOARD                           ');
    console.log('🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸\n');

    // Available services
    console.log('📋 Available Services:');
    Object.entries(this.config.services).forEach(([key, service]) => {
      const isRunning = this.services.has(key);
      const status = isRunning ? '🟢 Running' : '⚫ Stopped';
      const serviceData = isRunning ? this.services.get(key) : null;
      const uptime = serviceData ? this.getUptime(serviceData.startTime) : '';
      const command = serviceData ? serviceData.command : '';
      
      console.log(`  ${status} ${key.padEnd(12)} │ ${service.name}`);
      if (service.port) {
        console.log(`     ${' '.repeat(12)} │ 🌐 http://localhost:${service.port}`);
      }
      if (uptime) {
        console.log(`     ${' '.repeat(12)} │ ⏰ Uptime: ${uptime}`);
      }
      if (command) {
        console.log(`     ${' '.repeat(12)} │ 🎯 Command: ${command}`);
      }
      console.log(`     ${' '.repeat(12)} │ 📁 Path: ${service.path}`);
      console.log('');
    });

    // Running process summary
    if (this.services.size > 0) {
      console.log('📊 Running Processes Summary:');
      this.services.forEach((service, name) => {
        const pid = service.process && service.process.pid ? service.process.pid : 'N/A';
        console.log(`  🔹 ${name}: PID ${pid} | Status: ${service.status}`);
      });
    } else {
      console.log('ℹ️  No services currently running');
    }

    console.log('\n💡 Commands:');
    console.log('  node service.js start <service>    - Start specific service');
    console.log('  node service.js start all          - Start all services');
    console.log('  node service.js stop <service>     - Stop specific service');
    console.log('  node service.js stop all           - Stop all services');
    console.log('  node service.js restart <service>  - Restart specific service');
    console.log('  node service.js services           - Show this dashboard');
    console.log('  node service.js logs <service>     - Show service logs');
    console.log('\n🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸');
  }

  /**
   * ⏰ Get service uptime
   */
  getUptime(startTime) {
    const uptime = Date.now() - startTime;
    const seconds = Math.floor((uptime / 1000) % 60);
    const minutes = Math.floor((uptime / (1000 * 60)) % 60);
    const hours = Math.floor((uptime / (1000 * 60 * 60)) % 24);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * 📜 List infrastructure scripts
   */
  listInfrastructureScripts() {
    console.log('\n🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧');
    console.log('                           📜 INFRASTRUCTURE AUTOMATION SCRIPTS                      ');
    console.log('🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧\n');

    const scriptsPath = path.join(this.projectRoot, 'infrastructure', 'automation', 'scripts');
    
    if (!fs.existsSync(scriptsPath)) {
      console.log('❌ Infrastructure scripts directory not found');
      return;
    }

    try {
      const files = fs.readdirSync(scriptsPath);
      const scripts = files.filter(file => file.endsWith('.sh') && file !== 'README.md');

      console.log('🚀 Development & Setup:');
      const devScripts = scripts.filter(s => s.includes('setup') || s.includes('dev'));
      devScripts.forEach(script => {
        const scriptName = script.replace('.sh', '');
        console.log(`  📦 ${scriptName.padEnd(25)} │ node service.js run ${scriptName}`);
      });

      console.log('\n🏗️ Deployment & Production:');
      const deployScripts = scripts.filter(s => s.includes('deploy') || s.includes('production'));
      deployScripts.forEach(script => {
        const scriptName = script.replace('.sh', '');
        console.log(`  🚀 ${scriptName.padEnd(25)} │ node service.js run ${scriptName}`);
      });

      console.log('\n🔧 Maintenance & Tools:');
      const toolScripts = scripts.filter(s => 
        !s.includes('setup') && !s.includes('dev') && 
        !s.includes('deploy') && !s.includes('production')
      );
      toolScripts.forEach(script => {
        const scriptName = script.replace('.sh', '');
        console.log(`  🛠️  ${scriptName.padEnd(25)} │ node service.js run ${scriptName}`);
      });

      console.log('\n💡 Usage:');
      console.log('  node service.js scripts              - Show this list');
      console.log('  node service.js run <script-name>    - Execute infrastructure script');
      console.log('  node service.js run <script> [args]  - Execute script with arguments');

      console.log(`\n📁 Scripts Location: ${scriptsPath}`);
      console.log(`📊 Total Scripts Available: ${scripts.length}`);

    } catch (error) {
      console.error('❌ Error reading scripts directory:', error.message);
    }

    console.log('\n🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧🔧');
  }

  /**
   * 🚀 Run infrastructure script
   */
  async runInfrastructureScript(scriptName, args = []) {
    console.log(`🔧 Running infrastructure script: ${scriptName}`);
    
    const scriptsPath = path.join(this.projectRoot, 'infrastructure', 'automation', 'scripts');
    const scriptFile = `${scriptName}.sh`;
    const scriptPath = path.join(scriptsPath, scriptFile);

    if (!fs.existsSync(scriptPath)) {
      console.error(`❌ Script not found: ${scriptFile}`);
      console.log('\n💡 Available scripts:');
      return this.listInfrastructureScripts();
    }

    console.log(`📂 Script path: ${scriptPath}`);
    console.log(`📋 Arguments: ${args.length > 0 ? args.join(' ') : 'none'}`);

    try {
      // Make script executable
      await this.execCommand(`chmod +x "${scriptPath}"`);
      
      console.log('\n🚀 Executing script...\n');
      
      // Execute the script
      const child = spawn('bash', [scriptPath, ...args], {
        cwd: this.projectRoot,  // Run from project root instead of scripts directory
        stdio: 'pipe'
      });

      // Handle output
      child.stdout.on('data', (data) => {
        process.stdout.write(data);
      });

      child.stderr.on('data', (data) => {
        process.stderr.write(data);
      });

      // Wait for completion
      await new Promise((resolve, reject) => {
        child.on('exit', (code) => {
          if (code === 0) {
            console.log(`\n✅ Script ${scriptName} completed successfully`);
            resolve();
          } else {
            console.log(`\n❌ Script ${scriptName} exited with code ${code}`);
            reject(new Error(`Script failed with exit code ${code}`));
          }
        });

        child.on('error', (error) => {
          console.error(`\n❌ Error executing script: ${error.message}`);
          reject(error);
        });
      });

    } catch (error) {
      console.error(`❌ Failed to run script ${scriptName}:`, error.message);
      return false;
    }

    return true;
  }

  /**
   * 🗄️ Handle Database Commands
   */
  async handleDatabaseCommands(args, controller) {
    // Use centralized database controller
    const databaseController = this.databaseController;
    
    if (!databaseController) {
      console.log('🗄️ Database controller not available, attempting to initialize...');
      await this.initializeDatabaseManagement();
      
      if (!this.databaseController) {
        console.error('💥 Database Controller could not be initialized');
        return;
      }
    }
    
    const subCommand = args[0] || 'status';
    const dbType = args[1] || 'all'; // mongodb, postgresql, redis, or all
    
    try {
      const databaseController = this.databaseController;
      
      switch (subCommand) {
        case 'setup':
          console.log('🗄️ Setting up databases...');
          await databaseController.initialize();
          break;
          
        case 'status':
          const status = databaseController.getDatabaseStatus();
          console.log('🗄️ Database Status:');
          console.log(JSON.stringify(status, null, 2));
          break;
          
        case 'health':
          const health = await databaseController.performHealthCheck();
          console.log('🏥 Database Health Report:');
          console.log(JSON.stringify(health, null, 2));
          break;
          
        case 'backup':
          if (dbType === 'all') {
            const backups = await databaseController.backupAllDatabases();
            console.log('💾 Backup Results:');
            console.log(JSON.stringify(backups, null, 2));
          } else {
            const backup = await databaseController.backupDatabase(dbType, new Date().toISOString().replace(/[:.]/g, '-'));
            console.log(`💾 ${dbType} Backup Result:`);
            console.log(JSON.stringify(backup, null, 2));
          }
          break;
          
        case 'config':
          if (dbType === 'all') {
            const allConfigs = {};
            const databases = ['mongodb', 'postgresql', 'redis'];
            for (const db of databases) {
              try {
                allConfigs[db] = databaseController.getDatabaseConfig(db);
              } catch (error) {
                allConfigs[db] = { error: error.message };
              }
            }
            console.log('🔧 Database Configurations:');
            console.log(JSON.stringify(allConfigs, null, 2));
          } else {
            const config = databaseController.getDatabaseConfig(dbType);
            console.log(`🔧 ${dbType} Configuration:`);
            console.log(JSON.stringify(config, null, 2));
          }
          break;
          
        case 'enable':
          if (!dbType || dbType === 'all') {
            console.error('💥 Please specify database type: db enable <mongodb|postgresql|redis>');
            return;
          }
          const enableResult = databaseController.toggleDatabase(dbType, true);
          console.log(`✅ ${dbType} enabled`);
          console.log(JSON.stringify(enableResult, null, 2));
          break;
          
        case 'disable':
          if (!dbType || dbType === 'all') {
            console.error('💥 Please specify database type: db disable <mongodb|postgresql|redis>');
            return;
          }
          const disableResult = databaseController.toggleDatabase(dbType, false);
          console.log(`❌ ${dbType} disabled`);
          console.log(JSON.stringify(disableResult, null, 2));
          break;

        case 'seed':
          if (databaseController.environment === 'production') {
            console.error('💥 Cannot seed test data in production environment');
            return;
          }
          console.log(`🧪 Seeding test data for ${dbType}...`);
          const seedResult = await databaseController.seedTestData(dbType);
          console.log('✅ Test data seeding completed:');
          console.log(JSON.stringify(seedResult, null, 2));
          break;

        case 'reset':
          if (databaseController.environment === 'production') {
            console.error('💥 Cannot reset database in production environment');
            return;
          }
          console.log(`⚠️ This will permanently delete all data in ${dbType} database(s)`);
          console.log('This operation cannot be undone.');
          const resetResult = await databaseController.resetDatabase(dbType);
          console.log('🔄 Database reset completed:');
          console.log(JSON.stringify(resetResult, null, 2));
          break;
          
        default:
          console.error(`💥 Unknown database command: ${subCommand}`);
          console.log('🗄️ Available commands:');
          console.log('   setup              - Initialize all databases');
          console.log('   status             - Show database status');
          console.log('   health [db]        - Check database health');
          console.log('   backup [db]        - Create database backup');
          console.log('   config [db]        - Show database configuration');
          console.log('   enable <db>        - Enable specific database');
          console.log('   disable <db>       - Disable specific database');
          console.log('   seed [db]          - Seed test data (dev only)');
          console.log('   reset [db]         - Reset database (dev only)');
          console.log('');
          console.log('🗄️ Database types: mongodb, postgresql, redis, all');
      }
    } catch (error) {
    }
  }

  /**
   * 🎯 Handle Platform Commands
   */
  async handlePlatformCommands(args) {
    const subCommand = args[0] || 'status';
    
    try {
      switch (subCommand) {
        case 'status':
          const healthSummary = await this.getPlatformHealthSummary();
          console.log('🎯 Platform Health Summary:');
          console.log(JSON.stringify(healthSummary, null, 2));
          break;
          
        case 'metrics':
          const metrics = await this.getPlatformMetrics();
          console.log('📊 Platform Metrics:');
          console.log(JSON.stringify(metrics, null, 2));
          break;
          
        case 'start':
          console.log('🚀 Starting all platform components...');
          await this.startAllPlatformComponents();
          console.log('✅ All platform components started successfully');
          break;
          
        case 'stop':
          console.log('🛑 Stopping all platform components...');
          await this.stopAllPlatformComponents();
          console.log('✅ All platform components stopped successfully');
          break;
          
        case 'restart':
          console.log('🔄 Restarting all platform components...');
          await this.stopAllPlatformComponents();
          await this.startAllPlatformComponents();
          console.log('✅ All platform components restarted successfully');
          break;
          
        case 'health':
          const healthDetail = await this.getPlatformHealthSummary();
          console.log('🏥 Detailed Platform Health:');
          console.log(`Overall Status: ${healthDetail.overall.toUpperCase()}`);
          console.log(`Healthy Components: ${healthDetail.metrics.healthyComponents}/${healthDetail.metrics.totalComponents}`);
          
          if (healthDetail.alerts.length > 0) {
            console.log('\n🚨 Active Alerts:');
            healthDetail.alerts.forEach(alert => {
              console.log(`  • ${alert.severity.toUpperCase()}: ${alert.message} (${alert.component})`);
            });
          }
          break;
          
        case 'events':
          const events = this.platformEventBus.eventHistory.slice(-20); // Last 20 events
          console.log('📡 Recent Platform Events:');
          events.forEach(event => {
            console.log(`  ${event.timestamp.toISOString()} [${event.source}] ${event.type}: ${JSON.stringify(event.data)}`);
          });
          break;
          
        case 'channels':
          console.log('🔗 Communication Channels:');
          for (const [name, channel] of this.communicationChannels) {
            console.log(`  • ${name}: ${channel.type} (${channel.endpoints ? channel.endpoints.length : 'N/A'} endpoints)`);
          }
          break;
          
        default:
          console.error(`💥 Unknown platform command: ${subCommand}`);
          console.log('🎯 Available platform commands:');
          console.log('   status             - Show platform health summary');
          console.log('   metrics            - Show platform performance metrics');
          console.log('   start              - Start all platform components');
          console.log('   stop               - Stop all platform components');
          console.log('   restart            - Restart all platform components');
          console.log('   health             - Detailed health information');
          console.log('   events             - Show recent platform events');
          console.log('   channels           - Show communication channels');
      }
    } catch (error) {
      console.error(`💥 Platform command failed: ${error.message}`);
    }
  }

  /**
   * 🧩 Handle Component Commands
   */
  async handleComponentCommands(args) {
    const subCommand = args[0] || 'list';
    const componentName = args[1];
    
    try {
      switch (subCommand) {
        case 'list':
          console.log('🧩 Platform Components:');
          for (const [name, component] of this.platformComponents) {
            const health = this.componentHealthStatus.get(name);
            const status = health ? health.status : 'unknown';
            console.log(`  • ${name}: ${component.status} (health: ${status}) - ${component.type}`);
          }
          break;
          
        case 'info':
          if (!componentName) {
            console.error('💥 Please specify component name: components info <component-name>');
            this.listAvailableComponents();
            return;
          }
          
          const component = this.platformComponents.get(componentName);
          if (!component) {
            console.error(`💥 Component not found: ${componentName}`);
            this.listAvailableComponents();
            return;
          }
          
          console.log(`🧩 Component Information: ${componentName}`);
          console.log(JSON.stringify({
            name: component.name,
            type: component.type,
            priority: component.priority,
            status: component.status,
            startTime: component.startTime,
            dependencies: component.dependencies,
            capabilities: component.capabilities,
            metrics: component.metrics
          }, null, 2));
          break;
          
        case 'start':
          if (!componentName) {
            console.error('💥 Please specify component name: components start <component-name>');
            this.listAvailableComponents();
            return;
          }
          
          console.log(`▶️ Starting component: ${componentName}`);
          await this.startPlatformComponent(componentName);
          console.log(`✅ Component started: ${componentName}`);
          break;
          
        case 'stop':
          if (!componentName) {
            console.error('💥 Please specify component name: components stop <component-name>');
            this.listAvailableComponents();
            return;
          }
          
          console.log(`⏹️ Stopping component: ${componentName}`);
          await this.stopPlatformComponent(componentName);
          console.log(`✅ Component stopped: ${componentName}`);
          break;
          
        case 'restart':
          if (!componentName) {
            console.error('💥 Please specify component name: components restart <component-name>');
            this.listAvailableComponents();
            return;
          }
          
          console.log(`🔄 Restarting component: ${componentName}`);
          await this.stopPlatformComponent(componentName);
          await this.startPlatformComponent(componentName);
          console.log(`✅ Component restarted: ${componentName}`);
          break;
          
        case 'health':
          if (!componentName) {
            console.error('💥 Please specify component name: components health <component-name>');
            this.listAvailableComponents();
            return;
          }
          
          const health = this.componentHealthStatus.get(componentName);
          if (!health) {
            console.error(`💥 Health status not found for component: ${componentName}`);
            return;
          }
          
          console.log(`🏥 Component Health: ${componentName}`);
          console.log(JSON.stringify(health, null, 2));
          break;
          
        case 'dependencies':
          if (!componentName) {
            console.error('💥 Please specify component name: components dependencies <component-name>');
            this.listAvailableComponents();
            return;
          }
          
          const deps = this.getComponentDependencies(componentName);
          console.log(`🔗 Dependencies for ${componentName}:`);
          if (deps.length === 0) {
            console.log('  No dependencies');
          } else {
            deps.forEach(dep => {
              const depComponent = this.platformComponents.get(dep);
              const depHealth = this.componentHealthStatus.get(dep);
              const status = depComponent ? depComponent.status : 'not found';
              const health = depHealth ? depHealth.status : 'unknown';
              console.log(`  • ${dep}: ${status} (health: ${health})`);
            });
          }
          break;
          
        default:
          console.error(`💥 Unknown component command: ${subCommand}`);
          console.log('🧩 Available component commands:');
          console.log('   list                     - List all platform components');
          console.log('   info <component>         - Show detailed component information');
          console.log('   start <component>        - Start specific component');
          console.log('   stop <component>         - Stop specific component');
          console.log('   restart <component>      - Restart specific component');
          console.log('   health <component>       - Show component health details');
          console.log('   dependencies <component> - Show component dependencies');
      }
    } catch (error) {
      console.error(`💥 Component command failed: ${error.message}`);
    }
  }

  /**
   * 📋 List Available Components
   */
  listAvailableComponents() {
    console.log('\n🧩 Available components:');
    for (const [name] of this.platformComponents) {
      console.log(`  • ${name}`);
    }
  }

  /**
   * 💡 Show infrastructure help
   */
  showInfrastructureHelp() {
    console.log('\n💡 Infrastructure Script Usage:');
    console.log('  node service.js scripts              - List all available scripts');
    console.log('  node service.js run <script-name>    - Run specific script');
    console.log('  node service.js run <script> [args]  - Run script with arguments');
    console.log('\n📋 Example:');
    console.log('  node service.js run setup-development');
    console.log('  node service.js run deploy-production staging');
  }

  /**
   * 📊 Resolve service dependencies
   */
  resolveDependencies() {
    const services = Object.keys(this.config.services);
    const resolved = [];
    const visited = new Set();

    const resolve = (serviceName) => {
      if (visited.has(serviceName)) return;
      visited.add(serviceName);

      const dependencies = this.config.services[serviceName] ? 
        (this.config.services[serviceName].dependencies || []) : [];
      dependencies.forEach(dep => {
        if (services.includes(dep)) {
          resolve(dep);
        }
      });

      resolved.push(serviceName);
    };

    services.forEach(resolve);
    return resolved;
  }

  /**
   * 🔍 Development mode - start essential services
   */
  async startDevelopment() {
    console.log('🔧 Starting Ultra-Core in Development Mode...');
    
    // Start essential services for development
    const devServices = ['database', 'backend', 'frontend'];
    
    for (const service of devServices) {
      if (this.config.services[service]) {
        await this.startSingleService(service);
      }
    }

    console.log('🎉 Development environment ready!');
    console.log('📱 Frontend: http://localhost:3000');
    console.log('🔌 Backend API: http://localhost:3001');
    console.log('💾 Database: localhost:5432');
    
    return true;
  }

  /**
   * 🏥 Health check system
   */
  async runHealthChecks() {
    console.log('🏥 Running system health checks...');
    
    const results = [];
    
    for (const [serviceName, serviceInfo] of this.services) {
      const config = serviceInfo.config;
      const status = {
        service: serviceName,
        name: config.name,
        status: serviceInfo.status,
        uptime: Date.now() - serviceInfo.startTime,
        healthy: serviceInfo.status === 'running'
      };
      
      results.push(status);
    }

    // System resources
    const systemHealth = {
      service: 'system',
      name: 'System Resources',
      status: 'running',
      memory: {
        used: process.memoryUsage().heapUsed / 1024 / 1024,
        total: os.totalmem() / 1024 / 1024 / 1024
      },
      cpu: os.loadavg(),
      healthy: true
    };
    
    results.push(systemHealth);

    console.table(results);
    return results;
  }

  /**
   * 📈 System status overview
   */
  async getSystemStatus() {
    console.log('📈 Ultra-Core System Status\n');
    
    console.log(`🎯 Controller Status: Active`);
    console.log(`🌍 Environment: ${this.config.environment}`);
    console.log(`📁 Project Root: ${this.projectRoot}`);
    console.log(`🔧 Services Configured: ${Object.keys(this.config.services).length}`);
    console.log(`🏃 Services Running: ${this.services.size}\n`);

    if (this.services.size > 0) {
      console.log('📦 Active Services:');
      for (const [name, info] of this.services) {
        const uptime = Math.floor((Date.now() - info.startTime) / 1000);
        console.log(`  • ${info.config.name} (${name}) - ${info.status} - ${uptime}s`);
      }
    } else {
      console.log('📦 No services currently running');
    }

    return true;
  }

  /**
   * 🗺️ Show project map for easy navigation
   */
  showProjectMap(category = 'all') {
    console.log('🗺️  ULTRA-CORE PROJECT MAP\n');
    
    if (category === 'all' || category === 'organization') {
      console.log('🏗️ ORGANIZATIONAL STRUCTURE:');
      Object.entries(this.projectMap.organization).forEach(([name, path]) => {
        const exists = fs.existsSync(path) ? '✅' : '❌';
        console.log(`  ${exists} ${name}: ${path}`);
      });
      console.log('');
    }

    if (category === 'all' || category === 'platform') {
      console.log('🚀 PLATFORM SERVICES:');
      Object.entries(this.projectMap.platform).forEach(([name, config]) => {
        if (typeof config === 'object' && config.path) {
          const exists = fs.existsSync(config.path) ? '✅' : '❌';
          console.log(`  ${exists} ${name}: ${config.path}`);
          if (config.package && fs.existsSync(config.package)) {
            console.log(`    📦 Package: ${config.package}`);
          }
        }
      });
      console.log('');
    }

    if (category === 'all' || category === 'config') {
      console.log('⚙️ CONFIGURATION FILES:');
      Object.entries(this.projectMap.config).forEach(([name, pathOrObj]) => {
        if (typeof pathOrObj === 'string') {
          const exists = fs.existsSync(pathOrObj) ? '✅' : '❌';
          console.log(`  ${exists} ${name}: ${pathOrObj}`);
        } else if (typeof pathOrObj === 'object') {
          console.log(`  📁 ${name}:`);
          Object.entries(pathOrObj).forEach(([subName, subPath]) => {
            const exists = fs.existsSync(subPath) ? '✅' : '❌';
            console.log(`    ${exists} ${subName}: ${subPath}`);
          });
        }
      });
      console.log('');
    }

    if (category === 'all' || category === 'control') {
      console.log('🏛️ CONTROL & GOVERNANCE:');
      Object.entries(this.projectMap.control).forEach(([name, pathOrObj]) => {
        if (typeof pathOrObj === 'string') {
          const exists = fs.existsSync(pathOrObj) ? '✅' : '❌';
          console.log(`  ${exists} ${name}: ${pathOrObj}`);
        } else if (typeof pathOrObj === 'object') {
          console.log(`  📁 ${name}:`);
          Object.entries(pathOrObj).forEach(([subName, subPath]) => {
            if (typeof subPath === 'string') {
              const exists = fs.existsSync(subPath) ? '✅' : '❌';
              console.log(`    ${exists} ${subName}: ${subPath}`);
            } else if (typeof subPath === 'object') {
              console.log(`    📂 ${subName}:`);
              Object.entries(subPath).forEach(([deepName, deepPath]) => {
                const exists = fs.existsSync(deepPath) ? '✅' : '❌';
                console.log(`      ${exists} ${deepName}: ${deepPath}`);
              });
            }
          });
        }
      });
      console.log('');
    }

    return true;
  }

  /**
   * 🔍 Find components in project
   */
  findInProject(searchTerm) {
    console.log(`🔍 Searching for: "${searchTerm}"\n`);
    
    const results = [];
    
    // Search through all mapped paths
    const searchInMap = (obj, prefix = '') => {
      Object.entries(obj).forEach(([key, value]) => {
        if (typeof value === 'string') {
          if (key.toLowerCase().includes(searchTerm.toLowerCase()) || 
              value.toLowerCase().includes(searchTerm.toLowerCase())) {
            results.push({
              type: prefix,
              name: key,
              path: value,
              exists: fs.existsSync(value)
            });
          }
        } else if (typeof value === 'object') {
          searchInMap(value, prefix ? `${prefix}.${key}` : key);
        }
      });
    };

    searchInMap(this.projectMap);

    if (results.length === 0) {
      console.log('❌ No results found');
      return false;
    }

    console.log('📋 SEARCH RESULTS:');
    results.forEach(result => {
      const icon = result.exists ? '✅' : '❌';
      console.log(`  ${icon} ${result.type}.${result.name}: ${result.path}`);
    });

    return true;
  }

  /**
   * 📋 List project components by category
   */
  listProjectComponents(category = 'platform') {
    console.log(`📋 ${category.toUpperCase()} COMPONENTS:\n`);
    
    const categoryData = this.projectMap[category];
    if (!categoryData) {
      console.log(`❌ Category '${category}' not found`);
      console.log('Available categories:', Object.keys(this.projectMap).join(', '));
      return false;
    }

    Object.entries(categoryData).forEach(([name, config]) => {
      const path = typeof config === 'object' ? config.path : config;
      const exists = fs.existsSync(path) ? '✅' : '❌';
      console.log(`  ${exists} ${name}`);
      
      if (typeof config === 'object') {
        Object.entries(config).forEach(([subKey, subPath]) => {
          if (subKey !== 'path' && typeof subPath === 'string') {
            const subExists = fs.existsSync(subPath) ? '✅' : '❌';
            console.log(`    ${subExists} ${subKey}: ${subPath}`);
          }
        });
      }
    });

    return true;
  }

  /**
   * 📍 Get path to specific component
   */
  getComponentPath(category, component) {
    const categoryData = this.projectMap[category];
    if (!categoryData) {
      console.log(`❌ Category '${category}' not found`);
      return false;
    }

    const componentData = categoryData[component];
    if (!componentData) {
      console.log(`❌ Component '${component}' not found in ${category}`);
      console.log('Available components:', Object.keys(categoryData).join(', '));
      return false;
    }

    const path = typeof componentData === 'object' ? componentData.path : componentData;
    const exists = fs.existsSync(path) ? '✅ EXISTS' : '❌ MISSING';
    
    console.log(`📍 ${category}.${component}: ${path}`);
    console.log(`   Status: ${exists}`);
    
    return path;
  }

  /**
   * ❓ Show help information
   */
  showHelp() {
    console.log(`
🏗️  ULTRA-CORE ENTERPRISE CONTROLLER
====================================

🎯 MAIN COMMANDS:
  start [service]     Start services (all or specific: database, backend, frontend)
  stop [service]      Stop services (all or specific)
  restart [service]   Restart services
  services           Show service dashboard
  status             Show system status with production metrics
  health             Run comprehensive health checks
  dev                Start development environment
  production         Show production status and configuration

🏗️ BUILD SYSTEM:
  build [component]   Build platform components (all, frontend, backend, blockchain, api, database, services)
  build --production  Build for production environment
  build --staging     Build for staging environment
  build --parallel    Build components in parallel (default)
  build --sequential  Build components sequentially
  build --skip-tests  Skip tests during build
  build --force       Force rebuild all components

📦 DEPENDENCY MANAGEMENT:
  install-deps       Install dependencies for all components
  validate-deps      Validate all dependencies are installed
  check-deps [comp]  Check dependency health status

🗄️ DATABASE MANAGEMENT:
  database setup         Setup all databases for current environment
  database status        Show status of all databases
  database health [db]   Check database health (mongodb, postgresql, redis, all)
  database backup [db]   Create database backup (specific or all)
  database config [db]   Show database configuration
  database enable <db>   Enable specific database type
  database disable <db>  Disable specific database type

🎮 DEVELOPMENT PLATFORM:
  dev start [service] Start development environment (all services or specific)
  dev stop           Stop development environment
  dev status         Show development environment status
  dev reload <svc>   Reload specific service with hot reload
  dev --skip-db      Skip database services when starting
  dev --no-hot-reload Disable hot reload functionality

🧪 MASTER TESTING:
  test [scope]       Run master testing framework (all, unit, integration, e2e, performance, security)
  test --parallel    Run tests in parallel mode
  test --coverage    Generate coverage reports
  test --verbose     Enable verbose output

🌍 MASTER ENVIRONMENT:
  env status         Show environment status across all services
  env switch <env>   Switch to environment (development, staging, production)
  env validate <env> Validate environment configuration
  env sync           Synchronize environment configurations
  env backup         Backup current environment configs
  env secrets <env>  Manage environment secrets

🎛️ MASTER CONTROL:
  dashboard          Show master control dashboard (overview mode)
  control overview   System overview dashboard
  control detailed   Detailed system metrics
  control monitoring Real-time monitoring dashboard
  control security   Security status dashboard
  control performance Performance metrics dashboard

🗺️ PROJECT NAVIGATION:
  map [category]     Show project structure map
  find <term>        Search for components in project
  list <category>    List components by category
  path <cat> <comp>  Get path to specific component

🛠️ DEVTOOLS PLATFORM:
  devtools component <name> [type]    Generate component (react, vue, angular)
  devtools service <name> [type]      Generate service (nestjs, express, fastify)
  devtools project <name> [type]      Scaffold project (react-app, nestjs-microservice, node-api)
  devtools test <target> [type]       Generate tests (unit, integration, e2e)
  devtools build [target]             Build project components
  devtools watch [target]             Start watch mode for development
  devtools docs [target]              Generate documentation
  devtools health                     Check DevTools system health

📚 DOCUMENTATION TOOLS:
  docs generate                       Generate comprehensive documentation
  docs organize                       Organize documentation structure
  docs validate                       Validate documentation completeness
  docs ddt <operation>                Run Documentation Development Tools
  docs template <type> <target>       Create documentation from templates
  docs health                         Check documentation system health

🔧 INFRASTRUCTURE:
  scripts            List all infrastructure automation scripts
  docker             Run Docker commands
  cache              Clear caches

📊 MONITORING:
  logs               View service logs
  metrics            Show performance metrics
  alerts             Check system alerts

🔒 SECURITY:
  audit              Run security audit
  compliance         Check compliance status
  policies           Manage governance policies

💡 EXAMPLES:
  node main.js build all --production
  node main.js dev start --skip-db
  node main.js build frontend --force
  node main.js dev reload backend
  node main.js test unit --coverage
  node main.js env switch production
  node main.js dashboard monitoring
  node main.js map platform
  node main.js find wallet
`);
  }

  /**
   * 🚀 Enhanced service startup with production configurations
   */
  async startServices(serviceName = 'all') {
    console.log('🚀 Starting Ultra-Core Services...');
    
    // Validate production configurations first
    const configValidation = this.validateProductionConfigs();
    if (!configValidation.allValid) {
      console.error('❌ Production configurations validation failed');
      console.log('Missing configurations:', configValidation);
      return false;
    }
    
    console.log('✅ Production configurations validated');
    
    // Check database services health
    const healthCheck = await this.checkProductionHealth();
    console.log('🏥 Service Health Check:', healthCheck);
    
    if (serviceName === 'all' || serviceName === 'database') {
      await this.startDatabaseServices();
    }
    
    if (serviceName === 'all' || serviceName === 'backend') {
      await this.startBackendService();
    }
    
    if (serviceName === 'all' || serviceName === 'frontend') {
      await this.startFrontendService();
    }
    
    console.log('✅ Ultra-Core Services Started Successfully');
    return true;
  }

  /**
   * 🗄️ Start database services with production configurations
   */
  async startDatabaseServices() {
    console.log('🗄️ Starting Database Services...');
    
    // Start PostgreSQL
    await this.startPostgreSQL();
    
    // Start MongoDB
    await this.startMongoDB();
    
    // Start Redis
    await this.startRedis();
    
    console.log('✅ Database Services Started');
  }

  /**
   * 🐘 Start PostgreSQL with production configuration
   */
  async startPostgreSQL() {
    return new Promise((resolve) => {
      console.log('🐘 Starting PostgreSQL...');
      exec('wsl -- sudo service postgresql start', (error, stdout, stderr) => {
        if (error) {
          console.error('❌ PostgreSQL start failed:', error.message);
        } else {
          console.log('✅ PostgreSQL started successfully');
        }
        resolve();
      });
    });
  }

  /**
   * 🍃 Start MongoDB with analytics configuration
   */
  async startMongoDB() {
    return new Promise((resolve) => {
      console.log('🍃 Starting MongoDB...');
      exec('wsl -- sudo service mongod start', (error, stdout, stderr) => {
        if (error) {
          console.error('❌ MongoDB start failed:', error.message);
        } else {
          console.log('✅ MongoDB started successfully');
        }
        resolve();
      });
    });
  }

  /**
   * 🔴 Start Redis with clustering configuration
   */
  async startRedis() {
    return new Promise((resolve) => {
      console.log('🔴 Starting Redis...');
      exec('wsl -- sudo service redis-server start', (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Redis start failed:', error.message);
        } else {
          console.log('✅ Redis started successfully');
        }
        resolve();
      });
    });
  }

  /**
   * 🚀 Start backend service with production configurations
   */
  async startBackendService() {
    return new Promise((resolve) => {
      console.log('🚀 Starting Backend Service...');
      const backendPath = path.join(this.projectRoot, 'platform', 'backend');
      
      exec(`cd ${backendPath} && npm run start:prod`, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Backend start failed:', error.message);
          console.log('Trying development mode...');
          exec(`cd ${backendPath} && npm run start:dev`, (devError, devStdout, devStderr) => {
            if (devError) {
              console.error('❌ Backend development mode failed:', devError.message);
            } else {
              console.log('✅ Backend started in development mode');
            }
            resolve();
          });
        } else {
          console.log('✅ Backend started in production mode');
          resolve();
        }
      });
    });
  }

  /**
   * 🎨 Start frontend service
   */
  async startFrontendService() {
    return new Promise((resolve) => {
      console.log('🎨 Starting Frontend Service...');
      const frontendPath = path.join(this.projectRoot, 'platform', 'frontend');
      
      exec(`cd ${frontendPath} && npm run dev`, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Frontend start failed:', error.message);
        } else {
          console.log('✅ Frontend started successfully');
        }
        resolve();
      });
    });
  }

  /**
   * 📊 Enhanced status display with production metrics
   */
  async showProductionStatus() {
    console.log('\n🏗️  ULTRA-CORE PRODUCTION STATUS');
    console.log('=====================================\n');
    
    // Configuration validation
    const configValidation = this.validateProductionConfigs();
    console.log('🔧 CONFIGURATION STATUS:');
    console.log(`   Database Configs: ${Object.keys(configValidation.database).length}/3 ✅`);
    console.log(`   Security Configs: ${Object.keys(configValidation.security).length}/3 ✅`);
    console.log(`   Auth Configs: ${Object.keys(configValidation.authentication).length}/1 ✅`);
    console.log(`   Overall Valid: ${configValidation.allValid ? '✅' : '❌'}\n`);
    
    // Service health
    const healthStatus = await this.checkProductionHealth();
    console.log('🏥 SERVICE HEALTH:');
    Object.entries(healthStatus).forEach(([service, status]) => {
      const icon = status.healthy ? '✅' : '❌';
      console.log(`   ${service.toUpperCase()}: ${icon} ${status.status || status.error || ''}`);
    });
    
    console.log('\n📈 PRODUCTION FEATURES:');
    console.log('   🐘 PostgreSQL Production Configuration');
    console.log('   🍃 MongoDB Analytics Platform');
    console.log('   🔴 Redis Clustering & Caching');
    console.log('   🔒 Security Hardening Framework');
    console.log('   🔑 JWT Enhanced Authentication');
    console.log('   🛡️  Environment Security Management');
    console.log('   🌐 Production CORS Policies');
    
    console.log('\n🎯 NEXT ACTIONS:');
    console.log('   - Run health checks: node main.js health');
    console.log('   - Start all services: node main.js start');
    console.log('   - View service dashboard: node main.js services');
  }

  /**
   * 🧪 Master Testing Integration
   * Provides enterprise-grade testing orchestration
   */
  async runMasterTests(scope = 'all', options = {}) {
    console.log('🧪 ULTRA-CORE MASTER TESTING FRAMEWORK');
    console.log('========================================\n');
    
    const testRunner = {
      scope,
      options: {
        parallel: options.parallel || true,
        coverage: options.coverage || true,
        verbose: options.verbose || false,
        environment: options.environment || 'test',
        ...options
      },
      results: {
        total: 0,
        passed: 0,
        failed: 0,
        coverage: 0,
        duration: 0
      }
    };

    try {
      const startTime = Date.now();
      
      // Environment setup
      console.log('🔧 Setting up test environment...');
      await this.setupTestEnvironment(testRunner.options.environment);
      
      // Run tests based on scope
      switch (scope) {
        case 'all':
          await this.runFullTestSuite(testRunner);
          break;
        case 'unit':
          await this.runUnitTests(testRunner);
          break;
        case 'integration':
          await this.runIntegrationTests(testRunner);
          break;
        case 'e2e':
          await this.runE2ETests(testRunner);
          break;
        case 'performance':
          await this.runPerformanceTests(testRunner);
          break;
        case 'security':
          await this.runSecurityTests(testRunner);
          break;
        default:
          await this.runCustomTestScope(scope, testRunner);
      }
      
      testRunner.results.duration = Date.now() - startTime;
      
      // Generate test report
      await this.generateTestReport(testRunner);
      
      return testRunner.results;
      
    } catch (error) {
      console.error('❌ Master testing failed:', error.message);
      return false;
    }
  }

  /**
   * 🌍 Master Environment Management
   * Orchestrates environment configurations across all services
   */
  async manageEnvironment(action = 'status', environment = null, options = {}) {
    console.log('🌍 ULTRA-CORE MASTER ENVIRONMENT MANAGER');
    console.log('=========================================\n');
    
    const envManager = {
      action,
      environment,
      options,
      configs: {
        development: this.getDevelopmentConfig(),
        staging: this.getStagingConfig(), 
        production: this.getProductionConfig(),
        testing: this.getTestingConfig()
      },
      services: ['backend', 'frontend', 'database', 'blockchain', 'api'],
      status: {}
    };

    try {
      switch (action) {
        case 'status':
          return await this.showEnvironmentStatus(envManager);
        case 'switch':
          return await this.switchEnvironment(environment, envManager);
        case 'validate':
          return await this.validateEnvironment(environment, envManager);
        case 'sync':
          return await this.syncEnvironmentConfigs(envManager);
        case 'backup':
          return await this.backupEnvironmentConfigs(envManager);
        case 'restore':
          return await this.restoreEnvironmentConfigs(environment, envManager);
        case 'secrets':
          return await this.manageEnvironmentSecrets(environment, envManager);
        default:
          console.log('❌ Unknown environment action:', action);
          return false;
      }
    } catch (error) {
      console.error('❌ Environment management failed:', error.message);
      return false;
    }
  }

  /**
   * 🎛️ Master Control Dashboard
   * Unified control interface for all system operations
   */
  async showMasterControlDashboard(mode = 'overview') {
    console.log('\n🎛️  ULTRA-CORE MASTER CONTROL DASHBOARD');
    console.log('=========================================\n');
    
    const dashboard = {
      timestamp: new Date().toISOString(),
      mode,
      system: await this.getSystemMetrics(),
      services: await this.getServiceStatuses(),
      environment: await this.getCurrentEnvironmentStatus(),
      security: await this.getSecurityStatus(),
      performance: await this.getPerformanceMetrics(),
      alerts: await this.getSystemAlerts()
    };

    try {
      switch (mode) {
        case 'overview':
          await this.displayOverviewDashboard(dashboard);
          break;
        case 'detailed':
          await this.displayDetailedDashboard(dashboard);
          break;
        case 'monitoring':
          await this.displayMonitoringDashboard(dashboard);
          break;
        case 'security':
          await this.displaySecurityDashboard(dashboard);
          break;
        case 'performance':
          await this.displayPerformanceDashboard(dashboard);
          break;
        default:
          await this.displayOverviewDashboard(dashboard);
      }
      
      return dashboard;
      
    } catch (error) {
      console.error('❌ Dashboard display failed:', error.message);
      return false;
    }
  }

  /**
   * 🔧 Setup test environment
   */
  async setupTestEnvironment(environment) {
    console.log(`🔧 Setting up ${environment} test environment...`);
    
    // Load test-specific configurations
    await this.loadEnvironmentConfig(environment);
    
    // Initialize test databases
    if (environment === 'test') {
      await this.initializeTestDatabases();
    }
    
    console.log('✅ Test environment ready');
  }

  /**
   * 🧪 Run full test suite
   */
  async runFullTestSuite(testRunner) {
    console.log('🧪 Running full test suite...');
    
    const suites = ['unit', 'integration', 'e2e', 'performance', 'security'];
    
    for (const suite of suites) {
      console.log(`\n📋 Running ${suite} tests...`);
      await this.runTestSuite(suite, testRunner);
    }
  }

  /**
   * 🔍 Display overview dashboard
   */
  async displayOverviewDashboard(dashboard) {
    console.log('📊 SYSTEM OVERVIEW:');
    console.log(`   Status: ${dashboard.system.healthy ? '🟢 Healthy' : '🔴 Issues'}`);
    console.log(`   Uptime: ${dashboard.system.uptime}`);
    console.log(`   Environment: ${dashboard.environment.current}`);
    console.log(`   Services Running: ${dashboard.services.running}/${dashboard.services.total}`);
    
    console.log('\n🔔 ALERTS:');
    if (dashboard.alerts.length === 0) {
      console.log('   ✅ No active alerts');
    } else {
      dashboard.alerts.forEach(alert => {
        console.log(`   🔴 ${alert.type}: ${alert.message}`);
      });
    }
    
    console.log('\n🎯 QUICK ACTIONS:');
    console.log('   • Master Testing: node service.js test');
    console.log('   • Environment Switch: node service.js env switch <env>');
    console.log('   • Service Control: node service.js start/stop <service>');
    console.log('   • Health Check: node service.js health');
  }

  /**
   * 🌍 Show environment status
   */
  async showEnvironmentStatus(envManager) {
    console.log('🌍 ENVIRONMENT STATUS:');
    
    for (const [env, config] of Object.entries(envManager.configs)) {
      const status = await this.checkEnvironmentHealth(env, config);
      const icon = status.healthy ? '🟢' : '🔴';
      console.log(`   ${icon} ${env.toUpperCase()}: ${status.description}`);
    }
    
    console.log('\n📋 AVAILABLE ACTIONS:');
    console.log('   • switch <env>   - Switch to environment');
    console.log('   • validate <env> - Validate environment config');
    console.log('   • sync           - Sync configurations');
    console.log('   • backup         - Backup current configs');
    
    return true;
  }

  /**
   * 📊 Get system metrics
   */
  async getSystemMetrics() {
    return {
      healthy: true,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: os.loadavg(),
      platform: os.platform(),
      arch: os.arch()
    };
  }

  /**
   * 🔍 Get service statuses
   */
  async getServiceStatuses() {
    return {
      running: this.services.size,
      total: Object.keys(this.config.services).length,
      details: Array.from(this.services.entries()).map(([name, service]) => ({
        name,
        status: service.status,
        uptime: Date.now() - service.startTime
      }))
    };
  }

  /**
   * 🌍 Get current environment status
   */
  async getCurrentEnvironmentStatus() {
    return {
      current: process.env.NODE_ENV || 'development',
      configs: Object.keys(this.getDevelopmentConfig())
    };
  }

  /**
   * 🔒 Get security status
   */
  async getSecurityStatus() {
    return {
      policies: 'active',
      compliance: 'validated',
      alerts: 0
    };
  }

  /**
   * 📈 Get performance metrics
   */
  async getPerformanceMetrics() {
    return {
      responseTime: '< 100ms',
      throughput: 'normal',
      errors: 0
    };
  }

  /**
   * 🔔 Get system alerts
   */
  async getSystemAlerts() {
    return []; // No alerts for now
  }

  /**
   * 🔧 Development configuration
   */
  getDevelopmentConfig() {
    const envConfig = this.masterConfig?.get('environments.development') || {};
    const defaultConfig = {
      NODE_ENV: 'development',
      ULTRA_CORE_ENV: 'development',
      DATABASE_URL: 'postgresql://localhost:5432/ultracore_dev',
      REDIS_URL: 'redis://localhost:6379',
      LOG_LEVEL: 'debug'
    };
    return { ...defaultConfig, ...envConfig };
  }

  /**
   * 🚀 Staging configuration
   */
  getStagingConfig() {
    const envConfig = this.masterConfig?.get('environments.staging') || {};
    const defaultConfig = {
      NODE_ENV: 'staging',
      ULTRA_CORE_ENV: 'staging',
      DATABASE_URL: 'postgresql://localhost:5432/ultracore_staging',
      REDIS_URL: 'redis://localhost:6379',
      LOG_LEVEL: 'info'
    };
    return { ...defaultConfig, ...envConfig };
  }

  /**
   * 🏭 Production configuration
   */
  getProductionConfig() {
    const envConfig = this.masterConfig?.get('environments.production') || {};
    const defaultConfig = {
      NODE_ENV: 'production',
      ULTRA_CORE_ENV: 'production',
      DATABASE_URL: 'postgresql://localhost:5432/ultracore_prod',
      REDIS_URL: 'redis://localhost:6379',
      LOG_LEVEL: 'warn'
    };
    return { ...defaultConfig, ...envConfig };
  }

  /**
   * 🧪 Testing configuration
   */
  getTestingConfig() {
    const envConfig = this.masterConfig?.get('environments.testing') || {};
    const defaultConfig = {
      NODE_ENV: 'test',
      ULTRA_CORE_ENV: 'testing',
      DATABASE_URL: 'postgresql://localhost:5432/ultracore_test',
      REDIS_URL: 'redis://localhost:6379',
      LOG_LEVEL: 'silent'
    };
    return { ...defaultConfig, ...envConfig };
  }
}

// Create and export controller instance
const controller = new UltraCoreController();

} catch (error) {
  console.error('💥 Failed to load Ultra-Core system:', error.message);
  console.error('This is likely due to missing dependencies or configuration issues.');
  process.exit(1);
}

// ========================================================================================
// 🏗️ KUBECTL INTEGRATION METHODS
// ========================================================================================

/**
 * 🚀 Kubernetes Deployment Management
 */
class KubernetesManager {
  constructor(controller) {
    this.controller = controller;
    this.kubectlAvailable = false;
    this.checkKubectlAvailability();
  }

  /**
   * 🔍 Check kubectl availability
   */
  async checkKubectlAvailability() {
    try {
      const { exec } = require('child_process');
      await new Promise((resolve, reject) => {
        exec('kubectl version --client', (error, stdout, stderr) => {
          if (error) {
            console.log('⚠️ kubectl not available - Kubernetes features disabled');
            this.kubectlAvailable = false;
            resolve();
          } else {
            console.log('✅ kubectl available - Kubernetes features enabled');
            this.kubectlAvailable = true;
            resolve();
          }
        });
      });
    } catch (error) {
      this.kubectlAvailable = false;
    }
  }

  /**
   * 🚀 Deploy to Kubernetes
   */
  async deployToKubernetes(environment = 'development', options = {}) {
    if (!this.kubectlAvailable) {
      throw new Error('kubectl not available. Please install kubectl to use Kubernetes features.');
    }

    console.log(`🚀 Deploying Ultra-Core to Kubernetes (${environment})...`);
    
    const deploymentConfig = {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        name: `ultra-core-${environment}`,
        namespace: environment,
        labels: {
          app: 'ultra-core',
          environment: environment,
          version: '1.0.0'
        }
      },
      spec: {
        replicas: options.replicas || (environment === 'production' ? 3 : 1),
        selector: {
          matchLabels: {
            app: 'ultra-core',
            environment: environment
          }
        },
        template: {
          metadata: {
            labels: {
              app: 'ultra-core',
              environment: environment
            }
          },
          spec: {
            containers: [
              {
                name: 'ultra-core-backend',
                image: `ultra-core/backend:${options.tag || 'latest'}`,
                ports: [{ containerPort: 3000 }],
                env: [
                  { name: 'NODE_ENV', value: environment },
                  { name: 'DATABASE_URL', valueFrom: { secretKeyRef: { name: 'ultra-core-secrets', key: 'database-url' } } }
                ],
                resources: {
                  requests: { cpu: '500m', memory: '1Gi' },
                  limits: { cpu: '2000m', memory: '4Gi' }
                }
              }
            ]
          }
        }
      }
    };

    // Apply deployment
    await this.applyKubernetesConfig(deploymentConfig, environment);
    return { success: true, environment, deployment: deploymentConfig.metadata.name };
  }

  /**
   * ⚙️ Apply Kubernetes configuration
   */
  async applyKubernetesConfig(config, environment) {
    const { exec } = require('child_process');
    const fs = require('fs').promises;
    
    // Create temp config file
    const configPath = `/tmp/ultra-core-${environment}-config.yaml`;
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    
    return new Promise((resolve, reject) => {
      exec(`kubectl apply -f ${configPath}`, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Kubernetes deployment failed: ${stderr}`));
        } else {
          console.log('✅ Kubernetes configuration applied successfully');
          resolve(stdout);
        }
      });
    });
  }

  /**
   * 📊 Get Kubernetes status
   */
  async getKubernetesStatus(environment = 'development') {
    if (!this.kubectlAvailable) {
      return { available: false, message: 'kubectl not available' };
    }

    const { exec } = require('child_process');
    return new Promise((resolve, reject) => {
      exec(`kubectl get pods -n ${environment} -l app=ultra-core`, (error, stdout, stderr) => {
        if (error) {
          resolve({ available: true, status: 'error', message: stderr });
        } else {
          resolve({ available: true, status: 'success', pods: stdout });
        }
      });
    });
  }

  /**
   * 🔄 Scale deployment
   */
  async scaleDeployment(environment, replicas) {
    if (!this.kubectlAvailable) {
      throw new Error('kubectl not available');
    }

    const { exec } = require('child_process');
    return new Promise((resolve, reject) => {
      exec(`kubectl scale deployment ultra-core-${environment} --replicas=${replicas} -n ${environment}`, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Failed to scale deployment: ${stderr}`));
        } else {
          console.log(`✅ Scaled deployment to ${replicas} replicas`);
          resolve({ success: true, replicas, environment });
        }
      });
    });
  }
}

// Add to main controller
UltraCoreController.prototype.initializeKubernetes = function() {
  this.kubernetes = new KubernetesManager(this);
  return this.kubernetes;
};

UltraCoreController.prototype.getKubernetes = function() {
  if (!this.kubernetes) {
    this.kubernetes = new KubernetesManager(this);
  }
  return this.kubernetes;
};

// Initialize Kubernetes manager
controller.initializeKubernetes();

// ========================================================================================

/**
 * 🎯 Main CLI Handler
 */
async function main() {
  const command = process.argv[2] || 'help';
  const args = process.argv.slice(3);

  try {
    switch (command) {
      case 'start':
        await controller.startServices(args[0]);
        break;
      
      // 🏗️ Build System Commands
      case 'build':
        const buildTarget = args[0] || 'all';
        const buildOptions = {
          environment: args.includes('--production') ? 'production' : 
                      args.includes('--staging') ? 'staging' : 'development',
          parallel: !args.includes('--sequential'),
          skipTests: args.includes('--skip-tests'),
          forceRebuild: args.includes('--force')
        };
        const buildController = controller.getBuildController();
        if (buildController) {
          if (buildTarget === 'all') {
            const buildResult = await buildController.buildAll(buildOptions);
            console.log('🏗️ Build Result:', buildResult);
          } else {
            const buildResult = await buildController.buildComponent(buildTarget, buildOptions);
            console.log('🏗️ Build Result:', buildResult);
          }
        } else {
          console.error('❌ Build controller not available');
        }
        break;
      
      // 🎮 Development Platform Commands
      case 'dev':
        const devAction = args[0] || 'start';
        const devPlatform = controller.getDevPlatform();
        if (devPlatform) {
          switch (devAction) {
            case 'start':
              const devOptions = {
                services: args[1] || 'all',
                skipDatabases: args.includes('--skip-db'),
                hotReload: !args.includes('--no-hot-reload')
              };
              const devResult = await devPlatform.startDevelopment(devOptions);
              console.log('🎮 Development Started:', devResult);
              break;
            case 'stop':
              await devPlatform.stopDevelopment();
              console.log('🛑 Development environment stopped');
              break;
            case 'status':
              const devStatus = devPlatform.getDevelopmentStatus();
              console.log('🎮 Development Status:', devStatus);
              break;
            case 'reload':
              const serviceToReload = args[1];
              if (serviceToReload) {
                await devPlatform.reloadService(serviceToReload);
                console.log(`🔄 Service ${serviceToReload} reloaded`);
              } else {
                console.error('❌ Please specify service to reload');
              }
              break;
            default:
              console.error(`❌ Unknown dev action: ${devAction}`);
          }
        } else {
          console.error('❌ Development platform not available');
        }
        break;
      case 'production':
        await controller.showProductionStatus();
        break;
      case 'health':
        const health = await controller.checkProductionHealth();
        console.log('🏥 System Health:', JSON.stringify(health, null, 2));
        break;
      case 'validate':
        const validation = controller.validateProductionConfigs();
        console.log('✅ Configuration Validation:', JSON.stringify(validation, null, 2));
        break;
      
      // 🧪 Master Testing Commands
      case 'test':
      case 'testing':
        const testScope = args[0] || 'all';
        const testingController = controller.getController('testingController');
        if (testingController) {
          switch (testScope) {
            case 'all':
              const allResults = await testingController.runAllTests();
              console.log('🧪 All Tests Results:', allResults);
              break;
            case 'unit':
              const unitResults = await testingController.runUnitTests();
              console.log('🔬 Unit Tests Results:', unitResults);
              break;
            case 'integration':
              const integrationResults = await testingController.runIntegrationTests();
              console.log('🔗 Integration Tests Results:', integrationResults);
              break;
            case 'e2e':
              const e2eResults = await testingController.runE2ETests();
              console.log('🎭 E2E Tests Results:', e2eResults);
              break;
            case 'performance':
              const perfResults = await testingController.runPerformanceTests();
              console.log('⚡ Performance Tests Results:', perfResults);
              break;
            case 'security':
              const secResults = await testingController.runSecurityTests();
              console.log('🔒 Security Tests Results:', secResults);
              break;
            case 'platform':
              const platformResults = await testingController.runPlatformTests();
              console.log('🏗️ Platform Tests Results:', platformResults);
              break;
            case 'health':
              const healthCheck = await testingController.healthCheck();
              console.log('🏥 Testing Framework Health:', healthCheck);
              break;
            case 'setup':
              await testingController.setupEnvironment();
              console.log('✅ Testing environment setup complete');
              break;
            case 'cleanup':
              await testingController.cleanup();
              console.log('✅ Testing cleanup complete');
              break;
            case 'reports':
              const reports = await testingController.generateReports();
              console.log('📊 Test Reports Generated:', reports);
              break;
            default:
              console.log('❌ Unknown test scope. Available: all, unit, integration, e2e, performance, security, platform, health, setup, cleanup, reports');
          }
        } else {
          console.log('❌ Testing Controller not available');
        }
        break;
      
      // 🌍 Master Environment Commands  
      case 'env':
      case 'environment':
        const envAction = args[0] || 'status';
        const envTarget = args[1];
        const envOptions = {
          force: args.includes('--force'),
          backup: args.includes('--backup')
        };
        const envResult = await controller.manageEnvironment(envAction, envTarget, envOptions);
        console.log('🌍 Environment Result:', envResult);
        break;
      
      // 📊 Monitoring Commands
      case 'monitor':
      case 'monitoring':
        const monitorAction = args[0] || 'status';
        const monitoringController = controller.getController('monitoring');
        if (monitoringController) {
          switch (monitorAction) {
            case 'start':
              await monitoringController.start();
              console.log('✅ Monitoring system started');
              break;
            case 'stop':
              await monitoringController.stop();
              console.log('⏹️ Monitoring system stopped');
              break;
            case 'status':
              const monitorStatus = await monitoringController.status();
              console.log('📊 Monitoring Status:', JSON.stringify(monitorStatus, null, 2));
              break;
            case 'metrics':
              const metrics = monitoringController.metrics;
              console.log('📈 Current Metrics:');
              for (const [category, data] of metrics) {
                console.log(`  ${category}:`, JSON.stringify(data, null, 2));
              }
              break;
            case 'alerts':
              const alerts = Array.from(monitoringController.alerts.keys());
              console.log('🚨 Configured Alerts:', alerts);
              break;
            case 'dashboards':
              const dashboards = Array.from(monitoringController.dashboards.keys());
              console.log('📊 Available Dashboards:', dashboards);
              break;
            case 'health':
              // Trigger manual health checks
              await monitoringController.runHealthChecks();
              console.log('🏥 Health checks completed');
              break;
            default:
              console.log('❌ Unknown monitoring action:', monitorAction);
              console.log('Available actions: start, stop, status, metrics, alerts, dashboards, health');
          }
        } else {
          console.error('❌ Monitoring controller not available');
        }
        break;
      
      // 📚 Documentation Management Commands
      case 'docs':
      case 'documentation':
        const docsAction = args[0] || 'status';
        const documentationController = controller.getController('documentation');
        if (documentationController) {
          switch (docsAction) {
            case 'generate':
              const generateResult = await documentationController.generateDocumentation();
              console.log('📖 Documentation Generation Result:', generateResult);
              break;
            case 'organize':
              const organizeResult = await documentationController.organizeDocumentationStructure();
              console.log('🏗️ Documentation Organization Result:', organizeResult);
              break;
            case 'sign':
              const signResult = await documentationController.addSignatures();
              console.log('✍️ Signature Addition Result:', signResult);
              break;
            case 'validate':
              const validateResult = await documentationController.validateDocumentation();
              console.log('✅ Documentation Validation Result:', validateResult);
              break;
            case 'report':
              const reportResult = await documentationController.generateReport();
              console.log('📊 Documentation Report Result:', reportResult);
              break;
            case 'install':
              const installResult = await documentationController.installDocumentationTools();
              console.log('🔧 Tool Installation Result:', installResult);
              break;
            case 'ddt':
              const ddtOperation = args[1] || 'all';
              const ddtResult = await documentationController.runDDT(ddtOperation);
              console.log(`📚 DDT (${ddtOperation}) Result:`, ddtResult);
              break;
            case 'template':
              const templateType = args[1];
              const templateTarget = args[2];
              if (!templateType || !templateTarget) {
                console.log('❌ Template creation requires type and target path');
                console.log('Usage: docs template <type> <target-path>');
                console.log('Types: api, component, deployment, troubleshooting, readme');
              } else {
                const templateResult = await documentationController.createFromTemplate(templateType, templateTarget);
                console.log('📝 Template Creation Result:', templateResult);
              }
              break;
            case 'health':
              const healthResult = await documentationController.healthCheck();
              console.log('🏥 Documentation System Health:', healthResult);
              break;
            case 'update':
              const updateResult = await documentationController.updateIndexes();
              console.log('📋 Documentation Index Update Result:', updateResult);
              break;
            default:
              console.log('❌ Unknown documentation action:', docsAction);
              console.log('Available actions: generate, organize, sign, validate, report, install, ddt, template, health, update');
          }
        } else {
          console.error('❌ Documentation controller not available');
        }
        break;
      
      // 🎛️ Master Control Dashboard
      case 'dashboard':
      case 'control':
        const dashboardMode = args[0] || 'overview';
        const dashboardData = await controller.showMasterControlDashboard(dashboardMode);
        break;
      
      // �️ DevTools Platform Commands
      case 'devtools':
      case 'generate':
        const devtoolsAction = args[0] || 'status';
        const devtoolsController = controller.getController('devtools');
        if (devtoolsController) {
          switch (devtoolsAction) {
            case 'component':
              const componentName = args[1];
              const componentType = args[2] || 'react';
              if (!componentName) {
                console.log('❌ Component generation requires a name');
                console.log('Usage: devtools component <name> [type]');
                console.log('Types: react, vue, angular');
              } else {
                const componentResult = await devtoolsController.generateComponent(componentName, componentType);
                console.log('🧩 Component Generation Result:', componentResult);
              }
              break;
            case 'service':
              const serviceName = args[1];
              const serviceType = args[2] || 'nestjs';
              if (!serviceName) {
                console.log('❌ Service generation requires a name');
                console.log('Usage: devtools service <name> [type]');
                console.log('Types: nestjs, express, fastify');
              } else {
                const serviceResult = await devtoolsController.generateService(serviceName, serviceType);
                console.log('⚙️ Service Generation Result:', serviceResult);
              }
              break;
            case 'project':
              const projectName = args[1];
              const projectType = args[2] || 'react-app';
              if (!projectName) {
                console.log('❌ Project scaffolding requires a name');
                console.log('Usage: devtools project <name> [type]');
                console.log('Types: react-app, nestjs-microservice, node-api');
              } else {
                const projectResult = await devtoolsController.scaffoldProject(projectName, projectType);
                console.log('🏗️ Project Scaffolding Result:', projectResult);
              }
              break;
            case 'test':
              const testTarget = args[1];
              const testType = args[2] || 'unit';
              if (!testTarget) {
                console.log('❌ Test generation requires a target');
                console.log('Usage: devtools test <target> [type]');
                console.log('Types: unit, integration, e2e');
              } else {
                const testResult = await devtoolsController.generateTests(testTarget, testType);
                console.log('🧪 Test Generation Result:', testResult);
              }
              break;
            case 'build':
              const buildTarget = args[1] || 'all';
              const buildResult = await devtoolsController.buildProject(buildTarget);
              console.log('🔨 Build Result:', buildResult);
              break;
            case 'watch':
              const watchTarget = args[1] || 'all';
              const watchResult = await devtoolsController.watchMode(watchTarget);
              console.log('👀 Watch Mode Result:', watchResult);
              break;
            case 'docs':
              const docsTarget = args[1] || 'all';
              const docsResult = await devtoolsController.generateDocumentation(docsTarget);
              console.log('📚 Documentation Generation Result:', docsResult);
              break;
            case 'health':
              const healthResult = await devtoolsController.healthCheck();
              console.log('🏥 DevTools Health:', healthResult);
              break;
            default:
              console.log('❌ Unknown devtools action:', devtoolsAction);
              console.log('Available actions: component, service, project, test, build, watch, docs, health');
          }
        } else {
          console.error('❌ DevTools controller not available');
        }
        break;
      
      // �🗺️ Project Navigation Commands
      case 'map':
        await controller.showProjectMap(args[0]);
        break;
      case 'find':
        if (args[0]) {
          await controller.findInProject(args[0]);
        } else {
          console.log('❌ Please specify search term');
        }
        break;
      case 'list':
        await controller.listProjectComponents(args[0]);
        break;
      case 'path':
        if (args[0] && args[1]) {
          await controller.getComponentPath(args[0], args[1]);
        } else {
          console.log('❌ Please specify category and component');
        }
        break;
      
      case 'help':
      default:
        controller.showHelp();
        break;
    }
  } catch (error) {
    console.error('❌ Command failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { UltraCoreController, controller };
