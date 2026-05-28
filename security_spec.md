# Security Specification for Suivi de Recherche d’Emploi

This document establishes the Attribute-Based Access Control (ABAC) invariants, security test payloads, and test structures to enforce strict isolation on individual data while allowing peer transparency for status sharing.

## 1. Data Invariants

1. **Owner Isolation (Candidatures)**: A user can only see, create, modify, or delete their own job search list. Global listing or reading other users' candidatures is strictly forbidden.
2. **Read-Only Stats (Friends Dashboard)**: Users can register and publish high-level KPI aggregations (total applied, total interviewing, total offers). Aggregations are viewable by any authenticated friend, but can only be modified by the respective data owner.
3. **Immutability of Key Identity Fields**: A candidature's `ownerId` (`userId`) and creation timestamp (`createdAt`) cannot be altered post-creation.
4. **Verified Authentications**: All state write operations are blocked unless the request actor holds a valid authentication token with a verified email.

## 2. The "Dirty Dozen" Payloads (Logical Attacking Scenarios)

The following malicious client requests must be blocked by the Firestore rules:

1. **Identity Theft (Create)**: Attempting to create a candidature with another user's `userId`.
2. **Identity Alteration (Update)**: Modifying the `userId` of an existing candidature to hijack ownership or assign it to someone else.
3. **Stat Spoofing (Write)**: Attempting to overwrite a peer's statistics dashboard counter.
4. **Anonymity Write Gap**: Attempting to post a candidature with an unverified email account.
5. **PII Query Leak**: Attempting to run a list query on all candidatures without specifying the client owner constraint (`userId == auth.uid`).
6. **Immutability Bypass**: Altering the `createdAt` timestamp of a stored session.
7. **Junk String Poisoning**: Putting 1MB of garbage text or malicious strings into short text boundaries.
8. **Stat Modification with Forbidden Custom Claims**: Self-assigning roles or admin flags inside user profiles.
9. **Creation of Orphan Transactions**: Submitting a candidatura with a fake non-alphanumeric application ID.
10. **Terminal State Erasure**: Trying to change notes in a state that has been archived or locked without appropriate validation.
11. **Malicious Mass Injection**: Pushing an exceptionally large array of custom tags to crash list widgets.
12. **Bypassing Verification**: Writing state without verifying the `email_verified` flag.

## 3. Security Rules Draft (`firestore.rules`)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Global Safety Net
    match /{document=**} {
      allow read, write: if false;
    }

    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }

    function isVerifiedUser() {
      return isSignedIn() && request.auth.token.email_verified == true;
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    function isValidId(id) {
      return id is string && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$');
    }

    function incoming() {
      return request.resource.data;
    }

    function existing() {
      return resource.data;
    }

    // Validation for Candidatures
    function isValidApplication(data) {
      return data.id is string && data.id.size() <= 128
        && data.userId is string && data.userId.size() <= 128
        && data.userId == request.auth.uid
        && data.title is string && data.title.size() <= 200
        && data.company is string && data.company.size() <= 200
        && data.status is string && (data.status == 'to_apply' || data.status == 'applied' || data.status == 'interviewing' || data.status == 'offer' || data.status == 'rejected')
        && (data.dateApplied == null || (data.dateApplied is string && data.dateApplied.size() <= 30))
        && (data.location == null || (data.location is string && data.location.size() <= 150))
        && (data.url == null || (data.url is string && data.url.size() <= 1000))
        && (data.salary == null || (data.salary is string && data.salary.size() <= 100))
        && (data.notes == null || (data.notes is string && data.notes.size() <= 10000));
    }

    // Validation for Stats
    function isValidStat(data) {
      return data.userId is string && data.userId == request.auth.uid
        && data.displayName is string && data.displayName.size() <= 150
        && data.totalApplied is int && data.totalApplied >= 0
        && data.totalInterviewing is int && data.totalInterviewing >= 0
        && data.totalOffers is int && data.totalOffers >= 0;
    }

    // Collection: Applications (Candidatures)
    match /applications/{applicationId} {
      allow get: if isSignedIn() && existing().userId == request.auth.uid;
      allow list: if isSignedIn() && resource.data.userId == request.auth.uid;
      
      allow create: if isVerifiedUser() 
        && isValidId(applicationId) 
        && isValidApplication(incoming())
        && incoming().createdAt == request.time;
        
      allow update: if isVerifiedUser() 
        && isValidId(applicationId)
        && existing().userId == request.auth.uid
        && isValidApplication(incoming())
        && incoming().userId == existing().userId
        && incoming().createdAt == existing().createdAt
        && incoming().updatedAt == request.time;
        
      allow delete: if isVerifiedUser() 
        && existing().userId == request.auth.uid;
    }

    // Collection: Stats (Shared Friends Dashboard)
    match /stats/{userId} {
      allow read: if isSignedIn();
      
      allow create: if isVerifiedUser() 
        && isValidId(userId)
        && userId == request.auth.uid
        && isValidStat(incoming())
        && incoming().lastActive == request.time;
        
      allow update: if isVerifiedUser() 
        && isValidId(userId)
        && userId == request.auth.uid
        && isValidStat(incoming())
        && incoming().lastActive == request.time;
    }
  }
}
```
