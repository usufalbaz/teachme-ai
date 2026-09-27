# Security Specification & Test Protocol

## 1. Data Invariants
1. **User Identity Invariant**: A user document at `/users/{userId}` can only be read or written by the authenticated user whose `request.auth.uid == userId`.
2. **Subcollection Containment**: Pronunciation logs (`/users/{userId}/pronunciationLogs/{logId}`) and practice sessions (`/users/{userId}/sessions/{sessionId}`) can strictly only belong to and be accessed by the parent `{userId}`.
3. **No Blanket Reads**: Querying or listing subcollections requires user authentication and matching `userId`.
4. **Key and Type Hardening**: All created and updated documents must conform strictly to the required and allowed keys and max-length bounds defined in `firebase-blueprint.json`.
5. **Score & XP Integrity**: XP and session scores must be non-negative numbers within valid bounds.

## 2. The "Dirty Dozen" Payloads
1. **Unauthenticated User Profile Creation**: Anonymous/unauthenticated client attempting to create `/users/attacker123`. (Must be REJECTED).
2. **User Identity Spoofing**: User `victim` tries to write `/users/attacker123` or inject someone else's UID into `uid`. (Must be REJECTED).
3. **Ghost Field Injection**: Attempt to inject arbitrary `isAdmin: true` or `shadowField` into user profile. (Must be REJECTED).
4. **Unbounded String Resource Exhaustion**: Attempt to write a 1MB payload in `displayName` or `word`. (Must be REJECTED).
5. **Cross-User Pronunciation Log Read**: User A querying or reading User B's `/users/userB/pronunciationLogs/log1`. (Must be REJECTED).
6. **Orphan Pronunciation Log Write**: User A attempting to insert a log into `/users/userB/pronunciationLogs/log1`. (Must be REJECTED).
7. **Negative or Overflow Score**: Writing a practice session with `score: -50` or `score: 99999999`. (Must be REJECTED).
8. **Invalid Level Value**: Writing `level: "GOD_MODE"` instead of valid CEFR `A1, A2, B1, B2, C1`. (Must be REJECTED).
9. **Path Traversal / Malformed Document ID**: Using `../` or junk 2KB ID in `logId` or `userId`. (Must be REJECTED via `isValidId()`).
10. **Blanket Query Scraping**: Malicious user trying a collection group query or unbounded list without `userId == request.auth.uid`. (Must be REJECTED).
11. **Negative Streak/XP Tampering**: Sending negative integer or non-number for `xp` or `streak`. (Must be REJECTED).
12. **Tampering with Immortal Field**: Attempting to alter original `uid` or `createdAt` on profile update. (Must be REJECTED).
