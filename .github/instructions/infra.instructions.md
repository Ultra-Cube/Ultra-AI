# Infrastructure Instructions

**applyTo**: `infrastructure/**`, `control/templates/kubernetes/**`, Dockerfiles, `docker-compose.yml`

## Overview

Infrastructure code defines how Ultra AI is deployed and run in production. This includes Docker configurations, Kubernetes manifests, and infrastructure as code.

## Docker Guidelines

### Dockerfile Best Practices
- Use multi-stage builds
- Use minimal base images (alpine or distroless)
- Copy package files before dependencies for caching
- Run as non-root user
- Set appropriate health checks
- Use specific version tags (not `latest`)

### Docker Compose
- Define all services in one file
- Use environment variables for configuration
- Define networks for service isolation
- Use volume mounts for persistence
- Set resource limits
- Configure logging

### Security
- Scan images for vulnerabilities
- Don't include secrets in images
- Use read-only filesystems where possible
- Drop unnecessary capabilities
- Implement security contexts

## Kubernetes Guidelines

### Namespace & Labels
- Use dedicated namespace: `ultra-ai`
- Apply consistent labels to all resources
- Use annotations for metadata
- Follow naming conventions

### Deployments
- Use rolling updates
- Set resource requests and limits
- Configure liveness and readiness probes
- Use anti-affinity for high availability
- Set replica counts appropriately

### Services
- Use ClusterIP for internal services
- Use LoadBalancer or Ingress for external access
- Define service accounts
- Use pod disruption budgets
- Configure session affinity

### ConfigMaps & Secrets
- Store configuration in ConfigMaps
- Store secrets in Kubernetes Secrets
- Use secret versioning
- Rotate secrets regularly
- Encrypt secrets at rest

### Storage
- Use PersistentVolumeClaims for databases
- Use appropriate storage classes
- Set size limits
- Implement backup strategies
- Use read-only volumes where possible

### Security
- Use NetworkPolicies to restrict traffic
- Use PodSecurityPolicies or Pod Security Standards
- Run containers as non-root
- Use read-only root filesystem
- Implement RBAC

### Monitoring
- Expose metrics endpoints
- Use Prometheus for metrics collection
- Configure Grafana dashboards
- Set up alerting rules
- Configure log aggregation

## Infrastructure as Code

### Terraform (if used)
- Use modules for reusability
- Store state remotely
- Use variables for configuration
- Implement state locking
- Document dependencies

### Ansible (if used)
- Use idempotent playbooks
- Use roles for organization
- Implement error handling
- Use vault for secrets
- Test playbooks

## CI/CD Integration

### Build Pipeline
- Build Docker images on commit
- Run security scans
- Run tests in containers
- Tag images appropriately
- Push to registry

### Deployment Pipeline
- Use feature branches for testing
- Use main branch for staging
- Use tags for production
- Implement blue-green or canary deployments
- Rollback on failure

## Environment Configuration

### Development
- Use Docker Compose for local development
- Hot-reload where possible
- Use local databases
- Debug-friendly configuration

### Staging
- Mirror production environment
- Use test data
- Enable detailed logging
- Run integration tests

### Production
- Hardened configuration
- Minimal logging (for performance)
- Use managed services where possible
- Implement monitoring and alerting
- Regular backups

## Disaster Recovery

### Backups
- Automated database backups
- Backup configuration
- Test restore procedures
- Store backups in multiple locations
- Document recovery procedures

### High Availability
- Multi-region deployment
- Load balancing
- Failover procedures
- Data replication
- Regular failover testing

## Documentation

### Infrastructure Docs
- Document architecture decisions
- Provide deployment guides
- Document configuration options
- Include troubleshooting guides
- Keep diagrams up to date

### Runbooks
- Document common procedures
- Include incident response procedures
- Document escalation paths
- Include contact information
