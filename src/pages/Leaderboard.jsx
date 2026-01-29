import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const navigate = useNavigate();
  const teamId = localStorage.getItem("team_id");

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    const { data, error } = await supabase.rpc("get_leaderboard");
    if (!error) setLeaderboard(data || []);
  };

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
              team.team_id === teamId ? "#d1ffe3" : "#f3f3f3",
            fontWeight:
              team.team_id === teamId ? "bold" : "normal",
          }}
        >
          #{index + 1} — Team {team.team_code} —{" "}
          {team.total_scans} scans{" "}
          {team.team_id === teamId && " (You)"}
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
