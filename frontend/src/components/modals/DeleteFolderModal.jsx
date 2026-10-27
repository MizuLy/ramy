import React, { useState } from "react";
import { IoClose } from "react-icons/io5";
import { LuTriangleAlert } from "react-icons/lu";
import ModalPortal from "./ModalPortal";

// Plain delete confirmation. If the folder still has notes in it, the
// backend rejects the request and we show that error here instead of
// closing — the modal stays open so the user can go remove the notes first.
export default function DeleteFolderModal({
  isOpen,
  folder,
  onClose,
  onConfirm,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !folder) return null;

  const handleDelete = async () => {
    setLoading(true);
    setError("");
    try {
      await onConfirm(); // parent closes the modal on success
    } catch (err) {
      setError(err.message || "Failed to delete folder");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={loading ? undefined : onClose}
      >
      <div
        className="w-full max-w-sm bg-zinc-900 text-zinc-100 rounded-xl border border-zinc-800 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <h2 className="text-base font-semibold truncate pr-4">
            Delete "{folder.name}"?
          </h2>
          {!loading && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 shrink-0"
            >
              <IoClose size={18} />
            </button>
          )}
        </div>

        <div className="mt-4 flex gap-2.5 text-sm text-zinc-400 bg-zinc-800/60 border border-zinc-700 rounded-lg p-3">
          <LuTriangleAlert
            size={16}
            className="text-amber-400 shrink-0 mt-0.5"
          />
          <p>
            This removes the folder from your sidebar. Notes inside will stay in
            My Notes without a folder.
          </p>
        </div>

        {error && (
          <p className="mt-3 text-xs text-danger-soft bg-danger/10 p-2 rounded border border-danger/20">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-white disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm bg-danger hover:bg-danger-strong text-danger-ink disabled:opacity-50"
          >
            {loading ? "Deleting..." : "Delete Folder"}
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
