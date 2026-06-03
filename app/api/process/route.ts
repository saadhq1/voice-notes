import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();

    if (!transcript) {
      return NextResponse.json({ error: "No transcript provided" }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are an expert at turning raw, stream-of-consciousness voice notes into clear, actionable items.

Given this transcript, extract concrete next steps and tasks. Be specific and use action verbs. Return a JSON array of strings only — no explanation, no markdown, just the JSON array.

Transcript:
${transcript}`,
        },
      ],
    });

    const raw = (message.content[0] as { type: string; text: string }).text;
    let actions: string[] = [];

    try {
      const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
      actions = JSON.parse(cleaned);
    } catch {
      actions = raw.split("\n").filter((l) => l.trim().length > 0);
    }

    return NextResponse.json({ actions });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Processing error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
