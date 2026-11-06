# Packages Instructions

**applyTo**: `packages/**`

## Overview

The `packages/` directory contains shared libraries and services used across the monorepo. Each package should be independently testable and versioned.

## Package Structure

### Required Files
- `package.json` - Package metadata and dependencies
- `tsconfig.json` - TypeScript configuration
- `README.md` - Package documentation
- `src/index.ts` - Main entry point
- `jest.config.cjs` - Jest configuration (if tests exist)

### Recommended Files
- `CHANGELOG.md` - Change history
- `.eslintrc.js` - ESLint configuration (if overrides needed)
- `.prettierrc` - Prettier configuration (if overrides needed)

## Package Types

### 1. AI Core (`packages/ai-core`)
- LLM provider abstractions
- Model routing logic
- Intent recognition
- NLP utilities
- Provider implementations (OpenAI, Anthropic, etc.)

### 2. API Gateway (`packages/api-gateway`)
- HTTP server implementation
- Request routing
- Rate limiting
- Authentication middleware
- Logging middleware

### 3. API Services (`packages/api`)
- Business logic services
- Database models
- Service interfaces
- Integration services
- Agent services

### 4. Shared Utilities (`packages/shared`)
- Common types
- Utility functions
- Constants
- Helper functions

### 5. Desktop UI (`packages/desktop-ui`)
- Desktop-specific UI components
- Electron integrations
- Native OS bridges
- Desktop utilities

### 6. Control Center (`packages/control-center`)
- System monitoring
- Resource management
- Service orchestration
- Health checks

### 7. Memory Optimizer (`packages/memory-optimizer`)
- Memory management
- Cache strategies
- Storage optimization
- Data retention policies

### 8. Voice Recognition (`packages/voice-recognition`)
- Speech-to-text
- Text-to-speech
- Audio processing
- Voice commands

### 9. Distributed Processing (`packages/distributed`)
- Distributed task execution
- Chunked file transfer
- Network coordination
- Peer discovery

## Development Guidelines

### TypeScript
- Use strict mode
- Export types for public APIs
- Use proper generics
- Add JSDoc for public functions
- Avoid `any` type

### Dependencies
- Minimize external dependencies
- Prefer peer dependencies where appropriate
- Pin exact versions for production
- Document required peer dependencies

### Testing
- Write unit tests for all functions
- Mock external dependencies
- Test error cases
- Maintain >80% coverage

### Documentation
- Document public APIs
- Provide usage examples
- Document configuration options
- Keep README up to date

## Package Communication

### Internal Packages
- Use TypeScript imports
- Share types through `packages/shared`
- Avoid circular dependencies
- Document dependencies

### External APIs
- Use proper error handling
- Implement retry logic
- Add rate limiting
- Log all external calls

## Build Configuration

### TypeScript
- Extend root tsconfig
- Set correct module resolution
- Configure path aliases
- Enable declaration generation

### Bundling
- Use esbuild for fast builds
- Generate CommonJS and ESM
- Optimize bundle size
- Generate source maps

## Version Management

- Use semantic versioning
- Update changelog on release
- Tag releases in git
- Document breaking changes
