import { useNavigate } from "react-router-dom";
import { supabase } from "../../api/supabaseClient"; // Adjust path if needed
import logo from "../../assets/logo.svg";
import { LogOut } from "lucide-react";

export default function Navbar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const confirmLogout = window.confirm(
      "Are you sure you want to logout?"
    );

    if (confirmLogout) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error logging out:", error.message);
      }
      navigate("/");
    }
  };

  return (
    <nav className="w-full h-[50px] bg-brand flex items-center justify-between shadow-[0_4px_8px_rgba(0,0,0,0.15)] lg:h-[65px]">
      <img src={logo} alt="logo" className="h-[45px] mx-[10px]" />

      <button
        onClick={handleLogout} // <--- Attached the function here
        className="mx-[10px] bg-black flex justify-center items-center rounded-full h-[35px] w-[90px] text-white text-[12px] gap-1 hover:scale-[1.1] transition-all ease-in cursor-pointer"
      >
        <LogOut className="text-white h-[20px]" />
        Logout
      </button>
    </nav>
  );
}
