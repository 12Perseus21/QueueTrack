import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../api/supabaseClient";

// Type definitions for database records
interface Office {
  id: number;
  name: string;
  description: string;
}

interface QueueEntry {
  id: number;
  office_id: number;
  student_number: string;
  status: string;
}

export default function StudentDashboard() {
  const [offices, setOffices] = useState<Office[]>([]);
  const [myQueue, setMyQueue] = useState<QueueEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch offices
  async function fetchOffices() {
    const { data, error } = await supabase
      .from("offices")
      .select("*")
      .order("name", { ascending: true });

    if (!error) setOffices(data || []);
  }

  // Fetch student queue entry (active only)
  async function fetchMyQueue() {
    if (!userId) return;

    const {
      data: queue,
      error,
    } = await supabase
      .from("queue_entries")
      .select("*")
      .eq("student_number", userId)
      .eq("status", "waiting")
      .single();

    if (!error) setMyQueue(queue);
  }

  // Join a queue
  async function joinQueue(officeId: number) {
    if (!userId) {
      alert("Please log in first");
      return;
    }

    const { error } = await supabase.from("queue_entries").insert({
      office_id: officeId,
      student_number: userId,
      status: "waiting",
    });

    if (!error) {
      alert("You've joined the queue!");
      fetchMyQueue();
    } else {
      alert("Already in queue or something went wrong.");
    }
  }

  // Get logged-in user - redirect to login if not authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser();

      if (data.user) {
        setUserId(data.user.id);
        fetchOffices();
        setLoading(false);
      } else {
        navigate("/login");
      }
    };

    checkAuth();
  }, []);

  // Outdated - Poll queue every 5s when userId is available
  // Updated - real time fetching of queue status for better user experience
  useEffect(() => {
    if (!userId) return;

    fetchMyQueue();

    const channel = supabase
      .channel(`queue_updated_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'queue_entries',
          filter: `student_number=eq.${userId}`,
        },
        () => {
          fetchMyQueue();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    }
  }, [userId]);

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">QueueTrack — Student Dashboard</h1>

      <button
        onClick={async () => {
          await supabase.auth.signOut();
          window.location.href = "/login"; // safest redirect
        }}
        className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
      >
        Logout
      </button>

      {/* Show My Queue */}
      {myQueue ? (
        <div className="mb-6 p-4 bg-blue-100 border border-blue-300 rounded-lg">
          <h2 className="text-lg font-semibold">You're in a Queue</h2>
          <p className="mt-2">Office: {myQueue.office_id}</p>
          <p>Status: {myQueue.status}</p>
        </div>
      ) : (
        <div className="mb-4 p-4 bg-green-100 border border-green-300 rounded-lg">
          <p>You are not in a queue.</p>
        </div>
      )}
  
      {/* Office List */}
      <h2 className="text-xl font-semibold mb-2">Available Offices</h2>
      <div className="space-y-3">
        {offices.map((office) => (
          <div
            key={office.id}
            className="p-4 bg-white shadow rounded-lg border flex justify-between items-center"
          >
            <div>
              <h3 className="font-semibold">{office.name}</h3>
              <p className="text-sm text-gray-600">{office.description}</p>
            </div>

            {!myQueue ? (
              <button
                onClick={() => joinQueue(office.id)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Join Queue
              </button>
            ) : (
              <button
                disabled
                className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
              >
                In Queue
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
