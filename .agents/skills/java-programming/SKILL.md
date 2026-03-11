---
name: java-programming
description: Java programming language — modern Java 17-21+, OOP, Spring Boot, concurrency, and enterprise patterns. Use this skill whenever the user writes Java code, works with Spring Boot, configures Maven/Gradle builds, handles JVM tuning, designs REST APIs, implements design patterns, uses streams and lambdas, writes JUnit tests, or builds any JVM-based application. Also use when the user mentions servlets, JDBC, Hibernate, Kafka producers/consumers, microservices in Java, virtual threads, or needs help with compilation errors in .java files — even if they just say "my app won't start" and the stack trace is Java.
---

# Java Programming Guide

This skill provides comprehensive guidance on modern Java development, focusing on Java 17-21+, Spring Boot, and enterprise best practices.

## When to Use
- User writes or debugs Java code (`.java`, `pom.xml`, `build.gradle`).
- Spring Boot configuration, dependency injection, and REST controllers.
- Concurrency: threads, `ExecutorService`, `CompletableFuture`, virtual threads.
- Streams API, lambdas, and functional interfaces.
- Design patterns (Builder, Factory, Strategy, Observer, etc.).
- Maven/Gradle build configuration and dependency management.
- JVM tuning, GC selection, and memory analysis.
- Testing with JUnit 5, Mockito, and Testcontainers.
- Database access: JPA/Hibernate, JDBC, and connection pools.
- Messaging: Kafka, RabbitMQ, and SQS.
- Microservices architecture and API design.

## Core Concepts

### Modern Java Features (17-21+)
Java has evolved significantly. Modern Java is concise and expressive—use the latest features.

#### Records (Java 16+)
Immutable data carriers that replace boilerplate POJOs.
```java
public record User(String name, String email, int age) {
    public User {
        if (age < 0) throw new IllegalArgumentException("Age cannot be negative");
    }
}
```

#### Sealed Classes (Java 17+)
Restrict class hierarchies.
```java
public sealed interface Shape permits Circle, Rectangle, Triangle {
    double area();
}
```

#### Pattern Matching (Java 21+)
Switch expressions with pattern matching.
```java
String describe(Shape shape) {
    return switch (shape) {
        case Circle c when c.radius() > 10 -> "Large circle";
        case Circle c    -> "Circle with radius " + c.radius();
        case Rectangle r -> "Rectangle %sx%s".formatted(r.w(), r.h());
        case Triangle t  -> "Triangle";
    };
}
```

### Virtual Threads (Java 21+)
Project Loom makes blocking I/O cheap. One million concurrent tasks without thread pool tuning.
```java
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    IntStream.range(0, 10_000).forEach(i ->
        executor.submit(() -> {
            var response = httpClient.send(request, BodyHandlers.ofString());
            process(response);
        })
    );
}
```

### Streams and Functional Patterns
```java
var topSpenders = orders.stream()
    .filter(o -> o.status() == Status.COMPLETED)
    .collect(Collectors.groupingBy(
        Order::customerId,
        Collectors.summingDouble(Order::total)
    ))
    .entrySet().stream()
    .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
    .limit(10)
    .toList();
```

## Instructions

### Spring Boot Essentials
Standard project structure:
```
src/main/java/com/example/app/
├── config/          # Configuration classes
├── controller/      # REST controllers
├── service/         # Business logic
├── repository/      # Data access
├── model/           # Domain entities
├── dto/             # Data transfer objects
└── exception/       # Custom exceptions
```

#### REST Controller Example
```java
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.findById(id));
    }
}
```

### Build Configuration
#### Maven (pom.xml)
Ensure you use the correct parent and Java version.
```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.2.0</version>
</parent>
<properties>
    <java.version>21</java.version>
</properties>
```

## Constraints
- **NEVER** use raw types (`List` instead of `List<String>`)—always specify generics.
- **NEVER** catch `Exception` or `Throwable` broadly—catch specific exceptions.
- **NEVER** return `null` from collections—return empty collections (`List.of()`).
- **NEVER** use `synchronized` as a first resort—prefer `java.util.concurrent` utilities.
- **ALWAYS** use records for immutable data carriers.
- **ALWAYS** prefer `Optional` over `null` returns for methods that may not find a result.
- **ALWAYS** use try-with-resources for `AutoCloseable` objects.

## References
- Java Documentation: [https://docs.oracle.com/en/java/javase/21/](https://docs.oracle.com/en/java/javase/21/)
- Spring Boot Reference: [https://docs.spring.io/spring-boot/docs/current/reference/html/](https://docs.spring.io/spring-boot/docs/current/reference/html/)
- Baeldung: [https://www.baeldung.com/](https://www.baeldung.com/)
