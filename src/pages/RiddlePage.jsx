import { useEffect, useState } from "react";
import { supabase } from "../supabase";

function RiddlePage() {
  const [riddle, setRiddle] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRiddle = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("user_riddles")
      .select("riddles(title, riddle)")
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      setRiddle(null);
    } else {
      setRiddle(data.riddles);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchRiddle();

    // ✅ REALTIME UPDATE WHEN RIDDLE CHANGES
    const channel = supabase
      .channel("riddle-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_riddles",
        },
        () => {
          fetchRiddle();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return <p style={{ textAlign: "center" }}>Loading riddle...</p>;
  }

  if (!riddle) {
    return (
      <div style={{ padding: 30, textAlign: "center" }}>
        <h2>No riddle found</h2>
        <p>Please scan a valid QR code.</p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 30,
        maxWidth: 600,
        margin: "auto",
        textAlign: "center",
      }}
    >
      <h2>{riddle.title}</h2>

      <div
        style={{
          marginTop: 20,
          padding: 20,
          border: "2px solid #333",
          borderRadius: 8,
          background: "#f9f9f9",
        }}
      >
        <p style={{ fontSize: "18px" }}>{riddle.riddle}</p>
      </div>
    </div>
  );
}

export default RiddlePage;
