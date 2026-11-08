# LearnMate AI

A personalized AI learning workspace for students: tutor explanations, generated learning plans, quizzes, and progress tracking.

## Features
- Adaptive AI tutor: explanations, examples, and practice prompts.
- AI-generated learning plans with lessons and multiple-choice quizzes.
- Firebase email/password sign-in and user-owned Firestore progress.
- Lesson completion and quiz accuracy tracking.
- Input validation and explicit AI-provider disclosure in the app.

## Stack
Next.js, React, TypeScript, Firebase Authentication, Firestore, Zod, Vercel.

## AI provider
The tutor and learning-plan routes use the OpenAI-compatible Vireonix endpoint with the public `auto` model. No OpenAI key, Vercel AI Gateway key, or payment card is required. The service is free but subject to per-IP hourly limits and may return HTTP 429 or experience temporary outages; the application displays an honest fallback/error rather than claiming a fallback is AI-generated.

## Local setup
1. Use Node.js 20.9+ and npm.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Configure the Firebase Web App values below and enable Email/Password Authentication.
5. Create Firestore and publish `firestore.rules`.
6. Run `npm run dev`.

## Environment
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

Firebase client configuration is intended for client use; Firestore rules restrict user records to their owner. The learning-plan API verifies the Firebase ID token using the Firebase Identity Toolkit lookup endpoint. No Firebase Admin private key is used by the AI routes.

## API
- `POST /api/tutor`: `question`, `subject`, `level`, and `goal`.
- `POST /api/learning-plan`: authenticated JSON with `subject`, `level`, `goal`, and `durationDays`.
- `GET /api/health`: application/provider health metadata.

## Privacy and limitations
Prompts and outputs sent to Vireonix may be retained and used for model training and improvement. The interface links to the provider's terms and tells users not to submit sensitive personal data, secrets, or confidential information. Read https://vireonix.ai/terms before use. The service has no SLA or reserved capacity. AI educational content can be inaccurate and should be checked against course materials. This is not official Internee.pk curriculum content.

## Firestore data model
- `users/{uid}/plans/{planId}`: generated plan, completed lesson IDs, and timestamp.
- `users/{uid}/quizAttempts/{attemptId}`: topic, score, total, and timestamp.

MIT License.
