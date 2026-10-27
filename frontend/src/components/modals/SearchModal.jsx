import { useEffect, useState, useMemo } from "react";
import { IoClose, IoSearch } from "react-icons/io5";
import { LuFileText, LuTag } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";
import { getTags, getNotes } from "../../api/axios"; // Adjust path if needed

const stripHtml = (html) => {
  if (!html) return "";
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
  } catch {
    return "";
  }
};

// Short excerpt of the note text, centred on the first match when there is one.
const getSnippet = (text, query) => {
  if (!text) return "";
  const index = query ? text.toLowerCase().indexOf(query) : -1;
  if (index === -1) return text.slice(0, 110);
  const start = Math.max(0, index - 30);
  const end = Math.min(text.length, index + query.length + 80);
  return `${start > 0 ? "..." : ""}${text.slice(start, end)}${
    end < text.length ? "..." : ""
  }`;
};

export default function SearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [tags, setTags] = useState([]);
  const [notes, setNotes] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);

  const { accessToken } = useAuth();
  const navigate = useNavigate();

  // Helper to trigger open with animation
  const handleOpen = () => {
    setIsOpen(true);
    setTimeout(() => setIsAnimating(true), 10);
  };

  // Helper to trigger close with exit animation duration & reset filters
  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsOpen(false);
      setSearchTerm("");
      setSelectedTags([]);
    }, 200);
  };

  // Bind methods to the ID container so existing Sidebar triggers work
  useEffect(() => {
    const el = document.getElementById("searchModal");
    if (el) {
      el.showModal = handleOpen;
      el.close = handleClose;
    }
  }, []);

  // Fetch tags and notes when modal opens or token is ready
  useEffect(() => {
    if (!accessToken || !isOpen) return;

    const fetchData = async () => {
      try {
        const [tagsRes, notesRes] = await Promise.all([
          getTags(accessToken),
          getNotes ? getNotes(accessToken) : Promise.resolve([]),
        ]);

        const tagsList = tagsRes?.data || tagsRes?.result || tagsRes || [];
        const notesList = notesRes?.data || notesRes?.result || notesRes || [];

        setTags(Array.isArray(tagsList) ? tagsList : []);
        setNotes(Array.isArray(notesList) ? notesList : []);
      } catch (err) {
        console.error("Failed to fetch search data:", err.message);
      }
    };

    fetchData();
  }, [accessToken, isOpen]);

  // Handle closing with Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleToggleTag = (tagId) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  };

  // Live filter notes based on query AND selected tags
  const filteredNotes = useMemo(() => {
    if (!searchTerm.trim() && selectedTags.length === 0) {
      return [];
    }

    return notes.filter((note) => {
      // Search term filter (title or content)
      const query = searchTerm.toLowerCase().trim();
      const matchesQuery =
        !query ||
        note.title?.toLowerCase().includes(query) ||
        stripHtml(note.body).toLowerCase().includes(query);

      // Selected tags filter
      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.every((selectedId) =>
          note.tags?.some((t) => (t.id || t._id || t) === selectedId),
        );

      return matchesQuery && matchesTags;
    });
  }, [notes, searchTerm, selectedTags]);

  const handleSelectNote = (noteId) => {
    handleClose();
    navigate(`/notes/${noteId}`);
  };

  return (
    <div id="searchModal">
      {isOpen && (
        /* Modal Backdrop Fade */
        <div
          className={`fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ease-out ${
            isAnimating ? "opacity-100" : "opacity-0"
          }`}
          onClick={handleClose}
        >
          {/* Modal Content Scale + Fade */}
          <div
            className={`relative w-full max-w-lg bg-zinc-900 text-white rounded-2xl border border-zinc-700 p-5 shadow-2xl shadow-black/50 mx-4 overflow-hidden transform transition-all duration-200 ease-out flex flex-col max-h-[80vh] ${
              isAnimating
                ? "opacity-100 scale-100 translate-y-0"
                : "opacity-0 scale-95 -translate-y-2"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 shrink-0">
              <h3 className="font-semibold text-base text-zinc-100">
                Looking for something, MAGICAL?!
              </h3>
              <button
                type="button"
                onClick={handleClose}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700/60 transition-colors"
                title="Close"
              >
                <IoClose size={18} />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mt-2 shrink-0">
              <IoSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-lg" />
              <input
                type="search"
                placeholder="Type to search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 text-sm text-white placeholder-zinc-500 border border-zinc-800 outline-none focus:border-accent/60 transition-colors"
                autoFocus
              />
            </div>

            {/* Tags Pill Container */}
            {tags.length > 0 && (
              <div className="mt-4 pt-3 border-t border-zinc-700/50 shrink-0">
                <p className="text-xs font-medium text-zinc-400 mb-2">
                  Filter by tags:
                </p>
                <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto pr-1">
                  {tags.map((t) => {
                    const tagId = t.id || t._id;
                    const isSelected = selectedTags.includes(tagId);
                    const label = t.tag || t.tagName || t.name;

                    return (
                      <button
                        key={tagId}
                        type="button"
                        onClick={() => handleToggleTag(tagId)}
                        className={`px-3 py-1 text-xs rounded-full border transition-all ${
                          isSelected
                            ? "bg-accent/15 border-accent/40 text-accent-soft font-medium"
                            : "border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Results Section */}
            <div className="mt-4 pt-3 border-t border-zinc-700/50 overflow-y-auto flex-1 space-y-1 pr-1">
              {filteredNotes.length > 0 ? (
                filteredNotes.map((note) => {
                  const noteId = note.id || note._id;
                  const snippet = getSnippet(
                    stripHtml(note.body),
                    searchTerm.toLowerCase().trim(),
                  );
                  return (
                    <button
                      key={noteId}
                      type="button"
                      onClick={() => handleSelectNote(noteId)}
                      className="w-full text-left p-3 rounded-xl hover:bg-zinc-800 border border-transparent transition-colors flex items-start gap-3 group"
                    >
                      <LuFileText
                        size={18}
                        className="text-zinc-500 group-hover:text-accent-soft shrink-0 mt-0.5 transition-colors"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-medium text-zinc-200 group-hover:text-white truncate">
                          {note.title || "Untitled Note"}
                        </h4>
                        {snippet && (
                          <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">
                            {snippet}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="py-6 text-center text-zinc-500 text-xs">
                  {searchTerm.trim() || selectedTags.length > 0
                    ? "No matching notes found."
                    : "Type a keyword or select a tag above to show results."}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
