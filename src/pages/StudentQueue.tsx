import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Users } from "lucide-react";
import StudentNavbar from "../components/layouts/StudentNavbar";
import { supabase } from "../api/supabaseClient";

// --- Interfaces ---
interface Office {
  id: string;
  name: string;
}

interface QueueEntry {
  id: string;
  office_id: string;
  student_number: string;
  order_number: number;
  // FIXED: Updated status types to match what Staff Dashboard actually writes
  status: "waiting" | "called" | "served" | "cancelled" | "skipped";
  created_at: string;
}

export default function StudentQueue() {
  const navigate = useNavigate();
  const location = useLocation();
  const office = (location.state as { office: Office } | null)?.office;

  // --- State ---
  const [userId, setUserId] = useState<string | null>(null);
  const [myQueue, setMyQueue] = useState<QueueEntry | null>(null);
  const [queueList, setQueueList] = useState<QueueEntry[]>([]);
  const [currentServing, setCurrentServing] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // --- Helpers ---
  const formatQueueNumber = (num: number) => {
    if (!office) return `#${num}`;
    const prefix = office.name.charAt(0).toUpperCase();
    return `${prefix}-${num}`;
  };

  // --- Auth Check ---
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUserId(data.user.id);
      } else {
        navigate("/");
      }
    };
    checkAuth();
  }, [navigate]);

  // --- Redirect Safety ---
  useEffect(() => {
    if (!office) navigate("/student/dashboard");
  }, [office, navigate]);

  // --- Fetch Function ---
  const fetchQueueData = async () => {
    if (!office) return;

    try {
      // A. Get "Now Serving"
      // FIXED: Changed status from 'serving' to 'called' to match Staff Dashboard
      const { data: serving } = await supabase
        .from("queue_entries")
        .select("order_number")
        .eq("office_id", office.id)
        .eq("status", "called") // <--- THIS WAS THE BUG
        .maybeSingle();

      setCurrentServing(serving ? serving.order_number : null);

      // B. Get "Waiting List"
      const { data: list, error } = await supabase
        .from("queue_entries")
        .select("*")
        .eq("office_id", office.id)
        .eq("status", "waiting")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setQueueList(list || []);

      // C. Find if "I" am in the list (Waiting OR Called)
      // If I am being called, I still want to see my ticket on screen!
      const { data: myActiveTicket } = await supabase
        .from("queue_entries")
        .select("*")
        .eq("office_id", office.id)
        .eq("student_number", userId)
        .in("status", ["waiting", "called"]) // Fetch if waiting OR called
        .maybeSingle();

      setMyQueue(myActiveTicket || null);
    } catch (error) {
      console.error("Error fetching queue:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- Real-time Subscription ---
  useEffect(() => {
    if (!userId || !office) return;
    fetchQueueData();

    const channel = supabase
      .channel(`queue_office_${office.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue_entries",
          filter: `office_id=eq.${office.id}`,
        },
        () => fetchQueueData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, office]);

  // --- JOIN QUEUE ---
  async function joinQueue() {
    if (!userId || !office) return;
    setLoading(true);

    try {
      // 1. CHECK: Is student already in ANY queue?
      const { data: activeQueues, error: checkError } = await supabase
        .from("queue_entries")
        .select("id, status")
        .eq("student_number", userId)
        .in("status", ["waiting", "called"]); // Block if waiting OR called

      if (checkError) throw checkError;

      if (activeQueues && activeQueues.length > 0) {
        alert("You are already in a queue!");
        setLoading(false);
        return;
      }

      // 2. Get next number
      const { data: maxEntry, error: fetchError } = await supabase
        .from("queue_entries")
        .select("order_number")
        .eq("office_id", office.id)
        .order("order_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;

      const nextOrderNumber = maxEntry ? maxEntry.order_number + 1 : 101;

      // 3. Insert
      const { error: insertError } = await supabase
        .from("queue_entries")
        .insert({
          office_id: office.id,
          student_number: userId,
          order_number: nextOrderNumber,
          status: "waiting",
        });

      if (insertError) throw insertError;
    } catch (error: any) {
      alert("Error joining queue: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  // --- Leave Queue ---
  async function leaveQueue() {
    if (!myQueue) return;
    const confirmLeave = window.confirm(
      "Are you sure you want to leave the queue?"
    );
    if (!confirmLeave) return;

    setLoading(true);

    const { error } = await supabase
      .from("queue_entries")
      .update({ status: "cancelled" })
      .eq("id", myQueue.id);

    if (error) alert("Error leaving queue");
    setLoading(false);
  }

  // UI Calculations
  const myPosition = myQueue
    ? queueList.findIndex((q) => q.id === myQueue.id)
    : 0;
  const estWaitTime = (myPosition + 1) * 5;

  // Determine Ticket State
  // If my status is 'called', show a special message instead of position
  const isMyTurn = myQueue?.status === "called";

  if (!office) return null;

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col items-center pb-10">
      <StudentNavbar />

      <div className="w-full max-w-[1000px] px-5 mt-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-gray-200 transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="font-bold text-[24px] text-gray-800">{office.name}</h1>
        </div>

        {/* NOW SERVING BOARD */}
        <div
          className={`p-6 rounded-2xl shadow-sm border text-center mb-6 transition-colors duration-500 ${
            isMyTurn
              ? "bg-green-50 border-green-500"
              : "bg-white border-gray-100"
          }`}
        >
          <h2 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">
            Now Serving
          </h2>
          <div
            className={`text-6xl font-black tracking-tighter ${
              isMyTurn
                ? "text-green-600 scale-110 transform transition-transform"
                : "text-brand"
            }`}
          >
            {currentServing ? formatQueueNumber(currentServing) : "---"}
          </div>
          <div className="flex justify-center items-center gap-2 mt-4 text-gray-500 text-sm">
            <div
              className={`w-2 h-2 rounded-full animate-pulse ${
                isMyTurn ? "bg-green-500" : "bg-brand"
              }`}
            ></div>
            <span className={isMyTurn ? "font-bold text-green-700" : ""}>
              {isMyTurn ? "IT'S YOUR TURN!" : "Counter 1"}
            </span>
          </div>
        </div>

        {/* INTERACTION AREA */}
        {myQueue ? (
          // In Queue State
          <div
            className={`text-white rounded-2xl p-6 shadow-lg relative overflow-hidden mb-8 animate-fade-in ${
              isMyTurn
                ? "bg-green-600 shadow-green-600/30"
                : "bg-brand shadow-brand/30"
            }`}
          >
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
            <div className="relative z-10 text-center">
              <h3 className="text-white/80 text-sm font-medium mb-1">
                Your Queue Number
              </h3>
              <div className="text-5xl font-bold mb-4">
                {formatQueueNumber(myQueue.order_number)}
              </div>

              {!isMyTurn && (
                <div className="flex justify-center gap-6 text-sm bg-black/10 py-3 rounded-lg backdrop-blur-sm">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-white/70" />
                    <span>{myPosition} ahead</span>
                  </div>
                  <div className="w-px bg-white/20"></div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-white/70" />
                    <span>~{estWaitTime} mins</span>
                  </div>
                </div>
              )}

              {isMyTurn && (
                <div className="bg-white/20 py-2 rounded-lg font-bold animate-pulse">
                  Please proceed to the counter
                </div>
              )}

              <button
                onClick={leaveQueue}
                disabled={loading || isMyTurn} // Disable leaving if it's already your turn
                className="mt-6 text-[14px] text-white/70 hover:text-white underline decoration-white/30 hover:decoration-white transition-colors cursor-pointer disabled:opacity-50"
              >
                {loading ? "Processing..." : "Leave Queue"}
              </button>
            </div>
          </div>
        ) : (
          // Join Button
          <button
            onClick={joinQueue}
            disabled={loading}
            className="w-full py-4 bg-brand text-white rounded-xl font-bold text-lg shadow-lg shadow-brand/20 hover:bg-brand-dark active:scale-[0.98] transition-all mb-8 cursor-pointer disabled:bg-gray-400"
          >
            {loading ? "Loading..." : "Get a Number"}
          </button>
        )}

        {/* UP NEXT LIST */}
        <div className="mt-8">
          <h3 className="text-gray-500 text-sm font-semibold mb-4 ml-1">
            Up Next
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {queueList.length > 0 ? (
              queueList.slice(0, 8).map((entry) => (
                <div
                  key={entry.id}
                  className={`border py-3 rounded-lg text-center font-bold text-sm shadow-sm transition-all ${
                    entry.id === myQueue?.id
                      ? "bg-brand/10 border-brand text-brand scale-105"
                      : "bg-white border-gray-100 text-gray-600"
                  }`}
                >
                  {formatQueueNumber(entry.order_number)}
                </div>
              ))
            ) : (
              <p className="col-span-4 text-center text-gray-400 text-sm py-4 bg-gray-50 rounded-lg">
                The queue is currently empty.
              </p>
            )}
            {queueList.length > 8 && (
              <div className="text-gray-300 flex items-center justify-center text-xs">
                ...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
