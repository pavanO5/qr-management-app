import { useEffect, useState } from "react";
import { supabase } from "../supabase";

function TeamManager() {
  const [teams, setTeams] = useState([]);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");

  const fetchTeams = async () => {
    const { data } = await supabase.from("teams").select("*");
    setTeams(data || []);
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  // ✅ Create team
  const createTeam = async () => {
    if (!code || !password) {
      alert("Enter team ID and password");
      return;
    }

    const { error } = await supabase.from("teams").insert({
      team_code: code,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setCode("");
    setPassword("");
    fetchTeams();
  };

  // ❌ Delete team
  const deleteTeam = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this team?\nThis will log them out immediately."
    );

    if (!confirmDelete) return;

    const { error } = await supabase
      .from("teams")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    fetchTeams();
  };

  return (
    <div style={{ padding: 30 }}>
      <h2>Team Management</h2>

      {/* Create Team */}
      <div style={{ marginBottom: 20 }}>
        <input
          placeholder="Team ID"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <input
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={createTeam}>Create Team</button>
      </div>

      <hr />

      {/* Team List */}
      <h3>Existing Teams</h3>

      {teams.length === 0 && <p>No teams created</p>}

      {teams.map((team) => (
        <div
          key={team.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "10px",
            border: "1px solid #ccc",
            marginBottom: "10px",
            borderRadius: "6px",
          }}
        >
          <div>
            <strong>{team.team_code}</strong>
          </div>

          <button
            style={{
              background: "crimson",
              color: "white",
              border: "none",
              padding: "6px 12px",
              cursor: "pointer",
            }}
            onClick={() => deleteTeam(team.id)}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}

export default TeamManager;
