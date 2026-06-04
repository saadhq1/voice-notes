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

    // Split into multiple notes grouped by category
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `You are an expert at turning raw, stream-of-consciousness voice notes into clear, actionable items.

Today's date is ${new Date().toISOString().split("T")[0]}.

Given this transcript, group the tasks into categories. Each group becomes a separate note.

Rules:
- Only use these categories: Personal, Work, Health, Shopping, Ideas
- Only create a group if there are actual tasks for it
- Be specific and use action verbs for each task
- If everything belongs to one category, return just one group
- For each action, detect any deadline mentioned (e.g. "by Friday", "before the 15th", "next Monday", "tomorrow")
- Convert deadlines to ISO date format (YYYY-MM-DD) based on today's date
- If no deadline is mentioned for an action, use null

Return a JSON array only — no explanation, no markdown. Format:
[
  {"category": "Shopping", "actions": [{"text": "Buy milk", "deadline": null}, {"text": "Buy eggs", "deadline": null}]},
  {"category": "Work", "actions": [{"text": "Send report to manager", "deadline": "2026-06-07"}, {"text": "Schedule team meeting", "deadline": null}]}
]

Transcript:
${transcript}`,
        },
      ],
    });

    const raw = (message.content[0] as { type: string; text: string }).text;
    let groups: { category: string; actions: { text: string; deadline: string | null }[] }[] = [];

    try {
      const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
      groups = JSON.parse(cleaned);
    } catch {
      // Fallback: single note, no deadlines
      groups = [{
        category: "Personal",
        actions: raw.split("\n").filter((l) => l.trim().length > 0).map((text) => ({ text, deadline: null })),
      }];
    }

    return NextResponse.json({ transcript, groups });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Processing error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
