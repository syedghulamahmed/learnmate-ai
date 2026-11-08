import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { tutorRequestSchema } from "@/lib/schemas";

export const runtime = "nodejs";

const tutorInstructions = [
  "You are LearnMate AI, a patient, precise personal tutor for university students and interns.",
  "Adapt explanations to the learner's stated subject, level, and goal.",
  "Structure answers with a direct explanation, simple example, key points, and one short practice question.",
  "Do not claim to know private progress, fabricate sources, or overstate certainty.",
].join(" ");

function builtInTutorAnswer(subject: string, level: string, goal: string, question: string) {
  const q = question.toLowerCase();
  if ((q.includes("agentic") && q.includes("generative")) || q.includes("agentic vs generative")) {
    return [
      "BUILT-IN STUDY GUIDE - This explanation is from LearnMate's curated fallback, not an external AI model.",
      "",
      "## Generative AI vs. Agentic AI",
      "**Generative AI** creates new content from a prompt: text, code, images, audio, or summaries. It usually responds to the instruction it receives. Example: asking a model to explain recursion or draft a Python function.",
      "",
      "**Agentic AI** uses a goal, plans steps, chooses tools, observes results, and can repeat actions to complete a task. Example: asking an agent to inspect a codebase, run tests, identify a failing test, edit the code, and run the tests again.",
      "",
      "**Core distinction:** Generative AI focuses on producing content; Agentic AI focuses on pursuing a goal through a sequence of actions. An agent may use a generative model as its reasoning or language engine, so the two are complementary rather than mutually exclusive.",
      "",
      "**Example:** A generative assistant writes an email when asked. An email agent can identify the intended recipient, draft the email, check it against rules, and request approval before sending.",
      "",
      "**Key points:**",
      "- Generative = create an output.",
      "- Agentic = plan and act toward an outcome, often using tools and memory.",
      "- Agents need guardrails, permissions, validation, and human approval for consequential actions.",
      "",
      "**Practice:** A system that reads a question and writes a SQL query is mainly which type? What extra capabilities would make it agentic?",
      "",
      "Level: " + level + " | Goal: " + goal
    ].join("\n");
  }
  return [
    "BUILT-IN STUDY GUIDE - This is a limited fallback, not an AI-generated answer.",
    "",
    "I can currently provide a reliable structured study response for selected core AI concepts, including Generative AI vs Agentic AI. I do not have a verified built-in explanation for this exact question yet.",
    "",
    "Try narrowing the question to one concept, or use this study framework:",
    "1. Define the concept in one sentence.",
    "2. Explain how it works step by step.",
    "3. Give one practical example.",
    "4. Compare it with a related concept.",
    "5. Test your understanding with a short exercise.",
    "",
    "Subject: " + subject + " | Level: " + level + " | Goal: " + goal
  ].join("\n");
}

export async function POST(request: Request) {
  try {
    const length = Number(request.headers.get("content-length") || 0);
    if (length > 16 * 1024) return NextResponse.json({ error: "Request is too large." }, { status: 413 });

    let body: unknown;
    try { body = await request.json(); }
    catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }

    const payload = tutorRequestSchema.parse(body);
    try {
      let response: Response | null = null;
      for (const model of ["nvidia/nemotron-3.5-bolt", "poolside/laguna-xs-2.1"]) {
        try {
          response = await fetch("https://blockrun.ai/api/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model,
              temperature: 0.35,
              max_tokens: 1400,
              messages: [
                { role: "system", content: tutorInstructions + " Answer directly. Never expose hidden reasoning or internal analysis." },
                { role: "user", content: [
                  "Subject: " + payload.subject,
                  "Learner level: " + payload.level,
                  "Learning goal: " + payload.goal,
                  "Question: " + payload.question,
                ].join("\n\n") },
              ],
            }),
            signal: AbortSignal.timeout(22000),
          });
          if (response.ok) break;
        } catch {
          response = null;
        }
      }
      if (!response?.ok) throw new Error("BLOCKRUN_REQUEST_FAILED");
      const data = await response.json();
      const generated = data?.choices?.[0]?.message?.content;
      if (typeof generated === "string" && generated.trim()) {
        return NextResponse.json({ answer: generated.trim(), source: "blockrun" });
      }
      throw new Error("BLOCKRUN_EMPTY_RESPONSE");
    } catch (error) {
      console.warn("LearnMate BlockRun inference unavailable; using labelled fallback.", error instanceof Error ? error.name : "unknown");
    }

    return NextResponse.json({
      answer: builtInTutorAnswer(payload.subject, payload.level, payload.goal, payload.question),
      source: "built-in",
      notice: "Live AI is temporarily unavailable. This is a labelled built-in fallback.",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid input. Check the question and learning settings." }, { status: 400 });
    }
    console.error("LearnMate tutor endpoint failed.");
    return NextResponse.json({ error: "The tutor could not respond. Please try again shortly." }, { status: 500 });
  }
}
