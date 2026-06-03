"use client";

import { useEffect, useState } from "react";
import Recorder from "@/components/Recorder";
import NoteCard from "@/components/NoteCard";
import { loadNotes, saveNote, Note, DEFAULT_CATEGORIES } from "@/lib/storage";

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [pendingCategory, setPendingCategory] = useState("Personal");

  function refresh() {
    setNotes(loadNotes());
  }

  useEffect(() => {
    refresh();
  }, []);

  function handleResult(transcript: string, actions: string[]) {
    const note: Note = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      transcript,
      actions: actions.map((text) => ({
        id: crypto.randomUUID(),
        text,
        done: false,
      })),
      category: pendingCategory,
    };
    saveNote(note);
    refresh();
  }

  const categories = ["All", ...DEFAULT_CATEGORIES];
  const filtered = activeCategory === "All"
    ? notes
    : notes.filter((n) => n.category === activeCategory);

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 pt-10 pb-4">
        <h1 className="text-2xl font-bold text-gray-800">Voice Notes</h1>
        <p className="text-sm text-gray-400 mt-0.5">Record a thought. Get actionable tasks.</p>

        {/* Category filter tabs */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-none">
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
        {/* Recorder card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col items-center gap-4">
            <Recorder onResult={handleResult} />

            {/* Category picker for new note */}
            <div className="flex items-center gap-2 w-full justify-center">
              <span className="text-xs text-gray-400">Save to:</span>
              <div className="flex gap-1.5 flex-wrap justify-center">
                {DEFAULT_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setPendingCategory(cat)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      pendingCategory === cat
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Notes list */}
        {filtered.length === 0 ? (
          <p className="text-center text-sm text-gray-400 mt-12">
            {activeCategory === "All" ? "No notes yet. Record something above." : `No notes in ${activeCategory}.`}
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((note) => (
              <NoteCard key={note.id} note={note} onChange={refresh} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
