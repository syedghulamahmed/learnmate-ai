"use client";

import { FormEvent, useState } from "react";

type Level = "beginner" | "intermediate" | "advanced";

export default function Home() {
  const [question, setQuestion] = useState("");
  const [subject, setSubject] = useState("Artificial Intelligence");
  const [level, setLevel] = useState<Level>("beginner");
  const [goal, setGoal] = useState("Understand the topic and practise it.");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function askTutor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setAnswer("");

    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, subject, level, goal }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Request failed.");
      setAnswer(data.answer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">LearnMate<span> AI</span></div>
        <div className="pill">PERSONALIZED LEARNING ASSISTANT</div>
      </header>

      <section className="hero">
        <div className="eyebrow">Your AI learning companion</div>
        <h1>Learn smarter.<br />Make measurable progress.</h1>
        <p className="sub">Turn difficult topics into manageable learning steps. Ask questions, get explanations adapted to your level, and build a focused learning routine.</p>
      </section>

      <section className="grid">
        <div className="panel">
          <h2>Ask your AI tutor</h2>
          <p className="muted">Set your learning context, then ask a question.</p>
          <form onSubmit={askTutor}>
            <label htmlFor="subject">Subject</label>
            <input id="subject" value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={80} required />
            <label htmlFor="level">Current knowledge level</label>
            <select id="level" value={level} onChange={(event) => setLevel(event.target.value as Level)}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <label htmlFor="goal">Learning goal</label>
            <input id="goal" value={goal} onChange={(event) => setGoal(event.target.value)} maxLength={300} />
            <label htmlFor="question">What would you like to understand?</label>
            <textarea id="question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Example: Explain supervised and unsupervised learning with practical examples..." minLength={2} maxLength={2000} required />
            <button className="primary" type="submit" disabled={busy || question.trim().length < 2}>
              {busy ? "Preparing explanation..." : "Ask LearnMate"}
            </button>
          </form>
          {error && <p className="error" role="alert">{error}</p>}
          {answer && <div className="answer" aria-live="polite"><strong>LearnMate's explanation</strong><br /><br />{answer}</div>}
        </div>

        <aside className="panel">
          <h2>Your learning overview</h2>
          <p className="muted">Your personal learning metrics will appear here after account and progress tracking are connected.</p>
          <div className="stat"><strong>—</strong><span>Learning plan completion</span></div>
          <div className="stat"><strong>—</strong><span>Lessons completed</span></div>
          <div className="stat"><strong>—</strong><span>Topics to revise</span></div>
          <div className="notice">Setup stage: tutor interface and server endpoint are in place. Personalized lesson plans, secure profiles, progress history, and weak-area analytics are upcoming modules.</div>
        </aside>
      </section>
      <footer className="footer">LearnMate AI · Learning support, not a substitute for verified course materials.</footer>
    </main>
  );
}
