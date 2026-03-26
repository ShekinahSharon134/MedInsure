import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserRegistry   from "../../contracts/UserRegistry.json";
import PolicyContract from "../../contracts/PolicyContract.json";

const USER_REGISTRY_ADDRESS   = "0xc13889F84aB7351841CC70A807E9FF3AE1f3b401";
const POLICY_CONTRACT_ADDRESS = "0x7ed91991A862Cf52E60e2cc213A6c8d80c52Ad81";

function ViewSubscriptions({ account, web3 }) {
  const navigate = useNavigate();

  const [subscriptions, setSubscriptions]   = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading]               = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError]                   = useState("");
  const [search, setSearch]                 = useState("");
  const [filter, setFilter]                 = useState("All");
  const [showHistory, setShowHistory]       = useState(false);

  useEffect(() => {
    if (web3 && account) loadSubscriptions();
  }, [web3, account]);

  // ================================
  // LOAD ALL SUBSCRIPTIONS
  // ================================
  const loadSubscriptions = async () => {
    try {
      setLoading(true);

      const userContract = new web3.eth.Contract(
        UserRegistry.abi, USER_REGISTRY_ADDRESS
      );
      const policyContract = new web3.eth.Contract(
        PolicyContract.abi, POLICY_CONTRACT_ADDRESS
      );

      const allAddresses = await userContract.methods
        .getAllPatients()
        .call();

      const list = [];

      for (let addr of allAddresses) {
        const patient = await userContract.methods
          .getPatient(addr)
          .call();

        const hasSub = await policyContract.methods
          .checkActivePolicy(addr)
          .call();

        if (hasSub) {
          const sub = await policyContract.methods
            .getSubscription(addr)
            .call();

          list.push({
            patientId:          patient.patientId,
            patientName:        patient.name,
            mobile:             patient.mobile,
            email:              patient.email,
            walletAddress:      patient.walletAddress,
            policyId:           sub.policyId,
            policyName:         sub.policyName,
            premiumAmount:      sub.premiumAmount,
            totalPaid:          sub.totalPaid,
            monthsPaid:         sub.monthsPaid,
            startDate:          sub.startDate,
            endDate:            sub.endDate,
            nextDueDate:        sub.nextDueDate,
            subscriptionStatus: sub.subscriptionStatus,
            paymentStatus:      sub.paymentStatus,
          });
        }
      }

      setSubscriptions(list);
      setLoading(false);

    } catch (err) {
      setError(" Error: " + err.message);
      setLoading(false);
    }
  };

  // ================================
  // LOAD PAYMENT HISTORY
  // ================================
  const loadPaymentHistory = async (walletAddress, patientName) => {
    try {
      setHistoryLoading(true);
      setShowHistory(true);
      setSelectedPatient(patientName);

      const policyContract = new web3.eth.Contract(
        PolicyContract.abi, POLICY_CONTRACT_ADDRESS
      );

      const history = await policyContract.methods
        .getPaymentHistory(walletAddress)
        .call();

      setPaymentHistory(history);
      setHistoryLoading(false);

    } catch (err) {
      setError(" Error loading history: " + err.message);
      setHistoryLoading(false);
    }
  };

  // ================================
  // HELPERS
  // ================================
  const formatDate = (ts) =>
    new Date(Number(ts) * 1000).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric"
    });

  const formatETH = (wei) =>
    parseFloat(web3.utils.fromWei(wei.toString(), "ether")).toFixed(4);

  // ================================
  // FILTER + SEARCH
  // ================================
  const filtered = subscriptions.filter((s) => {
    const matchSearch =
      s.patientName.toLowerCase().includes(search.toLowerCase()) ||
      s.policyName.toLowerCase().includes(search.toLowerCase()) ||
      s.mobile.includes(search) ||
      s.walletAddress.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "All" || s.subscriptionStatus === filter;
    return matchSearch && matchFilter;
  });

  // ================================
  // STATS
  // ================================
  const totalPremium = subscriptions.reduce(
    (sum, s) => sum + Number(s.totalPaid), 0
  );

  const counts = {
    All:       subscriptions.length,
    Active:    subscriptions.filter((s) => s.subscriptionStatus === "Active").length,
    Suspended: subscriptions.filter((s) => s.subscriptionStatus === "Suspended").length,
    Expired:   subscriptions.filter((s) => s.subscriptionStatus === "Expired").length,
  };

  return (
    <div style={S.page}>

      {/* Header */}
      <div style={S.header}>
        <h1 style={S.title}> Policy Subscriptions</h1>
        <p style={S.badge}>{account}</p>
        <button style={S.backBtn} onClick={() => navigate("/insurer")}>
          ← Back to Dashboard
        </button>
      </div>

      {error && <p style={S.errorMsg}>{error}</p>}

      {/* Stats Row */}
      <div style={S.statsRow}>
        <div style={S.statBox}>
          <div style={{ ...S.statNum, color: "#2563EB" }}>
            {subscriptions.length}
          </div>
          <div style={S.statLabel}>Total Subscribers</div>
        </div>
        <div style={S.statBox}>
          <div style={{ ...S.statNum, color: "#22C55E" }}>
            {counts.Active}
          </div>
          <div style={S.statLabel}>Active Policies</div>
        </div>
        <div style={S.statBox}>
          <div style={{ ...S.statNum, color: "#EF4444" }}>
            {counts.Suspended}
          </div>
          <div style={S.statLabel}>Suspended</div>
        </div>
        <div style={S.statBox}>
          <div style={{ ...S.statNum, color: "#9b59b6" }}>
            {web3
              ? parseFloat(
                  web3.utils.fromWei(totalPremium.toString(), "ether")
                ).toFixed(4)
              : "0"}{" "}ETH
          </div>
          <div style={S.statLabel}>Total Collected</div>
        </div>
      </div>

      {/* Filter Pills */}
      <div style={S.filterRow}>
        {Object.entries(counts).map(([key, val]) => (
          <button
            key={key}
            style={{
              ...S.filterPill,
              backgroundColor: filter === key ? "#2563EB" : "white",
              color: filter === key ? "white" : "#64748B",
              border: filter === key
                ? "1px solid #3498db"
                : "1px solid #e0e0e0",
            }}
            onClick={() => setFilter(key)}
          >
            {key} ({val})
          </button>
        ))}
      </div>

      {/* Main Table */}
      <div style={S.tableCard}>

        <div style={S.tableTopRow}>
          <div>
            <span style={S.tableTitle}>Subscribed Patients</span>
            <span style={S.countPill}>{filtered.length} shown</span>
          </div>
          <div style={S.searchBox}>
            <input
              style={S.searchInput}
              type="text"
              placeholder=" Search name, policy, mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button style={S.refreshBtn} onClick={loadSubscriptions}></button>
          </div>
        </div>

        {loading ? (
          <p style={S.center}> Loading subscriptions...</p>
        ) : subscriptions.length === 0 ? (
          <div style={S.emptyBox}>
            <div style={{ fontSize: "50px" }}></div>
            <p style={{ color: "#64748B", marginTop: "10px" }}>
              No patients have subscribed to any policy yet.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <p style={S.center}>No results found.</p>
        ) : (
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  {[
                    "Patient","Mobile","Wallet",
                    "Policy","Monthly Premium","Total Paid",
                    "Months Paid","Next Due","Payment","Status","History"
                  ].map((h) => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                    <td style={S.td}>
                      <div style={S.nameCell}>
                        <div style={S.avatar}>
                          {s.patientName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: "600", color: "#1E293B", fontSize: "13px" }}>
                            {s.patientName}
                          </div>
                          <div style={{ fontSize: "11px", color: "#94A3B8" }}>
                            #{s.patientId.toString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={S.td}>{s.mobile}</td>
                    <td style={S.td}>
                      <span style={S.walletText}>
                        {s.walletAddress.substring(0, 8)}...{s.walletAddress.slice(-4)}
                      </span>
                    </td>
                    <td style={{ ...S.td, fontWeight: "600", color: "#9b59b6" }}>
                      {s.policyName}
                      <div style={{ fontSize: "11px", color: "#94A3B8" }}>
                        #{s.policyId.toString()}
                      </div>
                    </td>
                    <td style={{ ...S.td, color: "#2563EB", fontWeight: "600" }}>
                      {formatETH(s.premiumAmount)} ETH
                    </td>
                    <td style={{ ...S.td, color: "#16A34A", fontWeight: "600" }}>
                      {formatETH(s.totalPaid)} ETH
                    </td>
                    <td style={S.td}>
                      <span style={{
                        ...S.pill,
                        backgroundColor: "#EFF6FF",
                        color: "#2563EB",
                      }}>
                        {s.monthsPaid.toString()} months
                      </span>
                    </td>
                    <td style={S.td}>
                      <div style={{ fontSize: "12px" }}>
                        {formatDate(s.nextDueDate)}
                      </div>
                    </td>
                    <td style={S.td}>
                      <span style={{
                        ...S.pill,
                        backgroundColor:
                          s.paymentStatus === "Paid"    ? "#DCFCE7"
                          : s.paymentStatus === "Due"   ? "#FEF9C3"
                          : "#FEE2E2",
                        color:
                          s.paymentStatus === "Paid"    ? "#14532D"
                          : s.paymentStatus === "Due"   ? "#713F12"
                          : "#7F1D1D",
                      }}>
                        {s.paymentStatus}
                      </span>
                    </td>
                    <td style={S.td}>
                      <span style={{
                        ...S.pill,
                        backgroundColor:
                          s.subscriptionStatus === "Active"    ? "#DCFCE7"
                          : s.subscriptionStatus === "Suspended" ? "#FEF9C3"
                          : "#FEE2E2",
                        color:
                          s.subscriptionStatus === "Active"    ? "#14532D"
                          : s.subscriptionStatus === "Suspended" ? "#713F12"
                          : "#7F1D1D",
                      }}>
                        {s.subscriptionStatus}
                      </span>
                    </td>
                    <td style={S.td}>
                      <button
                        style={S.historyBtn}
                        onClick={() => loadPaymentHistory(s.walletAddress, s.patientName)}
                      >
                         View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment History Modal */}
      {showHistory && (
        <div style={S.modalOverlay} onClick={() => setShowHistory(false)}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>

            <div style={S.modalHeader}>
              <div>
                <h2 style={S.modalTitle}>
                   Payment History
                </h2>
                <p style={{ color: "#64748B", fontSize: "13px", marginTop: "3px" }}>
                  {selectedPatient}
                </p>
              </div>
              <button
                style={S.closeBtn}
                onClick={() => setShowHistory(false)}
              >
                
              </button>
            </div>

            {historyLoading ? (
              <p style={S.center}> Loading...</p>
            ) : paymentHistory.length === 0 ? (
              <p style={S.center}>No payment records found.</p>
            ) : (
              <>
                {/* History Stats */}
                <div style={S.historyStats}>
                  <div style={S.historyStatBox}>
                    <div style={{ fontSize: "22px", fontWeight: "800", color: "#22C55E" }}>
                      {paymentHistory.length}
                    </div>
                    <div style={{ fontSize: "11px", color: "#64748B" }}>Payments Made</div>
                  </div>
                  <div style={S.historyStatBox}>
                    <div style={{ fontSize: "22px", fontWeight: "800", color: "#2563EB" }}>
                      {formatETH(
                        paymentHistory.reduce(
                          (sum, p) => sum + Number(p.amount), 0
                        )
                      )} ETH
                    </div>
                    <div style={{ fontSize: "11px", color: "#64748B" }}>Total Received</div>
                  </div>
                </div>

                {/* History Table */}
                <div style={S.tableWrap}>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        {["Month #", "Amount (ETH)", "Paid On", "Status"].map((h) => (
                          <th key={h} style={S.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paymentHistory.map((p, i) => (
                        <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                          <td style={{ ...S.td, fontWeight: "600" }}>
                            Month {p.monthNumber.toString()}
                          </td>
                          <td style={{ ...S.td, color: "#16A34A", fontWeight: "600" }}>
                            {formatETH(p.amount)} ETH
                          </td>
                          <td style={S.td}>{formatDate(p.paidOn)}</td>
                          <td style={S.td}>
                            <span style={{
                              ...S.pill,
                              backgroundColor: "#DCFCE7",
                              color: "#14532D",
                            }}>
                               {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

const S = {
  page:        { backgroundColor: "#F1F5F9", minHeight: "100vh", padding: "40px 20px", fontFamily: "'Inter', sans-serif" },
  header:      { textAlign: "center", marginBottom: "25px" },
  title:       { fontSize: "30px", color: "#1E293B", marginBottom: "8px" },
  badge:       { display: "inline-block", backgroundColor: "#F0FDF4", color: "#16A34A", padding: "5px 14px", borderRadius: "20px", fontSize: "12px", marginBottom: "10px" },
  backBtn:     { backgroundColor: "#94A3B8", color: "white", padding: "8px 18px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", display: "block", margin: "8px auto 0" },
  errorMsg:    { color: "#EF4444", backgroundColor: "#FEF2F2", padding: "12px", borderRadius: "8px", textAlign: "center", maxWidth: "1200px", margin: "0 auto 15px auto" },
  statsRow:    { display: "flex", justifyContent: "center", gap: "15px", marginBottom: "20px", flexWrap: "wrap" },
  statBox:     { backgroundColor: "white", padding: "18px 30px", borderRadius: "12px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", minWidth: "130px" },
  statNum:     { fontSize: "26px", fontWeight: "800" },
  statLabel:   { fontSize: "11px", color: "#64748B", fontWeight: "600", marginTop: "3px" },
  filterRow:   { display: "flex", justifyContent: "center", gap: "10px", marginBottom: "20px", flexWrap: "wrap" },
  filterPill:  { padding: "7px 18px", borderRadius: "20px", cursor: "pointer", fontSize: "13px", fontWeight: "600", transition: "all 0.2s" },
  tableCard:   { backgroundColor: "white", borderRadius: "15px", maxWidth: "1400px", margin: "0 auto", boxShadow: "0 4px 15px rgba(0,0,0,0.08)", overflow: "hidden" },
  tableTopRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 25px", borderBottom: "1px solid #f0f4f8", flexWrap: "wrap", gap: "10px" },
  tableTitle:  { fontSize: "16px", fontWeight: "bold", color: "#1E293B", marginRight: "10px" },
  countPill:   { backgroundColor: "#EFF6FF", color: "#2563EB", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" },
  searchBox:   { display: "flex", gap: "8px", alignItems: "center" },
  searchInput: { padding: "8px 14px", borderRadius: "8px", border: "1px solid #bdc3c7", fontSize: "13px", width: "260px" },
  refreshBtn:  { backgroundColor: "#F1F5F9", border: "1px solid #bdc3c7", padding: "8px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "14px" },
  tableWrap:   { overflowX: "auto" },
  table:       { width: "100%", borderCollapse: "collapse" },
  th:          { backgroundColor: "#F8FAFC", padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#6c757d", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid #e9ecef", whiteSpace: "nowrap" },
  td:          { padding: "11px 16px", fontSize: "13px", color: "#495057", borderBottom: "1px solid #f0f4f8", whiteSpace: "nowrap" },
  nameCell:    { display: "flex", alignItems: "center", gap: "8px" },
  avatar:      { width: "30px", height: "30px", borderRadius: "50%", backgroundColor: "#9b59b6", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "bold", flexShrink: 0 },
  walletText:  { fontFamily: "monospace", fontSize: "12px", color: "#6c757d" },
  pill:        { padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "bold" },
  historyBtn:  { backgroundColor: "#EFF6FF", color: "#2563EB", padding: "5px 12px", border: "1px solid #bee3f8", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "600" },
  center:      { textAlign: "center", padding: "40px", color: "#64748B" },
  emptyBox:    { textAlign: "center", padding: "50px" },
  // Modal
  modalOverlay:{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" },
  modal:       { backgroundColor: "white", borderRadius: "15px", width: "100%", maxWidth: "650px", maxHeight: "80vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "25px 25px 15px", borderBottom: "1px solid #f0f4f8" },
  modalTitle:  { fontSize: "18px", fontWeight: "700", color: "#1E293B" },
  closeBtn:    { backgroundColor: "#F1F5F9", border: "none", width: "30px", height: "30px", borderRadius: "50%", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center" },
  historyStats:{ display: "flex", gap: "15px", padding: "15px 25px", borderBottom: "1px solid #f0f4f8" },
  historyStatBox: { flex: 1, backgroundColor: "#F8FAFC", padding: "15px", borderRadius: "10px", textAlign: "center" },
};

export default ViewSubscriptions;