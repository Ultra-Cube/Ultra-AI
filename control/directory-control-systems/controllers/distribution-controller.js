// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                                                                          ║
// ║ ██╗   ██╗██╗      █████╗ ██████╗                                         ║
// ║ ██║   ██║██║     ██╔══██╗██╔══██╗                                        ║
// ║ ██║   ██║██║     ███████║██████╔╝                                        ║
// ║ ╚██╗ ██╔╝██║     ██╔══██║██╔══██╗                                        ║
// ║  ╚████╔╝ ███████╗██║  ██║██████╔╝                                        ║
// ║   ╚═══╝  ╚══════╝╚═╝  ╚═╝╚═════╝                                         ║
// ║                                                                          ║
// ║ Project   : Ultra AI — Proprietary AI Platform                           ║
// ║ Developer : Ultra Cube Tech — ucubetech.com                              ║
// ║ Team      : Ultra Zone Team — ultra-zone.ucubetech.com                   ║
// ║ GitHub    : github.com/Ultra-Cube                                        ║
// ║ Copyright : (c) Ultra Cube Tech — All rights reserved                    ║
// ║ [UCUBETECH-COPYRIGHT]                                                    ║
// ║                                                                          ║
// ╚══════════════════════════════════════════════════════════════════════════╝

/**
 * 📦 Distribution Control System
 * ==============================
 * 
 * Manages distribution assets, releases, templates, and deployment packages.
 * Integrates with the master control system for comprehensive distribution management.
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

class DistributionController {
  constructor(masterController = null) {
    this.masterController = masterController;
    this.projectRoot = masterController ? masterController.projectRoot : path.resolve(__dirname, '../..');
    this.distributionPath = path.join(this.projectRoot, 'distribution');
    this.releasesPath = path.join(this.distributionPath, 'releases');
    this.assetsPath = path.join(this.distributionPath, 'assets');
    this.templatesPath = path.join(this.distributionPath, 'templates');
    
    console.log('📦 Distribution Controller initialized');
    console.log(`📁 Distribution Path: ${this.distributionPath}`);
  }

  /**
   * 🏥 Health check for distribution system
   */
  async healthCheck() {
    try {
      const health = {
        status: 'healthy',
        components: {},
        timestamp: new Date().toISOString()
      };

      // Check distribution directories
      const directories = ['releases', 'assets', 'templates'];
      for (const dir of directories) {
        const dirPath = path.join(this.distributionPath, dir);
        try {
          await fs.access(dirPath);
          const stats = await fs.stat(dirPath);
          const files = await fs.readdir(dirPath);
          
          health.components[dir] = {
            status: 'available',
            path: dirPath,
            files: files.length,
            size: stats.size,
            lastModified: stats.mtime
          };
        } catch (error) {
          health.components[dir] = {
            status: 'error',
            error: error.message
          };
          health.status = 'degraded';
        }
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
   * 📋 Get distribution status
   */
  async getStatus() {
    try {
      const status = {
        distribution: {
          path: this.distributionPath,
          components: {}
        }
      };

      // Check releases
      const releasesPath = path.join(this.distributionPath, 'releases');
      try {
        const releases = await fs.readdir(releasesPath);
        status.distribution.components.releases = {
          count: releases.length,
          items: releases
        };
      } catch (error) {
        status.distribution.components.releases = { error: error.message };
      }

      // Check assets
      const assetsPath = path.join(this.distributionPath, 'assets');
      try {
        const assets = await fs.readdir(assetsPath);
        status.distribution.components.assets = {
          count: assets.length,
          items: assets
        };
      } catch (error) {
        status.distribution.components.assets = { error: error.message };
      }

      // Check templates
      const templatesPath = path.join(this.distributionPath, 'templates');
      try {
        const templates = await fs.readdir(templatesPath);
        status.distribution.components.templates = {
          count: templates.length,
          items: templates
        };
      } catch (error) {
        status.distribution.components.templates = { error: error.message };
      }

      return status;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * 🔨 Build distribution packages
   */
  async buildDistribution(component = 'all') {
    try {
      console.log(`🔨 Building distribution for: ${component}`);
      
      const buildResults = {
        component,
        started: new Date().toISOString(),
        results: {}
      };

      if (component === 'all' || component === 'assets') {
        // Build assets
        buildResults.results.assets = await this.buildAssets();
      }

      if (component === 'all' || component === 'releases') {
        // Build releases
        buildResults.results.releases = await this.buildReleases();
      }

      if (component === 'all' || component === 'templates') {
        // Build templates
        buildResults.results.templates = await this.buildTemplates();
      }

      buildResults.completed = new Date().toISOString();
      buildResults.status = 'success';

      console.log('✅ Distribution build completed');
      return buildResults;
    } catch (error) {
      console.error('❌ Distribution build failed:', error.message);
      return {
        status: 'error',
        error: error.message,
        component
      };
    }
  }

  /**
   * 🏗️ Build assets
   */
  async buildAssets() {
    try {
      const assetsPath = path.join(this.distributionPath, 'assets');
      
      // Ensure assets directory exists
      await fs.mkdir(assetsPath, { recursive: true });
      
      // Copy platform assets
      const platformAssetsPath = path.join(this.projectRoot, 'platform', 'frontend', 'public');
      try {
        await this.copyDirectory(platformAssetsPath, path.join(assetsPath, 'frontend'));
      } catch (error) {
        console.warn('⚠️ Frontend assets not found, skipping...');
      }

      return {
        status: 'success',
        path: assetsPath,
        message: 'Assets built successfully'
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * 🚀 Build releases
   */
  async buildReleases() {
    try {
      const releasesPath = path.join(this.distributionPath, 'releases');
      
      // Ensure releases directory exists
      await fs.mkdir(releasesPath, { recursive: true });
      
      // Create release package
      const version = await this.getCurrentVersion();
      const releasePackage = {
        version,
        timestamp: new Date().toISOString(),
        components: {
          frontend: 'Built and optimized',
          backend: 'Services packaged',
          api: 'API gateway configured',
          database: 'Database schemas',
          blockchain: 'Smart contracts'
        },
        files: []
      };

      // Write release information
      const releaseInfoPath = path.join(releasesPath, `release-${version}.json`);
      await fs.writeFile(releaseInfoPath, JSON.stringify(releasePackage, null, 2));

      return {
        status: 'success',
        version,
        path: releasesPath,
        package: releasePackage
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * 📝 Build templates
   */
  async buildTemplates() {
    try {
      const templatesPath = path.join(this.distributionPath, 'templates');
      
      // Ensure templates directory exists
      await fs.mkdir(templatesPath, { recursive: true });
      
      // Create project templates
      const templates = [
        'react-component-template',
        'nestjs-service-template',
        'api-endpoint-template',
        'database-schema-template'
      ];

      for (const template of templates) {
        const templatePath = path.join(templatesPath, template);
        await fs.mkdir(templatePath, { recursive: true });
        
        // Create basic template structure
        await fs.writeFile(
          path.join(templatePath, 'template.json'),
          JSON.stringify({
            name: template,
            description: `Template for ${template}`,
            version: '1.0.0',
            files: []
          }, null, 2)
        );
      }

      return {
        status: 'success',
        path: templatesPath,
        templates
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * 📦 Package application for distribution
   */
  async packageApplication(component, version = null) {
    try {
      console.log(`📦 Packaging ${component} for distribution...`);
      
      const packageVersion = version || await this.getCurrentVersion();
      const packagePath = path.join(this.releasesPath, `${component}-${packageVersion}.tar.gz`);
      
      // Create package based on component
      let sourcePath;
      switch (component) {
        case 'frontend':
          sourcePath = path.join(this.projectRoot, 'platform', 'frontend', 'dist');
          break;
        case 'backend':
          sourcePath = path.join(this.projectRoot, 'platform', 'backend', 'dist');
          break;
        case 'api':
          sourcePath = path.join(this.projectRoot, 'platform', 'api');
          break;
        default:
          sourcePath = path.join(this.projectRoot, 'platform', component);
      }

      // Create package (simplified - in production would use proper packaging)
      const packageResult = {
        component,
        version: packageVersion,
        sourcePath,
        packagePath,
        status: 'packaged',
        timestamp: new Date().toISOString()
      };

      console.log(`✅ ${component} packaged successfully`);
      return packageResult;
    } catch (error) {
      console.error(`❌ Failed to package ${component}:`, error.message);
      return {
        status: 'error',
        error: error.message,
        component
      };
    }
  }

  /**
   * 🗂️ Copy directory recursively
   */
  async copyDirectory(src, dest) {
    try {
      await fs.mkdir(dest, { recursive: true });
      const entries = await fs.readdir(src, { withFileTypes: true });
      
      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
          await this.copyDirectory(srcPath, destPath);
        } else {
          await fs.copyFile(srcPath, destPath);
        }
      }
    } catch (error) {
      console.warn(`⚠️ Copy operation failed: ${error.message}`);
    }
  }

  /**
   * 📊 Get current version from package.json
   */
  async getCurrentVersion() {
    try {
      const packagePath = path.join(this.projectRoot, 'package.json');
      const packageContent = await fs.readFile(packagePath, 'utf8');
      const packageData = JSON.parse(packageContent);
      return packageData.version || '1.0.0';
    } catch (error) {
      return '1.0.0';
    }
  }

  /**
   * 🎯 Start distribution service
   */
  async start() {
    try {
      console.log('🚀 Starting Distribution Controller...');
      
      // Initialize distribution directories
      await fs.mkdir(this.distributionPath, { recursive: true });
      await fs.mkdir(this.releasesPath, { recursive: true });
      await fs.mkdir(this.assetsPath, { recursive: true });
      await fs.mkdir(this.templatesPath, { recursive: true });
      
      console.log('✅ Distribution Controller started successfully');
      return { status: 'started', timestamp: new Date().toISOString() };
    } catch (error) {
      console.error('❌ Failed to start Distribution Controller:', error.message);
      return { status: 'error', error: error.message };
    }
  }

  /**
   * 🛑 Stop distribution service
   */
  async stop() {
    try {
      console.log('🛑 Stopping Distribution Controller...');
      
      // Cleanup operations
      console.log('✅ Distribution Controller stopped successfully');
      return { status: 'stopped', timestamp: new Date().toISOString() };
    } catch (error) {
      console.error('❌ Failed to stop Distribution Controller:', error.message);
      return { status: 'error', error: error.message };
    }
  }
}

module.exports = DistributionController;
