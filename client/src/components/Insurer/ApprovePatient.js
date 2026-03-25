import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserRegistry from "../../contracts/UserRegistry.json";

const CONTRACT_ADDRESS = "0x71924c5065c8Fa224C48346D01763d40A5635C0C";

function ApprovePatient({ account, web3 }) {
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [actionMsg, setActionMsg] = useState("");
  const [error, setError]         = useState("");
  const [search, setSearch]       = useState("");
  const [filter, setFilter]       = useState("All");

  useEffect(() => {
    if (web3 && account) loadPatients();
  }, [web3, account]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const contract = new web3.eth.Contract(
        UserRegistry.abi, CONTRACT_ADDRESS
      );
      const allAddresses = await contract.methods
        .getAllPatients()
        .call();
      const list = [];
      for (let addr of allAddresses) {
        const data = await contract.methods
          .getPatient(addr)
          .call();
        list.push(data);
      }
      setPatients(list);
      setLoading(false);
    } catch (err) {
      setError("❌ Error: " + err.message);
      setLoading(false);
    }
  };

  const approvePatient = async (walletAddress) => {
    try {
      setActionMsg("");
      setError("");
      const contract = new web3.eth.Contract(
        UserRegistry.abi, CONTRACT_ADDRESS
      );
      await contract.methods
        .approvePatient(walletAddress)
        .send({ from: account });
      setActionMsg("✅ Patient Approved Successfully!");
      loadPatients();
    } catch (err) {
      setError("❌ Error: " + err.message);
    }
  };

  const rejectPatient = async (walletAddress) => {
    try {
      setActionMsg("");
      setError("");
      const contract = new web3.eth.Contract(
        UserRegistry.abi, CONTRACT_ADDRESS
      );
      await contract.methods
        .rejectPatient(walletAddress)
        .send({ from: account });
      setActionMsg("Patient Rejected!");
      loadPatients();
    } catch (err) {
      setError("❌ Error: " + err.message);
    }
  };

  // Filter + Search
  const filtered = patients.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.mobile.includes(search) ||
      p.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "All" || p.status === filter;
    return matchSearch && matchFilter;
  });

  const counts = {
    All:      patients.length,
    Pending:  patients.filter((p) => p.status === "Pending").length,
    Approved: patients.filter((p) => p.status === "Approved").length,
    Rejected: patients.filter((p) => p.status === "Rejected").length,
  };

  return (
    <div style={S.page}>

      {/* Header */}
      <div style={S.header}>
        <h1 style={S.title}>✅ Patient Management</h1>
        <p style={S.badge}>{account}</p>
        <button style={S.backBtn} onClick={() => navigate("/insurer")}>
          ← Back to Dashboard
        </button>
      </div>

      {/* Messages */}
      {actionMsg && <p style={S.successMsg}>{actionMsg}</p>}
      {error     && <p style={S.errorMsg}>{error}</p>}

      {/* Stats Row */}
      <div style={S.statsRow}>
        {Object.entries(counts).map(([key, val]) => (
          <div
            key={key}
            style={{
              ...S.statBox,
              borderColor:
                key === "Pending"  ? "#f39c12"
                : key === "Approved" ? "#2ecc71"
                : key === "Rejected" ? "#e74c3c"
                : "#3498db",
              cursor: "pointer",
              backgroundColor: filter === key ? "#f0f4f8" : "white",
            }}
            onClick={() => setFilter(key)}
          >
            <div style={{
              ...S.statNum,
              color:
                key === "Pending"  ? "#f39c12"
                : key === "Approved" ? "#2ecc71"
                : key === "Rejected" ? "#e74c3c"
                : "#3498db",
            }}>
              {val}
            </div>
            <div style={S.statLabel}>{key}</div>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div style={S.tableCard}>

        {/* Table Top */}
        <div style={S.tableTopRow}>
          <div>
            <span style={S.tableTitle}>Patient Registrations</span>
            <span style={S.countPill}>{filtered.length} shown</span>
          </div>
          <div style={S.searchBox}>
            <input
              style={S.searchInput}
              type="text"
              placeholder="🔍 Search name, mobile, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button style={S.refreshBtn} onClick={loadPatients}>🔄</button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <p style={S.center}>🔄 Loading patients...</p>
        ) : filtered.length === 0 ? (
          <p style={S.center}>
            {patients.length === 0
              ? "No patient registrations yet."
              : "No results found."}
          </p>
        ) : (
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  {["ID","Name","DOB","Gender","Mobile","Email","OTP","Status","Actions"].map((h) => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                    <td style={S.td}>#{p.patientId.toString()}</td>
                    <td style={{ ...S.td, fontWeight: "600", color: "#2c3e50" }}>
                      <div style={S.nameCell}>
                        <div style={S.avatar}>
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        {p.name}
                      </div>
                    </td>
                    <td style={S.td}>{p.dob}</td>
                    <td style={S.td}>{p.gender}</td>
                    <td style={S.td}>{p.mobile}</td>
                    <td style={S.td}>{p.email}</td>
                    <td style={S.td}>
                      <span style={{
                        ...S.pill,
                        backgroundColor: p.otpVerified ? "#d4edda" : "#f8d7da",
                        color: p.otpVerified ? "#155724" : "#721c24",
                      }}>
                        {p.otpVerified ? "✅ Yes" : "❌ No"}
                      </span>
                    </td>
                    <td style={S.td}>
                      <span style={{
                        ...S.pill,
                        backgroundColor:
                          p.status === "Approved" ? "#d4edda"
                          : p.status === "Rejected" ? "#f8d7da"
                          : "#fff3cd",
                        color:
                          p.status === "Approved" ? "#155724"
                          : p.status === "Rejected" ? "#721c24"
                          : "#856404",
                      }}>
                        {p.status}
                      </span>
                    </td>
                    <td style={S.td}>
                      {p.status === "Pending" ? (
                        <div style={S.actionBtns}>
                          <button
                            style={S.approveBtn}
                            onClick={() => approvePatient(p.walletAddress)}
                          >
                            ✅ Approve
                          </button>
                          <button
                            style={S.rejectBtn}
                            onClick={() => rejectPatient(p.walletAddress)}
                          >
                            ❌ Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: "#95a5a6", fontSize: "12px" }}>
                          {p.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const S = {
  page:       { backgroundColor: "#f0f4f8", minHeight: "100vh", padding: "40px 20px", fontFamily: "Arial, sans-serif" },
  header:     { textAlign: "center", marginBottom: "25px" },
  title:      { fontSize: "30px", color: "#2c3e50", marginBottom: "8px" },
  badge:      { display: "inline-block", backgroundColor: "#eafaf1", color: "#27ae60", padding: "5px 14px", borderRadius: "20px", fontSize: "12px", marginBottom: "10px" },
  backBtn:    { backgroundColor: "#95a5a6", color: "white", padding: "8px 18px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", display: "block", margin: "8px auto 0" },
  successMsg: { color: "#27ae60", backgroundColor: "#eafaf1", padding: "12px", borderRadius: "8px", textAlign: "center", maxWidth: "1000px", margin: "0 auto 15px auto" },
  errorMsg:   { color: "#e74c3c", backgroundColor: "#fdf2f2", padding: "12px", borderRadius: "8px", textAlign: "center", maxWidth: "1000px", margin: "0 auto 15px auto" },
  statsRow:   { display: "flex", justifyContent: "center", gap: "15px", marginBottom: "25px", flexWrap: "wrap" },
  statBox:    { backgroundColor: "white", padding: "15px 30px", borderRadius: "12px", textAlign: "center", border: "2px solid", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", minWidth: "100px" },
  statNum:    { fontSize: "28px", fontWeight: "800" },
  statLabel:  { fontSize: "12px", color: "#7f8c8d", fontWeight: "600", marginTop: "3px" },
  tableCard:  { backgroundColor: "white", borderRadius: "15px", maxWidth: "1200px", margin: "0 auto", boxShadow: "0 4px 15px rgba(0,0,0,0.08)", overflow: "hidden" },
  tableTopRow:{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 25px", borderBottom: "1px solid #f0f4f8", flexWrap: "wrap", gap: "10px" },
  tableTitle: { fontSize: "16px", fontWeight: "bold", color: "#2c3e50", marginRight: "10px" },
  countPill:  { backgroundColor: "#ebf5fb", color: "#3498db", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" },
  searchBox:  { display: "flex", gap: "8px", alignItems: "center" },
  searchInput:{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #bdc3c7", fontSize: "13px", width: "280px" },
  refreshBtn: { backgroundColor: "#f0f4f8", border: "1px solid #bdc3c7", padding: "8px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "14px" },
  tableWrap:  { overflowX: "auto" },
  table:      { width: "100%", borderCollapse: "collapse" },
  th:         { backgroundColor: "#f8f9fa", padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#6c757d", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid #e9ecef", whiteSpace: "nowrap" },
  td:         { padding: "11px 16px", fontSize: "13px", color: "#495057", borderBottom: "1px solid #f0f4f8", whiteSpace: "nowrap" },
  nameCell:   { display: "flex", alignItems: "center", gap: "8px" },
  avatar:     { width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "#3498db", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold", flexShrink: 0 },
  pill:       { padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "bold" },
  actionBtns: { display: "flex", gap: "6px" },
  approveBtn: { backgroundColor: "#2ecc71", color: "white", padding: "5px 10px", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "bold", whiteSpace: "nowrap" },
  rejectBtn:  { backgroundColor: "#e74c3c", color: "white", padding: "5px 10px", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "bold", whiteSpace: "nowrap" },
  center:     { textAlign: "center", padding: "40px", color: "#7f8c8d" },
};

export default ApprovePatient;