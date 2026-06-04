import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audio = formData.get("audio") as File;

    if (!audio) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    // Transcribe with Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: "whisper-1",
    });

    const transcript = transcription.text;

    // Extract actionable notes and category with Claude
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are an expert at turning raw, stream-of-consciousness voice notes into clear, actionable items.

Given this transcript:
1. Extract concrete next steps and tasks. Be specific and use action verbs.
2. Pick the single best category from: Personal, Work, Health, Shopping, Ideas.

Return a JSON object only — no explanation, no markdown. Format:
{"category": "Work", "actions": ["Do this", "Do that"]}

Transcript:
${transcript}`,
        },
      ],
    });

    const raw = (message.content[0] as { type: string; text: string }).text;
    let actions: string[] = [];
    let category = "Personal";

    try {
      const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      actions = parsed.actions ?? [];
      category = parsed.category ?? "Personal";
    } catch {
      actions = raw.split("\n").filter((l) => l.trim().length > 0);
    }

    return NextResponse.json({ transcript, actions, category });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Processing error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
