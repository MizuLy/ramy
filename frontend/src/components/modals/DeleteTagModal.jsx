import React, { useState } from "react";
import { IoClose } from "react-icons/io5";
import { LuTriangleAlert } from "react-icons/lu";

export default function DeleteTagModal({ isOpen, tag, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !tag) return null;

  const handleDelete = async () => {
    setLoading(true);
    setError("");
    try {
      await onConfirm();
    } catch (err) {
      setError(err.message || "Failed to delete tag");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={loading ? undefined : onClose}
    >
      <div
        className="w-full max-w-sm bg-zinc-900 text-zinc-100 rounded-xl border border-zinc-800 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <h2 className="text-base font-semibold truncate pr-4">
            Delete tag "{tag.tag}"?
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
            This removes the tag from your sidebar. Notes that used it will no
            longer show this tag.
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
            {loading ? "Deleting..." : "Delete Tag"}
          </button>
        </div>
      </div>
    </div>
  );
}
