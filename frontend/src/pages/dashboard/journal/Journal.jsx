import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/AuthProvider";

import {
  getJournals,
  createJournal,
  updateJournal,
  deleteJournal,
  restoreJournal,
  permanentDeleteJournal,
} from "../../../api/axios"; // Adjust path as needed

import JournalEditor from "./JournalEditor";
import JournalList from "./JournalList";
import JournalTrash from "./JournalTrash";

import { FiTrash2, FiPlus } from "react-icons/fi";
import { LuBookOpen } from "react-icons/lu";
import PageShell from "../../../components/PageShell";
import PageHeader from "../../../components/PageHeader";

export default function Journal() {
  const { accessToken } = useAuth();

  const [journals, setJournals] = useState([]);
  const [trashedJournals, setTrashedJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingJournal, setEditingJournal] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [currentView, setCurrentView] = useState("active"); // 'active' | 'trash'

  const [searchQuery, setSearchQuery] = useState("");

  const fetchAllJournals = async () => {
    try {
      setLoading(true);
      const [activeRes, trashRes] = await Promise.all([
        getJournals(accessToken),
        getJournals(accessToken, { trash: true }),
      ]);

      setJournals(activeRes?.result || []);
      setTrashedJournals(trashRes?.result || []);
    } catch (err) {
      console.error("Failed to fetch journals:", err);
      toast.error("Failed to load journals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) fetchAllJournals();
  }, [accessToken]);

  // Save / Update Handler
  const handleSaveJournal = async (formData) => {
    try {
      setSaving(true);
      if (editingJournal) {
        const id = editingJournal.id || editingJournal._id;
        await updateJournal(id, formData, accessToken);
        toast.success("Journal updated!");
      } else {
        await createJournal(formData, accessToken);
        toast.success("Journal saved!");
      }
      setEditingJournal(null);
      setIsCreating(false);
      fetchAllJournals();
    } catch (err) {
      console.error("Failed to save journal:", err);
      toast.error("Failed to save entry");
    } finally {
      setSaving(false);
    }
  };

  // Soft Delete
  const handleSoftDelete = async (id) => {
    try {
      await deleteJournal(id, accessToken);
      toast.success("Moved to trash");
      fetchAllJournals();
    } catch (err) {
      console.error("Soft delete failed:", err);
      toast.error("Failed to delete entry");
    }
  };

  // Restore
  const handleRestore = async (id) => {
    try {
      await restoreJournal(id, accessToken);
      toast.success("Journal restored!");
      fetchAllJournals();
    } catch (err) {
      console.error("Restore failed:", err);
      toast.error("Failed to restore entry");
    }
  };

  // Permanent Delete
  const handlePermanentDelete = async (id) => {
    try {
      await permanentDeleteJournal(id, accessToken);
      toast.success("Permanently deleted");
      fetchAllJournals();
    } catch (err) {
      console.error("Permanent delete failed:", err);
      toast.error("Failed to delete entry");
    }
  };

  return (
    <PageShell>
      <div className="space-y-6">
        <PageHeader
          icon={LuBookOpen}
          title="Journal"
          description="Write and revisit your daily reflections."
          actions={
            <>
            <button
              onClick={() => {
                setCurrentView("active");
                setIsCreating(true);
                setEditingJournal(null);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-accent-ink hover:bg-accent-soft transition-colors"
            >
              <FiPlus className="h-4 w-4" />
              <span>New Entry</span>
            </button>

            <button
              onClick={() =>
                setCurrentView((prev) =>
                  prev === "trash" ? "active" : "trash",
                )
              }
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                currentView === "trash"
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                  : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white"
              }`}
            >
              <FiTrash2 className="h-3.5 w-3.5" />
              <span>Trash ({trashedJournals.length})</span>
            </button>
            </>
          }
        />

        {/* Editor Area */}
        {(isCreating || editingJournal) && (
          <JournalEditor
            journal={editingJournal}
            onSave={handleSaveJournal}
            onCancel={() => {
              setIsCreating(false);
              setEditingJournal(null);
            }}
            loading={saving}
          />
        )}

        {/* Main Content Feed */}
        {loading ? (
          <div className="py-12 text-center text-xs text-zinc-500">
            Loading reflections...
          </div>
        ) : currentView === "trash" ? (
          <JournalTrash
            trashedJournals={trashedJournals}
            onRestore={handleRestore}
            onPermanentDelete={handlePermanentDelete}
          />
        ) : (
          <JournalList
            journals={journals}
            onEdit={(item) => {
              setEditingJournal(item);
              setIsCreating(false);
            }}
            onSoftDelete={handleSoftDelete}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}
      </div>
    </PageShell>
  );
}
