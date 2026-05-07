# Security Specification - Aether Pro

## Data Invariants
1. A user can only read and write their own profile document.
2. A user can only read and write their own activity logs.
3. Activity logs must belong to the authenticated user and include a server-generated timestamp.
4. Users cannot modify their own `isVip` status (this is a system-controlled field).

## The Dirty Dozen Payloads (Target: Rejection)
1. Write to another user's profile: `setDoc(doc(db, 'users', 'otherUID'), { ... })`
2. Update `isVip` status directly from client: `updateDoc(doc(db, 'users', uid), { isVip: true })`
3. Create activity log for another user: `addDoc(collection(db, 'users', 'otherUID', 'activities'), { ... })`
4. Create activity log with fake timestamp: `addDoc(collection(db, 'users', uid, 'activities'), { timestamp: '2000-01-01' })`
5. Create user profile with shadow field: `setDoc(doc(db, 'users', uid), { ..., admin: true })`
6. Injection attack via UID: `getDoc(doc(db, 'users', '../secrets/config'))`
7. Unauthorized list query: `getDocs(collectionGroup(db, 'activities'))` without filter
8. Overwriting `createdAt` timestamp: `updateDoc(doc(db, 'users', uid), { createdAt: 'newTime' })`
9. Resource exhaustion: Large junk string in `displayName`.
10. Spoofing identity: Providing a `userId` in activity log that doesn't match `request.auth.uid`.
11. Reading private PII of another user.
12. Deleting another user's activity log.

## Test Runner (Draft)
I will implement these checks in the rules directly using helper functions.
