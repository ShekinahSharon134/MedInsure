import React, { useState, useEffect } from "react";
import HospitalRegistry from "../../contracts/HospitalRegistry.json";

// ================================
// UPDATE YOUR CONTRACT ADDRESS
// ================================
const CONTRACT_ADDRESS =
  "0x29981FDD4C7040673b7b7E0eF5B8df69ae39Bb1F";

function HospitalDashboard({ account, web3 }) {

  const [hospital, setHospital]         = useState(null);
  const [loading, setLoading]           = useState(true);
  const [notRegistered, setNotRegistered] = useState(false);

  useEffect(() => {
    if (web3 && account) loadHospitalData();
  }, [web3, account]);

  const loadHospitalData = async () => {
    try {
      setLoading(true);

      const contract = new web3.eth.Contract(
        HospitalRegistry.abi,
        CONTRACT_ADDRESS
      );

      const isRegistered = await contract.methods
        .checkHospital(account)
        .call();

      if (!isRegistered) {
        setNotRegistered(true);
        setLoading(false);
        return;
      }

      const hospitalData = await contract.methods
        .getHospital(account)
        .call();

      setHospital(hospitalData);
      setLoading(false);

    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // ================================
  // LOADING
  // ================================
  if (loading) {
    return (
      <div style={S.center}>
        <div style={{ fontSize: "40px" }}>🔄</div>
        <h2>Loading hospital details...</h2>
      </div>
    );
  }

  // ================================
  // NOT REGISTERED
  // ================================
  if (notRegistered) {
    return (
      <div style={S.page}>
        <div style={S.header}>
          <h1 style={S.title}>🏨 Hospital Dashboard</h1>
          <p style={S.badge}>{account}</p>
        </div>
        <div style={S.emptyCard}>
          <div style={{ fontSize: "60px" }}>⚠️</div>
          <h2 style={{ color: "#e67e22", marginBottom: "10px" }}>
            Not Registered!
          </h2>
          <p style={{ color: "#7f8c8d", marginBottom: "10px" }}>
            Your hospital is not registered
            in MedInsure system.
          </p>
          <p style={{ color: "#7f8c8d" }}>
            Please contact the insurer
            to register your hospital.
          </p>
        </div>
      </div>
    );
  }

  // ================================
  // MAIN DASHBOARD
  // ================================
  return (
    <div style={S.page}>

      {/* Header */}
      <div style={S.header}>
        <h1 style={S.title}>🏨 Hospital Dashboard</h1>
        <p style={S.badge}>{account}</p>
        <button
          style={S.refreshBtn}
          onClick={loadHospitalData}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Status Banner */}
      <div style={{
        ...S.statusBanner,
        backgroundColor: hospital.status === "Active"
          ? "#eafaf1" : "#fdf2f2",
        borderColor: hospital.status === "Active"
          ? "#2ecc71" : "#e74c3c",
        color: hospital.status === "Active"
          ? "#27ae60" : "#e74c3c",
      }}>
        <span style={{ fontSize: "22px" }}>
          {hospital.status === "Active" ? "✅" : "❌"}
        </span>
        <span style={{ fontWeight: "bold", fontSize: "16px" }}>
          Hospital Status: {hospital.status}
        </span>
      </div>

      {/* Cards Row */}
      <div style={S.cardRow}>

        {/* Hospital Details */}
        <div style={S.card}>
          <h2 style={S.cardTitle}>🏥 Hospital Details</h2>

          <InfoRow label="Hospital ID"     value={"#" + hospital.hospitalId.toString()} />
          <InfoRow label="Hospital Name"   value={hospital.name} />
          <InfoRow label="Address"         value={hospital.location} />
          <InfoRow label="City"            value={hospital.city} />
          <InfoRow label="State"           value={hospital.state} />
          <InfoRow label="Pincode"         value={hospital.pincode} />
          <InfoRow label="License Number"  value={hospital.licenseNumber} />
          <InfoRow label="Status"          value={hospital.status} />
          <InfoRow
            label="Registered On"
            value={new Date(
              Number(hospital.timestamp) * 1000
            ).toLocaleDateString()}
          />
        </div>

        {/* Wallet & Network Details */}
        <div style={S.card}>
          <h2 style={S.cardTitle}>🔗 Blockchain Details</h2>

          <InfoRow
            label="Wallet Address"
            value={hospital.walletAddress}
          />

          <div style={S.infoBox}>
            <div style={{ fontSize: "40px", marginBottom: "10px" }}>⛓️</div>
            <p style={{ color: "#7f8c8d", fontSize: "13px", lineHeight: "1.8" }}>
              Your hospital is registered
              on the Ethereum blockchain.
              All patient claims will be
              processed through this wallet.
            </p>
          </div>

          {/* Phase 2 Notice */}
          <div style={S.phase2Box}>
            <h3 style={{ color: "#3498db", marginBottom: "8px", fontSize: "15px" }}>
              🚀 Coming in Phase 2:
            </h3>
            <ul style={{ color: "#7f8c8d", fontSize: "13px", lineHeight: "2", paddingLeft: "20px" }}>
              <li>Submit Patient Claims</li>
              <li>View Claim Status</li>
              <li>Receive Claim Payments</li>
              <li>Patient Medical Records</li>
              <li>ML Fraud Detection</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Helper
function InfoRow({ label, value }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "9px 0",
      borderBottom: "1px solid #f0f4f8",
    }}>
      <span style={{ color: "#7f8c8d", fontSize: "13px", fontWeight: "bold" }}>
        {label}
      </span>
      <span style={{ color: "#2c3e50", fontSize: "13px", textAlign: "right", maxWidth: "55%", wordBreak: "break-all" }}>
        {value}
      </span>
    </div>
  );
}

const S = {
  page:    { backgroundColor: "#f0f4f8", minHeight: "100vh", padding: "40px 20px", fontFamily: "Arial, sans-serif" },
  center:  { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "Arial, sans-serif" },
  header:  { textAlign: "center", marginBottom: "30px" },
  title:   { fontSize: "32px", color: "#2c3e50", marginBottom: "8px" },
  badge:   { display: "inline-block", backgroundColor: "#eafaf1", color: "#27ae60", padding: "6px 16px", borderRadius: "20px", fontSize: "13px", marginBottom: "10px", wordBreak: "break-all" },
  refreshBtn: { backgroundColor: "#95a5a6", color: "white", padding: "8px 20px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", display: "block", margin: "8px auto 0" },
  statusBanner: { display: "flex", alignItems: "center", gap: "10px", padding: "15px 25px", borderRadius: "12px", border: "2px solid", maxWidth: "860px", margin: "0 auto 30px auto" },
  cardRow: { display: "flex", justifyContent: "center", gap: "30px", flexWrap: "wrap", maxWidth: "1000px", margin: "0 auto" },
  card:    { backgroundColor: "white", padding: "30px", borderRadius: "15px", width: "400px", boxShadow: "0 4px 15px rgba(0,0,0,0.08)" },
  cardTitle: { fontSize: "18px", color: "#2c3e50", marginBottom: "15px", paddingBottom: "10px", borderBottom: "2px solid #f0f4f8" },
  emptyCard: { backgroundColor: "white", padding: "50px 40px", borderRadius: "15px", maxWidth: "450px", margin: "0 auto", textAlign: "center", boxShadow: "0 4px 15px rgba(0,0,0,0.08)" },
  infoBox: { backgroundColor: "#f8f9fa", padding: "20px", borderRadius: "10px", textAlign: "center", margin: "20px 0" },
  phase2Box: { backgroundColor: "#ebf5fb", padding: "20px", borderRadius: "10px", marginTop: "10px" },
};

export default HospitalDashboard;