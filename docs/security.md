# SETU-ROUTE Security Architecture & Vulnerability Review

Security and cryptographic safeguards implemented across SETU-ROUTE to meet government compliance standards for critical logistics infrastructure.

---

## 1. Authentication & Role-Based Access Control (RBAC)

- **JWT Tokens:** Signed using HMAC-SHA256 with strong secrets (`SECRET_KEY`) and strict 8-hour token expiration.
- **Password Hashing:** Passwords hashed with BCrypt/Argon2 with high-iteration salt rounds.
- **Role Permissions:**
  - `SUPER_ADMIN`: System configuration, audit trail access, user provisioning.
  - `COMMAND_DISPATCHER`: Live reroute confirmation, incident management, vehicle tasking.
  - `FIELD_OFFICER`: Incident reporting, offline outbox synchronization, GPS verification.
  - `LOGISTICS_VIEWER`: Read-only telemetry, corridor status viewing.

---

## 2. Secure Image Upload Architecture (`src/routers/incidents.py`)

Incident photographs from on-ground officers undergo strict multi-stage validation:
1. **File Size Enforcement:** Hard maximum limit of 5.0 MB per upload.
2. **MIME Type Whitelist:** Restricted strictly to `image/jpeg`, `image/png`, `image/webp`. Executables and SVG vectors are rejected.
3. **UUID Filename Sanitization:** Original client filenames are stripped to prevent path traversal attacks (`../../evil.sh`); replaced with random UUIDs (`inc_photo_3a7b9c.jpg`).
4. **Isolated Storage:** Uploaded binaries are written to a dedicated file volume (`uploads/`) with no executable permissions.

---

## 3. Threat Mitigation Matrix

| Threat Category | Risk | Mitigation Implemented |
|---|---|---|
| **SQL Injection** | Critical | 100% Parameterized queries via SQLAlchemy Async ORM. No raw string concatenation. |
| **Cross-Site Scripting (XSS)** | High | React/Next.js automatic HTML escaping; sanitized Markdown rendering. |
| **Path Traversal** | High | Whitelisted and UUID-generated storage filenames; secure `os.path.join`. |
| **Information Leakage** | Medium | Internal database error traces and Python stack traces sanitized to friendly error strings. |
| **Replay & Duplicate Sync** | Medium | Cryptographic `idempotency_key` deduplication in `SyncQueue`. |
| **CORS & CSRF** | Medium | Strict HTTP headers and configurable CORS origins. |
| **Credential Exposure** | High | `.env` separation; no private keys or secrets committed to repository. |
