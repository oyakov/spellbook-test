---
name: docker-compose-operations
description: >
  Docker and Docker Compose reference for AI agents. Use this skill whenever the user
  mentions Docker, containers, Dockerfile, docker-compose, container orchestration, or
  self-hosting — including when deploying applications, debugging container issues, or
  setting up development environments with Docker.
---

# Docker & Docker Compose Operations

This skill provides a comprehensive reference for Docker operations, covering image management, container lifecycles, Dockerfile best practices, and Docker Compose orchestration.

## When to use

- Agent needs to build, run, or manage Docker containers
- Setting up multi-service applications with Docker Compose
- Debugging container issues (logs, networking, volumes)
- Writing or modifying Dockerfiles
- Working with CI/CD pipelines that use Docker
- Deploying self-hosted applications

## Docker CLI Essentials

### Image Management

```bash
# Build image
docker build -t myapp:latest .
docker build -t myapp:v1.2.0 -f Dockerfile.prod .
docker build --no-cache -t myapp:latest .       # Force rebuild all layers
docker build --target builder -t myapp:build .   # Build specific stage

# List / Pull / Push
docker images                          # List local images
docker pull nginx:1.25-alpine          # Pull specific tag
docker push registry.example.com/myapp:v1.2.0
docker tag myapp:latest registry.example.com/myapp:v1.2.0

# Cleanup
docker image prune -f                  # Remove dangling images
docker image prune -a -f               # Remove ALL unused images
docker system prune -af --volumes      # Nuclear cleanup (images + containers + volumes)
```

### Container Lifecycle

```bash
# Run container
docker run -d --name myapp -p 8080:3000 myapp:latest
docker run -d --name myapp \
  -p 8080:3000 \
  -v ./data:/app/data \
  -e NODE_ENV=production \
  --restart unless-stopped \
  myapp:latest

# Interactive / Debug
docker run -it --rm ubuntu:22.04 bash           # Disposable shell
docker exec -it myapp bash                       # Shell into running container
docker exec -it myapp sh                         # If bash not available (alpine)

# Lifecycle
docker start myapp
docker stop myapp                # Graceful stop (SIGTERM, 10s timeout)
docker stop -t 30 myapp          # Custom timeout
docker restart myapp
docker rm myapp                  # Remove stopped container
docker rm -f myapp               # Force remove (even running)

# Status
docker ps                        # Running containers
docker ps -a                     # All containers (including stopped)
docker stats                     # Live resource usage
docker inspect myapp             # Full container details
docker top myapp                 # Processes inside container
```

### Logs

```bash
docker logs myapp                # All logs
docker logs myapp -f             # Follow (tail -f)
docker logs myapp --tail 100     # Last 100 lines
docker logs myapp --since 1h     # Last hour
docker logs myapp --timestamps   # Add timestamps
docker logs myapp 2>&1 | grep ERROR  # Filter errors
```

### Copy Files

```bash
docker cp myapp:/app/config.yaml ./config.yaml   # Container -> Host
docker cp ./config.yaml myapp:/app/config.yaml   # Host -> Container
```

## Dockerfile — Best Practices

### Standard Dockerfile

```docker
# ✅ Always pin versions
FROM node:20-alpine AS builder

# ✅ Set working directory
WORKDIR /app

# ✅ Copy dependency files first (layer caching)
COPY package.json package-lock.json ./
RUN npm ci --production

# ✅ Copy source code
COPY . .

# ✅ Build step
RUN npm run build

# --- Production stage ---
FROM node:20-alpine

WORKDIR /app

# ✅ Non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# ✅ Copy only what's needed from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# ✅ Set ownership
RUN chown -R appuser:appgroup /app
USER appuser

# ✅ Health check
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### Multi-Stage Build Patterns

```docker
# Pattern: Build + Runtime
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /app/server ./cmd/server

FROM alpine:3.19
RUN apk --no-cache add ca-certificates
COPY --from=builder /app/server /usr/local/bin/server
USER nobody:nobody
ENTRYPOINT ["server"]
```

### Dockerfile Rules for Agents

```docker
# ✅ DO: Pin base image versions
FROM python:3.12-slim

# ❌ DON'T: Use :latest
FROM python:latest

# ✅ DO: Use alpine/slim variants
FROM node:20-alpine          # ~50MB

# ❌ DON'T: Use full images unnecessarily
FROM node:20                 # ~350MB

# ✅ DO: Combine RUN commands
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# ❌ DON'T: Separate RUN per command (bloats layers)
RUN apt-get update
RUN apt-get install -y curl

# ✅ DO: Use .dockerignore
# .dockerignore:
# node_modules
# .git
# .env
# *.md
# Dockerfile

# ✅ DO: Use exec form for CMD/ENTRYPOINT
CMD ["node", "server.js"]

# ❌ DON'T: Use shell form (no signal handling)
CMD node server.js
```

> [!IMPORTANT]
> **AGENT RULE:** Always use multi-stage builds for compiled languages. Always run as non-root. Always pin image versions. Always create `.dockerignore`.

## Docker Compose

### Basic Structure

```yaml
# docker-compose.yml (or compose.yaml)
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8080:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgres://user:pass@db:5432/mydb
    volumes:
      - ./data:/app/data
      - app-logs:/app/logs
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - backend

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mydb
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d mydb"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - backend

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass secret
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    restart: unless-stopped
    networks:
      - backend

volumes:
  postgres-data:
  redis-data:
  app-logs:

networks:
  backend:
    driver: bridge
```

### Compose CLI Commands

```bash
# Start / Stop
docker compose up -d                     # Start all services detached
docker compose up -d --build             # Rebuild images + start
docker compose up -d app                 # Start specific service
docker compose down                      # Stop + remove containers
docker compose down -v                   # + remove volumes (DATA LOSS!)
docker compose down --rmi all            # + remove images

# Status
docker compose ps                        # Running services
docker compose ps -a                     # All services
docker compose top                       # Processes in all services

# Logs
docker compose logs                      # All services
docker compose logs -f app               # Follow specific service
docker compose logs --tail 50 app db     # Last 50 lines from multiple

# Exec / Run
docker compose exec app bash             # Shell into running service
docker compose run --rm app npm test     # Run one-off command

# Build
docker compose build                     # Build all images
docker compose build --no-cache app      # Rebuild without cache

# Scale
docker compose up -d --scale worker=3    # Run 3 worker instances

# Pull latest images
docker compose pull

# Restart specific service
docker compose restart app
```

> [!IMPORTANT]
> **AGENT RULE:** Always use `docker compose` (v2, no hyphen) instead of `docker-compose` (v1, deprecated). Always use `-d` flag for background execution in scripts.

### Environment Variables

```yaml
# Method 1: Inline
services:
  app:
    environment:
      - NODE_ENV=production
      - API_KEY=secret123

# Method 2: env_file (preferred — keeps secrets out of compose file)
services:
  app:
    env_file:
      - .env
      - .env.production

# Method 3: Variable substitution from host
services:
  app:
    image: myapp:${APP_VERSION:-latest}
    environment:
      - DATABASE_URL=${DATABASE_URL}
```

```bash
# .env file (auto-loaded by Compose)
APP_VERSION=1.2.0
DATABASE_URL=postgres://user:pass@db:5432/mydb
REDIS_URL=redis://:secret@redis:6379
```

> [!IMPORTANT]
> **AGENT RULE:** Never hardcode secrets in `docker-compose.yml`. Use `.env` files and add `.env` to `.gitignore`.

## Volumes

```yaml
# Named volumes — managed by Docker, persist across restarts
volumes:
  postgres-data:
  redis-data:

# Usage in services
services:
  db:
    volumes:
      - postgres-data:/var/lib/postgresql/data   # Named volume
      - ./init.sql:/docker-entrypoint-initdb.d/  # Bind mount
      - ./config:/app/config:ro                  # Read-only bind mount
```

```bash
# Volume management
docker volume ls
docker volume inspect postgres-data
docker volume rm postgres-data
docker volume prune -f              # Remove unused volumes

# Backup a volume
docker run --rm -v postgres-data:/data -v $(pwd):/backup alpine \
  tar czf /backup/postgres-data.tar.gz -C /data .

# Restore a volume
docker run --rm -v postgres-data:/data -v $(pwd):/backup alpine \
  tar xzf /backup/postgres-data.tar.gz -C /data
```

> [!IMPORTANT]
> **AGENT RULE:** Use named volumes for persistent data (databases, uploads). Use bind mounts for config files and development. Never use `docker compose down -v` unless you intend data loss.

## Networking

```yaml
# Custom networks
networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true    # No external access

services:
  nginx:
    networks:
      - frontend
      - backend
  app:
    networks:
      - backend
  db:
    networks:
      - backend
```

```bash
# Network commands
docker network ls
docker network inspect bridge
docker network create mynetwork
docker network connect mynetwork mycontainer
docker network disconnect mynetwork mycontainer

# DNS: containers on same network resolve each other by service name
# From 'app' container: curl http://db:5432 -> resolves to 'db' service
```

> [!IMPORTANT]
> **AGENT RULE:** Services on the same Compose network resolve by service name. Use `internal: true` for networks that shouldn't have internet access (e.g., database network).

## Health Checks

```yaml
services:
  app:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s    # Grace period for startup

  db:
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
```

### Common Health Check Commands

| Service | Test Command |
| :--- | :--- |
| HTTP/Web | `["CMD", "curl", "-f", "http://localhost:3000/health"]` |
| Postgres | `["CMD-SHELL", "pg_isready -U postgres"]` |
| MySQL | `["CMD", "mysqladmin", "ping", "-h", "localhost"]` |
| Redis | `["CMD", "redis-cli", "ping"]` |
| MongoDB | `["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]` |
| Generic | `["CMD-SHELL", "grep -q 'ready' /var/log/app.log"]` |

## Common Compose Patterns

### Reverse Proxy (Nginx + App)

```yaml
services:
  nginx:
    image: nginx:1.25-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      app:
        condition: service_healthy
    restart: unless-stopped

  app:
    build: .
    expose:
      - "3000"    # Only within Docker network, not host
    restart: unless-stopped
```

### Development Override

```yaml
# docker-compose.yml (base)
services:
  app:
    build: .
    environment:
      - NODE_ENV=production

# docker-compose.override.yml (auto-loaded in dev)
services:
  app:
    build:
      target: dev
    volumes:
      - .:/app
      - /app/node_modules    # Anonymous volume to prevent overwrite
    environment:
      - NODE_ENV=development
    ports:
      - "3000:3000"
      - "9229:9229"          # Debug port
    command: npm run dev
```

```bash
# Dev (auto-loads override)
docker compose up -d

# Production (skip override)
docker compose -f docker-compose.yml up -d

# Explicit multi-file
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Debugging

```bash
# Container won't start?
docker compose logs app               # Check logs
docker compose config                  # Validate compose file
docker inspect myapp                   # Full container details

# Shell into container
docker compose exec app bash           # Running container
docker compose run --rm app sh         # Start new container with shell

# Network issues?
docker compose exec app ping db        # Test DNS resolution
docker compose exec app nslookup db    # DNS lookup
docker network inspect compose_default # Check network config

# Disk/volume issues?
docker system df                       # Docker disk usage
docker volume ls                       # List volumes
docker compose exec db ls -la /var/lib/postgresql/data  # Check mount

# Resource issues?
docker stats                           # Live CPU/memory/IO
docker compose top                     # Processes per service
```

## Common Agent Pitfalls

| Problem | Symptom | Solution |
| :--- | :--- | :--- |
| **Race Conditions** | App starts before DB is ready | Use `depends_on` with `condition: service_healthy` + app retries |
| **Binds Overwriting** | Local `node_modules` overwrite container's | Use an anonymous volume: `- /app/node_modules` |
| **Signal Handling** | `docker stop` takes 10s (SIGKILL) | Use `exec` form: `CMD ["node", "app.js"]` |
| **Host Connectivity** | Container can't reach host service | Use `host.docker.internal` (Docker Desktop) |
| **Permission Denied** | App can't write to mounted volume | Use `chown` in Dockerfile or `user: "1000:1000"` in Compose |

## Decision Tree

Agent needs to work with Docker
├── Single container or multi-service?
│   ├── Single → docker run with appropriate flags
│   └── Multi-service → Docker Compose
├── Need to build an image?
│   ├── YES → Multi-stage Dockerfile + .dockerignore
│   └── NO → Use official image with pinned version
├── Persistent data?
│   ├── Database → Named volume
│   ├── Config files → Bind mount (:ro)
│   └── Temp/cache → Anonymous volume or tmpfs
├── Service dependencies?
│   └── ALWAYS use depends_on with condition: service_healthy
├── Environment?
│   ├── Dev → docker-compose.override.yml + bind mounts
│   └── Prod → .env file + pinned images + restart policies
└── Debugging?
    ├── Logs → docker compose logs -f service
    ├── Shell → docker compose exec service sh
    ├── Network → docker compose exec service ping other_service
    └── Resources → docker stats

## Constraints

- **NEVER** use `docker-compose` (v1) — use `docker compose` (v2)
- **NEVER** use `:latest` tag in production — pin versions
- **NEVER** run containers as root — add USER directive
- **NEVER** hardcode secrets in Compose files — use `.env`
- **NEVER** use `docker compose down -v` without explicit intent to delete data
- **NEVER** expose database ports to host in production — use `expose`
- **ALWAYS** add health checks to all services
- **ALWAYS** use `restart: unless-stopped` for production
- **ALWAYS** use multi-stage builds for compiled languages
- **ALWAYS** create `.dockerignore` to reduce build context
- **ALWAYS** use alpine/slim base images when possible
- **ALWAYS** combine `RUN` commands and clean up in the same layer

## References

- [Docker Documentation](https://docs.docker.com/)
- [Dockerfile Best Practices](https://docs.docker.com/build/building/best-practices/)
- [Compose Specification](https://docs.docker.com/compose/compose-file/)
- [Docker Hub Official Images](https://hub.docker.com/search?q=&image_filter=official)
