import { useState } from "react";
import { supabase } from "../api/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function SignUpPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"student" | "staff">("student");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    setLoading(true);

    // Sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Insert into profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: data.user.id,
          email,
          role,
        });

      if (profileError) {
        setErrorMessage(profileError.message);
      } else {
        alert("Sign-up successful! Please log in.");
        navigate("/login");
      }
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSignUp}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-md"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">Sign Up</h1>

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

        <label className="block mb-3">
          <span className="font-medium">Password</span>
          <input
            type="password"
            required
            className="w-full mt-1 p-2 border rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <label className="block mb-3">
          <span className="font-medium">Confirm Password</span>
          <input
            type="password"
            required
            className="w-full mt-1 p-2 border rounded"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </label>

        <label className="block mb-4">
          <span className="font-medium">Role</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "student" | "staff")}
            className="w-full mt-1 p-2 border rounded"
          >
            <option value="student">Student</option>
            <option value="staff">Staff</option>
          </select>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>

        <p
          className="text-sm text-blue-600 text-center mt-3 cursor-pointer hover:underline"
          onClick={() => navigate("/login")}
        >
          Already have an account? Log in
        </p>
      </form>
    </div>
  );
}
