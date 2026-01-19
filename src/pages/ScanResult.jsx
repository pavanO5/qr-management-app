import { useLocation, useNavigate } from "react-router-dom";

function ScanResult() {
  const location = useLocation();
  const navigate = useNavigate();

  const qrValue = location.state?.qrValue;

  if (!qrValue) {
    return (
      <div style={{ padding: "20px" }}>
        <h3>Invalid Access</h3>
        <button onClick={() => navigate("/")}>Go Back</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>QR Scan Successful</h2>
      <p><strong>QR Value:</strong> {qrValue}</p>

      <button onClick={() => navigate("/")}>
        Scan Another QR
      </button>
    </div>
  );
}

export default ScanResult;
