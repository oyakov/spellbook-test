---
name: javascript-programming
description: >
  JavaScript and TypeScript — modern ES2024+, Node.js, browser APIs, async patterns, and full-stack development.
  Use this skill whenever the user writes JavaScript or TypeScript, works with Node.js, builds React/Vue/Svelte
  components, configures bundlers (Vite, webpack, esbuild), handles async/await and Promises, manipulates the DOM,
  writes Express/Fastify/Hono APIs, uses npm/pnpm/yarn, or debugs any .js/.ts/.jsx/.tsx file. Also use when the
  user mentions closures, event loop, prototypes, hoisting, modules (ESM/CJS), or has a frontend/backend JS
  question — even if they just paste code with curly braces and arrow functions.
---

# JavaScript Programming Skill

JavaScript and TypeScript skill covering modern ES2024+, async/await, closures, prototypes, Node.js runtime, DOM manipulation, React patterns, bundlers (Vite/esbuild), testing (Vitest/Jest), and full-stack patterns for building performant web applications and APIs.

## When to use

- User writes or debugs JavaScript/TypeScript (.js, .ts, .jsx, .tsx)
- Async programming: Promises, async/await, event loop, streams
- Node.js APIs, Express/Fastify/Hono server development
- Frontend: React, Vue, Svelte, DOM manipulation, browser APIs
- Build tools: Vite, esbuild, webpack, Rollup, tsconfig
- Package management: npm, pnpm, yarn, package.json
- Testing: Vitest, Jest, Playwright, Testing Library
- TypeScript: types, interfaces, generics, utility types, strict mode
- Full-stack: Next.js, Nuxt, SvelteKit, Astro, Remix

## Core Concepts

### The Event Loop

JavaScript is single-threaded with an event loop. Understanding this is essential for writing correct async code.

**Execution order:**
1. Synchronous code (call stack)
2. Microtasks (Promise callbacks, queueMicrotask)
3. Macrotasks (setTimeout, setInterval, I/O callbacks)

```javascript
console.log('1 - sync');
setTimeout(() => console.log('2 - macro'), 0);
Promise.resolve().then(() => console.log('3 - micro'));
console.log('4 - sync');
// Output: 1, 4, 3, 2
```

> [!NOTE]
> The reason this matters for agents: when you generate JS code, incorrect ordering of async operations is the #1 source of subtle bugs. Always reason about the event loop.

### Closures and Scope

A closure captures variables from its enclosing scope. This is how JavaScript implements data privacy and stateful functions.

```javascript
// Closure for encapsulation
function createCounter(initial = 0) {
  let count = initial;
  return {
    increment: () => ++count,
    decrement: () => --count,
    getCount: () => count,
  };
}

const counter = createCounter(10);
counter.increment(); // 11
counter.getCount();  // 11
// count is inaccessible directly
```

❌ Classic closure bug:
```javascript
// All callbacks share the same `i`
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100); // 3, 3, 3
}

// Fix: use let (block-scoped)
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100); // 0, 1, 2
}
```

### Async/Await and Promises

```javascript
// Async function
async function fetchUserData(userId) {
  const response = await fetch(`/api/users/${userId}`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

// Parallel execution
const [user, orders] = await Promise.all([
  fetchUser(id),
  fetchOrders(id),
]);

// Error handling
try {
  const data = await fetchUserData(123);
} catch (err) {
  if (err instanceof TypeError) {
    console.error('Network error:', err.message);
  } else {
    throw err; // Re-throw unexpected errors
  }
}

// Promise.allSettled — when you need all results regardless of failures
const results = await Promise.allSettled([
  fetchFromAPI('service-a'),
  fetchFromAPI('service-b'),
  fetchFromAPI('service-c'),
]);
const successes = results.filter(r => r.status === 'fulfilled').map(r => r.value);
```

### Prototypes and Classes

```javascript
// Modern class syntax (syntactic sugar over prototypes)
class EventEmitter {
  #listeners = new Map();  // Private field

  on(event, callback) {
    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, []);
    }
    this.#listeners.get(event).push(callback);
    return this;
  }

  emit(event, ...args) {
    const callbacks = this.#listeners.get(event) ?? [];
    callbacks.forEach(cb => cb(...args));
  }
}
```

## Instructions

### TypeScript Essentials

```typescript
// Interfaces for object shapes
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';  // Union type
  createdAt: Date;
}

// Generics
interface ApiResponse<T> {
  data: T;
  meta: { total: number; page: number };
}

async function fetchApi<T>(url: string): Promise<ApiResponse<T>> {
  const res = await fetch(url);
  return res.json();
}

// Utility types
type CreateUserInput = Omit<User, 'id' | 'createdAt'>;
type UserUpdate = Partial<Pick<User, 'name' | 'email'>>;
type ReadonlyUser = Readonly<User>;

// Type guards
function isUser(value: unknown): value is User {
  return typeof value === 'object' && value !== null && 'id' in value && 'email' in value;
}

// Discriminated unions
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function handleResult(result: Result<User>) {
  if (result.success) {
    console.log(result.data.name);  // TypeScript knows data exists
  } else {
    console.error(result.error);    // TypeScript knows error exists
  }
}
```

### Node.js Patterns

**Express/Fastify API:**
```typescript
import Fastify from 'fastify';

const app = Fastify({ logger: true });

app.get('/users/:id', async (request, reply) => {
  const { id } = request.params as { id: string };
  const user = await userService.findById(id);
  if (!user) return reply.status(404).send({ error: 'Not found' });
  return user;
});

app.listen({ port: 3000, host: '0.0.0.0' });
```

**Streams for large data:**
```javascript
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Transform } from 'stream';

const uppercase = new Transform({
  transform(chunk, encoding, callback) {
    callback(null, chunk.toString().toUpperCase());
  }
});

await pipeline(
  createReadStream('input.txt'),
  uppercase,
  createWriteStream('output.txt')
);
```

### Modern ES2024+ Features

```javascript
// Structured clone (deep copy)
const clone = structuredClone(complexObject);

// Array.groupBy
const grouped = Object.groupBy(users, user => user.role);
// { admin: [...], user: [...] }

// Temporal API (replacing Date)
const now = Temporal.Now.zonedDateTimeISO();
const meeting = Temporal.ZonedDateTime.from('2026-03-08T10:00[Europe/Belgrade]');
const duration = now.until(meeting);

// Iterator helpers
const firstFive = Iterator.from(hugeIterable).take(5).toArray();

// using keyword (disposable resources)
async function processFile() {
  using file = await openFile('data.csv');
  // file is automatically closed when scope exits
}
```

### Package.json and Config

```json
{
  "name": "my-app",
  "type": "module",
  "engines": { "node": ">=20" },
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest",
    "lint": "eslint . --fix"
  }
}
```

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "outDir": "dist"
  }
}
```

### Testing

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('UserService', () => {
  it('should create user and emit event', async () => {
    const mockRepo = { save: vi.fn().mockResolvedValue({ id: '1', name: 'Oleg' }) };
    const service = new UserService(mockRepo);

    const result = await service.create({ name: 'Oleg', email: 'oleg@test.com' });

    expect(result.name).toBe('Oleg');
    expect(mockRepo.save).toHaveBeenCalledOnce();
  });

  it('should throw on duplicate email', async () => {
    const mockRepo = { save: vi.fn().mockRejectedValue(new DuplicateError()) };
    const service = new UserService(mockRepo);

    await expect(service.create({ name: 'Test', email: 'dup@test.com' }))
      .rejects.toThrow(DuplicateError);
  });
});
```

## Constraints

- **NEVER** use `var` — always `const` by default, `let` only when reassignment is needed
- **NEVER** use `==` for comparison — always `===` (strict equality)
- **NEVER** leave Promises unhandled — always `await` or attach `.catch()`
- **NEVER** mutate function arguments — create new objects/arrays instead
- **NEVER** use `any` in TypeScript — use `unknown` and narrow with type guards
- **ALWAYS** use `const` assertions and strict TypeScript options for type safety
- **ALWAYS** handle errors in async code — unhandled rejections crash Node.js
- **ALWAYS** use ESM (`import/export`) over CommonJS (`require`) in new projects
- **ALWAYS** validate external input (API requests, env vars) at boundaries with Zod or similar

## References

- [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [Node.js Documentation](https://nodejs.org/docs/latest/api/)
- [JavaScript Info](https://javascript.info/)
- [TC39 Proposals](https://github.com/tc39/proposals)
- [Vitest Documentation](https://vitest.dev/)
- [You Don't Know JS](https://github.com/getify/You-Dont-Know-JS)
