import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-white to-gray-200 flex flex-col items-center p-4 sm:p-8 font-sans">
      
      {/* Top Header Section */}
      <header className="w-full max-w-7xl flex flex-col md:flex-row justify-between items-center mb-8 px-4">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-4 md:mb-0">
          <div className="text-black">
             <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="transform -skew-x-12">
                <path d="M19 13l-4-2.5-3 3.5 1 4h-2.5l-2-4-4-1.5 2-4.5 5.5-2 1.5-4h4v2.5h-3l-1.5 3 2.5 1.5 3 4z" />
             </svg>
          </div>
          <div className="font-bold text-xl tracking-wide text-slate-800">
            QUEUE <br className="hidden" /> <span className="font-extrabold">TRACK</span>
          </div>
        </div>

        {/* Navigation Buttons */}
        <nav className="flex gap-4 text-sm font-medium text-slate-700">
          <button onClick={() => navigate('/home')} className="px-6 py-2 rounded-full bg-slate-100 shadow-inner text-slate-900 font-semibold border border-slate-200">
            Home
          </button>
          <button onClick={() => navigate('/signup')} className="px-6 py-2 rounded-full bg-white shadow-[0_2px_5px_rgba(0,0,0,0.05)] hover:shadow-md hover:-translate-y-0.5 transition-all border border-slate-200">
            Register as a staff
          </button>
          <button onClick={() => navigate('/signup')} className="px-6 py-2 rounded-full bg-white shadow-[0_2px_5px_rgba(0,0,0,0.05)] hover:shadow-md hover:-translate-y-0.5 transition-all border border-slate-200">
            Register as a student
          </button>
        </nav>
      </header>

      {/* Main Hero Card */}
      <div className="relative w-full max-w-7xl h-[600px] rounded-[3rem] overflow-hidden shadow-2xl">
        
        {/* Background Image */}
        <img 
          src="#" /*https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop*/
          alt="Office Background" 
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Green Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#4d8b6b]/95 via-[#5aa37d]/90 to-[#6dbf8e]/80 backdrop-blur-[2px]"></div>

        {/* Content Container */}
        <div className="relative z-10 w-full h-full flex flex-col md:flex-row justify-between items-center px-12 md:px-24">
          
          {/* Left Side */}
          <div className="flex flex-col gap-8 max-w-lg w-full">
            <div className="relative text-white font-black text-7xl leading-[0.9] drop-shadow-lg tracking-tight select-none">
              <div className="flex items-center">
                 <span>QUEUE</span>
              </div>
              <div className="flex items-center gap-2 ml-1">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="white" className="transform -skew-x-12">
                    <path d="M19 13l-4-2.5-3 3.5 1 4h-2.5l-2-4-4-1.5 2-4.5 5.5-2 1.5-4h4v2.5h-3l-1.5 3 2.5 1.5 3 4z" />
                </svg>
                <span>TRACK</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-4 mt-4">
              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/70 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search for offices"
                  className="w-full pl-14 pr-6 py-4 rounded-full bg-[#3a6351]/60 border border-white/10 text-white placeholder-white/70 shadow-lg backdrop-blur-md focus:outline-none focus:bg-[#3a6351]/80 transition-all"
                />
              </div>

              <div className="flex flex-col gap-3">
                 <button 
                    onClick={() => navigate('/login')}
                    className="w-full py-4 rounded-full bg-[#345c48] hover:bg-[#2d503f] text-white font-semibold shadow-[0_4px_10px_rgba(0,0,0,0.2)] transition-all flex justify-center items-center border-t border-white/10"
                 >
                    Log in
                 </button>
                 
                 <button 
                    onClick={() => navigate('/signup')}
                    className="w-full py-4 rounded-full bg-[#3e6b53] hover:bg-[#345c48] text-white font-semibold shadow-[0_4px_10px_rgba(0,0,0,0.2)] transition-all flex justify-center items-center border-t border-white/10"
                 >
                    Get started
                 </button>
              </div>
            </div>
          </div>

          {/* Right Side */}
          <div className="hidden md:block text-right">
            <h2 className="text-white text-4xl font-normal leading-snug drop-shadow-md max-w-xs ml-auto">
              Efficient queueing,<br/>seamless tracking.
            </h2>
          </div>

        </div>
      </div>
    </div>
  );
}