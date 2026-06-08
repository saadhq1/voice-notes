"use client";

import { useEffect, useState } from "react";
import Recorder from "@/components/Recorder";
import NoteCard from "@/components/NoteCard";
import AuthGate from "@/components/AuthGate";
import { Note, DEFAULT_CATEGORIES } from "@/lib/storage";
import { loadNotesFromDB, saveNoteToDB, updateNoteInDB, deleteNoteFromDB } from "@/lib/db";

function NotesApp() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [loadingNotes, setLoadingNotes] = useState(true);

  async function refresh() {
    try {
      const data = await loadNotesFromDB();
      setNotes(data);
    } catch (e) {
      console.error("Failed to load notes:", e);
    } finally {
      setLoadingNotes(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleResult(
    transcript: string,
    groups: { category: string; actions: { text: string; deadline: string | null }[] }[]
  ) {
    const createdAt = new Date().toISOString();
    for (const group of groups) {
      const note: Note = {
        id: crypto.randomUUID(),
        createdAt,
        transcript,
        actions: group.actions.map((a) => ({
          id: crypto.randomUUID(),
          text: a.text,
          done: false,
          deadline: a.deadline ?? null,
        })),
        category: group.category,
      };
      await saveNoteToDB(note);
    }
    refresh();
  }

  async function handleUpdateNote(note: Note) {
    await updateNoteInDB(note);
    refresh();
  }

  async function handleDeleteNote(id: string) {
    await deleteNoteFromDB(id);
    refresh();
  }

  const categories = ["All", ...DEFAULT_CATEGORIES];
  const filtered = activeCategory === "All"
    ? notes
    : notes.filter((n) => n.category === activeCategory);

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 pt-10 pb-4">
        <h1 className="text-2xl font-bold text-gray-800">Voice Notes</h1>
        <p className="text-sm text-gray-400 mt-0.5">Record a thought. Get actionable tasks.</p>

        <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <Recorder onResult={handleResult} />
          <p className="text-center text-xs text-gray-400 mt-3">
            Category is assigned automatically
          </p>
        </div>

        {loadingNotes ? (
          <div className="flex justify-center mt-12">
            <div className="w-6 h-6 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-gray-400 mt-12">
            {activeCategory === "All" ? "No notes yet. Record something above." : `No notes in ${activeCategory}.`}
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onUpdate={handleUpdateNote}
                onDelete={handleDeleteNote}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <AuthGate>
      {() => <NotesApp />}
    </AuthGate>
  );
}
