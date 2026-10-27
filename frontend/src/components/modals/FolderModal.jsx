import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { IoClose } from "react-icons/io5";
import { createFolder, updateFolder } from "../../api/axios";
import { useAuth } from "../../context/AuthProvider";
import ModalPortal from "./ModalPortal";
import {
  setFolderColor,
  getFolderColor,
  DEFAULT_ITEM_COLOR,
} from "../../utils/localColors";

const COLOR_PRESETS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
];

export default function FolderModal({
  isOpen,
  onClose,
  onFolderCreated,
  onFolderUpdated,
  folder,
}) {
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const [folderName, setFolderName] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { accessToken } = useAuth();

  const isEditing = Boolean(folder);

  // Handle open / close animation lifecycle
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Wait a frame for DOM to mount before starting transition
      const timer = setTimeout(() => setIsAnimating(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      // Wait for exit transition duration (200ms) before unmounting
      const timer = setTimeout(() => setShouldRender(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Sync form fields whenever the modal opens or the target folder changes
  useEffect(() => {
    if (isOpen) {
      setFolderName(folder?.name || "");
      setSelectedColor(
        folder?.id || folder?._id
          ? getFolderColor(folder.id || folder._id)
          : COLOR_PRESETS[0] || DEFAULT_ITEM_COLOR,
      );
      setError("");
    }
  }, [isOpen, folder]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!shouldRender) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    try {
      setLoading(true);
      setError("");

      const payload = { name: folderName.trim() };

      if (isEditing) {
        const folderId = folder.id || folder._id;
        await updateFolder(folderId, payload, accessToken);
        setFolderColor(folderId, selectedColor);

        toast.success("Folder updated!");
        onFolderUpdated?.();
      } else {
        const res = await createFolder(payload, accessToken);
        const created = res?.data?.result || res?.result || res?.data || res;
        const id = created?.id || created?._id;

        if (id) setFolderColor(id, selectedColor);

        toast.success("Folder created!");
        onFolderCreated?.(created);
      }

      setFolderName("");
      setSelectedColor(COLOR_PRESETS[0]);
      onClose();
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Something went wrong";
      console.error(
        isEditing ? "Error updating folder:" : "Error creating folder:",
        err,
      );
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalPortal>
      <div
        className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-200 ${
          isAnimating ? "bg-black/60 opacity-100" : "bg-black/0 opacity-0"
        }`}
        onClick={onClose}
      >
      <div
        className={`w-full max-w-md rounded-2xl bg-neutral-900 p-6 text-white shadow-2xl transition-all duration-200 border border-neutral-800 ${
          isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {isEditing ? "Edit Folder" : "New folder"}
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-danger/10 p-3 text-sm text-danger-soft border border-danger/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">
              Name
            </label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="e.g. Work, Personal..."
              className="w-full rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-white focus:outline-none"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-2">
              Color
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`h-6 w-6 rounded-full transition-transform ${
                    selectedColor === color
                      ? "ring-2 ring-white ring-offset-2 ring-offset-neutral-900 scale-110"
                      : "hover:scale-105 opacity-80"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={loading || !folderName.trim()}
              className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink hover:bg-accent-soft transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : isEditing ? "Update Folder" : "Create"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
}
