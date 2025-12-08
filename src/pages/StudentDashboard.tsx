import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../api/supabaseClient";
import {
  FileText,
  Stethoscope,
  ChevronRight,
  Building,
  Users,
} from "lucide-react";

import StudentNavbar from "../components/layouts/Navbar";

// --- FIXED TYPES ---
interface Office {
  id: string;
  name: string;
  description: string;
}

interface QueueEntry {
  id: string;
  office_id: string;
  student_number: string;
  status: string;
}

export default function StudentDashboard() {
  const [offices, setOffices] = useState<Office[]>([]);
  const [myQueue, setMyQueue] = useState<QueueEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  // 1. Fetch Offices
  async function fetchOffices() {
    const { data, error } = await supabase
      .from("offices")
      .select("*")
      .order("name", { ascending: true });

    if (!error) setOffices(data || []);
  }

  // 2. Fetch Active Queue (FIXED)
  async function fetchMyQueue() {
    if (!userId) return;

    const { data: queue, error } = await supabase
      .from("queue_entries")
      .select("*")
      .eq("student_number", userId)
      // FIXED: Check for BOTH 'waiting' AND 'called'
      // This ensures the banner stays visible when staff calls the student
      .in("status", ["waiting", "called"])
      .maybeSingle();

    if (!error) {
      setMyQueue(queue);
    } else {
      console.error("Error fetching my queue:", error.message);
    }
  }

  // 3. Navigation Handler
  const handleOfficeClick = (office: Office) => {
    navigate("/student/queue", { state: { office } });
  };

  // 4. Auth Check & Initial Load
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser();

      if (data.user) {
        setUserId(data.user.id);
        fetchOffices();
        setLoading(false);
      } else {
        navigate("/");
      }
    };
    checkAuth();
  }, [navigate]);

  // 5. Real-time Queue Updates
  useEffect(() => {
    if (!userId) return;

    fetchMyQueue();

    const channel = supabase
      .channel(`queue_dashboard_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue_entries",
          filter: `student_number=eq.${userId}`,
        },
        () => {
          fetchMyQueue();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Helper to get an icon based on office name
  const getIconForOffice = (name: string) => {
    if (name.toLowerCase().includes("clinic"))
      return <Stethoscope className="w-8 h-8 text-brand" />;
    if (name.toLowerCase().includes("registrar"))
      return <FileText className="w-8 h-8 text-brand" />;
    return <Building className="w-8 h-8 text-brand" />;
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center text-brand font-bold animate-pulse">
        Loading Dashboard...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col items-center">
      <StudentNavbar />

      {/* Header Section */}
      <div className="mt-10 mb-8 text-center px-4">
        <h1 className="font-bold text-[28px] text-gray-900">
          Available Offices
        </h1>
        <p className="text-gray-500 mt-2 text-[15px]">
          Select an office below to view status or join the queue
        </p>
      </div>

      {/* Active Queue Banner */}
      {myQueue && (
        <div
          onClick={() => {
            const activeOffice = offices.find(
              (o) => o.id === myQueue.office_id
            );
            if (activeOffice) handleOfficeClick(activeOffice);
          }}
          className="w-full max-w-[800px] px-5 mb-6 cursor-pointer"
        >
          {/* Change color if Called to alert user */}
          <div
            className={`text-white p-4 rounded-xl shadow-lg flex items-center justify-between animate-fade-in ${
              myQueue.status === "called" ? "bg-green-600" : "bg-brand"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs opacity-80 uppercase font-bold tracking-wider">
                  {myQueue.status === "called"
                    ? "IT'S YOUR TURN!"
                    : "You are in queue"}
                </p>
                <p className="font-bold">Tap to view your ticket</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 opacity-80" />
          </div>
        </div>
      )}

      {/* Grid Container for Cards */}
      <div className="w-full max-w-[800px] px-5 grid grid-cols-1 md:grid-cols-2 gap-4 pb-10">
        {offices.map((office) => (
          <button
            key={office.id}
            onClick={() => handleOfficeClick(office)}
            className="group relative bg-white p-6 rounded-2xl shadow-sm border border-transparent hover:border-brand hover:shadow-md transition-all duration-300 text-left flex items-start gap-4 cursor-pointer"
          >
            <div className="p-3 bg-brand/10 rounded-xl group-hover:bg-brand/20 transition-colors">
              {getIconForOffice(office.name)}
            </div>

            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-bold text-lg text-gray-800 group-hover:text-brand transition-colors">
                  {office.name}
                </h3>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
                {office.description ||
                  "Join the queue for inquiries and transactions."}
              </p>
            </div>

            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-brand absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
          </button>
        ))}

        {offices.length === 0 && (
          <div className="col-span-full text-center text-gray-400 py-10">
            No offices available at the moment.
          </div>
        )}
      </div>
    </div>
  );
}
