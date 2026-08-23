# Security Specification for HUXLEY REASONING ENGINE

## 1. Data Invariants
- `SiphonedChunk`:
  - Must be created by an authenticated user (`userId` matches `request.auth.uid`).
  - `createdAt` must be server-generated.
  - `ccrrScore` must be between 0 and 10.
  - `intentAlignmentScore` must be between 0 and 1.
- `SystemArchetype`:
  - User can only read/write their own archetype (`userId` matches `docId`).
  - `updatedAt` must be server-generated.

## 2. The Dirty Dozen Payloads (Red Team Test Cases)

1. **Identity Spoofing**: Attempt to create a `SiphonedChunk` with a `userId` that does not match the authenticated user.
2. **Resource Poisoning**: Attempt to inject 1MB of junk data into the `title` field.
3. **Ghost Field Injection**: Attempt to include a field `isVerified: true` in `SiphonedChunk`.
4. **Timestamp Bypass**: Attempt to set a manual `createdAt` date from the client.
5. **Unauthorized Read**: Authenticated User A tries to read User B's `SystemArchetype`.
6. **Range Violation**: Attempt to set `ccrrScore` to 99.
7. **Type Mismatch**: Attempt to set `intentAlignmentScore` as a string.
8. **Orphaned Write**: Attempt to create a chunk without a `userId`.
9. **Mutation Lockout**: Attempt to update an immutable field (like `userId` or `createdAt`).
10. **Global Fetch**: Attempting a `list` query on `siphoned_chunks` without any owner filter (if applicable).
11. **Malicious ID injection**: Attempting to use a 1.5KB string as a document ID.
12. **PII Leak**: Attempting to store an `email` in a `SystemArchetype` field that isn't supposed to have it.

## 3. Test Runner (Mock)
(Final rules will be tested against these cases).
