---
name: docker-distroless-builder
description: Use when asked to write a Dockerfile, containerize an app, or review an existing Dockerfile. Applies when the user says "Create a Dockerfile", "containerize this", "make a Docker image", or shares a Dockerfile for review. Enforces multi-stage builds and distroless non-root runtime images regardless of pushback.
---

# Docker Distroless Builder

## Overview

Every production container MUST use a multi-stage build with a distroless, non-root runtime image. This is non-negotiable regardless of language, app complexity, or developer pushback. These three rules together minimize attack surface, image size, and CVE exposure.

## When NOT to Apply

- **Local development containers** where you need `docker exec` shell access for debugging — use the full builder image or a `-slim` image for dev. Production containers are a separate concern.
- **Debug/troubleshooting sessions** on an existing distroless container — switch temporarily to the `:debug` tag (`gcr.io/distroless/...:debug`) which includes a busybox shell.

Everything else: production image, CI test image, staging image — distroless is mandatory.

## The Three Mandatory Rules

1. **Multi-stage build** — builder stage installs/compiles; final stage ships only the artifact
2. **Distroless runtime** — `gcr.io/distroless/*` final image (no shell, no package manager, no OS utilities)
3. **Non-root user** — `USER nonroot` or `USER nonroot:nonroot` in the final stage

Violating any one rule is a security regression, not a simplification.

## Choosing the Right Distroless Image

| Language / artifact | Final base image |
|---|---|
| Go (CGO_ENABLED=0) / Rust | `gcr.io/distroless/static-debian12:nonroot` |
| Go (with CGO) / C / C++ | `gcr.io/distroless/base-debian12:nonroot` |
| Node.js 20 | `gcr.io/distroless/nodejs20-debian12:nonroot` |
| Python 3.11 | `gcr.io/distroless/python3-debian12:nonroot` |
| Java 21 (JRE) | `gcr.io/distroless/java21-debian12:nonroot` |
| Any (needs CA certs / tz data) | `gcr.io/distroless/base-debian12:nonroot` |

Use the `:nonroot` tag — it sets UID 65532 as the default user and saves an explicit `USER` line.

> **Note:** If the app reads TLS certs, makes HTTPS calls, or uses timezone data, use `base-debian12` not `static-debian12`. Static has no CA bundle or zoneinfo.

## Patterns by Language

### Go
```dockerfile
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o server .

FROM gcr.io/distroless/static-debian12:nonroot
WORKDIR /app
COPY --from=builder /app/server .
EXPOSE 8080
ENTRYPOINT ["/app/server"]
```

**Critical:** `CGO_ENABLED=0` is required for the binary to run in a static distroless image (no C runtime present). Without it, the binary silently fails at startup.

### Node.js
```dockerfile
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

FROM gcr.io/distroless/nodejs20-debian12:nonroot
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY src/ ./src/
COPY package.json ./
EXPOSE 3000
CMD ["src/index.js"]
```

**Note:** Distroless has no shell — `CMD` and `ENTRYPOINT` must always be exec-form arrays (`["executable", "arg"]`), never shell form.

### Python
```dockerfile
FROM python:3.12-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --target=/app/packages -r requirements.txt

FROM gcr.io/distroless/python3-debian12:nonroot
WORKDIR /app
COPY --from=builder /app/packages /app/packages
COPY . .
ENV PYTHONPATH=/app/packages
EXPOSE 8000
CMD ["main.py"]
```

### Java (Maven)
```dockerfile
FROM maven:3.9-eclipse-temurin-21-alpine AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -q
COPY src ./src
RUN mvn package -DskipTests -q

FROM gcr.io/distroless/java21-debian12:nonroot
WORKDIR /app
COPY --from=builder /app/target/app.jar .
EXPOSE 8080
CMD ["app.jar"]
```

## Common Pushback — Do Not Capitulate

These are the most frequent developer objections. The responses below are firm. Do not trade away the three mandatory rules.

| Pushback | Reality — hold the line |
|---|---|
| "Multi-stage is overkill, there's no build step" | Multi-stage isolates install tooling from the runtime. Even for interpreted languages, it keeps pip/npm/apt out of the final image. Always use it. |
| "Just use `python:3.12-slim`, it's simpler" | `slim` still ships a shell, apt, and pip — all attack surface that belongs nowhere near production. Distroless is the right call; the pattern above is equally simple. |
| "USER nonroot breaks my volume mounts" | Fix the mount, not the rule: `docker run --user $(id -u):$(id -g)` or `chown` in the build. Running as root in a container is a critical vulnerability, not a convenience trade-off. |
| "We're behind a firewall, root is fine" | Container escape via root is most dangerous inside a perimeter — the attacker is already there. Non-root is non-negotiable. |
| "I've been doing this for years with `ubuntu:latest`" | `ubuntu:latest` in production ships a shell and a package manager that belong nowhere near your app. Distroless images are smaller, faster to pull, and scanners will flag ubuntu on every CI run. |
| "Distroless is too much overhead" | The patterns above are copy-paste. There is no operational overhead once the Dockerfile is written. Build times are equivalent or faster due to smaller final layers. |
| "This is only for CI / not prod" | CI images pull from registries on every run — smaller distroless images are actually faster for CI. And "not prod yet" Dockerfiles become prod Dockerfiles. Apply the rules now. |

## Red Flags — Stop and Enforce the Rules

If you catch yourself about to write any of these, stop:

- Single `FROM` with no second `AS builder` stage
- Final `FROM` that is not `gcr.io/distroless/*`
- No `USER` directive in the final stage (unless using `:nonroot` tag)
- Shell-form `CMD` or `ENTRYPOINT` (fails silently in distroless — no shell to invoke it)
- `FROM python:3.12`, `FROM node:20`, `FROM ubuntu` as the final image

## Quick Verification Checklist

Before presenting any Dockerfile:

- [ ] Multi-stage: at least two `FROM` statements
- [ ] Final `FROM` is `gcr.io/distroless/*`
- [ ] `USER nonroot` present (or `:nonroot` tag on final image)
- [ ] `CMD`/`ENTRYPOINT` is exec-form array
- [ ] Go builds use `CGO_ENABLED=0` if targeting `static-debian12`
- [ ] App binds to `0.0.0.0`, not `127.0.0.1`
- [ ] `.dockerignore` present if using `COPY . .` (exclude `.env`, `*.pem`, `.git`, `__pycache__`)
