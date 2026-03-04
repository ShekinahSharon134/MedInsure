import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PolicyContract from "../../contracts/PolicyContract.json";
import UserRegistry from "../../contracts/UserRegistry.json";

// ================================
// UPDATE YOUR CONTRACT ADDRESSES
// ================================
const POLICY_CONTRACT_ADDRESS =
  "0xf72DC72bABC49a0cF93e073F9A98BB7a1EFc76e6";
const USER_REGISTRY_ADDRESS =
  "0xB6FA05De5D3f7f67e1A4cCc9C4AD79B032A3ccC4";

function SubscribePolicy({ account, web3 }) {
  const navigate = useNavigate();

  const [policies, setPolicies]             = useState([]);
  const [loading, setLoading]               = useState(true);
  const [subscribing, setSubscribing]       = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);
  const [patientApproved, setPatientApproved]     = useState(false);
  const [error, setError]                   = useState("");
  const [success, setSuccess]               = useState("");

  useEffect(() => {
    if (web3 && account) loadData();
  }, [web3, account]);

  // ================================
  // LOAD ALL DATA
  // ================================
  const loadData = async () => {
    try {
      setLoading(true);

      const userContract = new web3.eth.Contract(
        UserRegistry.abi,
        USER_REGISTRY_ADDRESS
      );

      const isRegistered = await userContract.methods
        .checkPatientRegistered(account)
        .call();

      if (!isRegistered) {
        setLoading(false);
        return;
      }

      const isApproved = await userContract.methods
        .checkPatientApproved(account)
        .call();

      setPatientApproved(isApproved);

      const policyContract = new web3.eth.Contract(
        PolicyContract.abi,
        POLICY_CONTRACT_ADDRESS
      );

      // Check if already subscribed
      const hasPolicy = await policyContract.methods
        .checkActivePolicy(account)
        .call();

      setAlreadySubscribed(hasPolicy);

      if (hasPolicy) {
        setLoading(false);
        return;
      }

      // Get all policy IDs
      const policyIds = await policyContract.methods
        .getAllPolicies()
        .call();

      // Get details for each policy
      const policyList = [];
      for (let id of policyIds) {
        const p = await policyContract.methods
          .getPolicy(id)
          .call();
        if (p.status === "Active") {
          policyList.push(p);
        }
      }

      setPolicies(policyList);
      setLoading(false);

    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // ================================
  // SUBSCRIBE TO POLICY
  // ================================
  const handleSubscribe = async (policy) => {
    setSubscribing(true);
    setError("");
    setSuccess("");

    try {
      const policyContract = new web3.eth.Contract(
        PolicyContract.abi,
        POLICY_CONTRACT_ADDRESS
      );

      await policyContract.methods
        .subscribePolicy(policy.policyId)
        .send({
          from:  account,
          value: policy.premiumAmount,
        });

      setSuccess(
        "✅ Successfully subscribed to " +
        policy.policyName +
        "! Redirecting to dashboard..."
      );

      setAlreadySubscribed(true);

      // ✅ FIX — Navigate to dashboard after 2 seconds
      setTimeout(() => {
        navigate("/patient/dashboard");
      }, 2000);

    } catch (err) {
      setError("❌ Error: " + err.message);
    }

    setSubscribing(false);
  };

  // ================================
  // LOADING
  // ================================
  if (loading) {
    return (
      <div style={S.center}>
        <div style={{ fontSize: "40px" }}>🔄</div>
        <h2>Loading policies...</h2>
      </div>
    );
  }

  // ================================
  // ALREADY SUBSCRIBED
  // ================================
  if (alreadySubscribed && !success) {
    return (
      <div style={S.page}>
        <div style={S.header}>
          <h1 style={S.title}>📋 Subscribe Policy</h1>
          <p style={S.badge}>{account}</p>
        </div>
        <div style={S.emptyCard}>
          <div style={{ fontSize: "60px" }}>✅</div>
          <h2 style={{ color: "#27ae60", marginBottom: "10px" }}>
            Already Subscribed!
          </h2>
          <p style={{ color: "#7f8c8d", marginBottom: "20px" }}>
            You already have an active policy.
          </p>
          <button
            style={S.btn}
            onClick={() => navigate("/patient/dashboard")}
          >
            View My Policy →
          </button>
        </div>
      </div>
    );
  }

  // ================================
  // NOT APPROVED
  // ================================
  if (!patientApproved) {
    return (
      <div style={S.page}>
        <div style={S.header}>
          <h1 style={S.title}>📋 Subscribe Policy</h1>
          <p style={S.badge}>{account}</p>
        </div>
        <div style={S.emptyCard}>
          <div style={{ fontSize: "60px" }}>⏳</div>
          <h2 style={{ color: "#e67e22", marginBottom: "10px" }}>
            Not Approved Yet!
          </h2>
          <p style={{ color: "#7f8c8d", marginBottom: "20px" }}>
            Please wait for insurer approval
            before subscribing to a policy.
          </p>
          <button
            style={S.backBtn}
            onClick={() => navigate("/patient/dashboard")}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ================================
  // NO POLICIES
  // ================================
  if (policies.length === 0) {
    return (
      <div style={S.page}>
        <div style={S.header}>
          <h1 style={S.title}>📋 Subscribe Policy</h1>
          <p style={S.badge}>{account}</p>
        </div>
        <div style={S.emptyCard}>
          <div style={{ fontSize: "60px" }}>📭</div>
          <h2 style={{ color: "#2c3e50", marginBottom: "10px" }}>
            No Policies Available!
          </h2>
          <p style={{ color: "#7f8c8d", marginBottom: "20px" }}>
            Insurer has not created any policies yet.
          </p>
          <button
            style={S.backBtn}
            onClick={() => navigate("/patient/dashboard")}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ================================
  // MAIN — POLICY LIST
  // ================================
  return (
    <div style={S.page}>

      {/* Header */}
      <div style={S.header}>
        <h1 style={S.title}>📋 Available Policies</h1>
        <p style={S.badge}>{account}</p>
        <button
          style={S.backBtn}
          onClick={() => navigate("/patient/dashboard")}
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Messages */}
      {success && (
        <div style={S.successBanner}>
          <p style={S.successMsg}>{success}</p>
          <p style={{ color: "#7f8c8d", fontSize: "13px", marginTop: "5px" }}>
            🔄 Redirecting in 2 seconds...
          </p>
        </div>
      )}
      {error && <p style={S.errorMsg}>{error}</p>}

      {/* Policy Cards */}
      <div style={S.cardGrid}>
        {policies.map((policy, index) => (
          <div
            key={index}
            style={{
              ...S.policyCard,
              border: selectedPolicy?.policyId === policy.policyId
                ? "2px solid #3498db"
                : "1px solid #e0e0e0",
              opacity: subscribing && selectedPolicy?.policyId !== policy.policyId
                ? 0.6 : 1,
            }}
          >
            {/* Card Header */}
            <div style={{
              ...S.cardHeader,
              backgroundColor:
                index === 0 ? "#3498db"
                : index === 1 ? "#9b59b6"
                : "#2ecc71",
            }}>
              <h2 style={S.policyName}>{policy.policyName}</h2>
              <span style={S.policyIdText}>Plan #{policy.policyId.toString()}</span>
            </div>

            {/* Price */}
            <div style={S.priceBox}>
              <div style={S.premium}>
                {web3.utils.fromWei(policy.premiumAmount.toString(), "ether")} ETH
              </div>
              <div style={S.premiumLabel}>monthly premium</div>
            </div>

            {/* Details */}
            <div style={S.details}>
              <DetailRow
                icon="🛡️"
                label="Coverage"
                value={
                  web3.utils.fromWei(
                    policy.coverageLimit.toString(), "ether"
                  ) + " ETH"
                }
              />
              <DetailRow
                icon="📅"
                label="Validity"
                value={policy.validityPeriod.toString() + " Year(s)"}
              />
              <DetailRow
                icon="✅"
                label="Covered"
                value={policy.covered}
              />
              <DetailRow
                icon="❌"
                label="Excluded"
                value={policy.excluded}
              />
              <DetailRow
                icon="📊"
                label="Status"
                value={policy.status}
              />
            </div>

            {/* Subscribe Button */}
            <button
              style={{
                ...S.subscribeBtn,
                backgroundColor:
                  index === 0 ? "#3498db"
                  : index === 1 ? "#9b59b6"
                  : "#2ecc71",
                cursor: subscribing ? "not-allowed" : "pointer",
              }}
              onClick={() => {
                setSelectedPolicy(policy);
                handleSubscribe(policy);
              }}
              disabled={subscribing}
            >
              {subscribing && selectedPolicy?.policyId === policy.policyId
                ? "⏳ Processing..."
                : `Subscribe for ${web3.utils.fromWei(
                    policy.premiumAmount.toString(), "ether"
                  )} ETH →`
              }
            </button>

          </div>
        ))}
      </div>

    </div>
  );
}

// ── Helper
function DetailRow({ icon, label, value }) {
  return (
    <div style={{
      display: "flex",
      gap: "8px",
      padding: "8px 0",
      borderBottom: "1px solid #f0f4f8",
      alignItems: "flex-start",
    }}>
      <span style={{ fontSize: "14px" }}>{icon}</span>
      <span style={{ color: "#7f8c8d", fontSize: "13px", fontWeight: "bold", minWidth: "70px" }}>
        {label}:
      </span>
      <span style={{ color: "#2c3e50", fontSize: "13px", flex: 1 }}>
        {value}
      </span>
    </div>
  );
}

const S = {
  page:         { backgroundColor: "#f0f4f8", minHeight: "100vh", padding: "40px 20px", fontFamily: "Arial, sans-serif" },
  center:       { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "Arial, sans-serif" },
  header:       { textAlign: "center", marginBottom: "30px" },
  title:        { fontSize: "32px", color: "#2c3e50", marginBottom: "8px" },
  badge:        { display: "inline-block", backgroundColor: "#eafaf1", color: "#27ae60", padding: "6px 16px", borderRadius: "20px", fontSize: "13px", marginBottom: "10px", wordBreak: "break-all" },
  backBtn:      { backgroundColor: "#95a5a6", color: "white", padding: "8px 20px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", display: "block", margin: "8px auto 0" },
  emptyCard:    { backgroundColor: "white", padding: "50px 40px", borderRadius: "15px", maxWidth: "400px", margin: "0 auto", textAlign: "center", boxShadow: "0 4px 15px rgba(0,0,0,0.08)" },
  btn:          { backgroundColor: "#3498db", color: "white", padding: "12px 24px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "15px", fontWeight: "bold", width: "100%" },
  successBanner:{ backgroundColor: "#eafaf1", padding: "20px", borderRadius: "10px", textAlign: "center", maxWidth: "800px", margin: "0 auto 20px auto", border: "1px solid #2ecc71" },
  successMsg:   { color: "#27ae60", fontSize: "16px", fontWeight: "bold" },
  errorMsg:     { color: "#e74c3c", backgroundColor: "#fdf2f2", padding: "12px", borderRadius: "8px", textAlign: "center", maxWidth: "800px", margin: "0 auto 20px auto" },
  cardGrid:     { display: "flex", justifyContent: "center", gap: "25px", flexWrap: "wrap", maxWidth: "1200px", margin: "0 auto" },
  policyCard:   { backgroundColor: "white", borderRadius: "15px", width: "340px", boxShadow: "0 4px 15px rgba(0,0,0,0.08)", overflow: "hidden", transition: "all 0.2s" },
  cardHeader:   { padding: "25px 20px", textAlign: "center" },
  policyName:   { color: "white", fontSize: "20px", fontWeight: "bold", marginBottom: "5px" },
  policyIdText: { color: "rgba(255,255,255,0.7)", fontSize: "12px" },
  priceBox:     { textAlign: "center", padding: "20px", borderBottom: "1px solid #f0f4f8" },
  premium:      { fontSize: "32px", fontWeight: "bold", color: "#2c3e50" },
  premiumLabel: { fontSize: "13px", color: "#7f8c8d", marginTop: "4px" },
  details:      { padding: "15px 20px" },
  subscribeBtn: { width: "100%", padding: "14px", border: "none", fontSize: "14px", fontWeight: "bold", color: "white", marginTop: "5px" },
};

export default SubscribePolicy;