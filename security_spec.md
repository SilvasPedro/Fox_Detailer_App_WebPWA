# Security Specification - Fox Detailer

## 1. Data Invariants
- Each document in `appointments`, `financial_transactions`, and `clients` must belong strictly to the authenticated user (`userId == request.auth.uid`).
- A user can only read, create, update, or delete their own documents.
- ID path variables must be valid alphanumeric strings (≤ 128 chars).
- Required fields must always be present with proper types and length bounds.
- Status values must strictly belong to their enumerated allowlists.
- No cross-tenant data leaks: list queries must check `resource.data.userId == request.auth.uid`.

## 2. The Dirty Dozen Payloads
1. **Payload 1 (Identity Spoofing - Appointment)**:
   - `{ userId: "attacker_id", clientName: "John", vehicleModel: "Civic", serviceType: "Polimento", price: 300, scheduledDate: "2026-09-30", status: "pending" }`
   - *Expected*: PERMISSION_DENIED (userId doesn't match `request.auth.uid`).
2. **Payload 2 (Ghost Field Attack - Shadow Update)**:
   - `{ userId: "auth_uid", clientName: "John", vehicleModel: "Civic", serviceType: "Polimento", price: 300, scheduledDate: "2026-09-30", status: "pending", isAdminBypass: true }`
   - *Expected*: PERMISSION_DENIED (unknown property).
3. **Payload 3 (Denial of Wallet - Oversized Client Name)**:
   - `{ userId: "auth_uid", clientName: "A".repeat(5000), ... }`
   - *Expected*: PERMISSION_DENIED (exceeds maxLength 100).
4. **Payload 4 (Invalid Status Injection)**:
   - `{ userId: "auth_uid", status: "admin_override", ... }`
   - *Expected*: PERMISSION_DENIED (not in enum).
5. **Payload 5 (Negative Price Injection)**:
   - `{ userId: "auth_uid", price: -500, ... }`
   - *Expected*: PERMISSION_DENIED (price must be >= 0).
6. **Payload 6 (Unauthenticated Write)**:
   - `request.auth == null`
   - *Expected*: PERMISSION_DENIED.
7. **Payload 7 (Unauthenticated Read)**:
   - Read request without auth token.
   - *Expected*: PERMISSION_DENIED.
8. **Payload 8 (Cross-Tenant Read Attempt)**:
   - User B attempting to read User A's document.
   - *Expected*: PERMISSION_DENIED.
9. **Payload 9 (Cross-Tenant Delete Attempt)**:
   - User B attempting to delete User A's transaction.
   - *Expected*: PERMISSION_DENIED.
10. **Payload 10 (Invalid Financial Transaction Type)**:
    - `{ userId: "auth_uid", type: "bitcoin_drain", amount: 100, ... }`
    - *Expected*: PERMISSION_DENIED.
11. **Payload 11 (Path Variable Poisoning)**:
    - Attempting to target document with `../../admin/token` or non-regex id.
    - *Expected*: PERMISSION_DENIED (fails `isValidId`).
12. **Payload 12 (Negative Amount in Financial Transaction)**:
    - `{ userId: "auth_uid", type: "income", amount: -100, ... }`
    - *Expected*: PERMISSION_DENIED.
