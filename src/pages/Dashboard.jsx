import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { getUserLocation } from "../utils/location";
import { ADMIN_EMAILS } from "../config/admin";
import ScanQR from "./ScanQR";
import AdminDashboard from "./AdminDashboard";

function Dashboard() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setIsAdmin(ADMIN_EMAILS.includes(user.email));

      const loc = await getUserLocation();
      setLocation(loc);
    } catch (err) {
      setError(err);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  if (error) {
    return (
      <div style={{ padding: "20px" }}>
        <h3>Location Required</h3>
        <button onClick={init}>Retry</button>
        <button onClick={logout}>Logout</button>
      </div>
    );
  }

  if (!location) {
    return <p>Loading...</p>;
  }

  return (
    <div style={{ padding: "20px" }}>
      {isAdmin ? (
        <AdminDashboard />
      ) : (
        <>
          <h3>User Dashboard</h3>
          <ScanQR location={location} />
        </>
      )}

      <button onClick={logout}>Logout</button>
    </div>
  );
}

export default Dashboard;
