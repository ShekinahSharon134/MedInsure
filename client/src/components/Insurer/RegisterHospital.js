import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import HospitalRegistry from "../../contracts/HospitalRegistry.json";

const CONTRACT_ADDRESS = "0xb100A10Adf98776d8483CaD03C4C628221F7187b";

function RegisterHospital({ account, web3 }) {
  const navigate = useNavigate();

  const [hospitals, setHospitals]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState("");
  const [search, setSearch]         = useState("");

  const [formData, setFormData] = useState({
    name: "", location: "", city: "",
    state: "", pincode: "", licenseNumber: "",
    walletAddress: "",
  });

  useEffect(() => {
    if (web3 && account) loadHospitals();
  }, [web3, account]);

  const loadHospitals = async () => {
    try {
      setLoading(true);
      const contract = new web3.eth.Contract(
        HospitalRegistry.abi, CONTRACT_ADDRESS
      );
      const events = await contract.getPastEvents(
        "HospitalRegistered",
        { fromBlock: 0, toBlock: "latest" }
      );
      const list = [];
      for (let e of events) {
        const data = await contract.methods
          .getHospital(e.returnValues.walletAddress)
          .call();
        list.push(data);
      }
      setHospitals(list);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const contract = new web3.eth.Contract(
        HospitalRegistry.abi, CONTRACT_ADDRESS
      );
      await contract.methods
        .registerHospital(
          formData.name, formData.location, formData.city,
          formData.state, formData.pincode,
          formData.licenseNumber, formData.walletAddress
        )
        .send({ from: account });
      setSuccess("✅ Hospital Registered Successfully!");
      setFormData({ name:"",location:"",city:"",state:"",pincode:"",licenseNumber:"",walletAddress:"" });
      setShowForm(false);
      loadHospitals();
    } catch (err) {
      setError("❌ Error: " + err.message);
    }
    setSubmitting(false);
  };

  // Filter by search
  const filtered = hospitals.filter((h) =>
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    h.city.toLowerCase().includes(search.toLowerCase()) ||
    h.licenseNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={S.page}>

      {/* Header */}
      <div style={S.header}>
        <h1 style={S.title}>🏨 Hospital Management</h1>
        <p style={S.badge}>{account}</p>
        <div style={S.headerBtns}>
          <button style={S.addBtn} onClick={() => { setShowForm(!showForm); setError(""); setSuccess(""); }}>
            {showForm ? "✕ Close Form" : "+ Register New Hospital"}
          </button>
          <button style={S.backBtn} onClick={() => navigate("/insurer")}>
            ← Back
          </button>
        </div>
      </div>

      {/* Messages */}
      {success && <p style={S.successMsg}>{success}</p>}
      {error   && <p style={S.errorMsg}>{error}</p>}

      {/* Register Form */}
      {showForm && (
        <div style={S.formCard}>
          <h2 style={S.formTitle}>Register New Hospital</h2>
          <form onSubmit={handleSubmit}>
            <div style={S.grid2}>
              {[
                { label: "Hospital Name",   name: "name",          ph: "Enter hospital name" },
                { label: "License Number",  name: "licenseNumber", ph: "Enter license number" },
                { label: "Address",         name: "location",      ph: "Enter address" },
                { label: "City",            name: "city",          ph: "Enter city" },
                { label: "State",           name: "state",         ph: "Enter state" },
                { label: "Pincode",         name: "pincode",       ph: "Enter pincode" },
              ].map((f) => (
                <div key={f.name} style={S.group}>
                  <label style={S.label}>{f.label}</label>
                  <input style={S.input} type="text" name={f.name}
                    placeholder={f.ph} value={formData[f.name]}
                    onChange={handleChange} required />
                </div>
              ))}
            </div>
            <div style={S.group}>
              <label style={S.label}>Hospital Wallet Address</label>
              <input style={S.input} type="text" name="walletAddress"
                placeholder="Enter ethereum wallet address"
                value={formData.walletAddress} onChange={handleChange} required />
            </div>
            <button style={S.submitBtn} type="submit" disabled={submitting}>
              {submitting ? "⏳ Registering..." : "🚀 Register Hospital"}
            </button>
          </form>
        </div>
      )}

      {/* Table Section */}
      <div style={S.tableCard}>

        {/* Table Header Row */}
        <div style={S.tableTopRow}>
          <div>
            <span style={S.tableTitle}>Registered Hospitals</span>
            <span style={S.countPill}>{hospitals.length} Total</span>
          </div>
          <div style={S.searchBox}>
            <input
              style={S.searchInput}
              type="text"
              placeholder="🔍 Search by name, city, license..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button style={S.refreshBtn} onClick={loadHospitals}>🔄</button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <p style={S.center}>🔄 Loading...</p>
        ) : filtered.length === 0 ? (
          <p style={S.center}>
            {hospitals.length === 0
              ? "No hospitals registered yet."
              : "No results found."}
          </p>
        ) : (
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  {["ID","Hospital Name","City","State","Pincode","License","Wallet","Registered","Status"].map((h) => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((h, i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                    <td style={S.td}>#{h.hospitalId.toString()}</td>
                    <td style={{ ...S.td, fontWeight: "600", color: "#2c3e50" }}>{h.name}</td>
                    <td style={S.td}>{h.city}</td>
                    <td style={S.td}>{h.state}</td>
                    <td style={S.td}>{h.pincode}</td>
                    <td style={S.td}>{h.licenseNumber}</td>
                    <td style={S.td}>
                      <span style={S.walletText}>
                        {h.walletAddress.substring(0, 8)}...{h.walletAddress.slice(-4)}
                      </span>
                    </td>
                    <td style={S.td}>
                      {new Date(Number(h.timestamp) * 1000).toLocaleDateString()}
                    </td>
                    <td style={S.td}>
                      <span style={{
                        ...S.statusPill,
                        backgroundColor: h.status === "Active" ? "#d4edda" : "#f8d7da",
                        color: h.status === "Active" ? "#155724" : "#721c24",
                      }}>
                        {h.status}
                      </span>
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
  headerBtns: { display: "flex", justifyContent: "center", gap: "10px", marginTop: "10px" },
  addBtn:     { backgroundColor: "#00c9ff", color: "#060d1f", padding: "9px 20px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" },
  backBtn:    { backgroundColor: "#95a5a6", color: "white", padding: "9px 20px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px" },
  successMsg: { color: "#27ae60", backgroundColor: "#eafaf1", padding: "12px", borderRadius: "8px", textAlign: "center", maxWidth: "900px", margin: "0 auto 20px auto" },
  errorMsg:   { color: "#e74c3c", backgroundColor: "#fdf2f2", padding: "12px", borderRadius: "8px", textAlign: "center", maxWidth: "900px", margin: "0 auto 20px auto" },
  formCard:   { backgroundColor: "white", padding: "30px", borderRadius: "15px", maxWidth: "900px", margin: "0 auto 25px auto", boxShadow: "0 4px 15px rgba(0,0,0,0.08)" },
  formTitle:  { fontSize: "18px", color: "#2c3e50", marginBottom: "20px", textAlign: "center" },
  grid2:      { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" },
  group:      { marginBottom: "15px" },
  label:      { display: "block", fontSize: "12px", color: "#2c3e50", marginBottom: "5px", fontWeight: "bold" },
  input:      { width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #bdc3c7", fontSize: "13px", boxSizing: "border-box" },
  submitBtn:  { backgroundColor: "#2ecc71", color: "white", padding: "12px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", width: "100%", fontWeight: "bold", marginTop: "5px" },
  tableCard:  { backgroundColor: "white", borderRadius: "15px", maxWidth: "1100px", margin: "0 auto", boxShadow: "0 4px 15px rgba(0,0,0,0.08)", overflow: "hidden" },
  tableTopRow:{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 25px", borderBottom: "1px solid #f0f4f8", flexWrap: "wrap", gap: "10px" },
  tableTitle: { fontSize: "16px", fontWeight: "bold", color: "#2c3e50", marginRight: "10px" },
  countPill:  { backgroundColor: "#ebf5fb", color: "#3498db", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" },
  searchBox:  { display: "flex", gap: "8px", alignItems: "center" },
  searchInput:{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #bdc3c7", fontSize: "13px", width: "280px" },
  refreshBtn: { backgroundColor: "#f0f4f8", border: "1px solid #bdc3c7", padding: "8px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "14px" },
  tableWrap:  { overflowX: "auto" },
  table:      { width: "100%", borderCollapse: "collapse" },
  th:         { backgroundColor: "#f8f9fa", padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: "#6c757d", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid #e9ecef", whiteSpace: "nowrap" },
  td:         { padding: "12px 16px", fontSize: "13px", color: "#495057", borderBottom: "1px solid #f0f4f8", whiteSpace: "nowrap" },
  walletText: { fontFamily: "monospace", fontSize: "12px", color: "#6c757d" },
  statusPill: { padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "bold" },
  center:     { textAlign: "center", padding: "40px", color: "#7f8c8d" },
};

export default RegisterHospital;