import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

function TeamManager() {
  const navigate = useNavigate();

  const [teams, setTeams] = useState([]);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");

  // ✅ BULK STATES (NEW)
  const [bulkCount, setBulkCount] = useState("");
  const [bulkLoginLimit, setBulkLoginLimit] = useState(1);
  const [bulkTeams, setBulkTeams] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);

  /* ================= FETCH TEAMS (UNCHANGED) ================= */
  const fetchTeams = async () => {
    const { data } = await supabase.from("teams").select("*");
    setTeams(data || []);
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  /* ================= CREATE SINGLE TEAM (UNCHANGED) ================= */
  const createTeam = async () => {
    if (!code || !password) {
      alert("Enter team ID and password");
      return;
    }

    try {
      const { error } = await supabase.from("teams").insert({
        team_code: code.trim(),
        password: password.trim(),
        login_limit: 1, // keep default behaviour
      });

      if (error) {
        alert(error.message);
        return;
      }

      alert("Team created successfully!");
      setCode("");
      setPassword("");
      fetchTeams();
    } catch (err) {
      alert("Failed to create team");
    }
  };

  /* ================= BULK CREATE LOGIC (NEW) ================= */
  const proceedBulkCreate = () => {
    const n = parseInt(bulkCount);
    if (!n || n <= 0) {
      alert("Enter valid number of teams");
      return;
    }

    const temp = Array.from({ length: n }, (_, i) => ({
      team_code: `Team ${i + 1}`,
      password: "",
    }));

    setBulkTeams(temp);
    setShowBulkModal(true);
  };

  const createBulkTeams = async () => {
    const valid = bulkTeams.filter(
      (t) => t.team_code && t.password
    );

    if (valid.length === 0) {
      alert("Fill at least one team");
      return;
    }

    await supabase.from("teams").insert(
      valid.map((t) => ({
        team_code: t.team_code.trim(),
        password: t.password.trim(),
        login_limit: bulkLoginLimit,
      }))
    );

    setBulkTeams([]);
    setBulkCount("");
    setBulkLoginLimit(1);
    setShowBulkModal(false);
    fetchTeams();
  };

  /* ================= DELETE TEAM (UNCHANGED) ================= */
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
      {/* ================= NAVIGATION (NEW) ================= */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button onClick={() => navigate("/admin-dashboard")}>
          Admin Dashboard
        </button>
        <button onClick={() => navigate("/qr-manager")}>
          QR Manager
        </button>
        <button onClick={() => navigate("/riddle-manager")}>
          Riddle Manager
        </button>
      </div>

      <h2>Team Management</h2>

      {/* ================= CREATE SINGLE TEAM (UNCHANGED UI) ================= */}
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

      {/* ================= BULK CREATE (NEW) ================= */}
      <h3>Create Multiple Teams</h3>

      <input
        type="number"
        placeholder="Number of teams"
        value={bulkCount}
        onChange={(e) => setBulkCount(e.target.value)}
        style={{ width: 180, marginRight: 10 }}
      />

      <button onClick={proceedBulkCreate}>Proceed</button>

      <hr />

      {/* ================= TEAM LIST (UNCHANGED) ================= */}
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

      {/* ================= BULK CREATE MODAL (NEW) ================= */}
      {showBulkModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "white",
              padding: 20,
              width: 420,
              maxHeight: "80vh",
              overflowY: "auto",
              borderRadius: 8,
            }}
          >
            <h3>Create {bulkTeams.length} Teams</h3>

            <label>Login limit (applies to all)</label>
            <input
              type="number"
              value={bulkLoginLimit}
              onChange={(e) =>
                setBulkLoginLimit(+e.target.value)
              }
              style={{ width: "100%", marginBottom: 10 }}
            />

            {bulkTeams.map((t, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <input
                  placeholder="Team name"
                  value={t.team_code}
                  onChange={(e) => {
                    const copy = [...bulkTeams];
                    copy[i].team_code = e.target.value;
                    setBulkTeams(copy);
                  }}
                />

                <input
                  placeholder="Password"
                  value={t.password}
                  onChange={(e) => {
                    const copy = [...bulkTeams];
                    copy[i].password = e.target.value;
                    setBulkTeams(copy);
                  }}
                />
              </div>
            ))}

            <button onClick={createBulkTeams}>
              Create Teams
            </button>
            <button
              onClick={() => setShowBulkModal(false)}
              style={{ marginLeft: 10 }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamManager;
