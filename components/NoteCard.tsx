"use client";

import { useState } from "react";
import { Note, ActionItem, DEFAULT_CATEGORIES } from "@/lib/storage";

const CATEGORY_COLORS: Record<string, string> = {
  Personal: "bg-purple-100 text-purple-600",
  Work: "bg-blue-100 text-blue-600",
  Health: "bg-green-100 text-green-600",
  Shopping: "bg-orange-100 text-orange-600",
  Ideas: "bg-yellow-100 text-yellow-600",
};

function DeadlineBadge({ deadline, done }: { deadline?: string | null; done: boolean }) {
  if (!deadline || done) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(deadline + "T00:00:00");
  const diff = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  let label = "";
  let className = "";

  if (diff < 0) {
    label = `Overdue by ${Math.abs(diff)}d`;
    className = "bg-red-100 text-red-600";
  } else if (diff === 0) {
    label = "Due today";
    className = "bg-orange-100 text-orange-600";
  } else if (diff === 1) {
    label = "Due tomorrow";
    className = "bg-yellow-100 text-yellow-600";
  } else {
    label = `Due ${due.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
    className = "bg-gray-100 text-gray-500";
  }

  return (
    <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${className}`}>
      {label}
    </span>
  );
}

type Props = {
  note: Note;
  onUpdate: (note: Note) => void;
  onDelete: (id: string) => void;
};

export default function NoteCard({ note, onUpdate, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  function toggleDone(item: ActionItem) {
    onUpdate({ ...note, actions: note.actions.map((a) => a.id === item.id ? { ...a, done: !a.done } : a) });
  }

  function startEdit(item: ActionItem) {
    setEditingId(item.id);
    setEditText(item.text);
  }

  function saveEdit(item: ActionItem) {
    onUpdate({ ...note, actions: note.actions.map((a) => a.id === item.id ? { ...a, text: editText } : a) });
    setEditingId(null);
  }

  function deleteAction(id: string) {
    onUpdate({ ...note, actions: note.actions.filter((a) => a.id !== id) });
  }

  function changeCategory(category: string) {
    onUpdate({ ...note, category });
  }

  function handleDelete() {
    if (confirm("Delete this note?")) {
      onDelete(note.id);
    }
  }

  const date = new Date(note.createdAt).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
  const done = note.actions.filter((a) => a.done).length;
  const colorClass = CATEGORY_COLORS[note.category] || "bg-gray-100 text-gray-500";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="flex justify-between items-start gap-2">
        <div className="flex flex-col gap-1">
          <p className="text-xs text-gray-400">{date}</p>
          <span className={`self-start text-xs font-medium px-2 py-0.5 rounded-full ${colorClass}`}>
            {note.category}
          </span>
        </div>
        <div className="flex gap-3 items-center">
          <p className="text-xs text-gray-400">{done}/{note.actions.length} done</p>
          <button onClick={() => setExpanded((e) => !e)} className="text-xs text-indigo-500">
            {expanded ? "Hide" : "Transcript"}
          </button>
          <button onClick={handleDelete} className="text-xs text-red-400">Delete</button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3">
          <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 leading-relaxed">
            {note.transcript}
          </p>
          <div className="flex gap-1.5 flex-wrap mt-2">
            <span className="text-xs text-gray-400 self-center">Move to:</span>
            {DEFAULT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => changeCategory(cat)}
                className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                  note.category === cat
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      <ul className="mt-3 flex flex-col gap-2.5">
        {note.actions.map((item) => (
          <li key={item.id} className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={item.done}
              onChange={() => toggleDone(item)}
              className="mt-1 w-4 h-4 accent-indigo-600 shrink-0"
            />
            <div className="flex-1 flex flex-col gap-1">
              {editingId === item.id ? (
                <div className="flex gap-1">
                  <input
                    className="flex-1 text-sm border-b border-indigo-400 outline-none py-0.5"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveEdit(item)}
                    autoFocus
                  />
                  <button onClick={() => saveEdit(item)} className="text-xs text-indigo-600 shrink-0">
                    Save
                  </button>
                </div>
              ) : (
                <span
                  className={`text-sm leading-snug ${item.done ? "line-through text-gray-400" : "text-gray-700"}`}
                  onDoubleClick={() => startEdit(item)}
                >
                  {item.text}
                </span>
              )}
              <DeadlineBadge deadline={item.deadline} done={item.done} />
            </div>
            <button onClick={() => deleteAction(item.id)} className="text-gray-300 hover:text-red-400 text-xs shrink-0 mt-0.5">
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
