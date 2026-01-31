import { useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState(""); // Team ID or Admin Email
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  /* ================= UNIFIED LOGIN ================= */
  const handleLogin = async () => {
    if (!identifier || !password) {
      setErrorMsg("PLEASE ENTER ALL FIELDS");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    /* ---------- TRY TEAM LOGIN FIRST ---------- */
    const { data: teamId, error: teamError } = await supabase.rpc(
      "team_login",
      {
        p_team_code: identifier.trim(),
        p_password: password.trim(),
        p_device_id: navigator.userAgent,
      }
    );

    if (!teamError && teamId) {
      localStorage.setItem("team_id", teamId);
      setLoading(false);
      navigate("/scan", { replace: true });
      return;
    }

    /* ---------- FALLBACK TO ADMIN LOGIN ---------- */
    const { data, error: adminError } =
      await supabase.auth.signInWithPassword({
        email: identifier.trim(),
        password: password.trim(),
      });

    setLoading(false);

    if (adminError) {
      setErrorMsg("INVALID CREDENTIALS");
      return;
    }

    if (data?.session) {
      localStorage.removeItem("team_id");
      navigate("/admin-dashboard", { replace: true });
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background:
          "linear-gradient(135deg, #0f2a44 0%, #1e5fa3 45%, #ffffff 100%)",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 460,
          background: "white",
          padding: "40px 35px",
          borderRadius: 14,
          boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
          textAlign: "center",
        }}
      >
        {/* ================= HEADINGS ================= */}
        <h1
          style={{
            fontSize: 42,
            fontWeight: 900,
            marginBottom: 5,
            letterSpacing: 2,
          }}
        >
          WELCOME
        </h1>

        <h2
          style={{
            fontSize: 32,
            fontWeight: 800,
            marginBottom: 6,
            letterSpacing: 1.5,
          }}
        >
          TREASURE HUNT
        </h2>

        <h2
          style={{
            fontSize: 28,
            fontWeight: 900,
            marginBottom: 10,
            letterSpacing: 2,
            color: "#1e5fa3",
          }}
        >
          KARUKRIT 2026
        </h2>

        <p
          style={{
            fontSize: 12,
            letterSpacing: 1.2,
            marginBottom: 30,
            color: "#555",
          }}
        >
          A FEST BY DEPARTMENT OF CSE
        </p>

        {/* ================= ERROR ================= */}
        {errorMsg && (
          <div
            style={{
              background: "#ffe6e6",
              color: "#b00000",
              padding: 10,
              borderRadius: 6,
              marginBottom: 15,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* ================= LOGIN FORM ================= */}
        <input
          placeholder="TEAM ID / ADMIN EMAIL"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          style={{
            width: "100%",
            padding: "14px",
            marginBottom: 14,
            borderRadius: 8,
            border: "1px solid #ccc",
            fontSize: 15,
            textTransform: "uppercase",
          }}
        />

        <input
          type="password"
          placeholder="PASSWORD"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: "14px",
            marginBottom: 22,
            borderRadius: 8,
            border: "1px solid #ccc",
            fontSize: 15,
          }}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            background: "#1e5fa3",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: 1,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "LOGGING IN..." : "LOGIN"}
        </button>

        <p
          style={{
            marginTop: 20,
            fontSize: 12,
            color: "#777",
            letterSpacing: 0.8,
          }}
        >
          ADMIN & TEAM LOGIN – SINGLE PORTAL
        </p>
      </div>
    </div>
  );
}

export default Login;
