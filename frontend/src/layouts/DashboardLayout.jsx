import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import SearchModal from "../components/modals/SearchModal";
import { LuMenu } from "react-icons/lu";
import ramyLogo from "../assets/ram.png";

export default function DashboardLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-zinc-950 text-white overflow-hidden">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800 shrink-0">
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          aria-label="Open sidebar"
        >
          <LuMenu size={18} />
        </button>
        <span className="inline-flex items-center gap-2 text-xs font-bold tracking-wider text-zinc-300 uppercase select-none">
          <img
            src={ramyLogo}
            alt="Ramy"
            className="w-5 h-5 rounded-full object-cover"
          />
          Ramy
        </span>
        <div className="w-8" /> {/* Spacer for centering title */}
      </div>

      {/* Backdrop overlay for mobile */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar (Responsive Overlay on Mobile, Fixed Sidebar on Desktop) */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onCloseMobile={() => setMobileSidebarOpen(false)} />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto min-w-0 bg-zinc-950">
        <Outlet />
      </main>

      {/* Global Modals */}
      <SearchModal />
    </div>
  );
}
