# =============================================================================
# Stage 1 — Builder
# Compile the Rust binary in the full toolchain image.
# Nothing from this stage ships to the final image.
# =============================================================================
FROM rust:1.78-slim AS builder

WORKDIR /app

# Cache dependency compilation separately from application code.
# Copy manifests first so Docker can reuse this layer on source-only changes.
COPY Cargo.toml Cargo.lock ./

# Build a stub main so Cargo can compile and cache all dependencies up-front.
RUN mkdir src && echo 'fn main() {}' > src/main.rs && \
    cargo build --release && \
    rm -rf src

# Now copy the real source and build the actual binary.
# touch forces Cargo to recompile even though Cargo.toml hasn't changed.
COPY src ./src
RUN touch src/main.rs && cargo build --release

# =============================================================================
# Stage 2 — Runtime
# Distroless contains only the minimal glibc runtime and ca-certificates.
# No shell, no package manager, no compiler — drastically smaller attack surface.
# =============================================================================
FROM gcr.io/distroless/cc-debian12:nonroot

# nonroot tag sets USER 65532 (nonroot) automatically — no extra USER directive needed.
# If you need to be explicit for documentation or policy reasons, uncomment:
# USER 65532:65532

WORKDIR /app

# Copy only the compiled binary from the builder stage.
COPY --from=builder /app/target/release/my_service .

EXPOSE 8080

ENTRYPOINT ["./my_service"]
