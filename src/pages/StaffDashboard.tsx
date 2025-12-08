import { useEffect, useState } from "react";
import { supabase } from "../api/supabaseClient";
import { useNavigate } from "react-router-dom";
import { LogOut, User, Bell, CheckCircle, XCircle } from "lucide-react";

// --- Interfaces ---
interface Office {
  id: string;
  name: string;
}

interface QueueEntry {
  id: string;
  student_number: string;
  order_number: number; // Added this to match DB
  status: "waiting" | "called" | "served" | "skipped" | "cancelled";
  created_at: string;
}

export default function StaffDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [office, setOffice] = useState<Office | null>(null);
  const [queue, setQueue] = useState<QueueEntry[]>([]);

  // Helper: Format Ticket Number (e.g., 101 -> R-101)
  const formatQueueNumber = (num: number) => {
    if (!office) return `#${num}`;
    const prefix = office.name.charAt(0).toUpperCase();
    return `${prefix}-${num}`;
  };

  // 1. Fetch Staff Profile & Office
  async function fetchProfile() {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      navigate("/");
      return;
    }

    // Get the staff's assigned office
    const { data: profile } = await supabase
      .from("profiles")
      .select("office_id")
      .eq("id", authData.user.id)
      .single();

    if (!profile?.office_id) {
      alert("No office assigned to your account. Please contact admin.");
      await supabase.auth.signOut();
      navigate("/");
      return;
    }

    // Get Office Details
    const { data: officeData } = await supabase
      .from("offices")
      .select("*")
      .eq("id", profile.office_id)
      .single();

    setOffice(officeData || null);
  }

  // 2. Fetch Queue (Active Only)
  // We only want to see people who are Waiting or Currently being Called
  async function fetchQueue() {
    if (!office) return;

    const { data, error } = await supabase
      .from("queue_entries")
      .select("*")
      .eq("office_id", office.id)
      .in("status", ["waiting", "called"]) // Filter out served/skipped to keep list clean
      .order("created_at", { ascending: true }); // Oldest first

    if (error) console.error("Error fetching queue:", error);
    setQueue(data || []);
  }

  // 3. Call Next Student
  async function callNext() {
    // A. Check if anyone is already being called (optional workflow enforcement)
    const currentlyCalled = queue.find((q) => q.status === "called");
    if (currentlyCalled) {
      if (
        !confirm(
          `Ticket ${formatQueueNumber(
            currentlyCalled.order_number
          )} is currently called. Mark them as served first?`
        )
      )
        return;
      await markServed(currentlyCalled.id);
    }

    // B. Find the next waiting person
    const next = queue.find((q) => q.status === "waiting");
    if (!next) {
      alert("No waiting students in queue.");
      return;
    }

    // C. Update Status
    const { error } = await supabase
      .from("queue_entries")
      .update({ status: "called" })
      .eq("id", next.id);

    if (error) alert("Error calling next student");
    fetchQueue();
  }

  // 4. Mark Served
  async function markServed(entryId: string) {
    await supabase
      .from("queue_entries")
      .update({ status: "served" })
      .eq("id", entryId);

    fetchQueue();
  }

  // 5. Mark Skipped (No Show)
  async function markSkipped(entryId: string) {
    await supabase
      .from("queue_entries")
      .update({ status: "skipped" })
      .eq("id", entryId);

    fetchQueue();
  }

  // 6. Logout
  async function logout() {
    await supabase.auth.signOut();
    navigate("/");
  }

  // --- Effects ---

  // Initial Load
  useEffect(() => {
    const init = async () => {
      await fetchProfile();
      setLoading(false);
    };
    init();
  }, []);

  // Real-time & Fetch Trigger
  useEffect(() => {
    if (!office) return;

    fetchQueue();

    const channel = supabase
      .channel(`staff_dashboard_${office.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue_entries",
          filter: `office_id=eq.${office.id}`,
        },
        () => fetchQueue()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [office]);

  // --- Render ---

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center text-gray-500 font-medium">
        Loading Staff Dashboard...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Staff Dashboard
            </h1>
            <p className="text-sm text-gray-500">
              Office:{" "}
              <span className="font-bold text-brand">{office?.name}</span>
            </p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <User className="w-5 h-5" />
            Current Queue ({queue.length})
          </h2>

          <button
            onClick={callNext}
            className="flex items-center gap-2 px-6 py-3 bg-brand text-white font-bold rounded-xl shadow-lg shadow-brand/20 hover:bg-brand-dark active:scale-95 transition-all"
          >
            <Bell className="w-5 h-5" />
            CALL NEXT STUDENT
          </button>
        </div>

        {/* Queue List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {queue.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              No students currently waiting.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {queue.map((entry) => (
                <div
                  key={entry.id}
                  className={`p-4 flex flex-col md:flex-row justify-between items-center gap-4 transition-colors ${
                    entry.status === "called"
                      ? "bg-green-50/50 border-l-4 border-green-500"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {/* Student Info */}
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                        entry.status === "called"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {entry.order_number}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        {formatQueueNumber(entry.order_number)}
                      </h3>
                      <p
                        className={`text-xs font-bold uppercase tracking-wider ${
                          entry.status === "called"
                            ? "text-green-600"
                            : "text-gray-400"
                        }`}
                      >
                        {entry.status}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 w-full md:w-auto">
                    {entry.status === "called" && (
                      <button
                        onClick={() => markServed(entry.id)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Mark Done
                      </button>
                    )}

                    {/* Skip Button (Available for waiting or called) */}
                    <button
                      onClick={() => markSkipped(entry.id)}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
                    >
                      <XCircle className="w-4 h-4" />
                      No Show
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
