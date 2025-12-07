import { useState, useEffect } from "react";
import { supabase } from "../api/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

        if (profile?.role === "student") navigate("/student");
        if (profile?.role === "staff") navigate("/staff");
        if (profile?.role === "admin") navigate("/staff");
      }
    };

    checkUser();
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    // Supabase login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    const user = data.user;

    if (!user) {
      setErrorMessage("Something went wrong.");
      setLoading(false);
      return;
    }

    // Fetch user profile + role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    setLoading(false);

    if (profile?.role === "student") {
      navigate("/student");
    } else if (profile?.role === "staff") {
      navigate("/staff");
    } else if (profile?.role === "admin"){
      console.log("admin login");
      navigate("/staff");
    } else if (!profile) {
      setErrorMessage("Unable to fetch profile. Contact admin.");
      return;
    } else {
      setErrorMessage("No role assigned. Contact admin.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-md"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">QueueTrack Login</h1>

        {errorMessage && (
          <p className="text-red-600 text-sm mb-3">{errorMessage}</p>
        )}

        <label className="block mb-3">
          <span className="font-medium">Email</span>
          <input
            type="email"
            required
            className="w-full mt-1 p-2 border rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label className="block mb-4">
          <span className="font-medium">Password</span>
          <input
            type="password"
            required
            className="w-full mt-1 p-2 border rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p
        className="text-sm text-blue-600 text-center mt-3 cursor-pointer hover:underline"
        onClick={() => navigate("/forgot-password")}
        >
        Forgot password?
        </p>

        <p
        className="text-sm text-blue-600 text-center mt-2 cursor-pointer hover:underline"
        onClick={() => navigate("/signup")}
        >
        Don't have an account? Sign Up
        </p>

      </form>
    </div>
  );
}
