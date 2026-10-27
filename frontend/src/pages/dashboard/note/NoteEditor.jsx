import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../../context/AuthProvider";
import {
  getNoteId,
  updateNote,
  createNote,
  getFolders,
  getTags,
  deleteNote,
  restoreNote,
  permanentDeleteNote,
  togglePin,
  addEditor,
  removeEditor,
} from "../../../api/axios";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import toast from "react-hot-toast";
import ConfirmModal from "../../../components/modals/ConfirmModal";
import Dropdown from "../../../components/Dropdown";

import {
  LuArrowLeft,
  LuPin,
  LuBold,
  LuItalic,
  LuUnderline,
  LuStrikethrough,
  LuList,
  LuListOrdered,
  LuCode,
  LuQuote,
  LuPlus,
  LuUndo,
  LuRedo,
  LuSave,
  LuFolder,
  LuTag,
  LuX,
  LuUser,
  LuCalendar,
  LuTrash2,
  LuRotateCcw,
  LuUsers,
  LuUserPlus,
} from "react-icons/lu";

const getWordCount = (text) => {
  if (!text) return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
};

const formatRelativeTime = (date) => {
  if (!date) return null;
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

const formatDateFormatted = (dateStr) => {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return date.toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const getReadTime = (words) => Math.max(1, Math.round(words / 200));

export default function NoteEditor({
  noteId,
  onNoteUpdated,
  onSelectNote,
  onTrashed,
  onBack,
  defaultFolderId = "",
  isTrash = false,
}) {
  const { accessToken } = useAuth();
  const [title, setTitle] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [createdAtRaw, setCreatedAtRaw] = useState(null);
  const [updatedAtRaw, setUpdatedAtRaw] = useState(null);
  const [trashing, setTrashing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [noteOwner, setNoteOwner] = useState(null);

  // Editors & Modal State
  const [editors, setEditors] = useState([]);
  const [isEditorsModalOpen, setIsEditorsModalOpen] = useState(false);
  const [editorEmailInput, setEditorEmailInput] = useState("");
  const [editorAction, setEditorAction] = useState(null);

  const [folders, setFolders] = useState([]);
  const [folderId, setFolderId] = useState("");

  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);

  const activeNoteIdRef = useRef(noteId);
  const titleRef = useRef(title);
  const isPinnedRef = useRef(isPinned);
  const selectedTagsRef = useRef(selectedTags);
  const saveTimeoutRef = useRef(null);
  const isLoadingRef = useRef(false);

  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    activeNoteIdRef.current = noteId;
  }, [noteId]);

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  useEffect(() => {
    isPinnedRef.current = isPinned;
  }, [isPinned]);

  useEffect(() => {
    selectedTagsRef.current = selectedTags;
  }, [selectedTags]);

  // Load Folders & Tags list
  useEffect(() => {
    if (!accessToken) return;
    const fetchData = async () => {
      try {
        const [foldersRes, tagsRes] = await Promise.all([
          getFolders(accessToken),
          getTags(accessToken),
        ]);
        const fList =
          foldersRes?.data || foldersRes?.result || foldersRes || [];
        const tList = tagsRes?.data || tagsRes?.result || tagsRes || [];
        setFolders(Array.isArray(fList) ? fList : []);
        setAvailableTags(Array.isArray(tList) ? tList : []);
      } catch (err) {
        console.error("Failed to load options:", err);
      }
    };
    fetchData();
  }, [accessToken]);

  const performSave = async (
    targetId,
    newTitle,
    newBody,
    newPinned,
    tagsList,
    isManual = false,
  ) => {
    if (!targetId) return;

    setSaving(true);
    try {
      const tagNames = tagsList.map((t) =>
        typeof t === "string" ? t : t.tag || t.name || t.tagName,
      );
      const res = await updateNote(
        targetId,
        { title: newTitle, body: newBody, isPinned: newPinned, tagNames },
        accessToken,
      );

      const updatedNote = res?.data?.data || res?.data || res?.result || res;

      if (updatedNote?.updatedAt) {
        setUpdatedAtRaw(updatedNote.updatedAt);
      }

      setLastSavedAt(new Date());
      onNoteUpdated?.();

      if (isManual) {
        toast.success("Note saved successfully!");
      }
    } catch (err) {
      console.error("Save failed:", err);
      toast.error(err?.response?.data?.error || "Failed to save note");
    } finally {
      setSaving(false);
    }
  };

  const debouncedSave = (newTitle, newBody, newPinned, tagsList) => {
    const targetId = activeNoteIdRef.current;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      performSave(targetId, newTitle, newBody, newPinned, tagsList, false);
    }, 800);
  };

  const handleManualSave = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    performSave(
      activeNoteIdRef.current,
      title,
      editor?.getHTML() || "",
      isPinned,
      selectedTags,
      true,
    );
  };

  const handleFolderChange = async (e) => {
    const targetId = activeNoteIdRef.current;
    const newFolderId = e.target.value || null;
    setFolderId(e.target.value);
    if (!targetId) return;

    try {
      await updateNote(targetId, { folderId: newFolderId }, accessToken);
      setLastSavedAt(new Date());
      onNoteUpdated?.();
      toast.success("Moved to folder");
    } catch (err) {
      console.error("Failed to change folder:", err);
      toast.error("Failed to move note to folder");
    }
  };

  const handleAddTag = (e) => {
    const tagVal = e.target.value;
    if (!tagVal) return;

    const exists = selectedTags.some(
      (t) => (t.id || t._id || t.name || t.tag || t) === tagVal,
    );

    if (!exists) {
      const foundTag =
        availableTags.find(
          (t) => (t.id || t._id || t.name || t.tag) === tagVal,
        ) || tagVal;

      const updated = [...selectedTags, foundTag];
      setSelectedTags(updated);
      debouncedSave(title, editor?.getHTML() || "", isPinned, updated);
      toast.success("Tag added");
    }
    e.target.value = "";
  };

  const handleRemoveTag = (tagToRemove) => {
    const targetVal =
      tagToRemove.id ||
      tagToRemove._id ||
      tagToRemove.name ||
      tagToRemove.tag ||
      tagToRemove;
    const updated = selectedTags.filter((t) => {
      const val = t.id || t._id || t.name || t.tag || t;
      return val !== targetVal;
    });
    setSelectedTags(updated);
    debouncedSave(title, editor?.getHTML() || "", isPinned, updated);
    toast.success("Tag removed");
  };

  // Editor Handlers
  const handleAddEditor = async (e) => {
    e.preventDefault();
    if (!editorEmailInput.trim() || !noteId) return;

    setEditorAction({ type: "add" });
    try {
      const res = await addEditor(noteId, editorEmailInput.trim(), accessToken);
      toast.success(res?.message || "Editor added successfully");
      const updatedNote = res?.result;
      if (updatedNote?.editors) {
        setEditors(updatedNote.editors);
      }
      setEditorEmailInput("");
    } catch (err) {
      console.error("Failed to add editor:", err);
      toast.error(err?.response?.data?.error || "Failed to add editor");
    } finally {
      setEditorAction(null);
    }
  };

  const handleRemoveEditor = async (emailToRemove) => {
    if (!noteId) return;

    setEditorAction({ type: "remove", email: emailToRemove });
    try {
      const res = await removeEditor(noteId, emailToRemove, accessToken);
      toast.success(res?.message || "Editor removed");
      const updatedNote = res?.result;
      if (updatedNote?.editors) {
        setEditors(updatedNote.editors);
      } else {
        setEditors((prev) => prev.filter((e) => e.email !== emailToRemove));
      }
    } catch (err) {
      console.error("Failed to remove editor:", err);
      toast.error(err?.response?.data?.error || "Failed to remove editor");
    } finally {
      setEditorAction(null);
    }
  };

  // Tiptap Setup
  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    editorProps: {
      attributes: {
        class:
          "focus:outline-none min-h-[300px] text-sm text-zinc-200 leading-relaxed [&_h1]:text-xl sm:[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-lg sm:[&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-2 [&_h3]:text-base sm:[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:border-zinc-700 [&_blockquote]:pl-3 [&_blockquote]:italic [&_code]:bg-zinc-800 [&_code]:px-1 [&_code]:rounded",
      },
    },
    onUpdate: ({ editor }) => {
      setWordCount(getWordCount(editor.getText()));
      if (isLoadingRef.current) return;
      if (activeNoteIdRef.current) {
        debouncedSave(
          titleRef.current,
          editor.getHTML(),
          isPinnedRef.current,
          selectedTagsRef.current,
        );
      }
    },
  });

  // Load Note
  useEffect(() => {
    if (!noteId) {
      setTitle("");
      setIsPinned(false);
      setWordCount(0);
      setLastSavedAt(null);
      setFolderId("");
      setSelectedTags([]);
      setEditors([]);
      if (editor && !editor.isDestroyed) {
        isLoadingRef.current = true;
        editor.commands.setContent("", { emitUpdate: false });
        queueMicrotask(() => {
          isLoadingRef.current = false;
        });
      }
      return;
    }

    let cancelled = false;

    const fetchNote = async () => {
      try {
        const data = await getNoteId(noteId, accessToken, { trash: isTrash });
        const found = data?.data || data?.result || data;

        if (found && !cancelled && editor && !editor.isDestroyed) {
          isLoadingRef.current = true;

          setTitle(found.title || "");
          const pinnedValue =
            found.isPinned ?? found.pinned ?? found.is_pinned ?? false;
          setIsPinned(pinnedValue);
          setFolderId(found.folderId || "");

          const initialTags = found.tags || found.tagNames || [];
          setSelectedTags(Array.isArray(initialTags) ? initialTags : []);
          selectedTagsRef.current = Array.isArray(initialTags)
            ? initialTags
            : [];

          setNoteOwner(found.user || null);
          setEditors(Array.isArray(found.editors) ? found.editors : []);

          setCreatedAtRaw(found.createdAt);
          setUpdatedAtRaw(found.updatedAt);

          editor.commands.setContent(found.body || "", { emitUpdate: false });
          setWordCount(getWordCount(editor.getText()));

          const savedTimestamp = found.updatedAt || found.createdAt;
          setLastSavedAt(savedTimestamp ? new Date(savedTimestamp) : null);

          titleRef.current = found.title || "";
          isPinnedRef.current = pinnedValue;

          queueMicrotask(() => {
            isLoadingRef.current = false;
          });
        }
      } catch (err) {
        console.error("Failed to load note:", err);
        toast.error("Failed to load note details");
      }
    };

    fetchNote();

    return () => {
      cancelled = true;
    };
  }, [noteId, accessToken, editor, isTrash]);

  const handleCreateNew = async () => {
    setCreating(true);
    try {
      const payload = { title: "", body: "", tagNames: [] };
      if (defaultFolderId) payload.folderId = defaultFolderId;
      const res = await createNote(payload, accessToken);

      const resData = res?.data || res;
      const newNote = resData?.data || resData?.result || resData;
      const newId = newNote?.id || newNote?._id;

      if (newId) {
        setTitle(newNote.title || "");
        setWordCount(0);
        setLastSavedAt(new Date());
        setFolderId(newNote.folderId || defaultFolderId || "");
        setSelectedTags([]);
        setEditors([]);
        if (editor && !editor.isDestroyed) {
          isLoadingRef.current = true;
          editor.commands.setContent("", { emitUpdate: false });
          queueMicrotask(() => {
            isLoadingRef.current = false;
          });
        }
        await onNoteUpdated?.();
        onSelectNote?.(newId);
        toast.success("Created new note");
      }
    } catch (err) {
      console.error("Failed to create note:", err);
      toast.error("Failed to create new note");
    } finally {
      setCreating(false);
    }
  };

  const handleTogglePin = async () => {
    if (!noteId) return;

    const nextPinnedState = !isPinned;
    setIsPinned(nextPinnedState);

    try {
      await togglePin(noteId, nextPinnedState, accessToken);
      onNoteUpdated?.();
      toast.success(nextPinnedState ? "Note pinned to top" : "Note unpinned");
    } catch (err) {
      console.error("Failed to toggle pin state:", err);
      setIsPinned(!nextPinnedState);
      toast.error("Failed to update pin state");
    }
  };

  const handleMoveToTrash = async () => {
    if (!noteId) return;
    setTrashing(true);
    try {
      await deleteNote(noteId, accessToken);
      toast.success("Note moved to trash");
      onTrashed?.();
    } catch (err) {
      console.error("Failed to move to trash:", err);
      toast.error(err?.response?.data?.error || "Failed to move to trash");
    } finally {
      setTrashing(false);
    }
  };

  const handleRestore = async () => {
    if (!noteId) return;
    setTrashing(true);
    try {
      await restoreNote(noteId, accessToken);
      toast.success("Note restored");
      onNoteUpdated?.();
    } catch (err) {
      console.error("Failed to restore note:", err);
      toast.error(err?.response?.data?.error || "Failed to restore note");
    } finally {
      setTrashing(false);
    }
  };

  const handleDeleteForeverRequest = () => {
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!noteId) return;
    setTrashing(true);
    try {
      await permanentDeleteNote(noteId, accessToken);
      toast.success("Note permanently deleted");
      onTrashed?.();
    } catch (err) {
      console.error("Failed to delete note permanently:", err);
      toast.error(err?.response?.data?.error || "Failed to delete note");
    } finally {
      setConfirmOpen(false);
      setTrashing(false);
    }
  };

  if (!noteId) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center bg-zinc-950 text-zinc-500 select-none p-4">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="sm:hidden mb-4 self-start flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <LuArrowLeft size={14} /> Back to notes
          </button>
        )}
        <p className="text-sm font-medium mb-3 text-zinc-400">
          No note selected
        </p>
        <button
          type="button"
          onClick={handleCreateNew}
          disabled={creating}
          className="px-4 py-2 bg-accent text-accent-ink text-xs font-medium rounded-md hover:bg-accent-soft transition-colors"
        >
          {creating ? "Creating..." : "+ Create a new note"}
        </button>
      </div>
    );
  }

  const savedLabel = saving
    ? "Saving..."
    : lastSavedAt
      ? `Saved ${formatRelativeTime(lastSavedAt)}`
      : "Draft";
  const readTime = getReadTime(wordCount);

  return (
    <div className="flex-1 h-full flex flex-col bg-zinc-950 text-zinc-200 overflow-hidden relative">
      <div className="w-full max-w-2xl mx-auto flex flex-col h-full">
        {/* Top action bar */}
        <div className="px-3 sm:px-4 pt-3 sm:pt-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                title="Back to notes"
                className="sm:hidden p-1.5 rounded-md border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors shrink-0"
              >
                <LuArrowLeft size={14} />
              </button>
            )}
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] sm:text-xs font-medium border shrink-0 ${
                saving
                  ? "text-zinc-300 border-zinc-700 bg-zinc-900"
                  : "text-zinc-500 border-zinc-800 bg-zinc-900/60"
              }`}
            >
              {saving && (
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse" />
              )}
              {savedLabel}
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {!isTrash && (
              <>
                {/* Folder selection dropdown */}
                <Dropdown
                  value={folderId || ""}
                  options={[
                    { value: "", label: "No folder" },
                    ...folders.map((folder) => ({
                      value: folder.id || folder._id,
                      label: folder.name,
                    })),
                  ]}
                  onChange={(v) => handleFolderChange({ target: { value: v } })}
                  icon={LuFolder}
                  title="Move to folder"
                  triggerClassName="rounded-lg border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700 max-w-[120px] sm:max-w-[150px]"
                />

                <button
                  type="button"
                  onClick={handleTogglePin}
                  title={isPinned ? "Unpin note" : "Pin note"}
                  className={`p-1.5 rounded-md border transition-colors ${
                    isPinned
                      ? "bg-accent/15 text-accent-soft border-accent/40"
                      : "text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800"
                  }`}
                >
                  <LuPin
                    size={14}
                    className={isPinned ? "rotate-45 transition-transform" : ""}
                  />
                </button>
              </>
            )}

            {!isTrash ? (
              <button
                type="button"
                onClick={handleMoveToTrash}
                disabled={trashing || saving}
                title="Move to trash"
                className="p-1.5 rounded-md border border-zinc-800 text-zinc-400 hover:text-danger-soft hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                <LuTrash2 size={14} />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleRestore}
                  disabled={trashing || saving}
                  title="Restore note"
                  className="p-1.5 rounded-md border border-zinc-800 text-zinc-400 hover:text-green-400 hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  <LuRotateCcw size={14} />
                </button>
                <button
                  type="button"
                  onClick={handleDeleteForeverRequest}
                  disabled={trashing || saving}
                  title="Delete permanently"
                  className="p-1.5 rounded-md border border-zinc-800 text-zinc-400 hover:text-danger-soft hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  <LuTrash2 size={14} />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={handleManualSave}
              disabled={saving}
              title="Save note"
              className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 text-xs font-medium rounded-md transition-colors disabled:opacity-50"
            >
              <LuSave size={12} className={saving ? "animate-pulse" : ""} />
              <span className="hidden sm:inline">
                {saving ? "Saving..." : "Save"}
              </span>
            </button>

            {!isTrash && (
              <button
                type="button"
                onClick={handleCreateNew}
                disabled={creating}
                title="New Note"
                className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 bg-accent hover:bg-accent-soft text-accent-ink text-xs font-medium rounded-md transition-colors disabled:opacity-50"
              >
                <LuPlus size={12} />
                <span className="hidden sm:inline">
                  {creating ? "Creating..." : "New Note"}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Title input */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="px-3 sm:px-4 pt-4">
          <input
            type="text"
            value={title}
            onChange={(e) => {
              const val = e.target.value;
              setTitle(val);
              debouncedSave(
                val,
                editor?.getHTML() || "",
                isPinned,
                selectedTags,
              );
            }}
            placeholder="Untitled"
            className="text-2xl sm:text-3xl font-bold bg-transparent text-white outline-none w-full placeholder-zinc-600 tracking-tight"
          />
          <p className="mt-1 text-[11px] sm:text-xs text-zinc-500">
            {wordCount} {wordCount === 1 ? "word" : "words"} · {readTime}{" "}
            {readTime === 1 ? "min" : "min"} read
          </p>
        </div>

        {/* METADATA SECTION */}
        <div className="px-3 sm:px-4 pt-3 sm:pt-4 pb-2 space-y-2 sm:space-y-2.5 text-xs text-zinc-400">
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4">
            <span className="w-24 text-zinc-500 flex items-center gap-1.5 shrink-0 text-[11px] sm:text-xs">
              <LuUser size={14} /> Created by
            </span>
            <div className="flex items-center gap-2 text-zinc-300 font-medium">
              <span>{noteOwner?.name || noteOwner?.email || "Unknown"}</span>
            </div>
          </div>

          {/* EDITORS ROW */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4">
            <span className="w-24 text-zinc-500 flex items-center gap-1.5 shrink-0 text-[11px] sm:text-xs">
              <LuUsers size={14} /> Editors
            </span>
            <div className="flex items-center gap-2">
              {/* Hover Wrapper */}
              <div className="relative group inline-block">
                <span className="text-zinc-300 font-medium cursor-pointer underline decoration-zinc-700 underline-offset-4 decoration-dotted hover:text-white transition-colors">
                  {editors.length} {editors.length === 1 ? "editor" : "editors"}
                </span>

                {/* Popover / Hover Card */}
                <div className="absolute left-0 top-full pt-1.5 hidden group-hover:block z-50">
                  <div className="w-52 sm:w-56 max-w-[calc(100vw-3rem)] p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl text-xs select-none">
                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                      Note Editors
                    </p>

                    {editors.length === 0 ? (
                      <p className="text-zinc-500 italic">
                        No additional editors
                      </p>
                    ) : (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                        {editors.map((ed) => {
                          const edId = ed.id || ed._id || ed.email;
                          const avatarUrl =
                            ed.image || ed.avatar || ed.picture || null;

                          return (
                            <div
                              key={edId}
                              className="flex items-center gap-2 border-b border-zinc-800/60 pb-1.5 pt-0.5 last:border-none last:pb-0"
                            >
                              <div className="w-6 h-6 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700/60 flex items-center justify-center shrink-0">
                                {avatarUrl ? (
                                  <img
                                    src={avatarUrl}
                                    alt={ed.name || "Editor"}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-[10px] font-semibold text-zinc-400 uppercase">
                                    {(ed.name || ed.email || "U").charAt(0)}
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-col min-w-0">
                                <span className="text-zinc-200 font-medium truncate">
                                  {ed.name || "User"}
                                </span>
                                <span className="text-zinc-500 text-[10px] truncate">
                                  {ed.email}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {!isTrash && (
                <button
                  type="button"
                  onClick={() => setIsEditorsModalOpen(true)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:text-white text-zinc-400 text-[11px] sm:text-xs font-medium transition-colors"
                >
                  <LuUserPlus size={12} /> Manage
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4">
            <span className="w-24 text-zinc-500 flex items-center gap-1.5 shrink-0 text-[11px] sm:text-xs">
              <LuCalendar size={14} /> Last Modified
            </span>
            <span className="text-zinc-300 font-medium">
              {formatDateFormatted(updatedAtRaw || createdAtRaw)}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
            <span className="w-24 text-zinc-500 flex items-center gap-1.5 shrink-0 pt-0.5 text-[11px] sm:text-xs">
              <LuTag size={14} /> Tags
            </span>
            <div className="flex-1 flex flex-wrap items-center gap-1.5 min-w-0">
              {selectedTags.map((tagObj, idx) => {
                const label =
                  typeof tagObj === "string"
                    ? tagObj
                    : tagObj.tag || tagObj.name || tagObj.tagName || "Tag";
                const key = tagObj.id || tagObj._id || idx;

                return (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60 text-zinc-300 text-xs font-medium max-w-full truncate"
                  >
                    <span className="truncate">{label}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tagObj)}
                      className="text-zinc-400 hover:text-white transition-colors shrink-0"
                    >
                      <LuX size={12} />
                    </button>
                  </span>
                );
              })}

              <Dropdown
                value=""
                label="+ Add tag"
                variant="dashed"
                options={availableTags.map((t) => ({
                  value: t.id || t._id || t.name || t.tag,
                  label: t.tag || t.name || t.tagName,
                }))}
                onChange={(v) => handleAddTag({ target: { value: v } })}
              />
            </div>
          </div>
        </div>

        {/* Toolbar */}
        {editor && (
          <div className="sticky top-0 z-10 mx-3 sm:mx-4 mt-3 border-y border-zinc-800 bg-zinc-950 py-1.5 flex items-center gap-0.5 text-zinc-400 text-xs select-none overflow-x-auto custom-scrollbar shrink-0">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
              className={`px-2 py-1 rounded-lg font-bold hover:bg-zinc-800 hover:text-white shrink-0 transition-colors ${
                editor.isActive("heading", { level: 1 })
                  ? "bg-accent/15 text-accent-soft"
                  : ""
              }`}
            >
              H1
            </button>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              className={`px-2 py-1 rounded-lg font-bold hover:bg-zinc-800 hover:text-white shrink-0 transition-colors ${
                editor.isActive("heading", { level: 2 })
                  ? "bg-accent/15 text-accent-soft"
                  : ""
              }`}
            >
              H2
            </button>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
              className={`px-2 py-1 rounded-lg font-bold hover:bg-zinc-800 hover:text-white shrink-0 transition-colors ${
                editor.isActive("heading", { level: 3 })
                  ? "bg-accent/15 text-accent-soft"
                  : ""
              }`}
            >
              H3
            </button>

            <div className="w-px h-5 bg-zinc-800 mx-1.5 shrink-0" />

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-1.5 rounded-lg hover:bg-zinc-800 hover:text-white shrink-0 transition-colors ${
                editor.isActive("bold") ? "bg-accent/15 text-accent-soft" : ""
              }`}
              title="Bold"
            >
              <LuBold size={16} />
            </button>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-1.5 rounded-lg hover:bg-zinc-800 hover:text-white shrink-0 transition-colors ${
                editor.isActive("italic") ? "bg-accent/15 text-accent-soft" : ""
              }`}
              title="Italic"
            >
              <LuItalic size={16} />
            </button>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`p-1.5 rounded-lg hover:bg-zinc-800 hover:text-white shrink-0 transition-colors ${
                editor.isActive("underline") ? "bg-accent/15 text-accent-soft" : ""
              }`}
              title="Underline"
            >
              <LuUnderline size={16} />
            </button>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`p-1.5 rounded-lg hover:bg-zinc-800 hover:text-white shrink-0 transition-colors ${
                editor.isActive("strike") ? "bg-accent/15 text-accent-soft" : ""
              }`}
              title="Strikethrough"
            >
              <LuStrikethrough size={16} />
            </button>

            <div className="w-px h-5 bg-zinc-800 mx-1.5 shrink-0" />

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-1.5 rounded-lg hover:bg-zinc-800 hover:text-white shrink-0 transition-colors ${
                editor.isActive("bulletList") ? "bg-accent/15 text-accent-soft" : ""
              }`}
              title="Bullet List"
            >
              <LuList size={16} />
            </button>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`p-1.5 rounded-lg hover:bg-zinc-800 hover:text-white shrink-0 transition-colors ${
                editor.isActive("orderedList") ? "bg-accent/15 text-accent-soft" : ""
              }`}
              title="Numbered List"
            >
              <LuListOrdered size={16} />
            </button>

            <div className="w-px h-5 bg-zinc-800 mx-1.5 shrink-0" />

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={`p-1.5 rounded-lg hover:bg-zinc-800 hover:text-white shrink-0 transition-colors ${
                editor.isActive("codeBlock") ? "bg-accent/15 text-accent-soft" : ""
              }`}
              title="Code Block"
            >
              <LuCode size={16} />
            </button>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={`p-1.5 rounded-lg hover:bg-zinc-800 hover:text-white shrink-0 transition-colors ${
                editor.isActive("blockquote") ? "bg-accent/15 text-accent-soft" : ""
              }`}
              title="Quote"
            >
              <LuQuote size={16} />
            </button>

            <div className="w-px h-5 bg-zinc-800 mx-1.5 shrink-0" />

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="p-1.5 rounded-lg hover:bg-zinc-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent shrink-0 transition-colors"
              title="Undo"
            >
              <LuUndo size={16} />
            </button>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="p-1.5 rounded-lg hover:bg-zinc-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent shrink-0 transition-colors"
              title="Redo"
            >
              <LuRedo size={16} />
            </button>
          </div>
        )}

        {/* Editor Body */}
        <div className="px-3 sm:px-4 pt-5 pb-28">
          <EditorContent editor={editor} />
        </div>
        </div>
      </div>

      {/* MANAGE EDITORS MODAL */}
      {isEditorsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <LuUsers size={16} /> Manage Note Editors
              </h3>
              <button
                type="button"
                onClick={() => setIsEditorsModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-md transition-colors"
              >
                <LuX size={16} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <form onSubmit={handleAddEditor} className="flex gap-2">
                <input
                  type="email"
                  value={editorEmailInput}
                  onChange={(e) => setEditorEmailInput(e.target.value)}
                  placeholder="Enter user email..."
                  required
                  className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-accent/60 transition-colors"
                />
                <button
                  type="submit"
                  disabled={editorAction?.type === "add"}
                  className="px-3 py-1.5 bg-accent hover:bg-accent-soft text-accent-ink text-xs font-medium rounded-md transition-colors disabled:opacity-50 shrink-0"
                >
                  {editorAction?.type === "add" ? "Adding..." : "Add"}
                </button>
              </form>

              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                  Current Editors ({editors.length})
                </p>

                {editors.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic py-2">
                    No co-editors added to this note.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                    {editors.map((ed) => {
                      const edId = ed.id || ed._id || ed.email;
                      const isRemoving =
                        editorAction?.type === "remove" &&
                        editorAction?.email === ed.email;

                      return (
                        <div
                          key={edId}
                          className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/80"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700/60 flex items-center justify-center shrink-0">
                              {ed.image || ed.avatar || ed.picture ? (
                                <img
                                  src={ed.image || ed.avatar || ed.picture}
                                  alt={ed.name || "Editor"}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-xs font-semibold text-zinc-400 uppercase">
                                  {(ed.name || ed.email || "U").charAt(0)}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-medium text-zinc-200 truncate">
                                {ed.name || "User"}
                              </span>
                              <span className="text-[11px] text-zinc-500 truncate">
                                {ed.email}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveEditor(ed.email)}
                            disabled={isRemoving}
                            className="p-1 text-zinc-400 hover:text-danger-soft transition-colors disabled:opacity-50"
                            title="Remove editor"
                          >
                            <LuX size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={confirmOpen}
        title="Delete Permanently"
        message="Are you sure you want to permanently delete this note? This action cannot be undone."
        confirmText="Delete Forever"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
