This plan leverages the excellent CivicConnect wolfpack components while transforming the Side Hustle Bar experience into a modern, engaging, TikTok-style platform that serves the local Salem/Portland community.
I've done a deep dive into the current state of the Wolfpack feature, analyzing the error logs and the project structure. We have a significant number of errors (over 500) that are preventing progress and making the codebase difficult to maintain.
To move forward effectively, we need a focused cleanup and refactoring effort. This plan outlines the vision for the feature and provides a prioritized list of technical tasks.
The Vision: A Single, Unified Wolfpack Feed
First, let's align on the core concept. The entire user experience should revolve around a single, unified "Wolfpack".
The Wolfpack Feed is Everything: This is the central hub of the application. It should function like a TikTok-style vertical feed.
All Interactions Happen in the Feed: Users will post content, send messages, and receive messages directly within this feed experience. There should not be separate, disconnected pages for private messages or chats.
Remove Old/Separate Messaging: Any code related to a standalone messaging system needs to be deprecated and removed. Components like PrivateMessagesInterface.tsx are likely obsolete or need to be completely re-imagined as an overlay or integrated feature within the main feed.
Technical Action Plan: Prioritized Tasks
Let's tackle this in order of severity to get the application stable first, then we can refactor.
Priority 1: Critical Blocking Errors (Let's Make it Build!)
These errors are fundamental and are likely causing a cascade of other issues.
Fix React Imports Globally:
Error: Module "react" has no exported member 'useState', 'useEffect', etc.
Problem: This is a consistent syntax error across many files (FindFriends.tsx, PostCreator.tsx, AuthContext.tsx, etc.). The imports are incorrect.
Action: Please perform a project-wide search and replace.
Incorrect: import React from 'react'; const [state, setState] = React.useState();
Correct: import React, { useState, useEffect, useCallback } from 'react';
Fix Next.js Server/Client Component Prop Errors:
Error: Props must be serializable... 'onClose' is a function that's not a Server Action.
Problem: This occurs when a Server Component tries to pass a function prop to a Client Component ('use client'). This breaks the React Server Components model.
Action: Refactor these components. Either move the parent component to also be a Client Component, or rethink the architecture so you're passing data (like an ID) instead of functions.
Priority 2: Architectural Cleanup & Removing Redundancy
Once the app is stable, we need to simplify the architecture. The current structure is confusing and has conflicting pieces of code.
Consolidate User & Auth State:
Observation: We have contexts/AuthContext.tsx, contexts/UserContext.tsx, hooks/useAuth.ts, and hooks/useAuth.ts. This is redundant and a source for bugs.
Action: Let's standardize on one source of truth. The AuthContext already provides the user. We should use a single useAuth() hook that exposes the user object and profile. Please deprecate and remove UserContext and the redundant useAuth/useAuth hooks.
Clarify Firebase vs. Supabase:
Observation: The project heavily uses Supabase (e.g., lib/supabase/client), but there is also a lib/firebase folder.
Action: We need to clarify the role of Firebase. Is it only for a specific service like FCM (Firebase Cloud Messaging) for notifications? Or is it legacy code from a previous version? If it's legacy, it needs to be removed to avoid confusion.
Refactor the Messaging System:
Observation: We have hooks/useChat.ts and components like PrivateMessagesInterface.tsx and components/chat/.
Action: Aligning with the vision, please refactor this. useChat.ts should be the primary hook for all feed-based messaging logic. Components for messaging should be designed to work as part of the main WolfpackFeed, not as separate pages.
Priority 3: Code Quality and TypeScript Health
These are important for long-term maintainability.
Eliminate any Type:
Error: Parameter 'user' implicitly has an 'any' type.
Action: Please add explicit TypeScript types for all function parameters, variables, and state. Use the types from Supabase and our own types/ directory.
Fix Accessibility (A11y) Issues:
Error: Buttons must have discernible text.
Action: For icon-only buttons, add an aria-label attribute to describe the button's function (e.g., <button aria-label="Close">...</button>).
Clean Up Linting Warnings:
Address the "defined but never used" variables and the "missing hook dependencies" warnings. This will prevent bugs related to stale state and make the code cleaner.
This is a substantial list, but tackling it in this order will bring stability and clarity back to the project. Please start with Priority 1 so we can get a clean build.
Let's sync up if you have any questions about the vision or the technical tasks. Looking forward to seeing the progress  Here is a detailed breakdown of the conflicts, which you can use to reinforce the prompt for your developer.
1. The "User/Auth" State Conflict (High Severity)
This is the most critical conflict as it deals with the core user session.
Conflicting Files:
contexts/AuthContext.tsx
contexts/UserContext.tsx
hooks/useAuth.ts
hooks/useAuth.ts (This is likely located in hooks/wolfpack/)
Why it's a conflict: This creates two sources of truth for user data. The AuthContext should be the single provider for the authenticated user and their session. A separate UserContext and multiple similar hooks (useAuth vs useAuth) will inevitably lead to bugs where one part of the app has stale user data while another is up-to-date. It's confusing for any developer to know which one to use.
Resolution: Consolidate everything into AuthContext. The useAuth() hook should be the only way to access the current user, their session, and their detailed profile. The other files should be deprecated and removed.
2. The Backend Services Conflict (High Severity)
This points to a major architectural ambiguity.
Conflicting Files:
lib/firebase/ (contains index.ts, admin.ts, etc.)
lib/supabase/ (contains client.ts, server.ts, etc.)
Why it's a conflict: The project has initializers and configurations for two different Backend-as-a-Service platforms. A developer will immediately question: Which one is for authentication? Which one is for the database? Is one being phased out? If Firebase is only for one specific thing (like Push Notifications), it needs to be strictly isolated and named accordingly (e.g., lib/firebase-notifications/). As it stands, this is a huge source of confusion.
Resolution: Clarify the role of each service. If Firebase is legacy, it must be removed. If it's for a specific purpose, the code and folder structure should make that crystal clear.
3. The "Private Messaging vs. Unified Feed" Conflict
This conflict goes directly against the core vision you described.
Conflicting Files:
components/wolfpack/shared/PrivateMessagesInterface.tsx
hooks/useChat.ts
app/api/messages/route.ts
Why it's a conflict: The existence of a PrivateMessagesInterface and a dedicated /api/messages route strongly suggests a separate, traditional chat system, like a standalone inbox page. This directly contradicts the vision of a "TikTok-style feed where everything happens."
Resolution: These files represent the "old" messaging code that needs to be removed or fundamentally refactored. The logic from useChat.ts should be integrated into the main feed hook, and PrivateMessagesInterface.tsx should be deleted.
4. The "Finding People" Conflict
This is a feature-level redundancy that will confuse users and developers.
Conflicting Files:
components/wolfpack/shared/FindFriends.tsx
components/wolfpack/shared/WolfpackMembersList.tsx
Why it's a conflict: The purpose of these two components seems to overlap significantly. When should a user "find friends" versus view the "members list"? This ambiguity can lead to a disjointed user experience.
Resolution: These features should likely be combined into a single, well-defined user discovery component.
5. The Organizational Structure Conflict
This shows a lack of convention and makes the codebase hard to navigate.
Conflicting Locations:
hooks/ (top-level directory)
lib/hooks/ (a second, separate hooks directory)
Why it's a conflict: There should only be one conventional place for hooks. Having two means developers won't know where to find existing hooks or where to place new ones, leading to further disorganization.
Resolution: All hooks should be consolidated into the top-level /hooks directory. The lib/hooks directory should be eliminated.
These file-level conflicts are concrete evidence that supports the refactoring prompt. They are not just theoretical problems; they are active sources of bugs, confusion, and technical debt that are hindering the development of the unified Wolfpack feed.
