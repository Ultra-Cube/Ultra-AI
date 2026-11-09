# Documentation Instructions

**applyTo**: `docs/**`

## Overview

Documentation is critical for Ultra AI's success. All documentation should be clear, accurate, up-to-date, and accessible to both developers and users.

## Documentation Types

### 1. Architecture Documentation
- High-level system architecture
- Component interactions
- Data flow diagrams
- Technology choices with rationale
- `docs/MASTER_ARCHITECTURE.md` is the authoritative source

### 2. API Documentation
- Auto-generated from code comments
- OpenAPI/Swagger specifications
- Usage examples
- Error response documentation
- Rate limiting information

### 3. User Documentation
- Installation guides
- Configuration guides
- Usage tutorials
- Troubleshooting guides
- FAQ

### 4. Developer Documentation
- Contribution guidelines
- Code style guides
- Development setup
- Testing guidelines
- Release process

### 5. Operations Documentation
- Deployment guides
- Monitoring setup
- Incident response procedures
- Backup and recovery
- Security hardening

## Writing Guidelines

### Clarity
- Use simple, clear language
- Avoid jargon where possible
- Define technical terms
- Provide examples
- Use active voice

### Accuracy
- Verify all technical claims
- Test all code examples
- Keep version-specific notes
- Document limitations
- Update regularly

### Structure
- Use consistent formatting
- Include table of contents
- Use headings hierarchically
- Number procedures and steps
- Link related sections

### Accessibility
- Use plain language
- Provide alt text for images
- Use descriptive link text
- Support screen readers
- Consider RTL for Arabic

## File Organization

### Root Level
- `README.md` - Project overview and quick start
- `CONTRIBUTING.md` - Contribution guidelines
- `SECURITY.md` - Security policy
- `CODE_OF_CONDUCT.md` - Community guidelines
- `LICENSE` - License information

### docs/ Directory
- `docs/MASTER_ARCHITECTURE.md` - Authoritative architecture
- `docs/ARCHITECTURE.md` - System architecture
- `docs/API.md` - API documentation
- `docs/DEVELOPER_GUIDE.md` - Developer guide
- `docs/DEPLOYMENT.md` - Deployment guide
- `docs/SECURITY.md` - Security documentation
- `docs/ROADMAP.md` - Project roadmap
- `docs/ai-workspace/` - AI workspace documentation
- `docs/gateos/` - Gate-OS integration docs
- `docs/security/` - Security-specific docs

## Diagrams

### Mermaid Diagrams
- Use Mermaid for inline diagrams
- Keep diagrams simple
- Add descriptive text
- Test rendering in GitHub
- Include alt text

### External Diagrams
- Use tools like draw.io for complex diagrams
- Export as SVG or PNG
- Include source files
- Document creation tools
- Keep version controlled

## Code Documentation

### JSDoc Comments
- Document all public functions
- Include parameter types
- Include return types
- Provide usage examples
- Document edge cases

### Inline Comments
- Explain complex logic
- Document workarounds
- Note performance implications
- Mark TODO items
- Reference issues

## Version Management

### Documentation Versioning
- Version documentation with releases
- Document breaking changes
- Provide migration guides
- Archive old versions
- Maintain current version

### Change Log
- Document all changes
- Categorize changes (added, changed, deprecated, removed, fixed, security)
- Link to issues/PRs
- Highlight breaking changes
- Use semantic versioning

## Review Process

### Documentation Review
- Review for accuracy
- Review for clarity
- Review for completeness
- Review for accessibility
- Get technical review

### Update Process
- Update docs with code changes
- Review docs before release
- Update screenshots
- Test all procedures
- Archive outdated docs

## Localization

### Arabic Support
- Provide Arabic translations
- Use RTL formatting
- Ensure cultural appropriateness
- Test with Arabic users
- Maintain both versions

### Translation Management
- Use translation-friendly format
- Separate content from formatting
- Provide context for translators
- Review translations
- Keep versions in sync

## Publishing

### Docs Site
- Use MkDocs or Docusaurus
- Configure search
- Add version selector
- Customize theme
- Deploy automatically

### README.md
- Keep it concise
- Focus on essentials
- Link to detailed docs
- Include badges
- Update regularly

## Quality Checks

### Spelling and Grammar
- Use spell checker
- Proofread carefully
- Get peer review
- Fix reported issues
- Maintain style guide

### Link Checking
- Verify all links work
- Use descriptive link text
- Update broken links
- Add alt text
- Test external links

### Code Examples
- Test all code examples
- Include expected output
- Handle errors appropriately
- Update with API changes
- Document prerequisites
