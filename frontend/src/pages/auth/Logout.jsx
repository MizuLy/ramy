import { useNavigate } from "react-router-dom";
import { logout } from "../../api/axios";
import { HiLogout } from "react-icons/hi";
import { useAuth } from "../../context/AuthProvider";

export default function Logout({ collapsed }) {
  const { setAccessToken, setUser, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      console.log(`Bye Bye, @${user?.name}`);
    } catch (err) {
      console.error("Logout failed:", err.message);
    } finally {
      setAccessToken(null);
      setUser(null);
      document.getElementById("logoutModal")?.close();
      navigate("/login");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => document.getElementById("logoutModal")?.showModal()}
        title="Logout"
        className={`text-sm flex items-center gap-2 text-zinc-400 hover:text-white transition-colors ${
          collapsed ? "justify-center w-full" : ""
        }`}
      >
        <HiLogout size={18} className="shrink-0" />
        {!collapsed && <span>Logout</span>}
      </button>

      <dialog
        id="logoutModal"
        className="m-auto w-full max-w-sm bg-transparent p-4 backdrop:bg-black/60 backdrop:backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
      >
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 text-white shadow-2xl menu-pop">
          <h3 className="font-bold text-lg mb-2">Log out?</h3>
          <p className="text-sm text-zinc-400 mb-6">
            You'll need to log back in to access your notes.
          </p>

          <div className="flex justify-end">
            <form method="dialog" className="flex gap-2">
              <button
                type="button"
                onClick={() => document.getElementById("logoutModal")?.close()}
                className="px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-danger hover:bg-danger-strong text-danger-ink transition-colors"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}
