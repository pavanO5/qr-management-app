import { useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("admin"); // admin | team
  const [email, setEmail] = useState("");
  const [teamId, setTeamId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  /* ================= ADMIN LOGIN ================= */
  const handleAdminLogin = async () => {
    if (!email || !password) {
      alert("Enter email and password");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    if (data?.session) {
      navigate("/"); // Admin dashboard
    }
  };

  /* ================= TEAM LOGIN ================= */
const handleTeamLogin = async () => {
  setLoading(true);

  const { data, error } = await supabase.rpc("team_login", {
    p_team_code: teamId,
    p_password: password,
    p_device_id: navigator.userAgent,
  });

  setLoading(false);

  if (error) {
    alert(error.message);
    return;
  }

  localStorage.setItem("team_id", data);

  // ✅ FORCE reload so App.jsx detects team
  window.location.href = "/scan";
};

  return (
    <div style={{ padding: 30, maxWidth: 400, margin: "auto" }}>
      <h2>{mode === "admin" ? "Admin Login" : "Team Login"}</h2>

      {/* MODE SWITCH */}
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setMode("admin")}>Admin</button>
        <button onClick={() => setMode("team")}>Team</button>
      </div>

      {/* ADMIN LOGIN */}
      {mode === "admin" && (
        <>
          <input
            type="email"
            placeholder="Admin Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", marginBottom: 10 }}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", marginBottom: 10 }}
          />

          <button type="button" onClick={handleAdminLogin} disabled={loading}>
            Login as Admin
          </button>
        </>
      )}

      {/* TEAM LOGIN */}
      {mode === "team" && (
        <>
          <input
            placeholder="Team ID"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            style={{ width: "100%", marginBottom: 10 }}
          />

          <input
            type="password"
            placeholder="Team Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", marginBottom: 10 }}
          />

         <button type="button" onClick={handleTeamLogin} disabled={loading}>
            Login as Team
          </button>
        </>
      )}
    </div>
  );
}

export default Login;
