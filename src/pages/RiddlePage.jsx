import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabase";

function RiddlePage() {
  const { id } = useParams(); // riddle ID from URL
  const [riddle, setRiddle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRiddle = async () => {
      const { data, error } = await supabase
        .from("riddles")
        .select("title, riddle")
        .eq("id", id)
        .single();

      if (!error) {
        setRiddle(data);
      }

      setLoading(false);
    };

    fetchRiddle();
  }, [id]);

  if (loading) {
    return <p style={{ padding: 20 }}>Loading riddle...</p>;
  }

  if (!riddle) {
    return (
      <div style={{ padding: 20 }}>
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
