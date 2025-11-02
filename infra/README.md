# Docker & Kubernetes Files Location

## 📁 Organized Structure

All Docker and Kubernetes files are now centralized in the `infra/` directory:

```
infra/
└── dev/
    ├── docker/                               # All Dockerfiles
    │   ├── Dockerfile.user-service          # User Service
    │   ├── Dockerfile.plan-service          # Plan Service
    │   ├── Dockerfile.noti-service          # Notification Service
    │   ├── Dockerfile.api-gateway           # API Gateway
    │   └── docker-compose.yaml              # Docker Compose
    │
    └── k8s/                                  # All Kubernetes manifests
        ├── configmap.yaml                    # ConfigMap
        ├── secrets.yaml                      # Secrets
        ├── user-service.yaml                 # User Service deployment
        ├── plan-service.yaml                 # Plan Service deployment
        ├── noti-service.yaml                 # Notification Service deployment
        └── api-gateway.yaml                  # API Gateway deployment
```

## 🐳 Docker Commands

### Build Images

```bash
# From project root
docker build -t user-service -f infra/dev/docker/Dockerfile.user-service .
docker build -t plan-service -f infra/dev/docker/Dockerfile.plan-service .
docker build -t noti-service -f infra/dev/docker/Dockerfile.noti-service .
docker build -t api-gateway -f infra/dev/docker/Dockerfile.api-gateway .
```

### Docker Compose

```bash
cd infra/dev/docker
docker-compose up --build
```

## ☸️ Kubernetes Commands

### Deploy All

```bash
kubectl apply -f infra/dev/k8s/
```

## 🎯 Tilt

The `Tiltfile` in the root automatically references the correct Dockerfile locations:

```bash
tilt up
```

---

**Benefits of this structure:**

-   ✅ Clean service directories (only source code)
-   ✅ All infrastructure in one place
-   ✅ Easy to find deployment files
-   ✅ Better separation of concerns
-   ✅ Easier to manage multiple environments (dev/prod)
