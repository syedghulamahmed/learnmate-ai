# LearnMate AI

An AI-powered personalized learning assistant built for the Internee.pk Generative AI internship assignment.

**Live demo:** https://learnmate-ai-olive.vercel.app  
**Source code:** https://github.com/syedghulamahmed/learnmate-ai

## Features

- Responsive learning workspace built with Next.js and TypeScript.
- AI tutor powered by the OpenAI Responses API.
- Firebase email/password registration and sign-in.
- Personalized lesson-plan generation based on subject, level, goal, and duration.
- User-specific lesson-plan and quiz persistence in Cloud Firestore.
- Lesson completion tracking and progress overview.
- Multiple-choice knowledge checks with saved scores.
- Weak-area identification from actual quiz attempts (topics below 70% combined accuracy).
- Server-side Firebase ID-token verification for AI API routes.
- Firestore rules scoped to the authenticated user's own records.

## Technology

- Next.js App Router, React 19, TypeScript
- OpenAI Node SDK / Responses API
- Firebase Authentication, Cloud Firestore, Firebase Admin SDK
- Zod for request and generated-plan validation
- Vercel deployment

## Local setup

Requires Node.js 20.9+ and npm.

1. Clone this repository.
2. Install dependencies: `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Add the OpenAI API key, Firebase Web App configuration, and Firebase Admin service-account credentials.
5. In Firebase Console, enable **Authentication → Email/Password**.
6. Create a Cloud Firestore database and publish the included `firestore.rules`.
7. Start the development server: `npm run dev`.
8. Open http://localhost:3000.

## Deployment configuration

The production app is deployed on Vercel at https://learnmate-ai-olive.vercel.app.

For another deployment:

1. Import this GitHub repository into Vercel with the **Next.js** framework preset.
2. Add all required variables listed in `.env.example` under **Project → Settings → Environment Variables**.
3. Store OpenAI and Firebase Admin credentials as encrypted server-side variables. Never expose them with a `NEXT_PUBLIC_` prefix.
4. Publish `firestore.rules` in Firebase Console → Firestore Database → Rules.
5. Add the deployed hostname (without `https://`) to Firebase Authentication → Settings → Authorized domains.
6. Redeploy after changing environment variables.

## Environment variables

- `OPENAI_API_KEY`: server-only OpenAI API secret.
- `OPENAI_MODEL`: model enabled for your API project (default: `gpt-4.1-mini`).
- `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`: Firebase Web App configuration.
- `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`: server-only Firebase Admin service-account credentials used to verify Firebase ID tokens.

Firebase Web App configuration is designed for client use. Firestore Security Rules enforce per-user data access. Never commit private service-account keys or `.env.local`.

## Firestore data model

- `users/{uid}/plans/{planId}`: generated plan, completed lesson IDs, and creation timestamp.
- `users/{uid}/quizAttempts/{attemptId}`: lesson topic, correct answer count, total questions, and timestamp.

Weak areas are computed from recorded quiz attempts; the app does not fabricate learning progress.

## Scope and limitations

- Lesson plans are AI-generated from user-provided subjects and goals; they are not represented as official Internee.pk curriculum content.
- AI-generated educational content should be checked against authoritative course material.
- API routes verify Firebase ID tokens. Before opening the app to significant public traffic, add a shared-store rate limiter and abuse monitoring.
- Live AI and persistent learning features require valid OpenAI and Firebase credentials.

## License

MIT.
