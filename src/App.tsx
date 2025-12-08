import { Routes, Route, Navigate } from "react-router-dom"; // Removed BrowserRouter alias
import { Toaster } from "react-hot-toast";
import StudentDashboard from './pages/StudentDashboard';
import StaffDashboard from "./pages/StaffDashboard";
import HomePage from './pages/HomePage';
import ProtectedRoute from "./components/ProtectedRoute";
import StudentQueue from "./pages/StudentQueue";

import { useUserRole } from "./hooks/useUserRole";


function App() {
  const { role, loading } = useUserRole();

  return (
    // No <Router> here anymore! It's in main.tsx
    <>
      <Toaster />
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/student/queue" element={<StudentQueue />} />

        {/* Student-only page */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute isAllowed={role === "student" || role === "admin"} loading={loading}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        {/* Staff-only page */}
        <Route
          path="/staff/dashboard"
          element={
            <ProtectedRoute isAllowed={role === "staff" || role === "admin"} loading={loading}>
              <StaffDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;