import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PolicyContract from "../../contracts/PolicyContract.json";

const CONTRACT_ADDRESS = "0xd32508C30cEc0d3961c2fBA35aaB127DD14BDAe9";

function CreatePolicy({ account, web3 }) {
  const navigate = useNavigate();

  const [policies, setPolicies]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState("");

  const [formData, setFormData] = useState({
    policyName: "", coverageLimit: "", premiumAmount: "",
    validityPeriod: "", ipfsCID: "", covered: "", excluded: "",
  });

  useEffect(() => {
    if (web3 && account) loadPolicies();
  }, [web3, account]);

  const loadPolicies = async () => {
    try {
      setLoading(true);
      const contract = new web3.eth.Contract(
        PolicyContract.abi, CONTRACT_ADDRESS
      );
      const ids = await contract.methods.getAllPolicies().call();
      const list = [];
      for (let id of ids) {
        const p = await contract.methods.getPolicy(id).call();
        list.push(p);
      }
      setPolicies(list);
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
        PolicyContract.abi, CONTRACT_ADDRESS
      );
      await contract.methods
        .createPolicy({
          policyName:     formData.policyName,
          coverageLimit:  web3.utils.toWei(formData.coverageLimit, "ether"),
          premiumAmount:  web3.utils.toWei(formData.premiumAmount, "ether"),
          validityPeriod: parseInt(formData.validityPeriod),
          ipfsCID:        formData.ipfsCID,
          covered:        formData.covered,
          excluded:       formData.excluded,
        })
        .send({ from: account });
      setSuccess("✅ Policy Created Successfully!");
      setFormData({ policyName:"",coverageLimit:"",premiumAmount:"",validityPeriod:"",ipfsCID:"",covered:"",excluded:"" });
      setShowForm(false);
      loadPolicies();
    } catch (err) {
      setError("❌ Error: " + err.message);
    }
    setSubmitting(false);
  };

  return (
    <div style={S.page}>

      {/* Header */}
      <div style={S.header}>
        <h1 style={S.title}>📋 Policy Management</h1>
        <p style={S.badge}>{account}</p>
        <div style={S.headerBtns}>
          <button style={S.addBtn} onClick={() => { setShowForm(!showForm); setError(""); setSuccess(""); }}>
            {showForm ? "✕ Close Form" : "+ Create New Policy"}
          </button>
          <button style={S.backBtn} onClick={() => navigate("/insurer")}>
            ← Back
          </button>
        </div>
      </div>

      {/* Messages */}
      {success && <p style={S.successMsg}>{success}</p>}
      {error   && <p style={S.errorMsg}>{error}</p>}

      {/* Create Form */}
      {showForm && (
        <div style={S.formCard}>
          <h2 style={S.formTitle}>Create New Policy</h2>
          <form onSubmit={handleSubmit}>
            <div style={S.grid2}>
              <div style={S.group}>
                <label style={S.label}>Policy Name</label>
                <input style={S.input} type="text" name="policyName"
                  placeholder="e.g. Basic Health Plan"
                  value={formData.policyName} onChange={handleChange} required />
              </div>
              <div style={S.group}>
                <label style={S.label}>Validity Period (Years)</label>
                <select style={S.input} name="validityPeriod"
                  value={formData.validityPeriod} onChange={handleChange} required>
                  <option value="">Select validity</option>
                  <option value="1">1 Year</option>
                  <option value="2">2 Years</option>
                  <option value="3">3 Years</option>
                  <option value="5">5 Years</option>
                </select>
              </div>
              <div style={S.group}>
                <label style={S.label}>Coverage Limit (ETH)</label>
                <input style={S.input} type="number" name="coverageLimit"
                  placeholder="e.g. 5" min="0.001" step="0.001"
                  value={formData.coverageLimit} onChange={handleChange} required />
              </div>
              <div style={S.group}>
                <label style={S.label}>Premium Amount (ETH)</label>
                <input style={S.input} type="number" name="premiumAmount"
                  placeholder="e.g. 0.1" min="0.001" step="0.001"
                  value={formData.premiumAmount} onChange={handleChange} required />
              </div>
              <div style={S.group}>
                <label style={S.label}>Covered Treatments</label>
                <textarea style={S.textarea} name="covered"
                  placeholder="e.g. Surgery, Hospitalization, ICU"
                  value={formData.covered} onChange={handleChange} required />
              </div>
              <div style={S.group}>
                <label style={S.label}>Excluded Treatments</label>
                <textarea style={S.textarea} name="excluded"
                  placeholder="e.g. Cosmetic Surgery, Dental"
                  value={formData.excluded} onChange={handleChange} required />
              </div>
            </div>
            <div style={S.group}>
              <label style={S.label}>
                IPFS CID <span style={{ color: "#95a5a6", fontWeight: "normal" }}>(optional)</span>
              </label>
              <input style={S.input} type="text" name="ipfsCID"
                placeholder="e.g. QmXyz123..."
                value={formData.ipfsCID} onChange={handleChange} />
            </div>
            <button style={S.submitBtn} type="submit" disabled={submitting}>
              {submitting ? "⏳ Creating..." : "🚀 Create Policy"}
            </button>
          </form>
        </div>
      )}

      {/* Table Card */}
      <div style={S.tableCard}>

        <div style={S.tableTopRow}>
          <div>
            <span style={S.tableTitle}>Insurance Policies</span>
            <span style={S.countPill}>{policies.length} Total</span>
          </div>
          <button style={S.refreshBtn} onClick={loadPolicies}>🔄 Refresh</button>
        </div>

        {loading ? (
          <p style={S.center}>🔄 Loading policies...</p>
        ) : policies.length === 0 ? (
          <p style={S.center}>No policies created yet. Click "+ Create New Policy"</p>
        ) : (
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  {["ID","Policy Name","Coverage","Premium","Validity","Covered","Excluded","Status"].map((h) => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {policies.map((p, i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                    <td style={S.td}>#{p.policyId.toString()}</td>
                    <td style={{ ...S.td, fontWeight: "600", color: "#2c3e50" }}>
                      {p.policyName}
                    </td>
                    <td style={S.td}>
                      {web3.utils.fromWei(p.coverageLimit.toString(), "ether")} ETH
                    </td>
                    <td style={S.td}>
                      {web3.utils.fromWei(p.premiumAmount.toString(), "ether")} ETH
                    </td>
                    <td style={S.td}>{p.validityPeriod.toString()} Yr</td>
                    <td style={{ ...S.td, maxWidth: "180px", whiteSpace: "normal", fontSize: "12px" }}>
                      {p.covered}
                    </td>
                    <td style={{ ...S.td, maxWidth: "150px", whiteSpace: "normal", fontSize: "12px" }}>
                      {p.excluded}
                    </td>
                    <td style={S.td}>
                      <span style={{
                        ...S.pill,
                        backgroundColor: p.status === "Active" ? "#d4edda" : "#f8d7da",
                        color: p.status === "Active" ? "#155724" : "#721c24",
                      }}>
                        {p.status}
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
  addBtn:     { backgroundColor: "#b388ff", color: "#060d1f", padding: "9px 20px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" },
  backBtn:    { backgroundColor: "#95a5a6", color: "white", padding: "9px 20px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px" },
  successMsg: { color: "#27ae60", backgroundColor: "#eafaf1", padding: "12px", borderRadius: "8px", textAlign: "center", maxWidth: "1000px", margin: "0 auto 20px auto" },
  errorMsg:   { color: "#e74c3c", backgroundColor: "#fdf2f2", padding: "12px", borderRadius: "8px", textAlign: "center", maxWidth: "1000px", margin: "0 auto 20px auto" },
  formCard:   { backgroundColor: "white", padding: "30px", borderRadius: "15px", maxWidth: "900px", margin: "0 auto 25px auto", boxShadow: "0 4px 15px rgba(0,0,0,0.08)" },
  formTitle:  { fontSize: "18px", color: "#2c3e50", marginBottom: "20px", textAlign: "center" },
  grid2:      { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" },
  group:      { marginBottom: "15px" },
  label:      { display: "block", fontSize: "12px", color: "#2c3e50", marginBottom: "5px", fontWeight: "bold" },
  input:      { width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #bdc3c7", fontSize: "13px", boxSizing: "border-box" },
  textarea:   { width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #bdc3c7", fontSize: "13px", boxSizing: "border-box", minHeight: "70px", resize: "vertical" },
  submitBtn:  { backgroundColor: "#9b59b6", color: "white", padding: "12px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", width: "100%", fontWeight: "bold", marginTop: "5px" },
  tableCard:  { backgroundColor: "white", borderRadius: "15px", maxWidth: "1100px", margin: "0 auto", boxShadow: "0 4px 15px rgba(0,0,0,0.08)", overflow: "hidden" },
  tableTopRow:{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 25px", borderBottom: "1px solid #f0f4f8" },
  tableTitle: { fontSize: "16px", fontWeight: "bold", color: "#2c3e50", marginRight: "10px" },
  countPill:  { backgroundColor: "#f3e5ff", color: "#9b59b6", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" },
  refreshBtn: { backgroundColor: "#f0f4f8", border: "1px solid #bdc3c7", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "13px" },
  tableWrap:  { overflowX: "auto" },
  table:      { width: "100%", borderCollapse: "collapse" },
  th:         { backgroundColor: "#f8f9fa", padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#6c757d", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid #e9ecef", whiteSpace: "nowrap" },
  td:         { padding: "11px 16px", fontSize: "13px", color: "#495057", borderBottom: "1px solid #f0f4f8" },
  pill:       { padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "bold" },
  center:     { textAlign: "center", padding: "40px", color: "#7f8c8d" },
};

export default CreatePolicy;