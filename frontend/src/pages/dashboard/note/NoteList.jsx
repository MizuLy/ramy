import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthProvider";
import {
  getNotes,
  createNote,
  restoreNote,
  permanentDeleteNote,
} from "../../../api/axios";
import { IoSearch } from "react-icons/io5";
import {
  LuPin,
  LuChevronDown,
  LuChevronRight,
  LuFilter,
  LuRotateCcw,
  LuTrash2,
  LuPlus,
  LuFileText,
  LuPanelLeftClose,
} from "react-icons/lu";
import toast from "react-hot-toast";
import ConfirmModal from "../../../components/modals/ConfirmModal";

// Helper: Convert raw HTML body to plain text preview
const stripHtml = (html) => {
  if (!html) return "";
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return (doc.body.textContent || doc.body.innerText || "").trim();
  } catch {
    return "";
  }
};

// Helper: Word count
const getWordCount = (text) => {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
};

// Helper: Relative time formatter
const formatRelativeTime = (dateInput) => {
  if (!dateInput) return null;
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return null;

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

const TIME_FILTERS = {
  all: { label: "All time", matches: () => true },
  today: {
    label: "Today",
    matches: (date) => {
      const now = new Date();
      return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate()
      );
    },
  },
  week: {
    label: "This week",
    matches: (date) => {
      const now = new Date();
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      return date >= weekAgo && date <= now;
    },
  },
  month: {
    label: "This month",
    matches: (date) => {
      const now = new Date();
      return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth()
      );
    },
  },
};

function NoteSkeleton() {
  return (
    <div className="mx-2 my-1 rounded-xl p-3 animate-pulse space-y-2">
      <div className="h-3.5 bg-zinc-900 rounded w-1/2" />
      <div className="h-3 bg-zinc-900/60 rounded w-full" />
      <div className="h-2.5 bg-zinc-900/40 rounded w-1/3" />
    </div>
  );
}

export default function NoteList({
  selectedNoteId,
  onSelectNote,
  refreshKey,
  folderId,
  folderName,
  tagId,
  tagLabel,
  isTrash = false,
  onRefresh,
  onTogglePane,
}) {
  const { accessToken } = useAuth();
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  // Persistent section states
  const [pinnedOpen, setPinnedOpen] = useState(() => {
    const saved = localStorage.getItem("notes_pinned_open");
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [unpinnedOpen, setUnpinnedOpen] = useState(() => {
    const saved = localStorage.getItem("notes_unpinned_open");
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem("notes_pinned_open", JSON.stringify(pinnedOpen));
  }, [pinnedOpen]);

  useEffect(() => {
    localStorage.setItem("notes_unpinned_open", JSON.stringify(unpinnedOpen));
  }, [unpinnedOpen]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const data = await getNotes(accessToken, { trash: isTrash });
      const list = data?.result || data?.data || data || [];
      setNotes(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to fetch notes:", err);
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) fetchNotes();
  }, [accessToken, refreshKey, isTrash]);

  const handleCreateNote = async () => {
    setCreating(true);
    try {
      const payload = { title: "", body: "", tagNames: [] };
      if (folderId) payload.folderId = folderId;
      if (tagLabel) payload.tagNames = [tagLabel];
      const res = await createNote(payload, accessToken);
      const resData = res?.data || res;
      const newNote = resData?.data || resData?.result || resData;
      const newId = newNote?.id || newNote?._id;

      if (newId) {
        const noteWithFolder = {
          ...newNote,
          id: newId,
          folderId: newNote.folderId ?? (folderId || null),
        };
        setNotes((prev) => [noteWithFolder, ...prev]);
        onSelectNote(newId);
        toast.success("Note created");
      }
    } catch (err) {
      console.error("Failed to create note:", err);
      toast.error("Failed to create note");
    } finally {
      setCreating(false);
    }
  };

  const listTitle = isTrash
    ? "Trash"
    : folderId
      ? folderName || "Folder"
      : tagId
        ? tagLabel || "Tag"
        : "All Notes";

  const displayedNotes = notes
    .filter((n) => (!folderId ? true : (n.folderId || "") === folderId))
    .filter((n) =>
      !tagId ? true : (n.tags || []).some((t) => (t.id || t._id) === tagId),
    )
    .filter((n) => {
      const query = search.trim().toLowerCase();
      if (!query) return true;
      return (
        (n.title || "Untitled Note").toLowerCase().includes(query) ||
        stripHtml(n.body).toLowerCase().includes(query)
      );
    })
    .filter((n) => {
      if (timeFilter === "all") return true;
      const created = n.createdAt ? new Date(n.createdAt) : null;
      if (!created || isNaN(created.getTime())) return false;
      return TIME_FILTERS[timeFilter].matches(created);
    })
    .sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0);
      const dateB = new Date(b.updatedAt || b.createdAt || 0);
      return dateB - dateA;
    });

  const pinnedNotes = displayedNotes.filter((n) => n.isPinned);
  const unpinnedNotes = displayedNotes.filter((n) => !n.isPinned);

  const handleRestore = async (e, noteId) => {
    e.stopPropagation();
    try {
      await restoreNote(noteId, accessToken);
      toast.success("Note restored");
      onRefresh?.();
      fetchNotes();
    } catch (err) {
      toast.error("Failed to restore note");
    }
  };

  const handleDeleteForeverRequest = (e, noteId) => {
    e.stopPropagation();
    setPendingDeleteId(noteId);
    setConfirmOpen(true);
  };

  const handleConfirmDeleteForever = async () => {
    if (!pendingDeleteId) return;
    try {
      await permanentDeleteNote(pendingDeleteId, accessToken);
      toast.success("Note permanently deleted");
      onRefresh?.();
      fetchNotes();
    } catch (err) {
      toast.error("Failed to delete note");
    } finally {
      setConfirmOpen(false);
      setPendingDeleteId(null);
    }
  };

  const renderNoteCard = (note) => {
    const id = note.id || note._id;
    const isSelected = selectedNoteId === id;
    const plainText = stripHtml(note.body);
    const words = getWordCount(plainText);
    const formattedDate = formatRelativeTime(note.updatedAt || note.createdAt);

    return (
      <div
        key={id}
        onClick={() => onSelectNote(id)}
        className={`group relative mx-2 my-0.5 cursor-pointer rounded-xl p-3 transition-colors duration-150 ${
          isSelected ? "bg-zinc-900 ring-1 ring-accent/30" : "hover:bg-zinc-900/60"
        }`}
      >
        {isSelected && (
          <span className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-accent" />
        )}
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-sm font-medium text-zinc-100 truncate flex-1">
            {note.title || "Untitled Note"}
          </h3>
          {note.isPinned && (
            <LuPin size={12} className="text-accent-soft rotate-45 shrink-0 mt-0.5" />
          )}
        </div>

        <p className="text-xs text-zinc-500 line-clamp-2 mb-2 leading-relaxed">
          {plainText || "Empty note..."}
        </p>

        <div className="flex items-center justify-between text-[11px] text-zinc-600">
          <span>
            {formattedDate} · {words} {words === 1 ? "word" : "words"}
          </span>

          {isTrash && (
            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => handleRestore(e, id)}
                className="p-1 rounded-md text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 transition-colors"
                title="Restore"
              >
                <LuRotateCcw size={12} />
              </button>
              <button
                onClick={(e) => handleDeleteForeverRequest(e, id)}
                className="p-1 rounded-md text-zinc-400 hover:text-danger-soft hover:bg-zinc-800 transition-colors"
                title="Delete permanently"
              >
                <LuTrash2 size={12} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full border-r border-zinc-800/80 bg-zinc-950 flex flex-col select-none shrink-0 font-sans">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold tracking-tight text-zinc-100">
              {listTitle}
            </h1>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800 tabular-nums">
              {displayedNotes.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {!isTrash && (
              <button
                onClick={handleCreateNote}
                disabled={creating}
                className="p-1.5 rounded-lg bg-accent text-accent-ink hover:bg-accent-soft transition-colors disabled:opacity-50"
                title="Create note"
              >
                <LuPlus size={16} />
              </button>
            )}

            {/* Collapse Button - Desktop only */}
            {onTogglePane && (
              <button
                onClick={onTogglePane}
                className="hidden sm:flex p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
                title="Hide Note List"
              >
                <LuPanelLeftClose size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <IoSearch
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-500 outline-none focus:border-accent/60 transition-colors"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-1.5 rounded-lg border text-xs flex items-center transition-colors ${
                timeFilter !== "all"
                  ? "bg-accent/15 text-accent-soft border-accent/40"
                  : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300 hover:border-zinc-700"
              }`}
            >
              <LuFilter size={12} />
            </button>

            {showFilters && (
              <div className="absolute right-0 mt-2 w-40 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl shadow-black/40 p-1 z-20 menu-pop">
                {Object.entries(TIME_FILTERS).map(([key, { label }]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setTimeFilter(key);
                      setShowFilters(false);
                    }}
                    className={`w-full text-left rounded-md px-2.5 py-1.5 text-[11px] transition-colors ${
                      timeFilter === key
                        ? "text-accent-soft bg-accent/15 font-medium"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Note List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <>
            <NoteSkeleton />
            <NoteSkeleton />
            <NoteSkeleton />
          </>
        ) : displayedNotes.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900 text-zinc-500">
              <LuFileText size={20} />
            </div>
            <p className="text-sm text-zinc-400">No notes found</p>
            <p className="text-xs text-zinc-600">
              {isTrash
                ? "Deleted notes show up here."
                : search
                  ? "Try a different search."
                  : "Create one with the + button."}
            </p>
          </div>
        ) : (
          <div>
            {/* PINNED SECTION */}
            {pinnedNotes.length > 0 && (
              <div className="border-b border-zinc-800/70 pb-1 mb-1">
                <button
                  onClick={() => setPinnedOpen(!pinnedOpen)}
                  className="w-full px-4 py-2 flex items-center justify-between text-[11px] font-semibold text-zinc-500 uppercase tracking-wider hover:text-zinc-300 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    {pinnedOpen ? (
                      <LuChevronDown size={12} />
                    ) : (
                      <LuChevronRight size={12} />
                    )}
                    Pinned ({pinnedNotes.length})
                  </span>
                </button>

                {pinnedOpen && (
                  <div>{pinnedNotes.map((note) => renderNoteCard(note))}</div>
                )}
              </div>
            )}

            {/* UNPINNED SECTION */}
            {unpinnedNotes.length > 0 && (
              <div>
                {pinnedNotes.length > 0 && (
                  <button
                    onClick={() => setUnpinnedOpen(!unpinnedOpen)}
                    className="w-full px-4 py-2 flex items-center justify-between text-[11px] font-semibold text-zinc-500 uppercase tracking-wider hover:text-zinc-300 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      {unpinnedOpen ? (
                        <LuChevronDown size={12} />
                      ) : (
                        <LuChevronRight size={12} />
                      )}
                      Notes ({unpinnedNotes.length})
                    </span>
                  </button>
                )}

                {(unpinnedOpen || pinnedNotes.length === 0) && (
                  <div>{unpinnedNotes.map((note) => renderNoteCard(note))}</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        title="Delete note permanently?"
        message="This action cannot be undone."
        onClose={() => {
          setConfirmOpen(false);
          setPendingDeleteId(null);
        }}
        onConfirm={handleConfirmDeleteForever}
      />
    </div>
  );
}
