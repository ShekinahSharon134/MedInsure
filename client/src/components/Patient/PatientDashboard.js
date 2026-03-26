import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserRegistry   from "../../contracts/UserRegistry.json";
import PolicyContract from "../../contracts/PolicyContract.json";

const USER_REGISTRY_ADDRESS   = "0xc13889F84aB7351841CC70A807E9FF3AE1f3b401";
const POLICY_CONTRACT_ADDRESS = "0x7ed91991A862Cf52E60e2cc213A6c8d80c52Ad81";

function PatientDashboard({ account, web3 }) {
  const navigate = useNavigate();

  const [patient, setPatient]               = useState(null);
  const [subscription, setSubscription]     = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading]               = useState(true);
  const [paying, setPaying]                 = useState(false);
  const [notRegistered, setNotRegistered]   = useState(false);
  const [error, setError]                   = useState("");
  const [success, setSuccess]               = useState("");
  const [debugInfo, setDebugInfo]           = useState("");

  useEffect(() => {
    if (web3 && account) {
      // Small delay to ensure blockchain state is ready
      setTimeout(() => loadData(), 500);
    }
  }, [web3, account]);

  // ================================
  // LOAD ALL DATA
  // ================================
  const loadData = async () => {
    try {
      setLoading(true);
      setDebugInfo("Loading patient data...");

      const userContract = new web3.eth.Contract(
        UserRegistry.abi, USER_REGISTRY_ADDRESS
      );

      // Step 1: Check registration
      const isRegistered = await userContract.methods
        .checkPatientRegistered(account)
        .call();

      setDebugInfo("Registered: " + isRegistered);

      if (!isRegistered) {
        setNotRegistered(true);
        setLoading(false);
        return;
      }

      // Step 2: Get patient data
      const patientData = await userContract.methods
        .getPatient(account)
        .call();

      setPatient(patientData);
      setDebugInfo("Patient loaded. Status: " + patientData.status);

      // Step 3: Load subscription regardless of status
      // (check directly from PolicyContract)
      const policyContract = new web3.eth.Contract(
        PolicyContract.abi, POLICY_CONTRACT_ADDRESS
      );

      const hasSub = await policyContract.methods
        .checkActivePolicy(account)
        .call();

      setDebugInfo("Has subscription: " + hasSub);

      if (hasSub) {
        // Get subscription details
        const sub = await policyContract.methods
          .getSubscription(account)
          .call();

        setDebugInfo("Subscription loaded: " + sub.policyName);
        setSubscription(sub);

        // Get payment history
        const history = await policyContract.methods
          .getPaymentHistory(account)
          .call();

        setPaymentHistory(history);
        setDebugInfo(" All data loaded!");
      } else {
        setDebugInfo(" Patient loaded. No subscription found.");
      }

      setLoading(false);

    } catch (err) {
      console.error("Dashboard error:", err);
      setDebugInfo(" Error: " + err.message);
      setLoading(false);
    }
  };

  // ================================
  // PAY MONTHLY PREMIUM
  // ================================
  const payMonthlyPremium = async () => {
    setPaying(true);
    setError("");
    setSuccess("");

    try {
      const policyContract = new web3.eth.Contract(
        PolicyContract.abi, POLICY_CONTRACT_ADDRESS
      );

      await policyContract.methods
        .payMonthlyPremium()
        .send({
          from:  account,
          value: subscription.premiumAmount,
        });

      setSuccess(" Monthly Premium Paid Successfully!");
      setTimeout(() => loadData(), 1000);

    } catch (err) {
      setError(" Error: " + err.message);
    }

    setPaying(false);
  };

  // ================================
  // HELPERS
  // ================================
  const formatDate = (timestamp) =>
    new Date(Number(timestamp) * 1000).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric"
    });

  const formatETH = (wei) =>
    parseFloat(web3.utils.fromWei(wei.toString(), "ether")).toFixed(4);

  const getDaysUntilDue = () => {
    if (!subscription) return 0;
    const now = Date.now() / 1000;
    const due = Number(subscription.nextDueDate);
    if (now >= due) return 0;
    return Math.ceil((due - now) / 86400);
  };

  const getProgressPercent = () => {
    if (!subscription) return 0;
    const start = Number(subscription.startDate);
    const end   = Number(subscription.endDate);
    const now   = Date.now() / 1000;
    return Math.min(100, Math.round(((now - start) / (end - start)) * 100));
  };

  // ================================
  // LOADING
  // ================================
  if (loading) {
    return (
      <div style={S.center}>
        <div style={{ fontSize: "40px", marginBottom: "15px" }}></div>
        <h2 style={{ color: "#1E293B" }}>Loading dashboard...</h2>
        <p style={{ color: "#64748B", fontSize: "13px", marginTop: "10px" }}>
          {debugInfo}
        </p>
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
          <h1 style={S.title}> Patient Dashboard</h1>
          <p style={S.badge}>{account}</p>
        </div>
        <div style={S.emptyCard}>
          <div style={{ fontSize: "60px" }}></div>
          <h2 style={{ color: "#1E293B", marginBottom: "10px" }}>Not Registered Yet!</h2>
          <p style={{ color: "#64748B", marginBottom: "20px" }}>
            Complete your KYC registration to get started.
          </p>
          <button style={S.btn} onClick={() => navigate("/patient/register")}>
            Register Now →
          </button>
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
        <h1 style={S.title}> Patient Dashboard</h1>
        <p style={S.badge}>{account}</p>
        <button style={S.refreshBtn} onClick={loadData}> Refresh</button>
      </div>

      {/* Messages */}
      {success && <p style={S.successMsg}>{success}</p>}
      {error   && <p style={S.errorMsg}>{error}</p>}

      {/*  ROW 1: Patient Info + Status  */}
      <div style={S.row}>

        {/* Personal Info */}
        <div style={S.card}>
          <h2 style={S.cardTitle}> Personal Details</h2>
          <InfoRow label="Name"     value={patient.name} />
          <InfoRow label="DOB"      value={patient.dob} />
          <InfoRow label="Gender"   value={patient.gender} />
          <InfoRow label="Mobile"   value={patient.mobile} />
          <InfoRow label="Email"    value={patient.email} />
          <InfoRow label="Address"  value={patient.location} />
          <InfoRow label="OTP"      value={patient.otpVerified ? " Verified" : " No"} />
          <InfoRow label="Aadhaar"  value=" Verified" />
          <InfoRow label="Face KYC" value=" Verified" />
        </div>

        {/* Status Card */}
        <div style={S.card}>
          <h2 style={S.cardTitle}> Account Status</h2>

          {/* KYC Status */}
          <div style={{
            ...S.statusBanner,
            backgroundColor:
              patient.status === "Approved" ? "#F0FDF4"
              : patient.status === "Rejected" ? "#FEF2F2"
              : "#fff8e1",
            borderColor:
              patient.status === "Approved" ? "#22C55E"
              : patient.status === "Rejected" ? "#EF4444"
              : "#F59E0B",
          }}>
            <span style={{ fontSize: "24px" }}>
              {patient.status === "Approved" ? ""
               : patient.status === "Rejected" ? "" : "⏳"}
            </span>
            <div>
              <div style={{ fontWeight: "bold", fontSize: "15px", color: "#1E293B" }}>
                KYC Status
              </div>
              <div style={{
                fontSize: "13px",
                color:
                  patient.status === "Approved" ? "#16A34A"
                  : patient.status === "Rejected" ? "#EF4444"
                  : "#F59E0B",
              }}>
                {patient.status}
              </div>
            </div>
          </div>

          {/* Approved + No Policy */}
          {patient.status === "Approved" && !subscription && (
            <div style={S.noPolicyBox}>
              <div style={{ fontSize: "40px", marginBottom: "10px" }}></div>
              <p style={{ color: "#64748B", marginBottom: "15px", fontSize: "14px" }}>
                You don't have an active policy yet.
              </p>
              <button
                style={S.btn}
                onClick={() => navigate("/patient/subscribe-policy")}
              >
                Browse Policies →
              </button>
            </div>
          )}

          {/* Approved + Has Policy Summary */}
          {patient.status === "Approved" && subscription && (
            <div style={S.policyMiniBox}>
              <div style={{ fontSize: "13px", color: "#64748B", marginBottom: "6px" }}>
                Active Policy
              </div>
              <div style={{ fontSize: "16px", fontWeight: "700", color: "#9b59b6", marginBottom: "4px" }}>
                {subscription.policyName}
              </div>
              <span style={{
                ...S.pill,
                backgroundColor:
                  subscription.subscriptionStatus === "Active" ? "#DCFCE7"
                  : subscription.subscriptionStatus === "Suspended" ? "#FEF9C3"
                  : "#FEE2E2",
                color:
                  subscription.subscriptionStatus === "Active" ? "#14532D"
                  : subscription.subscriptionStatus === "Suspended" ? "#713F12"
                  : "#7F1D1D",
              }}>
                {subscription.subscriptionStatus}
              </span>
            </div>
          )}

          {/* Pending */}
          {patient.status === "Pending" && (
            <div style={S.pendingBox}>
              <p style={{ color: "#713F12", fontSize: "14px", lineHeight: "1.6" }}>
                ⏳ Your KYC is under review.<br />
                Please wait for insurer approval.
              </p>
            </div>
          )}

          {/* Rejected */}
          {patient.status === "Rejected" && (
            <div style={S.rejectedBox}>
              <p style={{ color: "#7F1D1D", fontSize: "14px", lineHeight: "1.6" }}>
                 Your KYC was rejected.<br />
                Please contact the insurer.
              </p>
            </div>
          )}
        </div>
      </div>

      {/*  ROW 2: Policy + Payment  */}
      {subscription && (
        <div style={S.row}>

          {/* Policy Details */}
          <div style={S.card}>
            <h2 style={S.cardTitle}> My Policy</h2>

            <div style={{
              ...S.statusBanner,
              backgroundColor:
                subscription.subscriptionStatus === "Active"    ? "#F0FDF4"
                : subscription.subscriptionStatus === "Suspended" ? "#FEF9C3"
                : "#FEF2F2",
              borderColor:
                subscription.subscriptionStatus === "Active"    ? "#22C55E"
                : subscription.subscriptionStatus === "Suspended" ? "#F59E0B"
                : "#EF4444",
              marginBottom: "15px",
            }}>
              <span style={{ fontSize: "22px" }}>
                {subscription.subscriptionStatus === "Active"    ? ""
                 : subscription.subscriptionStatus === "Suspended" ? "" : ""}
              </span>
              <div>
                <div style={{ fontWeight: "bold", fontSize: "15px", color: "#1E293B" }}>
                  {subscription.policyName}
                </div>
                <div style={{ fontSize: "12px", color: "#64748B" }}>
                  Status: {subscription.subscriptionStatus}
                </div>
              </div>
            </div>

            <InfoRow label="Policy ID"       value={"#" + subscription.policyId.toString()} />
            <InfoRow label="Monthly Premium" value={formatETH(subscription.premiumAmount) + " ETH"} />
            <InfoRow label="Total Paid"      value={formatETH(subscription.totalPaid) + " ETH"} />
            <InfoRow label="Months Paid"     value={subscription.monthsPaid.toString() + " months"} />
            <InfoRow label="Start Date"      value={formatDate(subscription.startDate)} />
            <InfoRow label="End Date"        value={formatDate(subscription.endDate)} />

            {/* Progress Bar */}
            <div style={{ marginTop: "15px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748B", marginBottom: "5px" }}>
                <span>Policy Progress</span>
                <span>{getProgressPercent()}%</span>
              </div>
              <div style={S.progressTrack}>
                <div style={{ ...S.progressBar, width: getProgressPercent() + "%" }} />
              </div>
            </div>
          </div>

          {/* Payment Card */}
          <div style={S.card}>
            <h2 style={S.cardTitle}> Monthly Payment</h2>

            <div style={{
              ...S.dueBanner,
              backgroundColor:
                subscription.paymentStatus === "Paid"    ? "#F0FDF4"
                : subscription.paymentStatus === "Due"   ? "#FEF9C3"
                : "#FEF2F2",
            }}>
              <div style={{ fontSize: "32px", fontWeight: "800", color: "#1E293B" }}>
                {formatETH(subscription.premiumAmount)} ETH
              </div>
              <div style={{ fontSize: "13px", color: "#64748B", marginTop: "4px" }}>
                Monthly Premium Amount
              </div>
              <div style={{
                marginTop: "10px", fontSize: "13px", fontWeight: "bold",
                color:
                  subscription.paymentStatus === "Paid"    ? "#16A34A"
                  : subscription.paymentStatus === "Due"   ? "#713F12"
                  : "#7F1D1D",
              }}>
                {subscription.paymentStatus === "Paid"
                  ? ` Paid · Next due in ${getDaysUntilDue()} days`
                  : subscription.paymentStatus === "Due"
                  ? " Payment Due Now!"
                  : " Payment Overdue! Policy Suspended"}
              </div>
              <div style={{ fontSize: "12px", color: "#64748B", marginTop: "5px" }}>
                Due Date: {formatDate(subscription.nextDueDate)}
              </div>
            </div>

            {/* Pay Button */}
            {subscription.subscriptionStatus !== "Expired" && (
              <button
                style={{
                  ...S.payBtn,
                  backgroundColor:
                    subscription.paymentStatus === "Paid" ? "#94A3B8" : "#EF4444",
                }}
                onClick={payMonthlyPremium}
                disabled={paying}
              >
                {paying
                  ? "⏳ Processing..."
                  : subscription.paymentStatus === "Paid"
                  ? `Pay Next Month (${getDaysUntilDue()} days left)`
                  : ` Pay Now — ${formatETH(subscription.premiumAmount)} ETH`}
              </button>
            )}

            {subscription.subscriptionStatus === "Expired" && (
              <div style={S.expiredBox}>
                <p style={{ color: "#7F1D1D", fontSize: "14px" }}>
                   Your policy has expired.
                </p>
                <button
                  style={{ ...S.btn, marginTop: "10px" }}
                  onClick={() => navigate("/patient/subscribe-policy")}
                >
                  Browse New Policies →
                </button>
              </div>
            )}

            {/* Stats */}
            <div style={S.statsRow}>
              <div style={S.statBox}>
                <div style={S.statNum}>{subscription.monthsPaid.toString()}</div>
                <div style={S.statLabel}>Months Paid</div>
              </div>
              <div style={S.statBox}>
                <div style={S.statNum}>{formatETH(subscription.totalPaid)}</div>
                <div style={S.statLabel}>ETH Paid</div>
              </div>
              <div style={S.statBox}>
                <div style={S.statNum}>
                  {Math.max(0,
                    Number(subscription.endDate) > Date.now() / 1000
                      ? Math.ceil((Number(subscription.endDate) - Date.now() / 1000) / 2592000)
                      : 0
                  )}
                </div>
                <div style={S.statLabel}>Months Left</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/*  ROW 3: Payment History  */}
      {subscription && (
        <div style={S.fullCard}>
          <h2 style={S.cardTitle}> Payment History</h2>

          {paymentHistory.length === 0 ? (
            <p style={{ color: "#64748B", textAlign: "center", padding: "20px" }}>
              No payment history yet.
            </p>
          ) : (
            <div style={S.tableWrap}>
              <table style={S.table}>
                <thead>
                  <tr>
                    {["Month #","Amount (ETH)","Paid On","Status"].map((h) => (
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.map((p, i) => (
                    <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                      <td style={S.td}>Month {p.monthNumber.toString()}</td>
                      <td style={{ ...S.td, fontWeight: "600", color: "#16A34A" }}>
                        {formatETH(p.amount)} ETH
                      </td>
                      <td style={S.td}>{formatDate(p.paidOn)}</td>
                      <td style={S.td}>
                        <span style={{ ...S.pill, backgroundColor: "#DCFCE7", color: "#14532D" }}>
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
      )}

    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      padding: "8px 0",
      borderBottom: "1px solid #f0f4f8",
    }}>
      <span style={{ color: "#64748B", fontSize: "13px", fontWeight: "bold" }}>{label}</span>
      <span style={{ color: "#1E293B", fontSize: "13px", textAlign: "right", maxWidth: "60%" }}>{value}</span>
    </div>
  );
}

const S = {
  page:         { backgroundColor: "#F1F5F9", minHeight: "100vh", padding: "40px 20px", fontFamily: "'Inter', sans-serif" },
  center:       { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "'Inter', sans-serif" },
  header:       { textAlign: "center", marginBottom: "25px" },
  title:        { fontSize: "30px", color: "#1E293B", marginBottom: "8px" },
  badge:        { display: "inline-block", backgroundColor: "#F0FDF4", color: "#16A34A", padding: "5px 14px", borderRadius: "20px", fontSize: "12px", marginBottom: "10px", wordBreak: "break-all" },
  refreshBtn:   { backgroundColor: "#94A3B8", color: "white", padding: "7px 16px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", display: "block", margin: "8px auto 0" },
  successMsg:   { color: "#16A34A", backgroundColor: "#F0FDF4", padding: "12px", borderRadius: "8px", textAlign: "center", maxWidth: "900px", margin: "0 auto 15px auto" },
  errorMsg:     { color: "#EF4444", backgroundColor: "#FEF2F2", padding: "12px", borderRadius: "8px", textAlign: "center", maxWidth: "900px", margin: "0 auto 15px auto" },
  row:          { display: "flex", gap: "20px", maxWidth: "1000px", margin: "0 auto 20px auto", flexWrap: "wrap" },
  card:         { backgroundColor: "white", padding: "25px", borderRadius: "15px", flex: "1", minWidth: "300px", boxShadow: "0 4px 15px rgba(0,0,0,0.07)" },
  fullCard:     { backgroundColor: "white", padding: "25px", borderRadius: "15px", maxWidth: "1000px", margin: "0 auto 20px auto", boxShadow: "0 4px 15px rgba(0,0,0,0.07)" },
  cardTitle:    { fontSize: "17px", color: "#1E293B", marginBottom: "18px", fontWeight: "700" },
  emptyCard:    { backgroundColor: "white", padding: "50px 40px", borderRadius: "15px", maxWidth: "400px", margin: "0 auto", textAlign: "center", boxShadow: "0 4px 15px rgba(0,0,0,0.08)" },
  statusBanner: { display: "flex", alignItems: "center", gap: "12px", padding: "14px", borderRadius: "10px", border: "1px solid", marginBottom: "15px" },
  noPolicyBox:  { backgroundColor: "#F8FAFC", padding: "20px", borderRadius: "10px", textAlign: "center", marginTop: "10px" },
  policyMiniBox:{ backgroundColor: "#f3e5ff", padding: "15px", borderRadius: "10px", marginTop: "10px", textAlign: "center" },
  pendingBox:   { backgroundColor: "#fff8e1", padding: "15px", borderRadius: "10px", marginTop: "10px" },
  rejectedBox:  { backgroundColor: "#FEF2F2", padding: "15px", borderRadius: "10px", marginTop: "10px" },
  expiredBox:   { backgroundColor: "#FEF2F2", padding: "15px", borderRadius: "10px", textAlign: "center", marginTop: "10px" },
  dueBanner:    { padding: "20px", borderRadius: "12px", textAlign: "center", marginBottom: "15px" },
  payBtn:       { width: "100%", padding: "13px", border: "none", borderRadius: "10px", color: "white", fontWeight: "700", fontSize: "14px", marginBottom: "15px", cursor: "pointer" },
  statsRow:     { display: "flex", gap: "10px", marginTop: "10px" },
  statBox:      { flex: 1, backgroundColor: "#F8FAFC", padding: "12px", borderRadius: "10px", textAlign: "center" },
  statNum:      { fontSize: "20px", fontWeight: "800", color: "#1E293B" },
  statLabel:    { fontSize: "11px", color: "#64748B", marginTop: "3px" },
  progressTrack:{ height: "8px", backgroundColor: "#F1F5F9", borderRadius: "10px", overflow: "hidden" },
  progressBar:  { height: "100%", backgroundColor: "#22C55E", borderRadius: "10px" },
  btn:          { backgroundColor: "#2563EB", color: "white", padding: "11px 20px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "bold", width: "100%" },
  pill:         { padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "bold" },
  tableWrap:    { overflowX: "auto" },
  table:        { width: "100%", borderCollapse: "collapse" },
  th:           { backgroundColor: "#F8FAFC", padding: "11px 16px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#6c757d", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid #e9ecef" },
  td:           { padding: "11px 16px", fontSize: "13px", color: "#495057", borderBottom: "1px solid #f0f4f8" },
};

export default PatientDashboard;
