import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../../api/supabaseClient";
import logo from "../../assets/logo.svg";
import { LogOut } from "lucide-react";

export default function Navbar() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");

  useEffect(() => {
    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Prioritize full_name, fallback to email
        const displayName = user.user_metadata?.full_name || user.email;
        setUsername(displayName);
      }
    };
    getUserData();
  }, []);

  const handleLogout = async () => {
    const confirmLogout = window.confirm("Are you sure you want to logout?");
    if (confirmLogout) {
      const { error } = await supabase.auth.signOut();
      if (error) console.error("Error logging out:", error.message);
      navigate("/");
    }
  };

  return (
    <nav className="w-full h-[50px] bg-brand flex items-center justify-between shadow-[0_4px_8px_rgba(0,0,0,0.15)] lg:h-[65px] px-[10px]">
      {/* Left Side: Logo */}
      <img src={logo} alt="logo" className="h-[45px]" />

      {/* Right Side: Grouping Container */}
      <div className="flex items-center gap-3">
        
        {/* Username Display */}
        <span className="text-black font-semibold text-sm lg:text-base capitalize truncate max-w-[150px]">
          {username ? `Hi, ${username}` : "Loading..."}
        </span>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="bg-black flex justify-center items-center rounded-full h-[35px] w-[90px] text-white text-[12px] gap-1 hover:scale-[1.1] transition-all ease-in cursor-pointer"
        >
          <LogOut className="text-white h-[20px]" />
          Logout
        </button>
      </div>
    </nav>
  );
}