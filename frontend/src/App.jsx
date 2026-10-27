import AuthLayout from "./layouts/AuthLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import Login from "./pages/auth/Login";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/dashboard/Dashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminRoute from "./components/AdminRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import Note from "./pages/dashboard/note/Note";
import Trash from "./pages/dashboard/note/Trash";
import Register from "./pages/auth/Register";
import VerifyOTP from "./pages/auth/VerifyOTP";
import Settings from "./pages/auth/Setting";
import Todo from "./pages/dashboard/todo/Todo";
import Journal from "./pages/dashboard/journal/Journal";
import { Toaster } from "react-hot-toast";
import NotFound from "./error/NotFound";
import JournalTrash from "./pages/dashboard/journal/JournalTrash";
import ResetPassword from "./pages/auth/ResetPassword";
import ForgotPassword from "./pages/auth/ForgotPassword";

export default function App() {
  return (
    <>
      {/* Toast Notification Container */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#2a1b14", // chocolate
            color: "#fff",
            border: "1px solid #3b271d", // chocolate border
            fontSize: "13px",
            borderRadius: "8px",
          },
          success: {
            iconTheme: {
              primary: "#22c55e", // green-500
              secondary: "#2a1b14",
            },
          },
          error: {
            iconTheme: {
              primary: "#E5484D", // danger
              secondary: "#2a1b14",
            },
          },
        }}
      />

      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/folders/:folderId/:noteId?" element={<Note />} />
          <Route path="/tags/:tagId/:noteId?" element={<Note />} />
          <Route path="/notes/:id?" element={<Note />} />
          <Route path="/trash/:id?" element={<Trash />} />
          <Route path="/todos" element={<Todo />} />
          <Route path="/journals" element={<Journal />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/journal/:id" element={<Journal />} />
          <Route path="/journal/trash" element={<JournalTrash />} />
          <Route path="/journal/trash/:id" element={<JournalTrash />} />
          <Route path="/settings" element={<Settings />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
