import { useState, useEffect } from "react";
import {
  LuSun,
  LuMoon,
  LuMonitor,
  LuLogOut,
  LuTrash2,
  LuKeyRound,
  LuUserRound,
  LuUpload,
  LuLoader,
} from "react-icons/lu";
import { MdOutlineColorLens } from "react-icons/md";
import { RiLogoutBoxRLine } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import PageShell from "../../components/PageShell";
import PageHeader from "../../components/PageHeader";
import { LuSettings } from "react-icons/lu";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthProvider";
import { useTheme } from "../../context/ThemeProvider";
import {
  changeName,
  changeEmail,
  changePassword,
  changeAvatar,
  logout,
  removeMyself,
} from "../../api/axios";
import ConfirmModal from "../../components/modals/ConfirmModal";

export default function Settings() {
  const { user, setUser, setAccessToken, accessToken } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  // Avatar States
  const [avatarPreview, setAvatarPreview] = useState(
    user?.image || user?.avatar || "",
  );
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Form States
  const [name, setName] = useState(user?.name || "");
  const [nameSaving, setNameSaving] = useState(false);

  const [email, setEmail] = useState(user?.email || "");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Modal
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  useEffect(() => {
    document.title = "Settings | Ramy";
  }, []);

  // Sync avatar preview if global user state updates
  useEffect(() => {
    if (user?.image || user?.avatar) {
      setAvatarPreview(user.image || user.avatar);
    }
  }, [user]);

  // Avatar Handler with Toast
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be smaller than 2MB");
      return;
    }

    setAvatarPreview(URL.createObjectURL(file));
    setAvatarUploading(true);

    const formData = new FormData();
    formData.append("image", file);

    const uploadPromise = async () => {
      const res = await changeAvatar(formData, accessToken);

      const newImageUrl =
        res?.data?.data?.image ||
        res?.data?.image ||
        res?.data?.user?.image ||
        res?.data?.user?.avatar;

      if (!newImageUrl) {
        throw new Error("No image URL returned from server");
      }

      const freshUrl = `${newImageUrl}?t=${Date.now()}`;
      setAvatarPreview(freshUrl);
      setUser((prev) => ({
        ...prev,
        image: newImageUrl,
        avatar: newImageUrl,
      }));

      return "Avatar updated successfully!";
    };

    toast
      .promise(uploadPromise(), {
        loading: "Uploading avatar...",
        success: (msg) => msg,
        error: (err) =>
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Failed to update avatar",
      })
      .finally(() => setAvatarUploading(false));
  };

  // Save Name Handler
  const handleSaveName = async () => {
    setNameSaving(true);
    try {
      await changeName({ name }, accessToken);
      setUser((prev) => ({ ...prev, name }));
      toast.success("Display name updated!");
    } catch (err) {
      toast.error(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to update name",
      );
    } finally {
      setNameSaving(false);
    }
  };

  // Change Email Handler
  const handleChangeEmail = async () => {
    setEmailSaving(true);
    try {
      await changeEmail(
        { newEmail: email, password: emailPassword },
        accessToken,
      );
      setUser((prev) => ({ ...prev, email }));
      toast.success("Email updated successfully!");
      setEmailPassword("");
    } catch (err) {
      toast.error(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to update email",
      );
    } finally {
      setEmailSaving(false);
    }
  };

  // Change Password Handler
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }

    setPasswordSaving(true);
    try {
      await changePassword({ currentPassword, newPassword }, accessToken);
      toast.success("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to update password",
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  // Logout Handler
  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out");
    } catch (err) {
      console.error("Logout failed:", err.message);
    } finally {
      setAccessToken(null);
      setUser(null);
      navigate("/login");
    }
  };

  // Delete account handler
  const handleDeleteAccount = async () => {
    try {
      await removeMyself(accessToken);
      toast.success("Account deleted successfully");

      setAccessToken(null);
      setUser(null);
      navigate("/login");
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Account deletion failed";

      toast.error(errorMsg);
      console.error("Account deletion failed:", errorMsg);
    }
  };

  const themeOptions = [
    { value: "light", label: "Light", icon: LuSun },
    { value: "dark", label: "Dark", icon: LuMoon },
    { value: "system", label: "System", icon: LuMonitor },
  ];

  return (
    <PageShell>
      <div className="space-y-6">
        <PageHeader
          icon={LuSettings}
          title="Settings"
          description="Manage your profile, security, and workspace preferences."
        />

        {/* Profile Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-md bg-zinc-800 flex items-center justify-center shrink-0">
              <LuUserRound size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Profile</h2>
              <p className="text-xs text-zinc-500">
                How you appear in the app.
              </p>
            </div>
          </div>

          {/* Avatar Upload Area */}
          <div className="flex items-center gap-4 pb-6 mb-6 border-b border-zinc-800">
            <div className="relative group w-16 h-16 rounded-full overflow-hidden border border-zinc-700 bg-zinc-800 flex items-center justify-center shrink-0">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={user?.name || "User Avatar"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-lg font-semibold text-zinc-300">
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </span>
              )}

              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                {avatarUploading ? (
                  <LuLoader size={18} className="animate-spin text-white" />
                ) : (
                  <LuUpload size={18} className="text-white" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  disabled={avatarUploading}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <p className="text-sm font-medium">Profile Picture</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Click photo to update (JPG, PNG, max 2MB).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wide text-zinc-500 mb-1.5 block">
                Display name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 min-w-0 px-3 py-2 rounded-md bg-zinc-800 border border-zinc-700 text-sm outline-none focus:border-zinc-500"
                />
                <button
                  onClick={handleSaveName}
                  disabled={nameSaving || name === user?.name}
                  className="px-3 py-2 rounded-md bg-accent text-accent-ink text-xs font-medium hover:bg-accent-soft disabled:opacity-50 transition-colors shrink-0"
                >
                  {nameSaving ? "..." : "Save"}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wide text-zinc-500 mb-1.5 block">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-zinc-800 border border-zinc-700 text-sm outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          {email !== user?.email && (
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <label className="text-xs uppercase tracking-wide text-zinc-500 mb-1.5 block">
                Confirm password to update email
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="password"
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  placeholder="Current password"
                  className="flex-1 min-w-0 px-3 py-2 rounded-md bg-zinc-800 border border-zinc-700 text-sm outline-none focus:border-zinc-500"
                />
                <button
                  onClick={handleChangeEmail}
                  disabled={emailSaving || !emailPassword}
                  className="px-4 py-2 rounded-md bg-accent text-accent-ink text-sm font-medium hover:bg-accent-soft disabled:opacity-50 transition-colors shrink-0"
                >
                  {emailSaving ? "Saving..." : "Update email"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Security Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-md bg-zinc-800 flex items-center justify-center shrink-0">
              <LuKeyRound size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Security</h2>
              <p className="text-xs text-zinc-500">
                Change the password used to sign in.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wide text-zinc-500 mb-1.5 block">
                Current password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-zinc-800 border border-zinc-700 text-sm outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-zinc-500 mb-1.5 block">
                New password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-zinc-800 border border-zinc-700 text-sm outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-zinc-500 mb-1.5 block">
                Confirm new password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-zinc-800 border border-zinc-700 text-sm outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          <button
            onClick={handleChangePassword}
            disabled={passwordSaving || !currentPassword || !newPassword}
            className="mt-4 w-full sm:w-auto px-4 py-2 rounded-md bg-accent text-accent-ink text-sm font-medium hover:bg-accent-soft disabled:opacity-50 transition-colors"
          >
            {passwordSaving ? "Updating..." : "Update password"}
          </button>
        </div>

        {/* Appearance Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-md bg-zinc-800 flex items-center justify-center shrink-0">
              <MdOutlineColorLens size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Appearance</h2>
              <p className="text-xs text-zinc-500">
                Customize the look and feel of your workspace.
              </p>
            </div>
          </div>

          <p className="text-xs uppercase tracking-wide text-zinc-500 mb-3">
            Theme
          </p>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {themeOptions.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => {
                  setTheme(value);
                  toast.success(`Theme set to ${label}`);
                }}
                className={`relative flex flex-col items-center gap-2 py-4 sm:py-5 rounded-lg border transition-colors ${
                  theme === value
                    ? "border-zinc-400 bg-zinc-800"
                    : "border-zinc-800 hover:border-zinc-700"
                }`}
              >
                {theme === value && (
                  <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center">
                    ✓
                  </span>
                )}
                <Icon size={18} />
                <span className="text-xs">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Account Card */}
        <div className="bg-zinc-900 border border-danger/30 rounded-lg p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-md bg-danger/10 flex items-center justify-center shrink-0">
              <RiLogoutBoxRLine
                size={18}
                className="text-danger-soft"
              />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-danger-soft">Account</h2>
              <p className="text-xs text-zinc-500">
                Sign out or permanently delete your account.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 border-t border-zinc-800">
            <div>
              <p className="text-sm font-medium">Sign out</p>
              <p className="text-xs text-zinc-500">
                End your current session on this device.
              </p>
            </div>
            <button
              onClick={() => setLogoutConfirmOpen(true)}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-sm font-medium transition-colors shrink-0"
            >
              <RiLogoutBoxRLine size={16} aria-hidden="true" />
              Sign out
            </button>

            <ConfirmModal
              isOpen={logoutConfirmOpen}
              title="Sign out?"
              message="You'll need to log back in to access your notes, todos, and journals."
              confirmLabel="Sign out"
              loadingLabel="Signing out..."
              variant="accent"
              onClose={() => setLogoutConfirmOpen(false)}
              onConfirm={handleLogout}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 border-t border-zinc-800">
            <div>
              <p className="text-sm font-medium text-danger-soft">Delete account</p>
              <p className="text-xs text-zinc-500">
                Permanently remove your account and all notes. This cannot be
                undone.
              </p>
            </div>
            <button
              onClick={() => setDeleteConfirmOpen(true)}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-danger hover:bg-danger-strong text-danger-ink text-sm font-medium transition-colors shrink-0"
            >
              <LuTrash2 size={14} />
              Delete
            </button>

            <ConfirmModal
              isOpen={deleteConfirmOpen}
              title="Delete your account?"
              message="This will permanently delete your account and all your notes, todos, and journals. This action cannot be undone."
              onClose={() => setDeleteConfirmOpen(false)}
              onConfirm={handleDeleteAccount}
            />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
