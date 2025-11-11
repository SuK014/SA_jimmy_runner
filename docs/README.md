# SA Jimmy Runner - Documentation

## 📚 Documentation Index

This directory contains comprehensive documentation for the SA Jimmy Runner project.

### 📊 Use Case Diagram

**File:** `use-case-diagram.puml`

PlantUML source code for the complete use case diagram showing:

-   All actors (Guest, User, System actors)
-   40+ use cases organized by domain
-   Include/Extend relationships
-   System boundaries and packages

**How to view:**

1. Install PlantUML extension in VS Code
2. Open `use-case-diagram.puml`
3. Press `Alt+D` to preview diagram
4. Or use online viewer: http://www.plantuml.com/plantuml/uml/

**Alternatively:** Export to PNG/SVG

```bash
# If you have PlantUML CLI installed
plantuml use-case-diagram.puml
```

### 📖 Use Case Specifications

**File:** `use-case-specifications.md`

Detailed specifications for all use cases including:

-   **UC-1 to UC-6:** Authentication & User Management
-   **UC-10 to UC-15:** Trip Management
-   **UC-20 to UC-23:** Whiteboard Management
-   **UC-30 to UC-35:** Pin Management
-   **UC-40 to UC-44:** Collaboration
-   **UC-50:** Notifications

Each use case includes:

-   Description
-   Actors
-   Preconditions & Postconditions
-   Main Flow
-   Alternative Flows
-   Technical Details (endpoints, services, authentication)

### 🏗️ System Architecture

#### Microservices

```
┌─────────────────┐
│   Frontend      │ Next.js/React/TypeScript
│   (Port 3000)   │ http://localhost:3000
└────────┬────────┘
         │ HTTP/REST
         ↓
┌─────────────────┐
│  API Gateway    │ Fiber (Go)
│   (Port 8080)   │ http://localhost:8080
└────────┬────────┘
         │ gRPC
    ┌────┴────┬──────────────┬─────────────┐
    ↓         ↓              ↓             ↓
┌────────┐ ┌─────────┐ ┌──────────┐ ┌────────────┐
│ User   │ │ Plan    │ │ Noti     │ │ RabbitMQ   │
│Service │ │ Service │ │ Service  │ │ (Queue)    │
│:50051  │ │ :50052  │ │ :50053   │ │ :5672      │
└────┬───┘ └────┬────┘ └─────┬────┘ └─────┬──────┘
     │          │            │            │
     ↓          ↓            └────────────┘
┌──────────┐ ┌────────┐        └→ Gmail SMTP
│PostgreSQL│ │MongoDB │
│  :5432   │ │ :27017 │
└──────────┘ └────────┘
```

#### Technology Stack

-   **Frontend:** Next.js, React, TypeScript, Axios, Tailwind CSS
-   **API Gateway:** Go Fiber (HTTP → gRPC translation)
-   **Backend Services:** Go, gRPC
-   **Databases:**
    -   PostgreSQL with Prisma ORM (User Service)
    -   MongoDB (Plan Service)
-   **Message Queue:** RabbitMQ
-   **Email:** Gmail SMTP
-   **Container:** Docker
-   **Orchestration:** Kubernetes
-   **Development:** Tilt
-   **Cloud Gateway:** Kong Konnect

### 🔑 Key Features

#### 1. Authentication & Authorization

-   JWT-based authentication
-   HTTP-only cookies for token storage
-   24-hour token expiry
-   Middleware protection on routes
-   Trip-level access control

#### 2. Collaborative Trip Planning

-   Multi-user trips
-   Real-time collaboration (via UserTrip associations)
-   Role-based access (trip participants)
-   User avatars and display names

#### 3. Hierarchical Structure

```
Trip (Travel Plan)
└── Whiteboards (Day Plans)
    └── Pins (Activities/Places)
        ├── Expenses
        ├── Participants
        └── Parent Pins (dependencies)
```

#### 4. Automatic Data Management

-   **Auto-creation:** New trip automatically creates Day 1 whiteboard with default pin
-   **Cascade deletion:** Deleting trip removes all whiteboards and pins
-   **Consistency:** Ensures referential integrity across services

#### 5. Async Notifications

-   Welcome email on registration
-   gRPC → RabbitMQ → Email Consumer
-   Non-blocking, fault-tolerant architecture

### 🚀 Getting Started

#### Local Development (All Services)

```bash
# Start all services + ngrok (for Kong Konnect)
.\start-all-with-konnect.bat

# Or start all services locally
.\localhostRunner\start-all-services.bat
```

#### Kubernetes Development

```bash
# Using Tilt (recommended)
tilt up

# Manual kubectl
kubectl apply -f infra/dev/k8s/
```

#### Frontend Only

```bash
cd frontend
npm install
npm run dev
# Access at http://localhost:3000
```

### 📝 API Documentation

#### Base URLs

-   **Local API Gateway:** http://localhost:8080
-   **Kong Konnect (Cloud):** https://kong-80752999e8usq58hm.kongcloud.dev

#### Authentication

Most endpoints require JWT token sent via cookie:

```http
Cookie: cookies=<jwt_token>
```

Public endpoints (no auth required):

-   `POST /users/register`
-   `POST /users/login`

#### Example Requests

**Register:**

```bash
curl -X POST http://localhost:8080/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepass123"
  }'
```

**Create Trip:**

```bash
curl -X POST http://localhost:8080/plan/trip/ \
  -H "Content-Type: application/json" \
  -H "Cookie: cookies=<your_jwt_token>" \
  -d '{
    "name": "Tokyo Adventure",
    "description": "10-day trip to Japan"
  }'
```

**Create Pin:**

```bash
curl -X POST "http://localhost:8080/plan/pin/?whiteboard_id=<id>" \
  -H "Content-Type: application/json" \
  -H "Cookie: cookies=<your_jwt_token>" \
  -d '{
    "name": "Tokyo Tower",
    "description": "Visit iconic tower",
    "location": 1,
    "expenses": [
      {"id": "user1", "name": "John", "expense": 1000}
    ],
    "participants": ["user1", "user2"]
  }'
```

### 🔐 Environment Configuration

Required environment variables (see `shared/env/.env`):

```bash
# Databases
DATABASE_URL=postgresql://...
MONGODB_URI=mongodb://...

# RabbitMQ
RABBITMQ_URL=amqp://...

# Email (Gmail)
GMAIL_USER=your-email@gmail.com
GMAIL_PASSWORD=your-app-password

# Services
USER_SERVICE_URL=localhost:50051
PLAN_SERVICE_URL=localhost:50052
NOTI_SERVICE_URL=localhost:50053
```

### 🧪 Testing

#### Test Notification Service

```bash
cd services/noti-service/test
go run main.go
```

#### API Testing (Postman/Insomnia)

Import endpoints from `use-case-specifications.md` API Endpoint Summary

### 📦 Project Structure

```
SA_jimmy_runner/
├── docs/                          # This documentation
│   ├── use-case-diagram.puml
│   ├── use-case-specifications.md
│   └── README.md
├── services/
│   ├── api-gateway/               # HTTP REST API
│   ├── user-service/              # User & UserTrip management
│   ├── plan-service/              # Trip/Whiteboard/Pin
│   └── noti-service/              # Email notifications
├── frontend/                      # Next.js app
├── shared/                        # Shared code
│   ├── proto/                     # gRPC definitions
│   ├── entities/                  # Data models
│   ├── messaging/                 # RabbitMQ utilities
│   └── env/                       # Environment config
├── infra/
│   └── dev/
│       ├── docker/                # Docker Compose
│       └── k8s/                   # Kubernetes manifests
└── localhostRunner/               # Batch scripts
```

### 🐛 Troubleshooting

#### Email not sending

1. Check Gmail credentials in `.env`
2. Enable "App Passwords" in Google Account
3. Check RabbitMQ is running: `docker ps | grep rabbitmq`
4. View noti-service logs for errors

#### JWT token invalid

1. Check token expiry (24 hours)
2. Verify cookie is being sent
3. Check JWT_SECRET matches between services

#### gRPC connection failed

1. Verify service is running on correct port
2. Check firewall/network settings
3. Ensure services can reach each other (in K8s: service names)

### 🤝 Contributing

#### Adding New Use Case

1. Update `use-case-diagram.puml`
2. Add specification to `use-case-specifications.md`
3. Implement in relevant service
4. Add endpoint to API Gateway router
5. Update this README

#### Code Style

-   Go: Follow standard Go conventions
-   TypeScript: ESLint + Prettier
-   Commit messages: Conventional Commits format

### 📞 Support

For questions or issues:

1. Check `use-case-specifications.md` for API details
2. Review service logs for errors
3. Check environment configuration
4. Review gRPC proto definitions in `shared/proto/`

---

**Last Updated:** November 10, 2025
**Version:** 1.0
