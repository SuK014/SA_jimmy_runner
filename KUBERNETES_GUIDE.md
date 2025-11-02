# Kubernetes & Tilt Development Guide

## 🚀 Quick Start with Tilt

### Prerequisites

-   [Docker Desktop](https://www.docker.com/products/docker-desktop) with Kubernetes enabled
-   [Tilt](https://docs.tilt.dev/install.html) installed
-   [kubectl](https://kubernetes.io/docs/tasks/tools/) installed

### 1. Start Kubernetes Cluster

Ensure Docker Desktop Kubernetes is running:

```bash
kubectl cluster-info
```

### 2. Run with Tilt

From the project root:

```bash
tilt up
```

This will:

-   Build all Docker images
-   Deploy all services to Kubernetes
-   Set up port forwarding
-   Enable live reloading on code changes
-   Open the Tilt UI in your browser

### 3. Access Services

-   **Tilt UI**: http://localhost:10350
-   **API Gateway**: http://localhost:8080
-   **User Service**: localhost:50051 (gRPC)
-   **Plan Service**: localhost:50052 (gRPC)

---

## 📁 Project Structure

```
SA_jimmy_runner/
├── Tiltfile                          # Tilt configuration
├── infra/
│   └── dev/
│       ├── docker/
│       │   ├── Dockerfile.user-service      # User service Dockerfile
│       │   ├── Dockerfile.plan-service      # Plan service Dockerfile
│       │   ├── Dockerfile.noti-service      # Notification service Dockerfile
│       │   ├── Dockerfile.api-gateway       # API Gateway Dockerfile
│       │   └── docker-compose.yaml          # Docker Compose for local testing
│       └── k8s/
│           ├── configmap.yaml        # ConfigMap for non-sensitive config
│           ├── secrets.yaml          # Secrets for sensitive data
│           ├── user-service.yaml     # User service deployment
│           ├── plan-service.yaml     # Plan service deployment
│           ├── noti-service.yaml     # Notification service deployment
│           └── api-gateway.yaml      # API Gateway deployment
└── services/
    ├── user-service/
    ├── plan-service/
    ├── noti-service/
    └── api-gateway/
```

---

## 🐳 Docker Commands

### Build Individual Services

```bash
# Build all from root directory
docker build -t user-service:latest -f infra/dev/docker/Dockerfile.user-service .
docker build -t plan-service:latest -f infra/dev/docker/Dockerfile.plan-service .
docker build -t noti-service:latest -f infra/dev/docker/Dockerfile.noti-service .
docker build -t api-gateway:latest -f infra/dev/docker/Dockerfile.api-gateway .
```

### Using Docker Compose

```bash
cd infra/dev/docker
docker-compose up --build
```

To stop:

```bash
docker-compose down
```

---

## ☸️ Kubernetes Commands (Without Tilt)

### Apply All Manifests

```bash
kubectl apply -f infra/dev/k8s/
```

### Check Status

```bash
# Check all pods
kubectl get pods

# Check all services
kubectl get services

# Check deployments
kubectl get deployments

# Get detailed info
kubectl describe pod <pod-name>
```

### View Logs

```bash
# User service logs
kubectl logs -f deployment/user-service

# Plan service logs
kubectl logs -f deployment/plan-service

# API Gateway logs
kubectl logs -f deployment/api-gateway

# Notification service logs
kubectl logs -f deployment/noti-service
```

### Port Forwarding (if not using Tilt)

```bash
kubectl port-forward service/api-gateway 8080:8080
kubectl port-forward service/user-service 50051:50051
kubectl port-forward service/plan-service 50052:50052
```

### Delete Resources

```bash
# Delete all resources
kubectl delete -f infra/dev/k8s/

# Or delete individual services
kubectl delete deployment user-service
kubectl delete service user-service
```

---

## 🔧 Tilt Configuration

The `Tiltfile` includes:

### Live Update

Code changes are automatically synced and rebuilt without full container rebuild:

-   Changes in `services/*` trigger rebuild
-   Changes in `shared/*` are synced to all services

### Resource Labels

Services are organized by labels:

-   **backend**: user-service, plan-service, noti-service
-   **gateway**: api-gateway

### Port Forwarding

Automatic port forwarding for local access:

-   API Gateway: 8080
-   User Service: 50051
-   Plan Service: 50052

### Customizing Tiltfile

Edit the `Tiltfile` to:

-   Change context: `allow_k8s_contexts('your-context')`
-   Modify port forwards
-   Adjust resource limits
-   Add custom build steps

---

## 🔐 Secrets Management

### For Development

Secrets are stored in `infra/dev/k8s/secrets.yaml` using `stringData`.

**⚠️ Warning**: Never commit real secrets to git!

### For Production

Use proper secret management:

-   Kubernetes Secrets with encryption at rest
-   External secret managers (HashiCorp Vault, AWS Secrets Manager)
-   Sealed Secrets

### Update Secrets

```bash
# Edit secrets
kubectl edit secret app-secrets

# Or apply new secrets file
kubectl apply -f infra/dev/k8s/secrets.yaml
```

---

## 📊 Monitoring & Debugging

### Tilt UI Features

-   Real-time logs for all services
-   Build status and errors
-   Resource metrics
-   Trigger manual rebuilds

### Debugging Tips

1. **Container won't start**

    ```bash
    kubectl describe pod <pod-name>
    kubectl logs <pod-name>
    ```

2. **Service unreachable**

    ```bash
    kubectl get endpoints
    kubectl get services
    ```

3. **Check environment variables**

    ```bash
    kubectl exec -it <pod-name> -- env
    ```

4. **Interactive shell in container**
    ```bash
    kubectl exec -it <pod-name> -- sh
    ```

---

## 🧪 Testing

### Test API Gateway

```powershell
# Register a user
Invoke-RestMethod -Uri http://localhost:8080/users/register `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"test@example.com","display_name":"Test","password":"pass123"}'
```

### Health Checks

```bash
# Check if services are responding
curl http://localhost:8080/users/register
```

---

## 🚦 Common Workflows

### Development Workflow

1. Start Tilt: `tilt up`
2. Make code changes
3. Tilt auto-rebuilds and deploys
4. View logs in Tilt UI
5. Test changes via port-forwarded endpoints

### Debugging Workflow

1. Check Tilt UI for errors
2. View logs: `kubectl logs -f deployment/<service-name>`
3. Exec into pod: `kubectl exec -it <pod-name> -- sh`
4. Check configs: `kubectl describe configmap app-config`

### Cleanup Workflow

```bash
# Stop Tilt
tilt down

# Clean up Kubernetes resources
kubectl delete -f infra/dev/k8s/

# Clean Docker images (optional)
docker system prune -a
```

---

## 📝 Environment Variables

### API Gateway

-   `PORT`: HTTP port (default: 8080)
-   `USER_SERVICE_URL`: User service address (default: localhost:50051)
-   `PLAN_SERVICE_URL`: Plan service address (default: localhost:50052)

### User Service

-   `DATABASE_URL`: PostgreSQL connection string
-   `RABBITMQ_URL`: RabbitMQ connection string
-   `GMAIL_USER`: Gmail username for notifications
-   `GMAIL_PASSWORD`: Gmail app password

### Plan Service

-   `MONGODB_URI`: MongoDB connection string
-   `DATABASE_NAME`: MongoDB database name
-   `RABBITMQ_URL`: RabbitMQ connection string

### Notification Service

-   `RABBITMQ_URL`: RabbitMQ connection string
-   `GMAIL_USER`: Gmail username
-   `GMAIL_PASSWORD`: Gmail app password

---

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Deploy
on: [push]
jobs:
    build:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v2
            - name: Build images
              run: |
                  docker build -t user-service -f services/user-service/Dockerfile .
                  docker build -t plan-service -f services/plan-service/Dockerfile .
```

---

## 🎯 Next Steps

1. **Add Health Checks**: Implement `/health` endpoints for each service
2. **Monitoring**: Integrate Prometheus and Grafana
3. **Tracing**: Enable Jaeger tracing (already in code)
4. **Service Mesh**: Consider Istio or Linkerd
5. **Horizontal Scaling**: Configure HPA (Horizontal Pod Autoscaler)

---

## 📚 Resources

-   [Tilt Documentation](https://docs.tilt.dev/)
-   [Kubernetes Documentation](https://kubernetes.io/docs/)
-   [Docker Documentation](https://docs.docker.com/)
-   [gRPC Best Practices](https://grpc.io/docs/guides/)
