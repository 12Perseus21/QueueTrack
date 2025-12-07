import { useEffect, useState } from "react";
import { supabase } from "../api/supabaseClient";
import { useNavigate } from "react-router-dom";

interface Office {
  id: string;
  name: string;
}

interface QueueEntry {
  id: string;
  student_number: string;
  status: string;
  created_at: string;
}

export default function StaffDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [office, setOffice] = useState<Office | null>(null);
  const [queue, setQueue] = useState<QueueEntry[]>([]);

  // Fetch staff profile + assigned office
  async function fetchProfile() {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      navigate("/login");
      return;
    }

    setUserId(authData.user.id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("office_id")
      .eq("id", authData.user.id)
      .single();

    if (!profile?.office_id) {
      alert("No office assigned. Contact admin.");
      return;
    }

    const { data: officeData } = await supabase
      .from("offices")
      .select("*")
      .eq("id", profile.office_id)
      .single();

    setOffice(officeData || null);
  }

  // Fetch queue entries for this office
  async function fetchQueue() {
    if (!office) return;

    const { data } = await supabase
      .from("queue_entries")
      .select("*")
      .eq("office_id", office.id)
      .order("created_at", { ascending: true });

    setQueue(data || []);
  }

  // Call next student
  async function callNext() {
    if (!queue.length) return;
    const next = queue.find((q) => q.status === "waiting");
    if (!next) {
      alert("No waiting students in queue.");
      return;
    }

    await supabase
      .from("queue_entries")
      .update({ status: "called" })
      .eq("id", next.id);

    fetchQueue();
  }

  // Mark student as served
  async function markServed(entryId: string) {
    await supabase
      .from("queue_entries")
      .update({ status: "served" })
      .eq("id", entryId);

    fetchQueue();
  }

  // Mark student as skipped
  async function markSkipped(entryId: string) {
    await supabase
      .from("queue_entries")
      .update({ status: "skipped" })
      .eq("id", entryId);

    fetchQueue();
  }

  // Logout
  async function logout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  // Init
  useEffect(() => {
    const init = async () => {
      await fetchProfile();
      setLoading(false);
    };
    init();
  }, []);

  // Real-time updates
  useEffect(() => {
    if (!office) return;

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
        () => {
          fetchQueue();
        }
      )
      .subscribe();

    fetchQueue();

    return () => { void supabase.removeChannel(channel); };
  }, [office]);

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">QueueTrack — Staff Dashboard</h1>
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold">Office: {office?.name}</h2>
      </div>

      <div className="mb-4 flex gap-3">
        <button
          onClick={callNext}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Call Next
        </button>
      </div>

      <h2 className="text-lg font-semibold mb-2">Queue List</h2>
      <div className="space-y-2">
        {queue.length === 0 && (
          <p className="text-gray-600">No students in queue.</p>
        )}
        {queue.map((entry) => (
          <div
            key={entry.id}
            className="p-3 bg-white rounded shadow flex justify-between items-center border"
          >
            <div>
              <p>
                Student: <span className="font-medium">{entry.student_number}</span>
              </p>
              <p>Status: <span className="font-medium">{entry.status}</span></p>
            </div>
            <div className="flex gap-2">
              {entry.status === "called" || entry.status === "waiting" ? (
                <>
                  <button
                    onClick={() => markServed(entry.id)}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Served
                  </button>
                  <button
                    onClick={() => markSkipped(entry.id)}
                    className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    Skip
                  </button>
                </>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
