import {
  FiCalendar,
  FiEdit2,
  FiTrash2,
  FiBookOpen,
  FiSearch,
} from "react-icons/fi";

const MOOD_STYLES = {
  HAPPY: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  EXCITED: "text-pink-400 bg-pink-500/10 border-pink-500/20",
  NEUTRAL: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20",
  TIRED: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  ANXIOUS: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  SAD: "text-danger-soft bg-danger/10 border-danger/20",
};

const MOOD_DISPLAY = {
  HAPPY: "Happy",
  EXCITED: "Excited",
  NEUTRAL: "Neutral",
  TIRED: "Tired",
  ANXIOUS: "Anxious",
  SAD: "Sad",
};

const formatEntryDate = (value) => {
  const date = new Date(value || Date.now());
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(!sameYear && { year: "numeric" }),
  });
};

export default function JournalList({
  journals,
  onEdit,
  onSoftDelete,
  searchQuery,
  setSearchQuery,
}) {
  const filtered = journals.filter((item) => {
    const matchesSearch =
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.body?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-zinc-500">
          {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
        </p>
        <div className="relative w-full max-w-xs">
          <FiSearch className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search journals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-2 pl-9 pr-3.5 text-xs text-zinc-100 placeholder-zinc-500 outline-none transition-colors focus:border-accent/60"
          />
        </div>
      </div>

      {/* List Feed */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-zinc-800 py-14 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900 text-zinc-500">
            <FiBookOpen className="h-5 w-5" />
          </div>
          <p className="text-sm text-zinc-400">No journals found</p>
          <p className="text-xs text-zinc-600">
            {searchQuery
              ? "Try a different search."
              : "Start with a new entry."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((item) => {
            const id = item.id || item._id;
            const moodStyle = MOOD_STYLES[item.mood] || MOOD_STYLES.NEUTRAL;
            const moodLabel = MOOD_DISPLAY[item.mood] || "Neutral";

            return (
              <div
                key={id}
                onClick={() => onEdit(item)}
                className="group relative flex cursor-pointer flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
              >
                <div>
                  <span className="mb-3 flex items-center gap-1.5 text-xs text-zinc-500">
                    <FiCalendar className="h-3 w-3" />
                    {formatEntryDate(item.createdAt)}
                  </span>

                  <h3 className="line-clamp-1 text-base font-semibold text-zinc-100">
                    {item.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-400">
                    {item.body}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-zinc-800 pt-3">
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${moodStyle}`}
                  >
                    {moodLabel}
                  </span>

                  <div className="flex items-center gap-1 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(item);
                      }}
                      className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                      title="Edit"
                    >
                      <FiEdit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSoftDelete(id);
                      }}
                      className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-danger/10 hover:text-danger-soft"
                      title="Move to trash"
                    >
                      <FiTrash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
