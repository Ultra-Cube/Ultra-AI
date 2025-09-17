# Ultra AI Platform - Copilot Instructions

## Project Overview
This is an **early-stage distributed AI platform** (idea phase) combining natural language interfaces with blockchain-based distributed processing. The project is currently in planning/documentation phase with no implementation code yet.

## Architecture Principles
- **Distributed Processing**: User requests are chunked, encrypted, and processed across a volunteer user network
- **Natural Interface**: Conversational AI that auto-configures tools based on user requests in Arabic/English
- **Reward System**: CS digital currency rewards users for contributing processing power
- **Gata-OS Integration**: Tight integration with a custom operating system via secure APIs
- **Privacy-First**: End-to-end encryption with data chunking to prevent any single node from accessing complete data

## Key Components (Planned)
```mermaid
User Request → AI Core → Request Chunking → User Network → Parallel Processing → Result Aggregation → User
```

## Technology Stack (from README.md config)
- **Frontend**: React 18+, Next.js 14+, TypeScript, Tailwind CSS
- **Backend**: Node.js 18+, NestJS, Python 3.10+, FastAPI
- **AI/ML**: TensorFlow, PyTorch, Transformers, LangChain
- **Blockchain**: Ethereum, IPFS, Web3.js, Solidity
- **Database**: PostgreSQL, MongoDB, Redis, S3
- **Infrastructure**: Docker, Kubernetes, AWS/GCP/Azure

## Documentation Structure
- `README.md` - Comprehensive project vision with technical requirements and deployment plans
- `docs/business/` - Market analysis and competitive research (partially populated)
- `docs/architecture/` - Technical specs (empty - needs development)
- `docs/security/` - Security framework (empty - needs development) 
- `docs/ux-design/` - User experience design (empty - needs development)

## Development Workflow (Current Phase)
Since this is idea-stage, focus on:
1. **Documentation First**: Complete architecture docs before any code
2. **Market Validation**: Expand business analysis in `docs/business/`
3. **Security Planning**: Develop threat models given distributed/crypto nature
4. **Prototype Planning**: Define MVP scope from the comprehensive feature list

## Project-Specific Patterns
- **Mermaid Diagrams**: Extensive use for system flows, deployment timelines, and architecture
- **Bilingual Support**: Arabic/English as core requirement (not typical)
- **Crypto Integration**: Built-in reward system with CS currency
- **Distributed-First**: Unlike typical cloud apps, designed for peer-to-peer processing
- **Configuration-Driven**: See `config/default.js` example in README for modular settings

## Critical Considerations
- **No Implementation Yet**: Avoid creating code files - focus on planning/documentation
- **Regulatory Compliance**: Crypto rewards system needs legal review
- **Performance Targets**: <200ms response time, 99.9% uptime, 1000+ TPS
- **Security-Critical**: Distributed processing of potentially sensitive data requires robust encryption

## File Organization Conventions
- Configuration examples use nested objects (see README config section)
- Gantt charts for all planning timelines
- Comprehensive feature checklists with checkboxes
- Technical requirements tables with specific versions

## When Contributing
- Prioritize completing `docs/architecture/` specifications
- Reference the detailed tech stack requirements in README.md
- Follow the 3-phase deployment plan (Prototype → Distributed → Maturity)
- Consider the $1.25M-$1.9M budget constraints for Year 1