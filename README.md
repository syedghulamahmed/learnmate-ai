# LearnMate AI

An AI-powered personalized learning assistant built for the Internee.pk Generative AI internship assignment.

## Core objectives

- Explain concepts through an AI tutor adapted to a learner's subject, level, and goals.
- Generate structured, personalized learning plans.
- Track lesson completion and learning activity.
- Identify weak areas from quiz and activity evidence.
- Recommend focused revision and next steps.

## Technology

- Next.js App Router + TypeScript
- OpenAI Responses API (server-side)
- Firebase Authentication
- Cloud Firestore
- Zod request validation

## Current implementation status

- [x] Next.js application foundation and responsive dashboard
- [x] Server-side AI tutor endpoint with request validation
- [x] Firebase client configuration scaffold
- [ ] Firebase email/password authentication and protected user data
- [ ] Personalized lesson-plan generation and persistence
- [ ] Lesson completion, quizzes, and progress tracking
- [ ] Evidence-based weak-area analysis and recommendations
- [ ] Automated tests and production deployment

Do not treat unchecked items as implemented. Update this list as features are completed and tested.

## Getting started

Requirements: Node.js 20.9+ and npm.

```bash
npm install
cp .env.example .env.local
```

On Windows PowerShell, use `Copy-Item .env.example .env.local`.

Set the environment variables in `.env.local`. Then run:

```bash
npm run dev
```

Open http://localhost:3000.

## Environment variables

- `OPENAI_API_KEY`: secret API key; server-side only.
- `OPENAI_MODEL`: model available to your OpenAI API project (default: `gpt-4.1-mini`).
- `NEXT_PUBLIC_FIREBASE_*`: Firebase web-app configuration values.

Never prefix the OpenAI API key with `NEXT_PUBLIC_`. Never commit `.env.local`, service-account JSON, or other secrets.

## Firebase setup

1. Create a Firebase project.
2. Register a Web App and copy its configuration into `.env.local`.
3. Enable Email/Password under Authentication providers.
4. Create a Cloud Firestore database.
5. Deploy the rules in `firestore.rules` before storing user information.

The client Firebase configuration is not a substitute for Firestore Security Rules. Every user-owned document must be protected by authenticated UID checks.

## Project structure

```text
src/
  app/
    api/tutor/route.ts
    globals.css
    layout.tsx
    page.tsx
  lib/
    firebase.ts
    openai.ts
    schemas.ts
firestore.rules
```

## Security and reliability

- OpenAI requests execute on the server; the API key is never sent to the browser.
- API input is validated and length-limited.
- Configure Firestore rules before enabling persistence.
- Add authentication checks, rate limiting, abuse monitoring, and usage limits before public production deployment.
- AI-generated explanations and learning recommendations can be inaccurate; learners should verify important information.

## License

MIT. See [LICENSE](./LICENSE).
