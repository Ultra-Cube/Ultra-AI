# Security Instructions

**applyTo**: Security-sensitive code, authentication, authorization, encryption, secrets management

## Overview

Security is paramount for Ultra AI. All security-sensitive code must follow strict guidelines to protect user data, prevent unauthorized access, and ensure system integrity.

## Core Security Principles

### 1. Defense in Depth
- Layer security controls
- Don't rely on single point of failure
- Implement multiple barriers
- Assume each layer can fail

### 2. Least Privilege
- Grant minimum necessary permissions
- Use role-based access control
- Implement privilege escalation
- Regular audit permissions

### 3. Fail Securely
- Default to deny
- Fail closed, not open
- Don't leak information on errors
- Implement secure defaults

### 4. Security by Design
- Design security from the start
- Don't bolt on security later
- Threat model all features
- Security review required

## Secrets Management

### Storage
- Never commit secrets to git
- Use environment variables
- Use secret management systems (Vault, AWS Secrets Manager)
- Encrypt secrets at rest
- Rotate secrets regularly

### Transmission
- Use TLS for all network communication
- Verify certificates
- Use mutual TLS where appropriate
- Don't log secrets
- Use secure protocols only

### Access
- Limit who can access secrets
- Audit secret access
- Use service accounts
- Implement secret versioning
- Revoke compromised secrets immediately

## Authentication

### User Authentication
- Use strong password policies
- Implement multi-factor authentication
- Support OAuth2/OIDC
- Use secure session management
- Implement rate limiting

### Service Authentication
- Use mutual TLS
- Use JWT with short expiration
- Implement token rotation
- Validate all tokens
- Log authentication events

### Session Management
- Use secure session cookies
- Implement session timeout
- Invalidate sessions on logout
- Support session revocation
- Use secure random session IDs

## Authorization

### Access Control
- Implement RBAC (Role-Based Access Control)
- Use ABAC (Attribute-Based Access Control) where needed
- Default to deny
- Grant explicit permissions
- Regular audit access

### API Authorization
- Use OAuth2 scopes
- Validate permissions on each request
- Implement rate limiting per user
- Use API keys with proper scoping
- Log authorization decisions

### Resource Authorization
- Check ownership before access
- Implement sharing controls
- Use ACLs for fine-grained control
- Document permission model
- Test authorization thoroughly

## Input Validation

### User Input
- Validate all user inputs
- Sanitize inputs for context
- Use parameterized queries
- Implement input length limits
- Reject invalid inputs early

### File Uploads
- Validate file types
- Scan for malware
- Limit file sizes
- Store outside web root
- Generate safe filenames

### API Input
- Validate request schemas
- Use strong typing
- Implement request size limits
- Rate limit endpoints
- Log suspicious requests

## Output Encoding

### Cross-Site Scripting (XSS) Prevention
- Encode all user-generated content
- Use Content Security Policy
- Implement XSS filtering
- Use HTTPOnly cookies
- Validate and sanitize output

### SQL Injection Prevention
- Use parameterized queries
- Use ORM frameworks
- Validate inputs
- Limit database permissions
- Audit database queries

### Command Injection Prevention
- Avoid shell commands
- Use safe APIs
- Validate all arguments
- Escape user input
- Use allowlisting

## Cryptography

### Encryption
- Use standard algorithms (AES-256, RSA, ECDSA)
- Use authenticated encryption
- Never implement custom crypto
- Use secure random number generators
- Key management is critical

### Hashing
- Use slow hashes for passwords (bcrypt, argon2)
- Use salted hashes
- Use appropriate hash functions
- Don't hash secrets, encrypt them
- Compare hashes in constant time

### Key Management
- Generate keys securely
- Store keys securely
- Rotate keys regularly
- Never hardcode keys
- Use hardware security modules where possible

## Network Security

### Transport Security
- Use TLS 1.2 or higher
- Disable weak ciphers
- Use HSTS
- Implement certificate pinning
- Regular certificate rotation

### Firewall Rules
- Default deny inbound
- Only allow necessary ports
- Implement network segmentation
- Use security groups
- Regular audit rules

### API Security
- Implement rate limiting
- Use API keys
- Implement CORS properly
- Validate referer headers
- Monitor for abuse

## Logging and Monitoring

### Security Logging
- Log all authentication events
- Log authorization failures
- Log configuration changes
- Log privileged actions
- Don't log sensitive data

### Monitoring
- Monitor for suspicious activity
- Set up alerts for security events
- Monitor for brute force attacks
- Monitor for data exfiltration
- Regular security audits

### Incident Response
- Have incident response plan
- Document security incidents
- Contain incidents quickly
- Preserve evidence
- Post-incident analysis

## Vulnerability Management

### Dependency Scanning
- Scan dependencies regularly
- Update dependencies promptly
- Review security advisories
- Use lock files
- Pin production dependencies

### Penetration Testing
- Regular penetration tests
- Red team exercises
- Bug bounty program
- Address findings promptly
- Retest after fixes

### Security Reviews
- Code reviews for security
- Architecture reviews
- Threat modeling
- Third-party audits
- Compliance checks

## Prompt Injection Defense

### Input Sanitization
- Sanitize all user prompts
- Detect injection patterns
- Use allowlisting
- Implement rate limiting
- Monitor for attacks

### Output Filtering
- Filter model outputs
- Detect harmful content
- Validate output format
- Implement content moderation
- Allow user flagging

### System Prompts
- Design robust system prompts
- Define clear boundaries
- Use instruction following
- Test against jailbreaks
- Regular prompt updates

## Compliance

### Data Protection
- Implement data retention policies
- Support data deletion requests
- Implement data export
- Comply with GDPR, CCPA
- Document data flows

### Audit Requirements
- Maintain audit logs
- Regular compliance audits
- Document controls
- Implement compliance checks
- Report as required

## Testing

### Security Testing
- Unit tests for security logic
- Integration tests for auth flows
- Penetration testing
- Vulnerability scanning
- Dependency scanning

### Code Review
- Security-focused code reviews
- Review sensitive code changes
- Review dependency additions
- Review configuration changes
- Review authentication changes
