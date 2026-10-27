import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  FiSave,
  FiX,
  FiSmile,
  FiMeh,
  FiFrown,
  FiHeart,
  FiMoon,
  FiAlertCircle,
} from "react-icons/fi";

const MOODS = [
  {
    label: "HAPPY",
    display: "Happy",
    icon: FiSmile,
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    label: "EXCITED",
    display: "Excited",
    icon: FiHeart,
    color: "text-pink-400 bg-pink-500/10 border-pink-500/20",
  },
  {
    label: "NEUTRAL",
    display: "Neutral",
    icon: FiMeh,
    color: "text-zinc-300 bg-zinc-500/10 border-zinc-500/20",
  },
  {
    label: "TIRED",
    display: "Tired",
    icon: FiMoon,
    color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  },
  {
    label: "ANXIOUS",
    display: "Anxious",
    icon: FiAlertCircle,
    color: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  },
  {
    label: "SAD",
    display: "Sad",
    icon: FiFrown,
    color: "text-danger-soft bg-danger/10 border-danger/20",
  },
];

export default function JournalEditor({ journal, onSave, onCancel, loading }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("HAPPY");

  useEffect(() => {
    if (journal) {
      setTitle(journal.title || "");
      setContent(journal.body || journal.content || "");
      setMood(journal.mood || "HAPPY");
    } else {
      setTitle("");
      setContent("");
      setMood("HAPPY");
    }
  }, [journal]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("Journal content cannot be empty");
      return;
    }

    onSave({
      title: title.trim() || "Untitled Journal",
      body: content.trim(),
      mood,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-xl shadow-xl space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          {journal ? "Edit Reflection" : "New Reflection"}
        </h2>

        {/* Mood Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-500">Mood:</span>
          {MOODS.map((m) => {
            const Icon = m.icon;
            const isSelected = mood === m.label;
            return (
              <button
                key={m.label}
                type="button"
                onClick={() => setMood(m.label)}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
                  isSelected
                    ? m.color
                    : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{m.display}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Title */}
      <input
        type="text"
        placeholder="Entry Title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full bg-transparent text-xl font-bold text-zinc-100 placeholder-zinc-600 focus:outline-none"
      />

      {/* Content */}
      <textarea
        rows={6}
        placeholder="Write down your thoughts..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full resize-none bg-transparent text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none leading-relaxed"
      />

      {/* Footer */}
      <div className="flex items-center justify-end border-t border-zinc-800/80 pt-4">
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
            >
              <FiX className="h-3.5 w-3.5" />
              <span>Cancel</span>
            </button>
          )}

          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-accent px-5 py-2 text-xs font-semibold text-accent-ink hover:bg-accent-soft transition-all disabled:opacity-40"
          >
            <FiSave className="h-3.5 w-3.5" />
            <span>{loading ? "Saving..." : journal ? "Update" : "Save"}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
