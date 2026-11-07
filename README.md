# LearnMate AI

An AI-powered personalized learning assistant for the Internee.pk Generative AI internship assignment.

## Implemented

- Responsive Next.js + TypeScript learning workspace.
- AI tutor endpoint using the OpenAI Responses API.
- Email/password registration and sign-in using Firebase Authentication.
- Personalized lesson-plan generation with schema validation.
- User-specific plan and quiz persistence in Cloud Firestore.
- Lesson completion tracking.
- Multiple-choice knowledge checks with saved scores.
- Weak-area detection based on actual quiz results (topics below 70% combined accuracy).
- Firestore rules restricting user records to the authenticated owner.

## Stack

- Next.js App Router, React, TypeScript
- OpenAI Node SDK / Responses API
- Firebase Authentication and Cloud Firestore
- Zod

## Setup

Requires Node.js 20.9+ and npm.

1. Clone the repository.
2. Install packages: `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Add your OpenAI API key and Firebase Web App configuration.
5. In Firebase Console, enable **Authentication → Email/Password**.
6. Create a Cloud Firestore database and publish `firestore.rules`.
7. Create a Firebase service account and add its project ID, client email, and private key to the three server-only `FIREBASE_ADMIN_*` variables. Keep the private key secret.
8. Start the app with `npm run dev`.

### Deploy to Vercel

1. Import this GitHub repository into Vercel.
2. Keep the framework preset as **Next.js**.
3. Add every variable from `.env.example` in **Project → Settings → Environment Variables**. Add the OpenAI key and Firebase Admin service-account values only as encrypted server environment variables; do not prefix them with `NEXT_PUBLIC_`.
4. Add the six `NEXT_PUBLIC_FIREBASE_*` web-app values for the client.
5. Deploy. After deployment, test registration, sign-in, tutor questions, plan generation, saving quiz scores, and progress persistence.
6. In Firebase Console, add the deployed Vercel domain to **Authentication → Settings → Authorized domains**.

Open http://localhost:3000.

### Environment variables

- `OPENAI_API_KEY`: server-only secret. Never expose it through a `NEXT_PUBLIC_` variable.
- `OPENAI_MODEL`: model enabled for your API project (default `gpt-4.1-mini`).
- `NEXT_PUBLIC_FIREBASE_*`: Firebase web-app configuration.
- `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`: server-only Firebase Admin service-account credentials for API token verification.

Firebase web configuration is intended for client use; Firestore Security Rules enforce user-level access. Never commit private service-account keys or `.env.local`.

## Data model

- `users/{uid}/plans/{planId}`: generated plan, lesson completion IDs, creation timestamp.
- `users/{uid}/quizAttempts/{attemptId}`: topic, correct answer count, total questions, timestamp.

Weak areas are computed from recorded quiz attempts. The app does not invent learning progress.

## Important limitations before public deployment

- API routes verify Firebase ID tokens server-side using Firebase Admin. Add a shared-store rate limiter (for example, Upstash Redis) and abuse monitoring before opening the service to public traffic.
- Generated lessons are AI-produced and should be checked against official course material.
- A Firebase project and OpenAI API credentials are required to run authenticated, persistent, AI-powered features.

## License

MIT.
