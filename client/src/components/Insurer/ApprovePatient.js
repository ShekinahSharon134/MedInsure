import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserRegistry from "../../contracts/UserRegistry.json";

const CONTRACT_ADDRESS = "0xc13889F84aB7351841CC70A807E9FF3AE1f3b401";

function ApprovePatient({ account, web3 }) {
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [actionMsg, setActionMsg] = useState("");
  const [error, setError]         = useState("");
  const [search, setSearch]       = useState("");
  const [filter, setFilter]       = useState("All");

  // Pre-registration form
  const [preForm, setPreForm] = useState({ name: "", dob: "", mobile: "" });
  const [generatedMemberId, setGeneratedMemberId] = useState("");
  const [preLoading, setPreLoading] = useState(false);
  const [preMsg, setPreMsg]         = useState("");
  const [preError, setPreError]     = useState("");
  const [showPreForm, setShowPreForm] = useState(false);

  // Auto-generate Member ID from name+dob+mobile using SHA-256
  const deriveMemberId = async (name, dob, mobile) => {
    if (!name || !dob || !mobile) { setGeneratedMemberId(""); return; }
    try {
      const raw    = name.trim().toLowerCase() + dob.trim() + mobile.trim();
      const enc    = new TextEncoder().encode(raw);
      const buf    = await crypto.subtle.digest("SHA-256", enc);
      const hex    = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("");
      const id     = "MED-" + hex.substring(0, 8).toUpperCase();
      setGeneratedMemberId(id);
    } catch (_) { setGeneratedMemberId(""); }
  };

  const handlePreFormChange = (e) => {
    const updated = { ...preForm, [e.target.name]: e.target.value };
    setPreForm(updated);
    deriveMemberId(updated.name, updated.dob, updated.mobile);
  };

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
      setError(" Error: " + err.message);
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
      setActionMsg(" Patient Approved Successfully!");
      loadPatients();
    } catch (err) {
      setError(" Error: " + err.message);
    }
  };

  const rejectPatient = async (walletAddress) => {
    try {
      setActionMsg(""); setError("");
      const contract = new web3.eth.Contract(UserRegistry.abi, CONTRACT_ADDRESS);
      await contract.methods.rejectPatient(walletAddress).send({ from: account });
      setActionMsg("Patient Rejected!");
      loadPatients();
    } catch (err) { setError(" Error: " + err.message); }
  };

  const handlePreRegister = async (e) => {
    e.preventDefault();
    if (!generatedMemberId) { setPreError("Fill all fields to generate Member ID."); return; }
    setPreLoading(true); setPreMsg(""); setPreError("");
    try {
      const contract     = new web3.eth.Contract(UserRegistry.abi, CONTRACT_ADDRESS);
      const memberIdHash = web3.utils.keccak256(generatedMemberId);
      const nameHash     = web3.utils.keccak256(preForm.name.trim());
      const dobHash      = web3.utils.keccak256(preForm.dob.trim());
      const mobileHash   = web3.utils.keccak256(preForm.mobile.trim());
      await contract.methods
        .preRegisterPatient(memberIdHash, nameHash, dobHash, mobileHash)
        .send({ from: account });
      setPreMsg(`Patient pre-registered. Member ID: ${generatedMemberId} — give this to the patient.`);
      setPreForm({ name: "", dob: "", mobile: "" });
      setGeneratedMemberId("");
    } catch (err) { setPreError(err.message); }
    setPreLoading(false);
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
        <h1 style={S.title}> Patient Management</h1>
        <p style={S.badge}>{account}</p>
        <button style={S.backBtn} onClick={() => navigate("/insurer")}>
          ← Back to Dashboard
        </button>
      </div>

      {/* Messages */}
      {actionMsg && <p style={S.successMsg}>{actionMsg}</p>}
      {error     && <p style={S.errorMsg}>{error}</p>}

      {/*  PRE-REGISTER PATIENT (Insurer adds patient after office visit)  */}
      <div style={{ maxWidth: "1200px", margin: "0 auto 20px", background: "#fff", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderBottom: showPreForm ? "1px solid #f0f4f8" : "none", cursor: "pointer" }}
          onClick={() => setShowPreForm(v => !v)}>
          <div>
            <span style={{ fontWeight: 700, fontSize: "15px", color: "#1E293B" }}>Pre-Register New Patient</span>
            <span style={{ fontSize: "12px", color: "#64748B", marginLeft: "10px" }}>After office visit — stores hashed details on blockchain</span>
          </div>
          <span style={{ fontSize: "18px", color: "#2563EB" }}>{showPreForm ? "" : ""}</span>
        </div>
        {showPreForm && (
          <form onSubmit={handlePreRegister} style={{ padding: "20px 24px" }}>
            {preMsg   && <p style={S.successMsg}>{preMsg}</p>}
            {preError && <p style={S.errorMsg}>{preError}</p>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              {[
                { label: "Full Name",     name: "name",   type: "text", ph: "Patient full name" },
                { label: "Date of Birth", name: "dob",    type: "date", ph: "" },
                { label: "Mobile Number", name: "mobile", type: "text", ph: "10-digit mobile" },
              ].map(f => (
                <div key={f.name}>
                  <label style={{ fontSize: "11px", fontWeight: "700", color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "5px" }}>{f.label}</label>
                  <input style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #DBEAFE", borderRadius: "7px", fontSize: "13px", boxSizing: "border-box" }}
                    type={f.type} placeholder={f.ph} required
                    name={f.name} value={preForm[f.name]} onChange={handlePreFormChange} />
                </div>
              ))}
              {/* Auto-generated Member ID */}
              <div>
                <label style={{ fontSize: "11px", fontWeight: "700", color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "5px" }}>
                  Generated Member ID
                </label>
                <div style={{
                  padding: "9px 12px", border: "1.5px solid #86EFAC", borderRadius: "7px",
                  fontSize: "15px", fontWeight: "700", letterSpacing: "2px",
                  background: generatedMemberId ? "#F0FDF4" : "#F8FAFC",
                  color: generatedMemberId ? "#15803D" : "#94A3B8",
                  minHeight: "38px"
                }}>
                  {generatedMemberId || "Fill all fields above..."}
                </div>
                {generatedMemberId && (
                  <p style={{ fontSize: "11px", color: "#15803D", marginTop: "4px", fontWeight: 600 }}>
                    Copy this ID and give it to the patient.
                  </p>
                )}
              </div>
            </div>
            <p style={{ fontSize: "11px", color: "#94A3B8", marginBottom: "12px" }}>
              Member ID is derived from patient details using SHA-256. Personal data is hashed before storing on-chain.
            </p>
            <button type="submit" disabled={preLoading || !generatedMemberId}
              style={{ background: (preLoading || !generatedMemberId) ? "#94A3B8" : "#1D4ED8", color: "#fff", border: "none", padding: "10px 24px", borderRadius: "8px", fontWeight: "700", fontSize: "13px", cursor: (preLoading || !generatedMemberId) ? "not-allowed" : "pointer" }}>
              {preLoading ? "Storing on blockchain..." : "Pre-Register Patient"}
            </button>
          </form>
        )}
      </div>

      {/* Stats Row */}
      <div style={S.statsRow}>
        {Object.entries(counts).map(([key, val]) => (
          <div
            key={key}
            style={{
              ...S.statBox,
              borderColor: "#2563EB",
              cursor: "pointer",
              backgroundColor: filter === key ? "#EFF6FF" : "white",
            }}
            onClick={() => setFilter(key)}
          >
            <div style={{ ...S.statNum, color: "#1D4ED8" }}>
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
              placeholder=" Search name, mobile, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button style={S.refreshBtn} onClick={loadPatients}></button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <p style={S.center}> Loading patients...</p>
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
                    <td style={{ ...S.td, fontWeight: "600", color: "#1E293B" }}>
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
                        backgroundColor: p.otpVerified ? "#DCFCE7" : "#FEE2E2",
                        color: p.otpVerified ? "#14532D" : "#7F1D1D",
                      }}>
                        {p.otpVerified ? " Yes" : " No"}
                      </span>
                    </td>
                    <td style={S.td}>
                      <span style={{
                        ...S.pill,
                        backgroundColor:
                          p.status === "Approved" ? "#DCFCE7"
                          : p.status === "Rejected" ? "#FEE2E2"
                          : "#FEF9C3",
                        color:
                          p.status === "Approved" ? "#14532D"
                          : p.status === "Rejected" ? "#7F1D1D"
                          : "#713F12",
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
                             Approve
                          </button>
                          <button
                            style={S.rejectBtn}
                            onClick={() => rejectPatient(p.walletAddress)}
                          >
                             Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: "#94A3B8", fontSize: "12px" }}>
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
  page:       { backgroundColor: "#F1F5F9", minHeight: "100vh", padding: "40px 20px", fontFamily: "'Inter', sans-serif" },
  header:     { textAlign: "center", marginBottom: "25px" },
  title:      { fontSize: "30px", color: "#1E293B", marginBottom: "8px" },
  badge:      { display: "inline-block", backgroundColor: "#F0FDF4", color: "#16A34A", padding: "5px 14px", borderRadius: "20px", fontSize: "12px", marginBottom: "10px" },
  backBtn:    { backgroundColor: "#94A3B8", color: "white", padding: "8px 18px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", display: "block", margin: "8px auto 0" },
  successMsg: { color: "#16A34A", backgroundColor: "#F0FDF4", padding: "12px", borderRadius: "8px", textAlign: "center", maxWidth: "1000px", margin: "0 auto 15px auto" },
  errorMsg:   { color: "#EF4444", backgroundColor: "#FEF2F2", padding: "12px", borderRadius: "8px", textAlign: "center", maxWidth: "1000px", margin: "0 auto 15px auto" },
  statsRow:   { display: "flex", justifyContent: "center", gap: "15px", marginBottom: "25px", flexWrap: "wrap" },
  statBox:    { backgroundColor: "white", padding: "15px 30px", borderRadius: "12px", textAlign: "center", border: "2px solid", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", minWidth: "100px" },
  statNum:    { fontSize: "28px", fontWeight: "800" },
  statLabel:  { fontSize: "12px", color: "#64748B", fontWeight: "600", marginTop: "3px" },
  tableCard:  { backgroundColor: "white", borderRadius: "15px", maxWidth: "1200px", margin: "0 auto", boxShadow: "0 4px 15px rgba(0,0,0,0.08)", overflow: "hidden" },
  tableTopRow:{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 25px", borderBottom: "1px solid #f0f4f8", flexWrap: "wrap", gap: "10px" },
  tableTitle: { fontSize: "16px", fontWeight: "bold", color: "#1E293B", marginRight: "10px" },
  countPill:  { backgroundColor: "#EFF6FF", color: "#2563EB", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" },
  searchBox:  { display: "flex", gap: "8px", alignItems: "center" },
  searchInput:{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #bdc3c7", fontSize: "13px", width: "280px" },
  refreshBtn: { backgroundColor: "#F1F5F9", border: "1px solid #bdc3c7", padding: "8px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "14px" },
  tableWrap:  { overflowX: "auto" },
  table:      { width: "100%", borderCollapse: "collapse" },
  th:         { backgroundColor: "#F8FAFC", padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#6c757d", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid #e9ecef", whiteSpace: "nowrap" },
  td:         { padding: "11px 16px", fontSize: "13px", color: "#495057", borderBottom: "1px solid #f0f4f8", whiteSpace: "nowrap" },
  nameCell:   { display: "flex", alignItems: "center", gap: "8px" },
  avatar:     { width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "#2563EB", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold", flexShrink: 0 },
  pill:       { padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "bold" },
  actionBtns: { display: "flex", gap: "6px" },
  approveBtn: { backgroundColor: "#22C55E", color: "white", padding: "5px 10px", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "bold", whiteSpace: "nowrap" },
  rejectBtn:  { backgroundColor: "#EF4444", color: "white", padding: "5px 10px", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "bold", whiteSpace: "nowrap" },
  center:     { textAlign: "center", padding: "40px", color: "#64748B" },
};

export default ApprovePatient;