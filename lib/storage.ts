export type ActionItem = {
  id: string;
  text: string;
  done: boolean;
  deadline?: string | null; // ISO date string e.g. "2026-06-07"
};

export type Note = {
  id: string;
  createdAt: string;
  transcript: string;
  actions: ActionItem[];
  category: string;
};

export const DEFAULT_CATEGORIES = ["Personal", "Work", "Health", "Shopping", "Ideas"];

const KEY = "voice_notes";

export function loadNotes(): Note[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveNote(note: Note) {
  const notes = loadNotes();
  notes.unshift(note);
  localStorage.setItem(KEY, JSON.stringify(notes));
}

export function updateNote(updated: Note) {
  const notes = loadNotes().map((n) => (n.id === updated.id ? updated : n));
  localStorage.setItem(KEY, JSON.stringify(notes));
}

export function deleteNote(id: string) {
  const notes = loadNotes().filter((n) => n.id !== id);
  localStorage.setItem(KEY, JSON.stringify(notes));
}
