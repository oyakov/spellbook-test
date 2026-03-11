name: security-policy-enforcer
description: >
  Security policy enforcer and secure coding reference. Use this skill whenever writing
  code that handles authentication, user input, API endpoints, secrets, database queries,
  file uploads, or dependencies — and also when reviewing any code for security
  vulnerabilities, even if the user doesn't explicitly ask for a security review.
  Apply proactively as a guardrail on all code changes.

## When to use
- Any code that handles user input, authentication, or authorization
- Code that interacts with databases (SQL injection prevention)
- API endpoint implementation or configuration
- File upload or download handling
- Secret, credential, or API key management
- Dependency installation or updates
- Docker/container configuration
- CI/CD pipeline configuration
- Code review for security vulnerabilities
- Infrastructure or cloud configuration

## Security Policies

### 1. Secret Management
**CRITICAL: Never hardcode secrets in source code.**

| Strategy | Pattern |
| :--- | :--- |
| Environment Variables | Read from `process.env` or similar. |
| .gitignore | Always exclude `.env`, `*.pem`, `*.key`, `.auth/`. |
| Secret Managers | Use Vault, AWS Secrets Manager, or Google Secret Manager. |

**Correct Pattern:**
```typescript
// ✅ CORRECT: Read from environment
const apiKey = process.env.API_KEY;
if (!apiKey) throw new Error('API_KEY environment variable is required');

// ❌ WRONG: Hardcoded secret
const apiKey = 'sk-1234567890abcdef';
```

### 2. Input Validation & Sanitization
**Never trust user input. Validate and sanitize everything.**
- Validate on the **server side** (client validation is for UX only).
- Use allowlists over denylists.
- Limit string lengths, number ranges, and array sizes.
- Sanitize HTML output to prevent XSS (use `DOMPurify` or auto-escaping engines).

**Example (Zod):**
```typescript
import { z } from 'zod';

const UserInput = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(100).trim(),
  age: z.number().int().min(0).max(150),
});

function handleRequest(rawInput: unknown) {
  const validated = UserInput.parse(rawInput);
  // ... use validated data
}
```

### 3. SQL Injection Prevention
- Use parameterized queries for SQL (never string concatenation).
- Use ORMs with built-in protection.

**Correct Pattern:**
```typescript
// ✅ CORRECT: Parameterized query
const result = await db.query(
  'SELECT * FROM users WHERE email = $1 AND status = $2',
  [email, 'active']
);
```

### 4. Authentication & Authorization
- Use established libraries (Passport.js, NextAuth, Auth.js).
- Hash passwords with `bcrypt` or `argon2` (rounds ≥ 12).
- Implement rate limiting on login endpoints.
- Check permissions on every protected endpoint (RBAC/ABAC).

### 5. API Security
- **Always use HTTPS** in production.
- **Rate limit** all public endpoints.
- **Set security headers** (use `Helmet.js` for Express).
- **CORS** — configure explicitly, never use `*` in production.

### 6. Dependency Security
- Audit dependencies regularly (`npm audit`, `snyk test`).
- Pin dependency versions in production (`package-lock.json`).
- Review new dependencies before adding (maintainers, update frequency).

### 7. Docker & Container Security
- **Never run containers as root.**
- Use multi-stage builds and minimal images (`alpine`, `distroless`).
- Scan images with `trivy` or `grype`.

### 8. Logging & Error Handling
- Never expose stack traces or internal paths to clients.
- Log security events (failed logins, permission denials).
- Do not log secrets or PII in plain text.

## Decision Tree
- Writing code that accepts user input? → Validate with Zod/Joi, sanitize output.
- Writing a database query? → Use parameterized queries or ORM.
- Handling passwords? → bcrypt/argon2 with salt rounds ≥ 12.
- Adding an API endpoint? → Add auth middleware + rate limiting + input validation.
- Need to store a secret? → Environment variable or secret manager.
- Adding a dependency? → Check npm audit, review package, pin version.
- Writing a Dockerfile? → Non-root user, alpine base, multi-stage build.

## OWASP Top 10 Quick Reference

| # | Vulnerability | Prevention |
| :--- | :--- | :--- |
| A01 | Broken Access Control | Check permissions on every request. |
| A02 | Cryptographic Failures | Use strong algorithms, manage keys. |
| A03 | Injection | Parameterized queries, input validation. |
| A05 | Security Misconfiguration | Minimal permissions, automate config. |
| A06 | Vulnerable Components | Audit dependencies, auto-update. |
| A07 | Auth Failures | MFA, strong passwords, rate limiting. |
| A10 | SSRF | Validate URLs, allowlist destinations. |

## Constraints
- **NEVER** commit secrets to version control.
- **NEVER** use `eval()` or dynamic execution with user input.
- **NEVER** disable SSL/TLS verification in production.
- **NEVER** use MD5 or SHA1 for password hashing.
- **NEVER** trust client-side validation alone.
- **NEVER** use wildcard CORS with credentials in production.

## References
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Snyk Vulnerability Database](https://security.snyk.io/)
