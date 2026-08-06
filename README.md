# Course Service

The **Course Service** is the learning domain service of the Edulearn platform. It manages the complete lifecycle of educational courses, including course creation, content organization, enrollments, progress tracking, reviews, ratings, and certificate generation.

The service is built with **NestJS**, **TypeScript**, and **Clean Architecture**, and depends on **@edulearn/nest** for shared platform infrastructure such as logging, metrics, distributed tracing, Redis, Kafka, health checks, and observability utilities.

---

## Overview

The Course Service is the authoritative owner of course-related data within the platform. It manages course metadata, content hierarchy, learner enrollments, progress tracking, reviews, and certificates, while coordinating with other services through **gRPC** and **Kafka**.

### Responsibilities

* Course lifecycle management
* Course content organization (sections, lessons, quizzes)
* Enrollment management
* Progress tracking
* Reviews and ratings
* Certificate generation
* Category management
* Event-driven synchronization with other services

### Out of Scope

* Authentication and authorization (Auth Service)
* User profile management (User Service)
* Payment processing (Payment Service)
* Order lifecycle management (Order Service)
* Notification delivery (Notification Service)

---

# Architecture

This service follows **Clean Architecture (Hexagonal Architecture)** with **SOLID principles**, enabling framework-independent business logic, high testability, and clear separation of concerns.

## Layered Architecture

```text
                gRPC Controllers
                       │
               Application Layer
      (Use Cases / DTOs / Events / Services)
                       │
                 Domain Layer
 (Entities / Repository Interfaces / Domain Services)
                       │
             Infrastructure Layer
(PostgreSQL / Redis / Kafka / gRPC / Observability)
```

### Layers

#### Presentation Layer

* gRPC controllers
* Health endpoints
* Request validation
* Transport-specific concerns

#### Application Layer

* Course use cases
* Enrollment workflows
* Progress orchestration
* Review management
* Certificate generation
* Event handlers

#### Domain Layer

* Course aggregate
* Section and lesson entities
* Enrollment domain
* Progress domain
* Review domain
* Repository interfaces
* Domain services

#### Infrastructure Layer

* PostgreSQL persistence
* Redis caching
* Kafka integration
* gRPC client/server implementations
* Logging, metrics, and tracing

---

# Technology Stack

| Category      | Technology                                          |
| ------------- | --------------------------------------------------- |
| Language      | TypeScript 5.x                                      |
| Runtime       | Node.js                                             |
| Framework     | NestJS 11                                           |
| Architecture  | Clean Architecture                                  |
| Transport     | gRPC                                                |
| Database      | PostgreSQL                                          |
| ORM           | TypeORM                                             |
| Cache         | Redis                                               |
| Messaging     | Kafka                                               |
| Observability | @edulearn/nest (Winston, Prometheus, OpenTelemetry) |
| Deployment    | Docker, Kubernetes, Helm                            |

---

# Core Domain

The Course Service owns the learning domain.

## Course

* Metadata
* Pricing
* Categories
* Publishing state
* Instructor association

## Content Structure

* Sections
* Lessons
* Quizzes
* Ordering
* Learning hierarchy

## Enrollment

* Enrollment lifecycle
* Enrollment status
* Enrollment metadata
* Completion state

## Progress

* Lesson completion
* Quiz attempts
* Scores
* Completion percentage

## Review

* Ratings
* Reviews
* Review moderation
* Rating aggregation

## Certificate

* Completion certificates
* Certificate metadata
* Verification data

## Category

* Hierarchical categories
* Course organization
* Discovery metadata

---

# Course Lifecycle

```text
Draft
   │
   ▼
Content Editing
   │
   ▼
Validation
   │
   ▼
Published
   │
   ▼
Enrollment Available
   │
   ▼
Unpublished / Archived
```

Courses remain editable while in draft and become available for enrollment only after successful validation and publishing.

---

# Enrollment & Progress Flow

## Enrollment

```text
Order Completed Event
          │
          ▼
      Kafka Consumer
          │
          ▼
Create Enrollment
          │
          ▼
Initialize Progress
          │
          ▼
Publish Enrollment Event
```

## Progress Tracking

```text
Lesson Completed
       │
       ▼
Update Progress
       │
       ▼
Recalculate Completion
       │
       ▼
Generate Certificate
```

Progress is maintained incrementally and enrollment completion is detected automatically.

---

# Project Structure

```text
src/
├── application/
│   ├── dtos/
│   ├── use-cases/
│   ├── events/
│   └── services/
├── domain/
│   ├── entities/
│   ├── repositories/
│   ├── services/
│   └── exceptions/
├── infrastructure/
│   ├── database/
│   ├── grpc/
│   ├── kafka/
│   ├── redis/
│   ├── observability/
│   └── config/
├── presentation/
│   ├── grpc/
│   └── http/
└── shared/
```

---

# Communication

## gRPC APIs

The Course Service exposes internal gRPC APIs consumed by:

* API Gateway
* User Service
* Order Service
* Payment Service
* Notification Service
* Chat Service

Example operations:

* CreateCourse
* UpdateCourse
* PublishCourse
* GetCourse
* ListCourses
* CreateEnrollment
* GetEnrollment
* UpdateProgress
* SubmitReview
* GenerateCertificate

---

## Kafka Integration

The Course Service participates heavily in the platform event architecture.

### Consumed Events

| Topic                         | Purpose                          |
| ----------------------------- | -------------------------------- |
| order.completed.v1            | Create enrollment                |
| payment.completed.v1          | Confirm enrollment payment       |
| user.updated.v1               | Synchronize instructor/user data |
| user.instructor.registered.v1 | Instructor onboarding            |

### Published Events

| Topic                    | Purpose               |
| ------------------------ | --------------------- |
| course.created.v1        | Course created        |
| course.updated.v1        | Course updated        |
| course.published.v1      | Course published      |
| course.unpublished.v1    | Course unpublished    |
| enrollment.created.v1    | Enrollment created    |
| enrollment.completed.v1  | Course completed      |
| course.review.created.v1 | Review submitted      |
| certificate.generated.v1 | Certificate generated |

This event-driven model enables asynchronous enrollment processing, analytics, notifications, and search indexing.

---

# Data Ownership

The Course Service is the single source of truth for learning-related data.

| Entity       | Owner          |
| ------------ | -------------- |
| courses      | Course Service |
| sections     | Course Service |
| lessons      | Course Service |
| quizzes      | Course Service |
| enrollments  | Course Service |
| progress     | Course Service |
| reviews      | Course Service |
| certificates | Course Service |
| categories   | Course Service |

Other services access this data through gRPC APIs or Kafka events rather than direct database access.

---

# Dependency on @edulearn/nest

The Course Service relies on **@edulearn/nest** for shared platform infrastructure.

## Logging

* Winston structured logging
* JSON log output
* Correlation IDs
* Trace-aware logging

## Metrics

Prometheus metrics include:

* Course creation requests
* Course publish requests
* Enrollment creation rate
* Progress update rate
* Review submissions
* gRPC request latency
* Kafka consumer lag
* Cache hit/miss ratio

Exposed at:

```text
/metrics
```

## Distributed Tracing

OpenTelemetry instrumentation provides end-to-end tracing across learning workflows.

Trace flow:

```text
API Gateway
      │
      ▼
Course Service
      │
      ▼
PostgreSQL / Redis / Kafka
```

Traces are exported to **OTEL Collector → Tempo → Grafana**.

## Shared Infrastructure

Provided by **@edulearn/nest**:

* Logger
* Metrics registry
* Tracer
* Redis client
* Kafka producer/consumer
* Health checks
* Configuration utilities
* Common error handling

---

# Caching Strategy

Redis is used for:

* Course metadata
* Course listings
* Categories
* Instructor information
* Frequently accessed lessons
* Search-related metadata
* Hot course optimization

Cache invalidation occurs through course lifecycle events and repository updates.

---

# Database

PostgreSQL is the primary persistent datastore.

TypeORM manages:

* Entity mapping
* Migrations
* Repository implementations
* Transaction management

Typical migration command:

```bash
yarn migration:run
```

---

# Local Development

## Prerequisites

* Node.js 22+
* Yarn
* PostgreSQL
* Redis
* Kafka

## Install

```bash
yarn install
```

## Start Development

```bash
yarn start:dev
```

## Build

```bash
yarn build
```

## Start Production

```bash
yarn start:prod
```

---

# Environment Variables

| Variable                    | Description                  |
| --------------------------- | ---------------------------- |
| PORT                        | gRPC server port             |
| DATABASE_URL                | PostgreSQL connection string |
| REDIS_URL                   | Redis connection string      |
| KAFKA_BROKERS               | Kafka broker list            |
| USER_SERVICE_GRPC_URL       | User Service gRPC endpoint   |
| OTEL_EXPORTER_OTLP_ENDPOINT | OTLP collector endpoint      |
| LOG_LEVEL                   | Logging level                |

See `env.example` for the complete configuration.

---

# Docker

The service uses a **multi-stage Docker build** optimized for production.

Optimizations include:

* Multi-stage compilation
* Dependency pruning
* Layer caching
* Minimal runtime image
* Non-root execution
* Reduced attack surface

---

# Kubernetes Deployment

Deployment is managed through the **Edulearn umbrella Helm chart**.

The service is deployed with:

* ClusterIP service
* gRPC exposure
* Liveness probes
* Readiness probes
* Resource requests and limits
* Horizontal Pod Autoscaler support
* Prometheus ServiceMonitor

---

# CI/CD

This service participates in the platform GitOps deployment pipeline.

```text
Git Push
    │
    ▼
GitHub Actions
    ├── Test
    ├── Build
    ├── Lint
    ├── Trivy Scan
    └── Push to GHCR
             │
             ▼
ArgoCD Image Updater
             │
             ▼
ArgoCD
             │
             ▼
Amazon EKS
```

---

# Performance Optimizations

Implemented optimizations include:

* gRPC binary transport
* Redis caching
* Connection pooling
* Efficient repository queries
* Database indexing
* Asynchronous Kafka processing
* Idempotent enrollment handling
* Optimized Docker image size

---

# Security

The service follows production-oriented security practices.

## Authentication

* JWT validation for incoming requests
* Internal service authentication
* gRPC metadata propagation

## Authorization

* Instructor ownership validation
* Course access checks
* Enrollment authorization
* Resource-level permission enforcement

## Secrets Management

Production deployments retrieve secrets from:

* AWS Secrets Manager
* External Secrets Operator

## Container Security

* Runs as non-root user
* No shell access
* Minimal Linux capabilities
* Read-only filesystem where applicable

---

# Testing

```bash
# Unit tests
yarn test

# Integration tests
yarn test:integration

# End-to-end tests
yarn test:e2e

# Coverage
yarn test:cov
```

---

# Related Repositories

| Repository                    | Description                                                   |
| ----------------------------- | ------------------------------------------------------------- |
| edulearn-platform             | Platform orchestration repository                             |
| edulearn-api-gateway          | API Gateway                                                   |
| edulearn-auth-service         | Authentication service                                        |
| edulearn-user-service         | User profile service                                          |
| edulearn-payment-service      | Payment processing service                                    |
| edulearn-order-service        | Order management service                                      |
| edulearn-notification-service | Notification service                                          |
| edulearn-chat-service         | Chat service                                                  |
| @edulearn/core                | Shared logging, metrics, tracing, Redis, Kafka, health checks |
| @edulearn/nest                | Shared NestJS wrapper over @edulearn/core  package                          |

---

# License

This project is part of the **Edulearn Platform** and is licensed under the MIT License.
