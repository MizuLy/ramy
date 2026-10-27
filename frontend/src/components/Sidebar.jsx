import { useEffect, useState, useCallback } from "react";
import { NavLink, Link } from "react-router-dom";
import ramyLogo from "../assets/ram.png";
import { IoSearch } from "react-icons/io5";
import { PiNotebookLight } from "react-icons/pi";
import { RiShieldUserLine } from "react-icons/ri";
import {
  LuPanelLeftClose,
  LuPanelLeftOpen,
  LuSettings,
  LuPencil,
  LuTrash2,
  LuListTodo,
  LuPencilLine,
  LuTag,
  LuFolder,
  LuX,
} from "react-icons/lu";
import { GoPlus, GoChevronDown } from "react-icons/go";
import { useAuth } from "../context/AuthProvider";
import { getFolderColor, getTagColor } from "../utils/localColors";

// Modals
import FolderModal from "../components/modals/FolderModal";
import DeleteFolderModal from "../components/modals/DeleteFolderModal";
import TagModal from "../components/modals/TagModal";

// API
import { getFolders, deleteFolder, getTags, deleteTag } from "../api/axios";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768,
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
}

export default function Sidebar({ onCloseMobile }) {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("sidebarCollapsed") === "true";
  });

  const isMobile = useIsMobile();
  const showLabels = !collapsed || isMobile;

  // Folder States
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  const [deletingFolder, setDeletingFolder] = useState(null);
  const [folders, setFolders] = useState([]);
  const [isFoldersOpen, setIsFoldersOpen] = useState(() => {
    const saved = localStorage.getItem("isFoldersOpen");
    return saved !== null ? saved === "true" : true;
  });

  // Tag States
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [tags, setTags] = useState([]);
  const [isTagsOpen, setIsTagsOpen] = useState(() => {
    const saved = localStorage.getItem("isTagsOpen");
    return saved !== null ? saved === "true" : true;
  });

  // Context Menu State
  const [contextMenu, setContextMenu] = useState(null);

  const { user, accessToken } = useAuth();

  const handleNavClick = () => {
    if (onCloseMobile) onCloseMobile();
  };

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebarCollapsed", String(next));
      return next;
    });
  };

  const toggleFoldersOpen = () => {
    setIsFoldersOpen((prev) => {
      const next = !prev;
      localStorage.setItem("isFoldersOpen", String(next));
      return next;
    });
  };

  const toggleTagsOpen = () => {
    setIsTagsOpen((prev) => {
      const next = !prev;
      localStorage.setItem("isTagsOpen", String(next));
      return next;
    });
  };

  const fetchFolders = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await getFolders(accessToken);
      const list = res?.data || res?.result || res || [];
      setFolders(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Error fetching folders:", error);
    }
  }, [accessToken]);

  const fetchTagsList = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await getTags(accessToken);
      const list = res?.data || res?.result || res || [];
      setTags(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Error fetching tags:", error);
    }
  }, [accessToken]);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!accessToken) return;
      try {
        const [foldersRes, tagsRes] = await Promise.all([
          getFolders(accessToken),
          getTags(accessToken),
        ]);
        if (isMounted) {
          const folderList =
            foldersRes?.data || foldersRes?.result || foldersRes || [];
          const tagList = tagsRes?.data || tagsRes?.result || tagsRes || [];
          setFolders(Array.isArray(folderList) ? folderList : []);
          setTags(Array.isArray(tagList) ? tagList : []);
        }
      } catch (error) {
        if (isMounted) console.error("Error fetching sidebar data:", error);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [accessToken]);

  // Handle Context Menu dismissal & key press
  useEffect(() => {
    if (!contextMenu) return;

    const closeMenu = () => setContextMenu(null);
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setContextMenu(null);
    };

    window.addEventListener("click", closeMenu);
    window.addEventListener("scroll", closeMenu, true);
    window.addEventListener("resize", closeMenu);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("click", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
      window.removeEventListener("resize", closeMenu);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [contextMenu]);

  const handleOpenCreateFolderModal = () => {
    setEditingFolder(null);
    setIsFolderModalOpen(true);
  };

  const handleOpenEditFolderModal = (folder) => {
    setEditingFolder(folder);
    setIsFolderModalOpen(true);
  };

  const handleConfirmFolderDelete = async (mode) => {
    if (!deletingFolder) return;
    const id = deletingFolder.id || deletingFolder._id;
    try {
      await deleteFolder(id, mode, accessToken);
      await fetchFolders();
    } catch (error) {
      console.error("Error deleting folder:", error);
    } finally {
      setDeletingFolder(null);
    }
  };

  const handleOpenCreateTagModal = () => {
    setEditingTag(null);
    setIsTagModalOpen(true);
  };

  const handleOpenEditTagModal = (tag) => {
    setEditingTag(tag);
    setIsTagModalOpen(true);
  };

  const handleTagDelete = async (tag) => {
    const id = tag.id || tag._id;
    try {
      await deleteTag(id, accessToken);
      await fetchTagsList();
    } catch (error) {
      console.error("Error deleting tag:", error);
    }
  };

  const handleContextMenu = (e, item, type) => {
    e.preventDefault();
    // Clamp coordinates to stay inside the viewport
    const MENU_WIDTH = 160;
    const MENU_HEIGHT = 80;
    const x = Math.min(e.clientX, window.innerWidth - MENU_WIDTH - 10);
    const y = Math.min(e.clientY, window.innerHeight - MENU_HEIGHT - 10);

    setContextMenu({ x, y, item, type });
  };

  const handleContextEdit = () => {
    if (contextMenu?.type === "folder") {
      handleOpenEditFolderModal(contextMenu.item);
    } else if (contextMenu?.type === "tag") {
      handleOpenEditTagModal(contextMenu.item);
    }
    setContextMenu(null);
  };

  const handleContextDelete = () => {
    if (contextMenu?.type === "folder") {
      setDeletingFolder(contextMenu.item);
    } else if (contextMenu?.type === "tag") {
      handleTagDelete(contextMenu.item);
    }
    setContextMenu(null);
  };

  const getLinkClass = ({ isActive }) =>
    `group flex items-center gap-3 rounded-xl py-1.5 text-sm transition-colors duration-150 cursor-pointer ${
      collapsed ? "md:justify-center md:px-0 px-2" : "px-2"
    } ${
      isActive
        ? "bg-zinc-900 text-white font-medium"
        : "text-zinc-400 hover:bg-zinc-900/70 hover:text-white"
    }`;

  const renderNavItem = (to, Icon, label) => (
    <NavLink
      key={to}
      to={to}
      onClick={handleNavClick}
      className={getLinkClass}
      title={label}
    >
      {({ isActive }) => (
        <>
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors duration-150 ${
              isActive
                ? "bg-accent text-accent-ink"
                : "bg-zinc-800/60 text-zinc-400 group-hover:text-white"
            }`}
          >
            <Icon size={16} />
          </span>
          {showLabels && <span className="flex-1 truncate">{label}</span>}
        </>
      )}
    </NavLink>
  );

  const getItemLinkClass = ({ isActive }) =>
    `flex items-center gap-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors w-full ${
      collapsed ? "md:justify-center md:px-0 px-2" : "px-2.5"
    } ${
      isActive
        ? "bg-zinc-900 text-white font-medium"
        : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
    }`;

  return (
    <>
      <nav
        className={`bg-zinc-850 border-r border-zinc-800 h-screen shrink-0 text-white flex flex-col transition-all duration-300 select-none ${
          collapsed ? "w-[280px] md:w-[64px]" : "w-[280px] md:w-[260px]"
        }`}
      >
        {/* Header */}
        <div
          className={`border-b border-zinc-800 p-4 flex items-center shrink-0 ${
            collapsed ? "justify-between md:justify-center" : "justify-between"
          }`}
        >
          {showLabels && (
            <div className="flex items-center gap-2.5 overflow-hidden pr-2">
              <img
                src={ramyLogo}
                alt="Ramy"
                className="w-8 h-8 rounded-xl object-cover shrink-0"
              />
              <div className="min-w-0">
                <h1 className="font-belanosima text-base leading-tight tracking-wide truncate">
                  Ramy
                </h1>
                <p className="text-[11px] text-zinc-500 truncate">
                  Hi, {user?.name?.split(" ")[0] || "there"}
                </p>
              </div>
            </div>
          )}

          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            onClick={toggleCollapsed}
            className="hidden md:block text-zinc-400 hover:text-white shrink-0 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <LuPanelLeftOpen size={18} />
            ) : (
              <LuPanelLeftClose size={18} />
            )}
          </button>

          {/* Mobile Close Button */}
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden text-zinc-400 hover:text-white shrink-0 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
              aria-label="Close sidebar"
            >
              <LuX size={18} />
            </button>
          )}
        </div>

        {/* Scrollable Middle Container */}
        <div className="flex-1 overflow-y-auto min-h-0 py-2">
          {/* Search Trigger */}
          <div className="px-3 mb-2">
            <button
              type="button"
              onClick={() => {
                const searchModal = document.getElementById("searchModal");
                if (
                  searchModal &&
                  typeof searchModal.showModal === "function"
                ) {
                  searchModal.showModal();
                }
                handleNavClick();
              }}
              className={`relative flex items-center rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:text-white text-sm text-zinc-500 transition-colors duration-150 w-full pl-9 pr-4 py-2 text-left ${
                collapsed
                  ? "md:w-10 md:h-10 md:justify-center md:mx-auto md:p-0"
                  : ""
              }`}
            >
              <IoSearch
                className={`text-zinc-500 text-base shrink-0 ${
                  collapsed ? "absolute left-3 md:static" : "absolute left-3"
                }`}
              />
              {showLabels && <span>Search notes...</span>}
            </button>
          </div>

          {/* Nav Items */}
          <div className="px-3 space-y-1">
            {renderNavItem("/notes", PiNotebookLight, "My Notes")}
            {renderNavItem("/todos", LuListTodo, "My To-do")}
            {renderNavItem("/journals", LuPencilLine, "My Journals")}
            {renderNavItem("/trash", LuTrash2, "Trash")}

            {/* FOLDERS SECTION */}
            <div className="mt-2 border-t border-zinc-800 pt-3">
              {showLabels && (
                <div className="flex items-center justify-between text-zinc-500 font-semibold text-[11px] uppercase tracking-wider px-3">
                  <button
                    type="button"
                    onClick={toggleFoldersOpen}
                    className="flex items-center gap-1.5 hover:text-white transition-colors py-1"
                  >
                    <GoChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${
                        isFoldersOpen ? "rotate-0" : "-rotate-90"
                      }`}
                    />
                    <span>FOLDERS</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenCreateFolderModal}
                    className="p-1 rounded-md hover:bg-zinc-800 hover:text-white transition-colors"
                    title="New folder"
                  >
                    <GoPlus size={14} />
                  </button>
                </div>
              )}

              <div
                className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${
                  isFoldersOpen || collapsed
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <ul
                    className={`mt-1 space-y-0.5 ${
                      showLabels ? "ml-5 border-l border-zinc-800 pl-2" : "px-1"
                    }`}
                  >
                    {folders.map((folder) => {
                      const id = folder.id || folder._id;
                      return (
                        <li
                          key={id}
                          onContextMenu={(e) =>
                            handleContextMenu(e, folder, "folder")
                          }
                        >
                          <NavLink
                            to={`/folders/${id}`}
                            onClick={handleNavClick}
                            className={getItemLinkClass}
                            title={folder.name}
                          >
                            <LuFolder
                              size={16}
                              className="shrink-0"
                              style={{
                                color:
                                  getFolderColor(id) ||
                                  folder.color ||
                                  folder.folderColor ||
                                  "#3b82f6",
                              }}
                            />
                            {showLabels && (
                              <span className="truncate flex-1">
                                {folder.name}
                              </span>
                            )}
                          </NavLink>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>

            {/* TAGS SECTION */}
            <div className="mt-2 border-t border-zinc-800 pt-3">
              {showLabels && (
                <div className="flex items-center justify-between text-zinc-500 font-semibold text-[11px] uppercase tracking-wider px-3">
                  <button
                    type="button"
                    onClick={toggleTagsOpen}
                    className="flex items-center gap-1.5 hover:text-white transition-colors py-1"
                  >
                    <GoChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${
                        isTagsOpen ? "rotate-0" : "-rotate-90"
                      }`}
                    />
                    <span>TAGS</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenCreateTagModal}
                    className="p-1 rounded-md hover:bg-zinc-800 hover:text-white transition-colors"
                    title="New tag"
                  >
                    <GoPlus size={14} />
                  </button>
                </div>
              )}

              <div
                className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${
                  isTagsOpen || collapsed
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <ul
                    className={`mt-1 space-y-0.5 ${
                      showLabels ? "ml-5 border-l border-zinc-800 pl-2" : "px-1"
                    }`}
                  >
                    {tags.map((t) => {
                      const id = t.id || t._id;
                      const label =
                        t.tag || t.tagName || t.name || "Untitled Tag";

                      return (
                        <li
                          key={id}
                          onContextMenu={(e) => handleContextMenu(e, t, "tag")}
                        >
                          <NavLink
                            to={`/tags/${id}`}
                            onClick={handleNavClick}
                            className={getItemLinkClass}
                            title={label}
                          >
                            <LuTag
                              size={14}
                              className="shrink-0"
                              style={{
                                color: getTagColor(id) || t.color || "#3b82f6",
                              }}
                            />
                            {showLabels && (
                              <span className="truncate flex-1">
                                {label}
                              </span>
                            )}
                          </NavLink>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>

            {/* Admin Link */}
            {user?.role === "ADMIN" && (
              <div className="mt-2 border-t border-zinc-800 pt-3">
                {renderNavItem("/admin", RiShieldUserLine, "Admin")}
              </div>
            )}
          </div>
        </div>

        {/* User Footer */}
        <div className="p-3 border-t border-zinc-800 shrink-0">
          <Link
            to="/settings"
            onClick={handleNavClick}
            className={`flex items-center gap-3 rounded-xl hover:bg-zinc-900 transition-colors text-zinc-200 ${
              collapsed ? "md:justify-center md:p-2 p-2" : "p-2"
            }`}
            title="Settings"
          >
            <div className="w-9 h-9 rounded-full bg-accent/15 border border-accent/30 text-accent-soft flex items-center justify-center text-sm font-semibold shrink-0 overflow-hidden">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user?.name || "User Avatar"}
                  className="w-full h-full object-cover"
                />
              ) : (
                user?.name?.[0]?.toUpperCase() || "U"
              )}
            </div>

            {showLabels && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-200 truncate">
                    {user?.name || "User"}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">
                    {user?.email || ""}
                  </p>
                </div>
                <LuSettings
                  size={18}
                  className="text-zinc-400 shrink-0 hover:rotate-90 transition-transform duration-200 hover:text-white"
                />
              </>
            )}
          </Link>
        </div>
      </nav>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 w-40 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl shadow-black/40 p-1 text-sm select-none menu-pop"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={handleContextEdit}
            className="w-full flex items-center gap-2 rounded-md px-2.5 py-1.5 text-zinc-200 hover:bg-zinc-800 text-left transition-colors"
          >
            <LuPencil size={14} /> Edit
          </button>
          <button
            type="button"
            onClick={handleContextDelete}
            className="w-full flex items-center gap-2 rounded-md px-2.5 py-1.5 text-danger-soft hover:bg-danger/10 text-left transition-colors"
          >
            <LuTrash2 size={14} /> Delete
          </button>
        </div>
      )}

      {/* Modals */}
      <FolderModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        onFolderCreated={fetchFolders}
        onFolderUpdated={fetchFolders}
        folder={editingFolder}
      />

      <DeleteFolderModal
        isOpen={Boolean(deletingFolder)}
        folder={deletingFolder}
        onClose={() => setDeletingFolder(null)}
        onConfirm={handleConfirmFolderDelete}
      />

      <TagModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        onTagChanged={fetchTagsList}
        tag={editingTag}
      />
    </>
  );
}
