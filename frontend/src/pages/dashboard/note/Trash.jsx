import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import NoteList from "./NoteList";
import NoteEditor from "./NoteEditor";
import { useEffect } from "react";

export default function Trash() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => setRefreshKey((prev) => prev + 1);

  const handleSelectedNote = (nextNoteId) => {
    navigate(nextNoteId ? `/trash/${nextNoteId}` : "/trash");
  };

  const handleTrashed = () => {
    handleRefresh();
    navigate("/trash");
  };

  // Clears the selected note so mobile shows the list pane again.
  const handleBack = () => {
    navigate("/trash");
  };

  useEffect(() => {
    document.title = "Trash | Ramy";
  }, []);

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* List pane: full width on mobile when nothing is selected, hidden once a note is open. Always visible side-by-side from sm breakpoint up. */}
      <div className={`${id ? "hidden" : "flex"} sm:flex w-full sm:w-auto`}>
        <NoteList
          selectedNoteId={id}
          onSelectNote={handleSelectedNote}
          refreshKey={refreshKey}
          isTrash={true}
          onRefresh={handleRefresh}
        />
      </div>

      {/* Editor pane: hidden on mobile until a note is selected, always visible from sm breakpoint up. */}
      <div className={`${id ? "flex" : "hidden"} sm:flex flex-1 min-w-0`}>
        <NoteEditor
          noteId={id}
          onSelectNote={handleSelectedNote}
          onNoteUpdated={handleRefresh}
          onTrashed={handleTrashed}
          onBack={handleBack}
          isTrash={true}
        />
      </div>
    </div>
  );
}
