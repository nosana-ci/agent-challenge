/**
 * Raya custom plugin: note taking and retrieval.
 *
 * The agent keeps a small in-memory note list for the session. This is a
 * lightweight start. If you want notes to survive restarts, back them with
 * SQLite (ElizaOS already sets that up) or an external store.
 *
 * ElizaOS plugin docs: https://elizaos.github.io/eliza/docs/core/plugins
 */

import { type Plugin } from "@elizaos/core";

/**
 * In-memory store. Keys are lowercased topics, values are the note text.
 * Kept simple on purpose so the pattern is easy to copy.
 */
const noteStore = new Map<string, string>();

const saveNoteAction = {
  name: "SAVE_NOTE",
  description: "Save a note under a topic so it can be retrieved later.",
  similes: ["STORE_NOTE", "REMEMBER", "JOT_DOWN"],
  validate: async () => true,
  handler: async (
    _runtime: unknown,
    message: { content: { text: string } }
  ) => {
    const text = message.content.text || "";
    // Expect the user to say something like: save note <topic> : <text>
    const match = text.match(/save note\s+(.+?)\s*:\s*(.+)/i);
    if (!match) {
      console.log("SAVE_NOTE: no topic separator found, storing whole message");
      noteStore.set("general", text);
      return true;
    }
    const topic = match[1].trim().toLowerCase();
    const note = match[2].trim();
    noteStore.set(topic, note);
    console.log(`SAVE_NOTE: stored ${note.length} chars under "${topic}"`);
    return true;
  },
  examples: [],
};

const getNotesAction = {
  name: "GET_NOTES",
  description: "List all saved notes, optionally filtered by topic.",
  similes: ["LIST_NOTES", "RECALL", "SHOW_NOTES"],
  validate: async () => true,
  handler: async (
    _runtime: unknown,
    message: { content: { text: string } }
  ) => {
    const text = message.content.text || "";
    const topic = text.match(/get notes?\s+(.+)/i)?.[1]?.trim().toLowerCase();
    if (topic && noteStore.has(topic)) {
      console.log(`GET_NOTES: ${noteStore.get(topic)}`);
      return true;
    }
    if (noteStore.size === 0) {
      console.log("GET_NOTES: no notes stored yet");
      return true;
    }
    const all = Array.from(noteStore.entries())
      .map(([k, v]) => `- ${k}: ${v}`)
      .join("\n");
    console.log(`GET_NOTES:\n${all}`);
    return true;
  },
  examples: [],
};

export const customPlugin: Plugin = {
  name: "raya-notes-plugin",
  description: "Note taking and retrieval for the Raya research assistant.",
  actions: [saveNoteAction, getNotesAction],
  providers: [],
  evaluators: [],
};

export default customPlugin;
