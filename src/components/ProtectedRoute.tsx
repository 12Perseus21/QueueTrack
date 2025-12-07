import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  isAllowed: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

export default function ProtectedRoute({
  isAllowed,
  loading = false,
  children,
}: ProtectedRouteProps) {

  // While fetching user + role → show loading screen
  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Checking access...</p>
      </div>
    );
  }

  // If not allowed → redirect to login
  if (!isAllowed) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
