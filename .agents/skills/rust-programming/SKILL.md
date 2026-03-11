name: rust-programming
description: >
  Rust programming language — ownership, error handling, traits, async, and systems programming.
  Use this skill whenever the user writes Rust code, needs help with the borrow checker, lifetime
  annotations, error handling with Result/Option, pattern matching, trait implementations, async/await,
  cargo commands, or any systems-level programming in Rust. Also use when the user mentions memory
  safety, zero-cost abstractions, fearless concurrency, or is building CLI tools, web servers, WASM
  modules, or embedded systems in Rust — even if they just say "my code won't compile" and the
  context is a .rs file.

## When to use
- User writes or debugs Rust code (.rs files, Cargo.toml)
- Borrow checker errors, lifetime annotations, ownership questions
- Error handling with Result, Option, ? operator, thiserror, anyhow
- Implementing traits, generics, or deriving macros
- Async Rust (tokio, async-std, futures)
- Cargo operations (build, test, bench, publish, workspace setup)
- Systems programming: FFI, unsafe blocks, memory layout
- Web development (Actix, Axum, Rocket)
- CLI tools (clap, structopt)
- WASM or embedded targets

## Core Concepts

### Ownership and Borrowing
Rust's ownership system is the foundation of its memory safety guarantees. Every value has exactly one owner, and when the owner goes out of scope, the value is dropped.

**Three rules:**
1. Each value has exactly one owner
2. When the owner goes out of scope, the value is dropped
3. You can have either ONE mutable reference OR any number of immutable references (never both)

The reason this matters: these rules eliminate data races at compile time and prevent use-after-free, double-free, and dangling pointer bugs without needing a garbage collector.

✅ Correct borrowing:
```rust
fn process(data: &[u8]) -> usize {  // Borrow immutably
    data.len()
}

fn modify(data: &mut Vec<u8>) {     // Borrow mutably
    data.push(42);
}

let mut buffer = vec![1, 2, 3];
let len = process(&buffer);          // Immutable borrow OK
modify(&mut buffer);                 // Mutable borrow OK (no other borrows active)
```

❌ Borrow checker violation:
```rust
let mut data = vec![1, 2, 3];
let first = &data[0];     // Immutable borrow
data.push(4);             // ERROR: can't mutate while immutable borrow exists
println!("{}", first);    // first is still in scope
```

### Lifetimes
Lifetimes tell the compiler how long references are valid. Most of the time, the compiler infers them (lifetime elision). You only annotate when the compiler needs help.

```rust
// Compiler can't tell which input the output borrows from
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}

// Struct holding a reference needs a lifetime
struct Config<'a> {\n    name: &'a str,
}
```

**When to add lifetimes:**
- Function returns a reference and has multiple reference parameters
- Struct holds a reference
- Impl block for a struct with lifetimes

**When NOT to add lifetimes:**
- Return owned types (String, Vec) instead of references when possible
- Use `'static` for string literals and globally available data
- Single reference parameter → compiler infers automatically

### Error Handling
Rust has no exceptions. Errors are values, encoded as `Result<T, E>` (recoverable) or `panic!` (unrecoverable).

**The ? operator** propagates errors up the call stack:
```rust
use std::fs;
use std::io;

fn read_config() -> Result<String, io::Error> {
    let content = fs::read_to_string("config.toml")?;  // Returns Err early if fails
    Ok(content)
}
```

**Custom errors with `thiserror`** (library code):
```rust
use thiserror::Error;

#[derive(Error, Debug)]
enum AppError {
    #[error("Database connection failed: {0}")]
    Database(#[from] sqlx::Error),
    #[error("Config file not found: {path}")]
    ConfigNotFound { path: String },
    #[error("Invalid input: {0}")]
    Validation(String),
}
```

**Quick errors with `anyhow`** (application code):
```rust
use anyhow::{Context, Result};

fn setup() -> Result<()> {\n    let config = fs::read_to_string("config.toml")
        .context("Failed to read config file")?;
    Ok(())
}
```

**Decision tree:**
```javascript
Are you writing a library?
├─ YES → Use thiserror for typed errors
└─ NO  → Is this a prototype/script?
         ├─ YES → Use anyhow for quick development
         └─ NO  → Application code?
                  ├─ YES → anyhow at boundaries, thiserror for internal modules
                  └─ NO  → Custom enum errors
```

### Pattern Matching
Pattern matching is exhaustive in Rust — the compiler ensures you handle every case.

```rust
enum Command {
    Start { name: String },
    Stop,
    Status(u32),
}

fn handle(cmd: Command) {
    match cmd {
        Command::Start { name } => println!("Starting {name}"),
        Command::Stop => println!("Stopping"),
        Command::Status(code) if code > 0 => println!("Error: {code}"),
        Command::Status(_) => println!("OK"),
    }
}

// if-let for single-variant matching
if let Some(value) = optional_value {
    println!("Got: {value}");
}

// let-else for early returns (Rust 1.65+)
let Some(config) = load_config() else {
    eprintln!("No config found");
    return;
};
```

### Traits and Generics
Traits define shared behavior. Generics with trait bounds enable polymorphism without runtime overhead.

```rust
trait Summarize {
    fn summary(&self) -> String;
    fn preview(&self) -> String {  // Default implementation
        format!("{}...", &self.summary()[..50])
    }
}

// Generic function with trait bound
fn print_summary<T: Summarize>(item: &T) {
    println!("{}", item.summary());
}

// impl Trait syntax (syntactic sugar)
fn print_summary_alt(item: &impl Summarize) {
    println!("{}", item.summary());
}

// Returning impl Trait
fn create_summarizer() -> impl Summarize {
    Article { title: "Hello".into(), body: "World".into() }
}
```

## Instructions

### Cargo Essentials
Cargo is Rust's build system and package manager. Every Rust project uses it.

```bash
cargo new my-project          # Create new binary project
cargo new my-lib --lib         # Create new library project
cargo build                    # Build in debug mode
cargo build --release          # Build optimized release
cargo run                      # Build and run
cargo test                     # Run all tests
cargo test -- --nocapture      # Run tests with stdout visible
cargo bench                    # Run benchmarks
cargo clippy                   # Lint (catches common mistakes)
cargo fmt                      # Format code
cargo doc --open               # Generate and open docs
cargo add serde tokio clap     # Add dependencies
cargo update                   # Update deps within semver ranges
```

### Cargo.toml Best Practices
```toml
[package]
name = "my-app"
version = "0.1.0"
edition = "2021"               # Always use latest edition
rust-version = "1.75"          # Set MSRV

[dependencies]
serde = { version = "1", features = ["derive"] }
tokio = { version = "1", features = ["full"] }
anyhow = "1"
tracing = "0.1"

[dev-dependencies]
criterion = { version = "0.5", features = ["html_reports"] }

[profile.release]
lto = true                     # Link-time optimization
codegen-units = 1              # Better optimization, slower compile
strip = true                   # Strip debug symbols
```

### Async Rust with Tokio
Async is essential for I/O-bound workloads (web servers, network clients, file I/O).

```rust
use tokio;

#[tokio::main]
async fn main() -> anyhow::Result<()> {\n    let response = reqwest::get("https://api.example.com/data")
        .await?
        .json::<serde_json::Value>()
        .await?;
    println!("{response:#?}");
    Ok(())
}

// Concurrent tasks
let (result_a, result_b) = tokio::join!(
    fetch_from_api("endpoint_a"),
    fetch_from_api("endpoint_b"),
);

// Spawning background tasks
tokio::spawn(async move {
    process_in_background(data).await;
});
```

### Common Patterns
**Builder pattern:**
```rust
struct ServerBuilder {
    host: String,
    port: u16,
    workers: usize,
}

impl ServerBuilder {\n    fn new() -> Self {
        Self { host: "127.0.0.1".into(), port: 8080, workers: 4 }
    }
    fn host(mut self, host: &str) -> Self { self.host = host.into(); self }
    fn port(mut self, port: u16) -> Self { self.port = port; self }
    fn build(self) -> Server { Server { /* ... */ } }
}

let server = ServerBuilder::new().host("0.0.0.0").port(3000).build();
```

**Newtype pattern (type safety):**
```rust
struct UserId(u64);
struct OrderId(u64);
// Now compiler prevents mixing UserId and OrderId
```

**From/Into for conversions:**
```rust
impl From<AppError> for HttpResponse {
    fn from(err: AppError) -> Self {
        match err {
            AppError::NotFound => HttpResponse::NotFound().finish(),
            AppError::Internal(msg) => HttpResponse::InternalServerError().body(msg),
        }
    }
}
```

### Testing
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_addition() {
        assert_eq!(add(2, 3), 5);
    }

    #[test]
    #[should_panic(expected = "division by zero")]
    fn test_panic() {
        divide(1, 0);
    }

    #[test]
    fn test_result() -> Result<(), Box<dyn std::error::Error>> {
        let result = parse_config("valid.toml")?;
        assert!(result.port > 0);
        Ok(())
    }
}

// Integration tests go in tests/ directory
// tests/integration_test.rs
use my_crate::public_api;

#[test]
fn test_full_workflow() {
    // Tests only public API
}
```

## Constraints
- **NEVER** use `unwrap()` or `expect()` in production code paths — use proper error handling with `?` or `match`
- **NEVER** use `unsafe` without documenting the safety invariants in a `// SAFETY:` comment
- **NEVER** ignore compiler warnings — treat them as errors with `#![deny(warnings)]` in production
- **NEVER** use `clone()` as a first resort to fix borrow checker errors — restructure ownership first
- **ALWAYS** run `cargo clippy` before committing — it catches hundreds of common mistakes
- **ALWAYS** use `cargo fmt` for consistent formatting across the team
- **ALWAYS** prefer `&str` over `String` in function parameters (accept borrows, return owned)
- **ALWAYS** use the type system to make invalid states unrepresentable (enums over booleans, newtypes over primitives)

## References
- [The Rust Book](https://doc.rust-lang.org/book/)
- [Rust by Example](https://doc.rust-lang.org/rust-by-example/)
- [Rust Standard Library](https://doc.rust-lang.org/std/)
- [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/)
- [The Cargo Book](https://doc.rust-lang.org/cargo/)
- [Tokio Tutorial](https://tokio.rs/tokio/tutorial)
- [Awesome Rust](https://github.com/rust-unofficial/awesome-rust)
