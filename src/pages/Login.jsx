import { useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

function Login() {
  const [isTeam, setIsTeam] = useState(false);
  const [email, setEmail] = useState("");
  const [teamId, setTeamId] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const loginAdmin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return alert(error.message);
    navigate("/");
  };

  const loginTeam = async () => {
    const deviceId = navigator.userAgent;

    const { data, error } = await supabase.rpc("team_login", {
      p_team_code: teamId,
      p_password: password,
      p_device_id: deviceId,
    });

    if (error) return alert(error.message);

    localStorage.setItem("team_id", data);
    navigate("/scan");
  };

  return (
    <div style={{ padding: 30 }}>
      <h2>{isTeam ? "Team Login" : "Admin Login"}</h2>

      {isTeam ? (
        <>
          <input
            placeholder="Team ID"
            onChange={(e) => setTeamId(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={loginTeam}>Login as Team</button>
        </>
      ) : (
        <>
          <input
            placeholder="Admin Email"
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={loginAdmin}>Login as Admin</button>
        </>
      )}

      <hr />

      <button onClick={() => setIsTeam(!isTeam)}>
        Switch to {isTeam ? "Admin" : "Team"} Login
      </button>
    </div>
  );
}

export default Login;
