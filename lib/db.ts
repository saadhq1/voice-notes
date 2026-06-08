import { createClient } from "./supabase";
import { Note } from "./storage";

export async function loadNotesFromDB(): Promise<Note[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    transcript: row.transcript,
    category: row.category,
    actions: row.actions,
  }));
}

export async function saveNoteToDB(note: Note): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from("notes").insert({
    id: note.id,
    user_id: user?.id,
    created_at: note.createdAt,
    transcript: note.transcript,
    category: note.category,
    actions: note.actions,
  });

  if (error) throw error;
}

export async function updateNoteInDB(note: Note): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("notes")
    .update({ actions: note.actions, category: note.category })
    .eq("id", note.id);

  if (error) throw error;
}

export async function deleteNoteFromDB(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) throw error;
}
