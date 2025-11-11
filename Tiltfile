# Tiltfile for SA_jimmy_runner microservices
# This file configures Tilt for local Kubernetes development

# Allow k8s contexts (adjust for your local setup)
allow_k8s_contexts('docker-desktop')  # or 'minikube', 'kind-kind', etc.

# Load Kubernetes manifests
k8s_yaml([
    'infra/dev/k8s/configmap.yaml',
    'infra/dev/k8s/secrets.yaml',
    'infra/dev/k8s/user-service.yaml',
    'infra/dev/k8s/plan-service.yaml',
    'infra/dev/k8s/noti-service.yaml',
    'infra/dev/k8s/api-gateway.yaml',
])

# User Service
docker_build(
    'user-service',
    context='.',
    dockerfile='./infra/dev/docker/Dockerfile.user-service',
    live_update=[
        sync('./services/user-service', '/app/services/user-service'),
        sync('./shared', '/app/shared'),
        run('cd /app/services/user-service/cmd && go build -o /user-service .', trigger=['./services/user-service']),
    ]
)
k8s_resource(
    'user-service',
    port_forwards='50051:50051',
    labels=['backend'],
)

# Plan Service
docker_build(
    'plan-service',
    context='.',
    dockerfile='./infra/dev/docker/Dockerfile.plan-service',
    live_update=[
        sync('./services/plan-service', '/app/services/plan-service'),
        sync('./shared', '/app/shared'),
        run('cd /app/services/plan-service/cmd && go build -o /plan-service .', trigger=['./services/plan-service']),
    ]
)
k8s_resource(
    'plan-service',
    port_forwards='50052:50052',
    labels=['backend'],
)

# Notification Service
docker_build(
    'noti-service',
    context='.',
    dockerfile='./infra/dev/docker/Dockerfile.noti-service',
    live_update=[
        sync('./services/noti-service', '/app/services/noti-service'),
        sync('./shared', '/app/shared'),
        run('cd /app/services/noti-service/cmd && go build -o /noti-service .', trigger=['./services/noti-service']),
    ]
)
k8s_resource(
    'noti-service',
    port_forwards='50053:50053',
    labels=['backend'],
)

# API Gateway
docker_build(
    'api-gateway',
    context='.',
    dockerfile='./infra/dev/docker/Dockerfile.api-gateway',
    live_update=[
        sync('./services/api-gateway', '/app/services/api-gateway'),
        sync('./shared', '/app/shared'),
        run('cd /app/services/api-gateway/cmd && go build -o /api-gateway .', trigger=['./services/api-gateway']),
    ]
)
k8s_resource(
    'api-gateway',
    port_forwards='8080:8080',
    labels=['gateway'],
)

# Set update mode
update_settings(max_parallel_updates=3)
