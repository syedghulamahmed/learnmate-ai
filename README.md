# LearnMate AI

A personalized AI learning workspace for students, combining tutoring, generated lesson plans, quizzes, and progress tracking.

## Features
- Adaptive AI tutor with explanations, examples, and practice prompts.
- AI-generated learning plans with lessons and multiple-choice quizzes.
- Firebase email/password sign-in and user-owned Firestore progress.
- Lesson completion and quiz accuracy tracking.
- Input validation and honest fallback behavior.

## Stack
Next.js, React, TypeScript, Firebase Authentication, Cloud Firestore, Zod, Vercel.

## AI provider
The tutor and plan generator call BlockRun's OpenAI-compatible chat-completions endpoint using the currently listed free model `nvidia/nemotron-3.5-bolt`, with `poolside/laguna-xs-2.1` as a second free-model fallback. The integration needs no API key, wallet, payment card, or account. Free-model capacity and IP-based limits can change; if inference is unavailable, the app returns a labelled fallback/error instead of misrepresenting it as AI output.

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

The learning-plan API verifies Firebase ID tokens through Firebase Identity Toolkit. No Firebase Admin private key is used by these AI routes.

## API
- `POST /api/tutor`: `question`, `subject`, `level`, and `goal`.
- `POST /api/learning-plan`: authenticated JSON with `subject`, `level`, `goal`, and `durationDays`.
- `GET /api/health`: application/provider metadata.

## Privacy and limitations
Prompts are routed by BlockRun to the selected model provider. BlockRun states that it does not store or train on prompts; the upstream model provider's terms still apply. The interface links to [BlockRun Privacy](https://blockrun.ai/privacy) and [Terms](https://blockrun.ai/terms). Do not submit sensitive personal data, secrets, or confidential information. The free model pool may be rate-limited or changed without notice. Educational output can be inaccurate and should be checked against course materials. This is not official Internee.pk curriculum content.

## Firestore data model
- `users/{uid}/plans/{planId}`: generated plan, completed lesson IDs, and timestamp.
- `users/{uid}/quizAttempts/{attemptId}`: topic, score, total, and timestamp.

MIT License.
## Production verification

The tutor and learning-plan handlers use BlockRun's free-model endpoint. The learning-plan endpoint validates Firebase ID tokens, then validates the generated plan against the application schema before saving it to the signed-in user's workspace. If the provider is unavailable, the API returns a clear service error or labelled fallback; a rules-based answer is never marked as AI output.
