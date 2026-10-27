import PageShell from "../../components/PageShell";
import PageHeader from "../../components/PageHeader";
import {
  LuShieldCheck,
  LuUsers,
  LuFileText,
  LuListTodo,
  LuBookOpen,
  LuTag,
  LuTrash2,
} from "react-icons/lu";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthProvider";
import {
  getDashboardStats,
  getAllUsers,
  changeRole,
  removeUser,
} from "../../api/admin";
import RoleDropdown from "../../components/RoleDropdown";
import axios from "axios"; // Assuming axios is used for API calls

function StatCardSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 sm:p-5 animate-pulse">
      <div className="h-3 bg-zinc-800 rounded w-20 mb-3" />
      <div className="h-7 bg-zinc-800 rounded w-12" />
    </div>
  );
}

function UserRowSkeleton() {
  return (
    <tr className="border-b border-zinc-800/50 last:border-0 animate-pulse">
      <td className="px-4 sm:px-5 py-3">
        <div className="h-3.5 bg-zinc-800 rounded w-24" />
      </td>
      <td className="px-4 sm:px-5 py-3">
        <div className="h-3.5 bg-zinc-800 rounded w-32" />
      </td>
      <td className="px-4 sm:px-5 py-3">
        <div className="h-6 bg-zinc-800 rounded w-16" />
      </td>
      <td className="px-4 sm:px-5 py-3">
        <div className="h-3.5 bg-zinc-800 rounded w-16" />
      </td>
      <td className="px-4 sm:px-5 py-3">
        <div className="h-3.5 bg-zinc-800 rounded w-10 ml-auto" />
      </td>
    </tr>
  );
}

const formatJoined = (value) =>
  new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

function UserAvatar({ user, className = "h-10 w-10 text-sm" }) {
  const [failed, setFailed] = useState(false);
  const src = user.image || user.avatar;

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-accent/30 bg-accent/15 font-semibold text-accent-soft ${className}`}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={user.name || "User"}
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        user.name?.[0]?.toUpperCase() || "U"
      )}
    </div>
  );
}

function UserCardSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4 animate-pulse">
      <div className="h-10 w-10 shrink-0 rounded-full bg-zinc-800" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-28 rounded bg-zinc-800" />
        <div className="h-3 w-40 rounded bg-zinc-800" />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { accessToken } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Server health state: "checking" | "online" | "offline"
  const [serverHealth, setServerHealth] = useState("checking");

  const checkHealth = async () => {
    try {
      await axios.get("/api/health");
      setServerHealth("online");
    } catch {
      setServerHealth("offline");
    }
  };

  const loadData = async () => {
    try {
      const [statsData, usersData] = await Promise.all([
        getDashboardStats(accessToken),
        getAllUsers(accessToken),
      ]);
      setStats(statsData);
      setUsers(usersData);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to load admin data",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Admin | Ramy";
    checkHealth();
  }, []);

  useEffect(() => {
    if (accessToken) loadData();
  }, [accessToken]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await changeRole(userId, newRole, accessToken);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
      );
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to update role",
      );
    }
  };

  const handleRemoveUser = async (userId) => {
    if (!confirm("Delete this user permanently? This cannot be undone."))
      return;

    try {
      await removeUser(userId, accessToken);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to delete user",
      );
    }
  };

  const statCards = [
    { label: "Users", value: stats?.totalUsers, icon: LuUsers },
    { label: "Notes", value: stats?.totalNotes, icon: LuFileText },
    { label: "Tasks", value: stats?.totalTasks, icon: LuListTodo },
    { label: "Journals", value: stats?.totalJournals, icon: LuBookOpen },
    { label: "Tags", value: stats?.totalTags, icon: LuTag },
  ];

  return (
    <PageShell>
      <PageHeader
        icon={LuShieldCheck}
        title="Admin Dashboard"
        description="Manage users and monitor activity across the app."
        actions={
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs w-fit">
          <span
            className={`w-2 h-2 rounded-full ${
              serverHealth === "online"
                ? "bg-emerald-500 animate-pulse"
                : serverHealth === "offline"
                  ? "bg-danger"
                  : "bg-amber-500 animate-ping"
            }`}
          />
          <span className="text-zinc-300 font-medium capitalize">
            Server: {serverHealth}
          </span>
        </div>
        }
      />

      {error && (
        <p className="text-xs sm:text-sm text-danger-soft mb-6 bg-danger/10 border border-danger/30 rounded-md px-4 py-2.5">
          {error}
        </p>
      )}

      {/* Stats cards grid */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:gap-4 lg:grid-cols-5">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={i === 4 ? "col-span-2 lg:col-span-1" : ""}
              >
                <StatCardSkeleton />
              </div>
            ))
          : statCards.map(({ label, value, icon: Icon }, i) => (
              <div
                key={label}
                className={`flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3.5 sm:p-4 ${
                  i === 4 ? "col-span-2 lg:col-span-1" : ""
                }`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent-soft">
                  <Icon size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-semibold leading-tight">
                    {value ?? "-"}
                  </p>
                  <p className="truncate text-[11px] uppercase tracking-wide text-zinc-500">
                    {label}
                  </p>
                </div>
              </div>
            ))}
      </div>

      {/* Users */}
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3.5 sm:px-5">
          <h2 className="text-sm font-semibold text-zinc-200">Users</h2>
          {!loading && (
            <span className="rounded-full border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[11px] tabular-nums text-zinc-400">
              {users.length}
            </span>
          )}
        </div>

        {/* Mobile: card list */}
        <div className="divide-y divide-zinc-800 sm:hidden">
          {loading ? (
            <>
              <UserCardSkeleton />
              <UserCardSkeleton />
              <UserCardSkeleton />
            </>
          ) : (
            users.map((u) => (
              <div key={u.id} className="space-y-3 p-4">
                <div className="flex items-center gap-3">
                  <UserAvatar user={u} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{u.name}</p>
                    <p className="truncate text-xs text-zinc-500">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <RoleDropdown
                      value={u.role}
                      onChange={(newRole) => handleRoleChange(u.id, newRole)}
                    />
                    <span className="text-xs text-zinc-500">
                      Joined {formatJoined(u.createdAt)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveUser(u.id)}
                    className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-danger/10 hover:text-danger-soft"
                    title="Remove user"
                    aria-label={`Remove ${u.name}`}
                  >
                    <LuTrash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop: table */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Joined</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <>
                  <UserRowSkeleton />
                  <UserRowSkeleton />
                  <UserRowSkeleton />
                  <UserRowSkeleton />
                </>
              ) : (
                users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-zinc-800/50 transition-colors last:border-0 hover:bg-zinc-800/30"
                  >
                    <td className="whitespace-nowrap px-5 py-3 font-medium">
                      <div className="flex items-center gap-3">
                        <UserAvatar user={u} className="h-8 w-8 text-xs" />
                        {u.name}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-zinc-400">
                      {u.email}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3">
                      <RoleDropdown
                        value={u.role}
                        onChange={(newRole) => handleRoleChange(u.id, newRole)}
                      />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-zinc-400">
                      {formatJoined(u.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right">
                      <button
                        onClick={() => handleRemoveUser(u.id)}
                        className="rounded-lg px-2.5 py-1 text-xs font-medium text-danger-soft transition-colors hover:bg-danger/10 hover:text-danger-soft"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  );
}
