import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const navigate = useNavigate();

  // ✅ ensure consistent comparison
  const teamId = String(localStorage.getItem("team_id") || "");

  /* =============================
     FETCH LEADERBOARD
  ============================= */
  const fetchLeaderboard = async () => {
    const { data, error } = await supabase.rpc("get_leaderboard");

    if (error) {
      console.error("Leaderboard error:", error);
      return;
    }

    setLeaderboard(data || []);
  };

  /* =============================
     INITIAL LOAD + REALTIME
  ============================= */
  useEffect(() => {
    fetchLeaderboard();

    // ✅ REALTIME LISTENERS
    const channel = supabase
      .channel("leaderboard-live")

      // when a QR is scanned
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "scans",
        },
        () => {
          fetchLeaderboard();
        }
      )

      // when admin deletes scans / resets game
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "teams",
        },
        () => {
          fetchLeaderboard();
        }
      )

      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>🏆 Leaderboard</h2>

      {leaderboard.length === 0 && <p>No data yet</p>}

      {leaderboard.map((team, index) => (
        <div
          key={team.team_id}
          style={{
            padding: 12,
            marginBottom: 8,
            borderRadius: 6,
            background:
              String(team.team_id) === teamId
                ? "#d1ffe3"
                : "#f3f3f3",
            fontWeight:
              String(team.team_id) === teamId
                ? "bold"
                : "normal",
          }}
        >
          #{index + 1} — Team {team.team_code} —{" "}
          {team.total_scans} scans
          {String(team.team_id) === teamId && " (You)"}
        </div>
      ))}

      <button
        onClick={() => navigate("/scan")}
        style={{
          marginTop: 20,
          padding: "10px 16px",
        }}
      >
        Back to Scan
      </button>
    </div>
  );
}

export default Leaderboard;
