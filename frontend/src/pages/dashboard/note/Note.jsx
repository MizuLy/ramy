import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import NoteList from "./NoteList";
import NoteEditor from "./NoteEditor";
import { useAuth } from "../../../context/AuthProvider";
import { getFolderId, getTags } from "../../../api/axios";
import { LuPanelLeftOpen, LuFileText } from "react-icons/lu";

export default function Notes() {
  const { id, folderId, noteId, tagId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  const isTrash = location.pathname.startsWith("/trash");
  const selectedNoteId = noteId ?? id;

  const [refreshKey, setRefreshKey] = useState(0);
  const [folderName, setFolderName] = useState("");
  const [tagLabel, setTagLabel] = useState("");

  // Pane collapse toggle for desktop/large screens
  const [isListOpen, setIsListOpen] = useState(() => {
    const saved = localStorage.getItem("notelist_pane_open");
    return saved !== null ? JSON.parse(saved) : true;
  });

  const toggleListPane = () => {
    setIsListOpen((prev) => {
      const nextState = !prev;
      localStorage.setItem("notelist_pane_open", JSON.stringify(nextState));
      return nextState;
    });
  };

  const handleSelectedNote = (nextNoteId) => {
    if (isTrash) {
      navigate(nextNoteId ? `/trash/${nextNoteId}` : "/trash");
    } else if (folderId) {
      navigate(`/folders/${folderId}/${nextNoteId}`);
    } else if (tagId) {
      navigate(`/tags/${tagId}/${nextNoteId}`);
    } else {
      navigate(`/notes/${nextNoteId}`);
    }
  };

  // Clears selection to show mobile note list
  const handleBack = () => {
    if (isTrash) {
      navigate("/trash");
    } else if (folderId) {
      navigate(`/folders/${folderId}`);
    } else if (tagId) {
      navigate(`/tags/${tagId}`);
    } else {
      navigate("/notes");
    }
  };

  const handleRefresh = () => setRefreshKey((prev) => prev + 1);

  const handleTrashed = () => {
    handleRefresh();

    if (isTrash) {
      navigate("/trash");
    } else {
      navigate(
        folderId ? `/folders/${folderId}` : tagId ? `/tags/${tagId}` : "/notes",
      );
    }
  };

  // Document Title Effect
  useEffect(() => {
    if (isTrash) {
      document.title = "Trash | Ramy";
    } else if (folderName) {
      document.title = `${folderName} | Ramy`;
    } else if (tagLabel) {
      document.title = `${tagLabel} | Ramy`;
    } else {
      document.title = "Note | Ramy";
    }
  });

  // Fetch Folder Metadata
  useEffect(() => {
    if (!folderId || !accessToken) {
      setFolderName("");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await getFolderId(folderId, accessToken);
        const folder = res?.folder || res?.data || res?.result || res;

        if (!cancelled) {
          setFolderName(folder?.name || "Folder");
        }
      } catch {
        if (!cancelled) setFolderName("Folder");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [folderId, accessToken]);

  // Fetch Tag Metadata
  useEffect(() => {
    if (!tagId || !accessToken) {
      setTagLabel("");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const list = await getTags(accessToken);
        const tags = Array.isArray(list) ? list : [];
        const found = tags.find((t) => (t.id || t._id) === tagId);

        if (!cancelled) setTagLabel(found?.tag || "Tag");
      } catch {
        if (!cancelled) setTagLabel("Tag");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tagId, accessToken]);

  return (
    <div className="flex h-full w-full overflow-hidden select-none bg-zinc-950">
      {/* 
        List Pane:
        - Mobile: Original behavior (full width if no note selected, hidden if note selected).
        - Desktop: Toggles width smoothly via `isListOpen`.
      */}
      <div
        className={`transition-all duration-200 ease-in-out shrink-0 ${
          selectedNoteId ? "hidden sm:flex" : "flex"
        } ${
          isListOpen
            ? "w-full sm:w-80"
            : "w-full sm:w-0 sm:overflow-hidden border-none"
        }`}
      >
        <NoteList
          selectedNoteId={selectedNoteId}
          onSelectNote={handleSelectedNote}
          refreshKey={refreshKey}
          folderId={isTrash ? undefined : folderId}
          folderName={folderName}
          tagId={isTrash ? undefined : tagId}
          tagLabel={tagLabel}
          isTrash={isTrash}
          onRefresh={handleRefresh}
          onTogglePane={toggleListPane}
        />
      </div>

      {/* 
        Editor Pane:
        - Mobile: Original behavior (hidden if no note selected, full flex if note selected).
        - Desktop: Expands to remaining space.
      */}
      <div
        className={`flex-1 flex-col min-w-0 h-full relative ${
          selectedNoteId ? "flex" : "hidden sm:flex"
        }`}
      >
        {/* Expand Button: Only visible on Desktop when panel is hidden */}
        {!isListOpen && (
          <button
            onClick={toggleListPane}
            className="hidden sm:flex absolute top-4 left-4 z-30 p-2 rounded-lg bg-zinc-900/90 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 shadow-2xl backdrop-blur-md transition-all duration-150"
            title="Expand Note List"
          >
            <LuPanelLeftOpen size={18} />
          </button>
        )}

        {selectedNoteId ? (
          <NoteEditor
            noteId={selectedNoteId}
            onSelectNote={handleSelectedNote}
            onNoteUpdated={handleRefresh}
            onTrashed={handleTrashed}
            onBack={handleBack}
            defaultFolderId={isTrash ? "" : folderId || ""}
            defaultTagName={isTrash ? "" : tagLabel || ""}
            isTrash={isTrash}
          />
        ) : (
          /* Desktop Empty State when no note is active */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-black">
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-300 mb-4 shadow-2xl backdrop-blur-md">
              <LuFileText size={24} className="stroke-[1.5]" />
            </div>

            <h2 className="text-sm font-semibold text-zinc-100 tracking-tight">
              Pick a note or start writing
            </h2>
            <p className="text-xs text-zinc-500 mt-1 mb-5 max-w-xs leading-relaxed">
              Select an existing note from the list, or create a new document to
              begin your session.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
