"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc, arrayUnion, collection, doc, getDocs, serverTimestamp, updateDoc,
} from "firebase/firestore";
import { auth, db, firebaseConfigured } from "@/lib/firebase";
import { loginWithEmail, logout, registerWithEmail, type AuthUser } from "@/lib/firebase-auth";
import type { LearningPlan } from "@/lib/learning";

type Tab = "tutor" | "planner" | "progress";
type Level = "beginner" | "intermediate" | "advanced";
type SavedPlan = { id: string; plan: LearningPlan; completedLessonIds: string[] };
type QuizAttempt = { id: string; topic: string; score: number; total: number; createdAt?: unknown };

export default function Home() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [tab, setTab] = useState<Tab>("tutor");

  const [question, setQuestion] = useState("");
  const [subject, setSubject] = useState("Artificial Intelligence");
  const [level, setLevel] = useState<Level>("beginner");
  const [goal, setGoal] = useState("Understand the topic and practise it.");
  const [answer, setAnswer] = useState("");
  const [tutorBusy, setTutorBusy] = useState(false);

  const [planSubject, setPlanSubject] = useState("Artificial Intelligence");
  const [planGoal, setPlanGoal] = useState("Build a strong foundation and complete practical exercises.");
  const [durationDays, setDurationDays] = useState(7);
  const [planBusy, setPlanBusy] = useState(false);
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [activePlanId, setActivePlanId] = useState("");
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!auth) { setAuthReady(true); return; }
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    async function loadLearningData() {
      if (!user || !db) { setPlans([]); setAttempts([]); return; }
      try {
        const [planSnapshot, attemptSnapshot] = await Promise.all([
          getDocs(collection(db, "users", user.uid, "plans")),
          getDocs(collection(db, "users", user.uid, "quizAttempts")),
        ]);
        const loadedPlans = planSnapshot.docs.map((item) => ({
          id: item.id,
          plan: item.data().plan as LearningPlan,
          completedLessonIds: (item.data().completedLessonIds as string[]) || [],
        }));
        setPlans(loadedPlans);
        setAttempts(attemptSnapshot.docs.map((item) => ({
          id: item.id,
          topic: String(item.data().topic || "General"),
          score: Number(item.data().score || 0),
          total: Number(item.data().total || 0),
          createdAt: item.data().createdAt,
        })));
        if (loadedPlans.length && !activePlanId) setActivePlanId(loadedPlans[0].id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load your learning records.");
      }
    }
    void loadLearningData();
  }, [user, activePlanId]);

  const activePlan = plans.find((item) => item.id === activePlanId) || plans[0] || null;
  const activeLesson = activePlan?.plan.lessons[activeLessonIndex] || null;

  const weakAreas = useMemo(() => {
    const totals = new Map<string, { correct: number; questions: number; attempts: number }>();
    for (const attempt of attempts) {
      const current = totals.get(attempt.topic) || { correct: 0, questions: 0, attempts: 0 };
      current.correct += attempt.score;
      current.questions += attempt.total;
      current.attempts += 1;
      totals.set(attempt.topic, current);
    }
    return [...totals.entries()]
      .map(([topic, value]) => ({ topic, accuracy: value.questions ? Math.round(value.correct / value.questions * 100) : 0, attempts: value.attempts }))
      .filter((item) => item.accuracy < 70)
      .sort((a, b) => a.accuracy - b.accuracy);
  }, [attempts]);

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthBusy(true);
    setAuthError("");
    try {
      if (authMode === "register") await registerWithEmail(email, password);
      else await loginWithEmail(email, password);
      setPassword("");
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setAuthBusy(false);
    }
  }

  async function askTutor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTutorBusy(true); setError(""); setAnswer("");
    try {
      const response = await fetch("/api/tutor", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, subject, level, goal }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Tutor request failed.");
      setAnswer(data.answer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tutor request failed.");
    } finally { setTutorBusy(false); }
  }

  async function generatePlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !db) { setError("Sign in and configure Firebase before saving a learning plan."); return; }
    setPlanBusy(true); setError(""); setFeedback("");
    try {
      const token = await auth?.currentUser?.getIdToken();
      if (!token) throw new Error("Your session expired. Sign in again.");
      const response = await fetch("/api/learning-plan", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ subject: planSubject, level, goal: planGoal, durationDays }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Plan generation failed.");
      const ref = await addDoc(collection(db, "users", user.uid, "plans"), {
        plan: data.plan, completedLessonIds: [], createdAt: serverTimestamp(),
      });
      const saved: SavedPlan = { id: ref.id, plan: data.plan as LearningPlan, completedLessonIds: [] };
      setPlans((current) => [saved, ...current]);
      setActivePlanId(ref.id); setActiveLessonIndex(0); setTab("planner");
      setFeedback("Your personalized learning plan has been generated and saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate your learning plan.");
    } finally { setPlanBusy(false); }
  }

  async function markLessonComplete() {
    if (!user || !db || !activePlan || !activeLesson) return;
    const lessonId = String(activeLessonIndex);
    try {
      await updateDoc(doc(db, "users", user.uid, "plans", activePlan.id), {
        completedLessonIds: arrayUnion(lessonId),
      });
      setPlans((current) => current.map((item) => item.id === activePlan.id
        ? { ...item, completedLessonIds: [...new Set([...item.completedLessonIds, lessonId])] } : item));
      setFeedback("Lesson completion saved to your account.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save lesson completion.");
    }
  }

  async function submitQuiz() {
    if (!user || !db || !activeLesson || !activePlan) return;
    const unanswered = activeLesson.quiz.some((_, index) => selectedAnswers[index] === undefined);
    if (unanswered) { setError("Answer every question before submitting the quiz."); return; }
    const score = activeLesson.quiz.reduce((sum, item, index) => sum + (selectedAnswers[index] === item.correctIndex ? 1 : 0), 0);
    try {
      const attempt = { topic: activeLesson.title, score, total: activeLesson.quiz.length, createdAt: serverTimestamp() };
      const ref = await addDoc(collection(db, "users", user.uid, "quizAttempts"), attempt);
      setAttempts((current) => [...current, { id: ref.id, topic: attempt.topic, score, total: attempt.total }]);
      setFeedback(`Quiz recorded: ${score} / ${activeLesson.quiz.length}. ${score / activeLesson.quiz.length < 0.7 ? "Revise this lesson before moving on." : "Good work. Keep progressing."}`);
      setSelectedAnswers({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save quiz results.");
    }
  }

  const completedCount = activePlan?.completedLessonIds.length || 0;
  const lessonCount = activePlan?.plan.lessons.length || 0;
  const completion = lessonCount ? Math.round(completedCount / lessonCount * 100) : 0;
  const averageAccuracy = attempts.length
    ? Math.round(attempts.reduce((sum, item) => sum + (item.total ? item.score / item.total : 0), 0) / attempts.length * 100)
    : null;

  if (!authReady) return <main className="shell"><p className="muted">Loading LearnMate...</p></main>;

  if (!firebaseConfigured || !user) {
    return (
      <main className="shell auth-shell">
        <header className="topbar"><div className="brand">LearnMate<span> AI</span></div><div className="pill">PERSONALIZED LEARNING ASSISTANT</div></header>
        <section className="auth-card panel">
          <div className="eyebrow">Your learning workspace</div>
          <h1>{firebaseConfigured ? "Welcome to LearnMate." : "One setup step remains."}</h1>
          <p className="sub">{firebaseConfigured ? "Create an account or sign in to save learning plans, lesson progress, and quiz results." : "The application is implemented, but Firebase credentials are not configured. Add your Firebase Web App settings to .env.local to activate accounts and cloud storage."}</p>
          {!firebaseConfigured ? <div className="notice">Required: Firebase project configuration and Email/Password Authentication enabled. No account or data is created until Firebase is connected.</div> : (
            <form onSubmit={handleAuth}>
              <label htmlFor="email">Email</label>
              <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <label htmlFor="password">Password</label>
              <input id="password" type="password" autoComplete={authMode === "login" ? "current-password" : "new-password"} minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
              {authError && <p className="error" role="alert">{authError}</p>}
              <button className="primary" type="submit" disabled={authBusy}>{authBusy ? "Please wait..." : authMode === "login" ? "Sign in" : "Create account"}</button>
              <button className="text-button" type="button" onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setAuthError(""); }}>
                {authMode === "login" ? "New here? Create an account" : "Already registered? Sign in"}
              </button>
            </form>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">LearnMate<span> AI</span></div>
        <div className="user-tools"><span className="user-email">{user.email}</span><button className="quiet-button" onClick={() => void logout()}>Sign out</button></div>
      </header>
      <section className="hero">
        <div className="eyebrow">Your AI learning companion</div>
        <h1>Learn smarter.<br />Make measurable progress.</h1>
        <p className="sub">A personal tutor, structured learning plans, and progress insights grounded in your actual study activity.</p>
      </section>
      <nav className="tabs" aria-label="Learning workspace">
        <button className={tab === "tutor" ? "tab active" : "tab"} onClick={() => setTab("tutor")}>AI Tutor</button>
        <button className={tab === "planner" ? "tab active" : "tab"} onClick={() => setTab("planner")}>Learning Plans</button>
        <button className={tab === "progress" ? "tab active" : "tab"} onClick={() => setTab("progress")}>My Progress</button>
      </nav>

      {error && <p className="error global-error" role="alert">{error}<button className="dismiss" onClick={() => setError("")}>Dismiss</button></p>}
      {feedback && <p className="success" role="status">{feedback}<button className="dismiss" onClick={() => setFeedback("")}>Dismiss</button></p>}

      {tab === "tutor" && <section className="panel workspace">
        <h2>Ask your AI tutor</h2><p className="muted">Explanations adapt to your subject, current level, and learning goal.</p>
        <form onSubmit={askTutor} className="form-grid">
          <div><label htmlFor="subject">Subject</label><input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={80} required /></div>
          <div><label htmlFor="level">Knowledge level</label><select id="level" value={level} onChange={(e) => setLevel(e.target.value as Level)}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></div>
          <div className="full"><label htmlFor="goal">Learning goal</label><input id="goal" value={goal} onChange={(e) => setGoal(e.target.value)} maxLength={300} /></div>
          <div className="full"><label htmlFor="question">Your question</label><textarea id="question" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Explain supervised vs. unsupervised learning with practical examples..." minLength={2} maxLength={2000} required /></div>
          <div className="full"><button className="primary" type="submit" disabled={tutorBusy || question.trim().length < 2}>{tutorBusy ? "Preparing explanation..." : "Ask LearnMate"}</button></div>
        </form>
        {answer && <div className="answer" aria-live="polite"><strong>LearnMate's explanation</strong><br /><br />{answer}</div>}
      </section>}

      {tab === "planner" && <section className="workspace">
        <div className="panel">
          <h2>Generate a learning plan</h2><p className="muted">AI creates a sequenced curriculum with lesson explanations, practical tasks, and knowledge checks.</p>
          <form onSubmit={generatePlan} className="form-grid">
            <div><label htmlFor="planSubject">What do you want to learn?</label><input id="planSubject" value={planSubject} onChange={(e) => setPlanSubject(e.target.value)} maxLength={100} required /></div>
            <div><label htmlFor="duration">Plan duration</label><select id="duration" value={durationDays} onChange={(e) => setDurationDays(Number(e.target.value))}><option value={3}>3 days</option><option value={7}>7 days</option><option value={14}>14 days</option><option value={21}>21 days</option><option value={30}>30 days</option></select></div>
            <div className="full"><label htmlFor="planGoal">What is your target outcome?</label><textarea id="planGoal" value={planGoal} onChange={(e) => setPlanGoal(e.target.value)} maxLength={500} required /></div>
            <div className="full"><button className="primary" type="submit" disabled={planBusy}>{planBusy ? "Designing your plan..." : "Generate personalized plan"}</button></div>
          </form>
        </div>
        {plans.length > 0 && <div className="panel plan-panel">
          <div className="plan-heading"><div><h2>{activePlan?.plan.title}</h2><p className="muted">{activePlan?.plan.summary}</p></div><select aria-label="Choose saved plan" value={activePlan?.id || ""} onChange={(e) => { setActivePlanId(e.target.value); setActiveLessonIndex(0); setSelectedAnswers({}); }} className="plan-select">{plans.map((item) => <option key={item.id} value={item.id}>{item.plan.title}</option>)}</select></div>
          <div className="progress-track"><span style={{ width: completion + "%" }} /></div>
          <p className="muted">{completedCount} of {lessonCount} lessons completed · {completion}%</p>
          <div className="lesson-layout">
            <div className="lesson-list">{activePlan?.plan.lessons.map((lesson, index) => <button key={lesson.title + index} className={activeLessonIndex === index ? "lesson-link selected" : "lesson-link"} onClick={() => { setActiveLessonIndex(index); setSelectedAnswers({}); }}><span>Lesson {index + 1}</span><strong>{lesson.title}</strong><small>{activePlan.completedLessonIds.includes(String(index)) ? "Completed" : lesson.durationMinutes + " min"}</small></button>)}</div>
            {activeLesson && <article className="lesson-content">
              <div className="eyebrow">Lesson {activeLessonIndex + 1} · {activeLesson.durationMinutes} minutes</div>
              <h3>{activeLesson.title}</h3><p className="muted">{activeLesson.objective}</p>
              <div className="lesson-copy">{activeLesson.explanation}</div>
              <div className="task-box"><strong>Practice task</strong><p>{activeLesson.practiceTask}</p></div>
              <h3>Knowledge check</h3>
              {activeLesson.quiz.map((item, index) => <div className="question-card" key={item.question}><strong>{index + 1}. {item.question}</strong>{item.options.map((option, optionIndex) => <label className="option" key={optionIndex}><input type="radio" name={"question-" + index} checked={selectedAnswers[index] === optionIndex} onChange={() => setSelectedAnswers((current) => ({ ...current, [index]: optionIndex }))} />{option}</label>)}</div>)}
              <button className="primary" onClick={() => void submitQuiz()}>Submit quiz</button>
              <button className="secondary-button" onClick={() => void markLessonComplete()} disabled={activePlan.completedLessonIds.includes(String(activeLessonIndex))}>{activePlan.completedLessonIds.includes(String(activeLessonIndex)) ? "Lesson completed" : "Mark lesson complete"}</button>
            </article>}
          </div>
        </div>}
      </section>}

      {tab === "progress" && <section className="workspace">
        <div className="metrics-grid">
          <div className="metric panel"><strong>{plans.length}</strong><span>Saved learning plans</span></div>
          <div className="metric panel"><strong>{plans.reduce((sum, item) => sum + item.completedLessonIds.length, 0)}</strong><span>Lessons completed</span></div>
          <div className="metric panel"><strong>{attempts.length}</strong><span>Quiz attempts</span></div>
          <div className="metric panel"><strong>{averageAccuracy === null ? "—" : averageAccuracy + "%"}</strong><span>Average quiz accuracy</span></div>
        </div>
        <div className="panel"><h2>Topics to revise</h2><p className="muted">Weak areas are identified from your recorded quiz answers. A topic appears here when its combined accuracy is below 70%.</p>
          {weakAreas.length ? <div className="weak-list">{weakAreas.map((item) => <div className="weak-item" key={item.topic}><div><strong>{item.topic}</strong><span>{item.attempts} quiz attempt(s)</span></div><b>{item.accuracy}%</b></div>)}</div> : <p className="empty-state">{attempts.length ? "No weak areas detected from your current quiz records." : "Complete a lesson quiz to start building evidence-based progress insights."}</p>}
        </div>
        <div className="panel"><h2>Learning plans</h2>{plans.length ? plans.map((item) => <div className="saved-plan" key={item.id}><div><strong>{item.plan.title}</strong><span>{item.completedLessonIds.length} / {item.plan.lessons.length} lessons complete</span></div><button className="quiet-button" onClick={() => { setActivePlanId(item.id); setTab("planner"); }}>Open plan</button></div>) : <p className="empty-state">Your saved plans will appear here.</p>}</div>
      </section>}
      <footer className="footer">LearnMate AI · AI-generated guidance should be checked against trusted learning materials.</footer>
    </main>
  );
}
