# 🚀 KUBERNETES COMMANDS REFERENCE GUIDE
## Quick Reference for Ultra AI Platform

---

## 📋 TABLE OF CONTENTS
1. [Deployment Commands](#deployment)
2. [Debugging Commands](#debugging)
3. [Monitoring Commands](#monitoring)
4. [Scaling Commands](#scaling)
5. [Log Commands](#logs)
6. [Networking Commands](#networking)
7. [Storage Commands](#storage)
8. [Configuration Commands](#configuration)
9. [Security Commands](#security)
10. [Cleanup Commands](#cleanup)

---

## <a name="deployment"></a>🚀 DEPLOYMENT COMMANDS

### Deploy Using Script
```bash
# Full deployment
./k8s-deploy.sh full

# Deploy only configuration
./k8s-deploy.sh config

# Deploy only databases
./k8s-deploy.sh databases

# Deploy only applications
./k8s-deploy.sh apps

# Verify deployment
./k8s-deploy.sh verify

# Show access information
./k8s-deploy.sh info

# Undeploy everything
./k8s-deploy.sh delete
```

### Manual Deployment
```bash
# Deploy all using Kustomize
kubectl apply -k k8s/

# Deploy namespace
kubectl apply -f k8s/01-namespace.yaml

# Deploy config and secrets
kubectl apply -f k8s/02-configmap.yaml
kubectl apply -f k8s/03-secrets.yaml

# Deploy storage
kubectl apply -f k8s/04-storage.yaml

# Deploy databases
kubectl apply -f k8s/05-postgres.yaml
kubectl apply -f k8s/06-redis.yaml
kubectl apply -f k8s/07-mongodb.yaml

# Deploy applications
kubectl apply -f k8s/08-api-deployment.yaml
kubectl apply -f k8s/09-web-deployment.yaml

# Create services and routing
kubectl apply -f k8s/10-services.yaml
kubectl apply -f k8s/11-ingress.yaml

# Configure autoscaling
kubectl apply -f k8s/12-hpa-and-policies.yaml
```

### Check Deployment Status
```bash
# Get all resources
kubectl get all -n ultra-ai

# Get only pods
kubectl get pods -n ultra-ai

# Get pods with details
kubectl get pods -n ultra-ai -o wide

# Get pod status with conditions
kubectl get pods -n ultra-ai -o custom-columns=NAME:.metadata.name,STATUS:.status.phase,READY:.status.conditions[?(@.type==\"Ready\")].status

# Watch pod creation
kubectl get pods -n ultra-ai -w

# Get specific resource
kubectl get deployment -n ultra-ai
kubectl get statefulset -n ultra-ai
kubectl get service -n ultra-ai
```

---

## <a name="debugging"></a>🔍 DEBUGGING COMMANDS

### Inspect Pod
```bash
# Describe pod
kubectl describe pod <pod-name> -n ultra-ai

# Get pod details
kubectl get pod <pod-name> -n ultra-ai -o yaml

# Get pod events
kubectl describe pod <pod-name> -n ultra-ai | grep -A 20 Events:
```

### Pod Execution
```bash
# Get shell in pod
kubectl exec -it <pod-name> -n ultra-ai -- /bin/sh

# Run command in pod
kubectl exec <pod-name> -n ultra-ai -- command

# Run command in API pod
kubectl exec deployment/api -n ultra-ai -- npm run type-check

# Run command in specific container
kubectl exec -it <pod-name> -c <container-name> -n ultra-ai -- /bin/sh
```

### Check Health
```bash
# Health check endpoint
kubectl exec -it deployment/api -n ultra-ai -- curl localhost:5555/health

# Database connectivity
kubectl exec -it postgres-0 -n ultra-ai -- psql -U postgres -c "SELECT 1"

# Redis connectivity
kubectl exec -it redis-0 -n ultra-ai -- redis-cli ping

# MongoDB connectivity
kubectl exec -it mongodb-0 -n ultra-ai -- mongosh --eval "db.adminCommand('ping')"
```

### Check Events
```bash
# Get all events
kubectl get events -n ultra-ai

# Get events sorted by time
kubectl get events -n ultra-ai --sort-by='.lastTimestamp'

# Watch events in real-time
kubectl get events -n ultra-ai -w

# Get specific pod events
kubectl describe pod <pod-name> -n ultra-ai | tail -20
```

### Resource Debugging
```bash
# Check node resources
kubectl top nodes

# Check pod resource usage
kubectl top pods -n ultra-ai

# Get resource requests/limits
kubectl get pods -n ultra-ai -o custom-columns=NAME:.metadata.name,CPU_REQ:.spec.containers[0].resources.requests.cpu,MEM_REQ:.spec.containers[0].resources.requests.memory

# Check PVC status
kubectl get pvc -n ultra-ai

# Describe PVC
kubectl describe pvc postgres-pvc -n ultra-ai
```

---

## <a name="monitoring"></a>📊 MONITORING COMMANDS

### View Metrics
```bash
# Pod CPU/Memory
kubectl top pods -n ultra-ai

# Pod CPU/Memory with sorting
kubectl top pods -n ultra-ai --sort-by=memory

# Node resource usage
kubectl top nodes

# Get HPA status
kubectl get hpa -n ultra-ai
kubectl get hpa -n ultra-ai -o wide

# Describe HPA (detailed metrics)
kubectl describe hpa api-hpa -n ultra-ai

# Watch HPA scaling
kubectl get hpa -n ultra-ai -w
```

### Pod Affinity & Scheduling
```bash
# Get pod node placement
kubectl get pods -n ultra-ai -o wide

# Get node taints
kubectl describe nodes | grep -A 5 Taints

# Check pod affinity rules
kubectl get pods -n ultra-ai -o yaml | grep -A 10 affinity

# Simulate pod scheduling
kubectl explain pod.spec.affinity
```

### Network Policies
```bash
# Get network policies
kubectl get networkpolicies -n ultra-ai

# Describe network policy
kubectl describe networkpolicy <policy-name> -n ultra-ai

# Get all network policies
kubectl get networkpolicies --all-namespaces
```

---

## <a name="scaling"></a>⚖️ SCALING COMMANDS

### Manual Scaling
```bash
# Scale API deployment
kubectl scale deployment api -n ultra-ai --replicas=5

# Scale Web deployment
kubectl scale deployment web -n ultra-ai --replicas=3

# Get current replicas
kubectl get deployment -n ultra-ai -o custom-columns=NAME:.metadata.name,REPLICAS:.spec.replicas,READY:.status.readyReplicas
```

### HPA Management
```bash
# Get HPA details
kubectl get hpa -n ultra-ai

# Describe HPA
kubectl describe hpa api-hpa -n ultra-ai

# Check HPA metrics
kubectl get hpa api-hpa -n ultra-ai -o yaml | grep -A 20 status

# Edit HPA
kubectl edit hpa api-hpa -n ultra-ai

# Patch HPA (example: change max replicas)
kubectl patch hpa api-hpa -n ultra-ai -p '{"spec":{"maxReplicas":30}}'

# Watch HPA decisions
kubectl get hpa -n ultra-ai --watch
```

### StatefulSet Scaling
```bash
# Scale PostgreSQL
kubectl scale statefulset postgres -n ultra-ai --replicas=1

# Scale MongoDB
kubectl scale statefulset mongodb -n ultra-ai --replicas=3

# Get StatefulSet details
kubectl get statefulset -n ultra-ai -o wide
```

---

## <a name="logs"></a>📝 LOG COMMANDS

### View Logs
```bash
# Get pod logs
kubectl logs <pod-name> -n ultra-ai

# Get logs from deployment (all pods)
kubectl logs -n ultra-ai deployment/api

# Get logs with timestamps
kubectl logs <pod-name> -n ultra-ai --timestamps=true

# Follow logs (tail -f)
kubectl logs <pod-name> -n ultra-ai -f

# Get previous pod logs (for crashed pods)
kubectl logs <pod-name> -n ultra-ai --previous

# Get logs from specific container
kubectl logs <pod-name> -c <container-name> -n ultra-ai

# Get logs from all containers
kubectl logs <pod-name> -n ultra-ai --all-containers=true
```

### Log Filtering
```bash
# Get logs with grep
kubectl logs deployment/api -n ultra-ai | grep "ERROR"

# Get last 100 lines
kubectl logs <pod-name> -n ultra-ai --tail=100

# Get logs from last 1 hour
kubectl logs <pod-name> -n ultra-ai --since=1h

# Get logs since specific time
kubectl logs <pod-name> -n ultra-ai --since-time=2026-03-05T10:00:00Z

# Get logs and follow
kubectl logs <pod-name> -n ultra-ai -f --tail=50
```

### Log Export
```bash
# Export all logs
kubectl logs deployment/api -n ultra-ai > api-logs.txt

# Export logs from specific pod
kubectl logs postgres-0 -n ultra-ai > postgres-logs.txt

# Get logs from all pods in deployment
for pod in $(kubectl get pods -n ultra-ai -l app=api -o name); do
  kubectl logs $pod -n ultra-ai > logs-${pod##*/}.txt
done
```

---

## <a name="networking"></a>🌐 NETWORKING COMMANDS

### Service Management
```bash
# Get services
kubectl get svc -n ultra-ai

# Get service details
kubectl get svc -n ultra-ai -o wide

# Describe service
kubectl describe svc api -n ultra-ai

# Get service endpoints
kubectl get endpoints -n ultra-ai

# Edit service
kubectl edit svc api -n ultra-ai
```

### Ingress Management
```bash
# Get ingress
kubectl get ingress -n ultra-ai

# Get ingress details
kubectl get ingress -n ultra-ai -o wide

# Describe ingress
kubectl describe ingress ultra-ai-ingress -n ultra-ai

# Edit ingress
kubectl edit ingress ultra-ai-ingress -n ultra-ai

# Get ingress YAML
kubectl get ingress ultra-ai-ingress -n ultra-ai -o yaml
```

### Port Forwarding
```bash
# Forward API port
kubectl port-forward -n ultra-ai svc/api 5555:5555

# Forward Web port
kubectl port-forward -n ultra-ai svc/web 3000:3000

# Forward PostgreSQL
kubectl port-forward -n ultra-ai svc/postgres 5432:5432

# Forward Redis
kubectl port-forward -n ultra-ai svc/redis 6379:6379

# Forward MongoDB
kubectl port-forward -n ultra-ai svc/mongodb 27017:27017

# Forward from pod
kubectl port-forward -n ultra-ai pod/api-0 5555:5555
```

### Network Testing
```bash
# Test connectivity from pod
kubectl exec -it deployment/api -n ultra-ai -- curl http://postgres:5432

# DNS resolution test
kubectl exec -it deployment/api -n ultra-ai -- nslookup postgres.ultra-ai.svc.cluster.local

# Ping test
kubectl exec -it deployment/api -n ultra-ai -- ping postgres

# Network debugging pod
kubectl run -it --rm --image=busybox:1.28 --restart=Never net-debug -- /bin/sh
```

---

## <a name="storage"></a>💾 STORAGE COMMANDS

### Persistent Volume Management
```bash
# Get PersistentVolumes
kubectl get pv

# Get PersistentVolumeClaims
kubectl get pvc -n ultra-ai

# Describe PVC
kubectl describe pvc postgres-pvc -n ultra-ai

# Check PVC status
kubectl get pvc -n ultra-ai -o custom-columns=NAME:.metadata.name,STATUS:.status.phase,SIZE:.spec.resources.requests.storage

# Edit PVC
kubectl patch pvc postgres-pvc -n ultra-ai -p '{"spec":{"resources":{"requests":{"storage":"100Gi"}}}}'
```

### Storage Classes
```bash
# Get storage classes
kubectl get storageclass

# Describe storage class
kubectl describe storageclass fast-ssd

# Set default storage class
kubectl patch storageclass fast-ssd -p '{"metadata": {"annotations":{"storageclass.kubernetes.io/is-default-class":"true"}}}'
```

### Database Backups
```bash
# PostgreSQL backup
kubectl exec postgres-0 -n ultra-ai -- \
  pg_dump -U postgres -d ultra_ai | gzip > backup.sql.gz

# MongoDB backup
kubectl exec mongodb-0 -n ultra-ai -- \
  mongodump --uri="mongodb://mongodb:27017/ultra_ai" --out=/tmp/backup

# Redis backup
kubectl exec redis-0 -n ultra-ai -- redis-cli BGSAVE

# Copy backup from pod
kubectl cp ultra-ai/postgres-0:/var/lib/postgresql/data/backup.sql.gz ./backup.sql.gz
```

---

## <a name="configuration"></a>⚙️ CONFIGURATION COMMANDS

### ConfigMap Management
```bash
# Get ConfigMaps
kubectl get configmap -n ultra-ai

# Describe ConfigMap
kubectl describe configmap api-config -n ultra-ai

# Edit ConfigMap
kubectl edit configmap api-config -n ultra-ai

# Create ConfigMap from file
kubectl create configmap my-config --from-file=config.json -n ultra-ai

# Get ConfigMap as YAML
kubectl get configmap api-config -n ultra-ai -o yaml
```

### Secret Management
```bash
# Get Secrets
kubectl get secret -n ultra-ai

# Describe Secret
kubectl describe secret app-secrets -n ultra-ai

# Edit Secret
kubectl edit secret app-secrets -n ultra-ai

# Create Secret from file
kubectl create secret generic my-secret --from-file=secret.txt -n ultra-ai

# Create Secret from literal
kubectl create secret generic my-secret --from-literal=key=value -n ultra-ai

# Decode Secret (base64)
kubectl get secret app-secrets -n ultra-ai -o jsonpath='{.data.JWT_SECRET}' | base64 -d
```

### Environment Variables
```bash
# Get pod environment variables
kubectl exec deployment/api -n ultra-ai -- env

# Get specific environment variable
kubectl exec deployment/api -n ultra-ai -- env | grep DATABASE_URL
```

---

## <a name="security"></a>🔒 SECURITY COMMANDS

### RBAC Management
```bash
# Get ServiceAccounts
kubectl get sa -n ultra-ai

# Get Roles
kubectl get role -n ultra-ai

# Get RoleBindings
kubectl get rolebinding -n ultra-ai

# Describe ServiceAccount
kubectl describe sa api-sa -n ultra-ai

# View ServiceAccount token
kubectl describe secret $(kubectl get secret -n ultra-ai | grep api-sa-token | awk '{print $1}') -n ultra-ai
```

### Pod Security
```bash
# Check security context
kubectl get pod <pod-name> -n ultra-ai -o yaml | grep -A 20 securityContext

# Check capabilities
kubectl get pod <pod-name> -n ultra-ai -o yaml | grep -A 10 capabilities

# Check if pod runs as root
kubectl get pods -n ultra-ai -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.securityContext.runAsUser}{"\n"}{end}'
```

### Network Policies
```bash
# Get network policies
kubectl get networkpolicies -n ultra-ai

# Describe network policy
kubectl describe networkpolicy allow-internal -n ultra-ai

# Simulate network policy effect
kubectl run -it --rm --image=busybox:1.28 --restart=Never debug -- /bin/sh
```

---

## <a name="cleanup"></a>🧹 CLEANUP COMMANDS

### Delete Resources
```bash
# Delete deployment
kubectl delete deployment api -n ultra-ai

# Delete service
kubectl delete service api -n ultra-ai

# Delete all resources in namespace
kubectl delete all --all -n ultra-ai

# Delete StatefulSet
kubectl delete statefulset postgres -n ultra-ai

# Delete PVC
kubectl delete pvc postgres-pvc -n ultra-ai

# Delete namespace (deletes all resources)
kubectl delete namespace ultra-ai
```

### Cleanup Old Resources
```bash
# Delete completed jobs
kubectl delete job -n ultra-ai --field-selector status.successful=1

# Delete failed pods
kubectl delete pods -n ultra-ai --field-selector status.phase=Failed

# Delete evicted pods
kubectl get pods -n ultra-ai | grep Evicted | awk '{print $1}' | xargs kubectl delete pod -n ultra-ai

# Cleanup unused PVCs
kubectl delete pvc -n ultra-ai --field-selector status.phase=Released
```

---

## 🎯 COMMON WORKFLOWS

### Deploying a New Version
```bash
# 1. Update image
kubectl set image deployment/api api=ultra-ai-api:v2.0 -n ultra-ai

# 2. Watch rollout
kubectl rollout status deployment/api -n ultra-ai -w

# 3. If needed, rollback
kubectl rollout undo deployment/api -n ultra-ai

# 4. View rollout history
kubectl rollout history deployment/api -n ultra-ai
```

### Debugging Pod Crashes
```bash
# 1. Get pod status
kubectl get pod <pod-name> -n ultra-ai

# 2. Check logs
kubectl logs <pod-name> -n ultra-ai --previous

# 3. Describe pod
kubectl describe pod <pod-name> -n ultra-ai

# 4. Check events
kubectl get events -n ultra-ai --sort-by='.lastTimestamp'

# 5. Check node status
kubectl get nodes
kubectl describe node <node-name>
```

### Database Access
```bash
# PostgreSQL shell
kubectl exec -it postgres-0 -n ultra-ai -- psql -U postgres

# MongoDB shell
kubectl exec -it mongodb-0 -n ultra-ai -- mongosh

# Redis CLI
kubectl exec -it redis-0 -n ultra-ai -- redis-cli

# Run query
kubectl exec postgres-0 -n ultra-ai -- psql -U postgres -d ultra_ai -c "SELECT * FROM users LIMIT 1;"
```

### Performance Analysis
```bash
# CPU/Memory usage
kubectl top pods -n ultra-ai

# Node resources
kubectl top nodes

# Pod resource requests vs actual
kubectl get pods -n ultra-ai -o custom-columns=NAME:.metadata.name,CPU:.spec.containers[*].resources.requests.cpu,MEM:.spec.containers[*].resources.requests.memory

# HPA metrics
kubectl get hpa api-hpa -n ultra-ai -o jsonpath='{.status.currentMetrics}'
```

---

## 📚 HELPFUL RESOURCES

### Kubernetes Documentation
- [Official Kubectl Cheatsheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [Kubectl Commands Reference](https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands/)
- [API Resources](https://kubernetes.io/docs/reference/generated/kubernetes-api/)

### Ultra AI Platform Specific
- [Phase 19 K8s Guide](./PHASE_19_K8S_GUIDE.md)
- [Docker Guide](./docs/DOCKER_SETUP.md)
- [Architecture Documentation](./docs/architecture/)

---

## 🆘 TROUBLESHOOTING QUICK LINKS

| Issue | Command |
|-------|---------|
| Pod won't start | `kubectl describe pod <pod-name> -n ultra-ai` |
| Logs aren't showing | `kubectl logs <pod-name> -n ultra-ai --previous` |
| Service unreachable | `kubectl get svc -n ultra-ai` + `kubectl exec ... curl` |
| PVC not binding | `kubectl describe pvc <pvc-name> -n ultra-ai` |
| High CPU usage | `kubectl top pods -n ultra-ai` |
| Storage full | `kubectl get pvc -n ultra-ai` + expand volume |
| Network issues | `kubectl describe networkpolicies -n ultra-ai` |
| RBAC permissions | `kubectl auth can-i <verb> <resource>` |

---

**Last Updated**: March 5, 2026  
**Version**: Phase 19 Kubernetes
