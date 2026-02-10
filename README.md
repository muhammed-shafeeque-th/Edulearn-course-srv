# Course Service

The **Course Service** is a microservice in the EduLearn platform responsible for managing courses, sections, lessons, quizzes, enrollments, progress tracking, reviews, certificates, and categories. It is built using **NestJS**, follows **Clean Architecture** principles, and uses **gRPC** for inter-service communication, **Kafka** for async event-driven communication, **Redis** for caching, and **TypeORM** with **PostgreSQL** for persistence.

## 📚 Documentation

This service documentation is organized into several focused documents:

- **[Overview](./docs/overview.md)** - Service purpose, scope, responsibilities, and key features
- **[Architecture](./docs/architecture.md)** - Internal design, layers, patterns, and technical decisions
- **[API Reference](./docs/api.md)** - Complete gRPC service definitions and endpoint documentation
- **[Database](./docs/database.md)** - Entity models, relationships, and data ownership
- **[Events](./docs/events.md)** - Kafka events published and consumed by this service
- **[Business Flows](./docs/flows.md)** - Key business processes and workflows
- **[Error Handling](./docs/errors.md)** - Exception types, error codes, and failure scenarios

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18.x or later)
- **npm** (v9.x or later)
- **PostgreSQL** (v15.x or later)
- **Redis** (v7.x or later)
- **Kafka** (v3.x or later)
- **Docker** (optional, for running dependencies)

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp env.example .env

# Update .env with your configuration
```

### Running the Service

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

### Running Tests

```bash
# Unit tests
npm run test

# Integration tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📋 Key Features

- **Course Management**: Create, update, publish, and manage courses with rich metadata
- **Content Organization**: Organize courses into sections with lessons and quizzes
- **Enrollment Management**: Handle user enrollments via order completion events
- **Progress Tracking**: Track user progress through lessons and quizzes
- **Reviews & Ratings**: Allow users to submit reviews and ratings for courses
- **Certificates**: Generate and manage completion certificates
- **Categories**: Organize courses into categories and subcategories
- **Event-Driven Architecture**: Publish and consume events via Kafka
- **Caching**: Use Redis for improved performance
- **Observability**: Prometheus metrics, OpenTelemetry tracing, and structured logging

## 🏗️ Architecture

The service follows **Clean Architecture** principles with clear separation of concerns:

```
src/
├── domain/          # Core business logic (entities, repositories, events)
├── application/     # Use cases, DTOs, event handlers
├── infrastructure/  # External integrations (database, Kafka, Redis, gRPC)
└── presentation/    # gRPC and HTTP controllers
```

See [Architecture Documentation](./docs/architecture.md) for detailed information.

## 🔌 Communication

- **gRPC Port**: `50052` (configurable via `GRPC_PORT`)
- **HTTP Port**: `3002` (configurable via `API_PORT`)
- **Health Check**: `GET /health`
- **Metrics**: `GET /health/metrics`

## 📊 Monitoring

- **Prometheus Metrics**: Available at `/health/metrics`
- **Distributed Tracing**: OpenTelemetry with Jaeger
- **Structured Logging**: Winston with JSON format

## 🤝 Contributing

Please follow the existing code style and architecture patterns. See the main project documentation for contribution guidelines.

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.
