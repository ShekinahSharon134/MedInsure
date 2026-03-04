import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ClaimsContract from "../../contracts/ClaimsContract.json";

const CONTRACT_ADDRESS = "0x8AE7c69290fDbBf611993f41A4F7E370937EB13F";

function ViewMyClaims({ account, web3 }) {
  const navigate = useNavigate();

  const [claims, setClaims] = useState([]);
  const [coverage, setCoverage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (web3 && account) loadData();
  }, [web3, account]);

  const loadData = async () => {
    try {
      setLoading(true);
      const contract = new web3.eth.Contract(
        ClaimsContract.abi,
        CONTRACT_ADDRESS
      );

      // Load patient claims
      const claimIds = await contract.methods.getPatientClaims(account).call();
      const claimsList = [];

      for (let id of claimIds) {
        const claim = await contract.methods.getClaim(id).call();
        claimsList.push(claim);
      }

      setClaims(claimsList);

      // Load coverage info
      const coverageData = await contract.methods.getPatientCoverage(account).call();
      setCoverage(coverageData);

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={S.center}>
        <div style={{ fontSize: "40px" }}>🔄</div>
        <h2>Loading your claims...</h2>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>📋 My Claims & Coverage</h1>
        <p style={S.badge}>{account}</p>
        <div style={S.headerBtns}>
          <button style={S.refreshBtn} onClick={loadData}>
            🔄 Refresh
          </button>
          <button style={S.backBtn} onClick={() => navigate("/patient")}>
            ← Back
          </button>
        </div>
      </div>

      {/* Coverage Summary */}
      {coverage && coverage.policyId !== "0" && (
        <div style={S.coverageCard}>
          <h2 style={S.cardTitle}>💰 Coverage Summary</h2>
          <div style={S.coverageGrid}>
            <div style={S.coverageItem}>
              <div style={S.coverageLabel}>Total Coverage</div>
              <div style={S.coverageValue}>
                {web3.utils.fromWei(coverage.totalCoverageLimit.toString(), "ether")} ETH
              </div>
            </div>
            <div style={S.coverageItem}>
              <div style={S.coverageLabel}>Remaining Coverage</div>
              <div style={{ ...S.coverageValue, color: "#27ae60" }}>
                {web3.utils.fromWei(coverage.remainingCoverage.toString(), "ether")} ETH
              </div>
            </div>
            <div style={S.coverageItem}>
              <div style={S.coverageLabel}>Total Claimed</div>
              <div style={{ ...S.coverageValue, color: "#e67e22" }}>
                {web3.utils.fromWei(coverage.totalClaimedAmount.toString(), "ether")} ETH
              </div>
            </div>
            <div style={S.coverageItem}>
              <div style={S.coverageLabel}>Deductible Status</div>
              <div style={S.coverageValue}>
                {coverage.deductibleMet ? (
                  <span style={{ color: "#27ae60" }}>✅ Met</span>
                ) : (
                  <span style={{ color: "#e67e22" }}>
                    {web3.utils.fromWei(coverage.deductibleUsed.toString(), "ether")} ETH used
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={S.progressContainer}>
            <div style={S.progressLabel}>Coverage Used</div>
            <div style={S.progressBar}>
              <div
                style={{
                  ...S.progressFill,
                  width: `${
                    ((Number(coverage.totalCoverageLimit) - Number(coverage.remainingCoverage)) /
                      Number(coverage.totalCoverageLimit)) *
                    100
                  }%`,
                }}
              />
            </div>
            <div style={S.progressText}>
              {(
                ((Number(coverage.totalCoverageLimit) - Number(coverage.remainingCoverage)) /
                  Number(coverage.totalCoverageLimit)) *
                100
              ).toFixed(1)}
              % used
            </div>
          </div>
        </div>
      )}

      {/* Claims List */}
      <div style={S.tableCard}>
        <div style={S.tableTopRow}>
          <div>
            <span style={S.tableTitle}>My Claims</span>
            <span style={S.countPill}>{claims.length} Total</span>
          </div>
        </div>

        {claims.length === 0 ? (
          <p style={S.center}>No claims submitted yet</p>
        ) : (
          <div style={S.claimsList}>
            {claims.map((claim) => (
              <div key={claim.claimId.toString()} style={S.claimCard}>
                <div style={S.claimHeader}>
                  <div>
                    <span style={S.claimId}>Claim #{claim.claimId.toString()}</span>
                    <span
                      style={{
                        ...S.statusPill,
                        backgroundColor:
                          claim.status === "Pending"
                            ? "#fff3cd"
                            : claim.status === "Approved"
                            ? "#d4edda"
                            : "#f8d7da",
                        color:
                          claim.status === "Pending"
                            ? "#856404"
                            : claim.status === "Approved"
                            ? "#155724"
                            : "#721c24",
                      }}
                    >
                      {claim.status}
                    </span>
                  </div>
                  <div style={S.claimDate}>
                    {new Date(Number(claim.submittedOn) * 1000).toLocaleDateString()}
                  </div>
                </div>

                <div style={S.claimBody}>
                  <div style={S.infoRow}>
                    <span style={S.infoLabel}>Hospital:</span>
                    <span style={S.infoValue}>{claim.hospitalAddress}</span>
                  </div>
                  <div style={S.infoRow}>
                    <span style={S.infoLabel}>Treatment:</span>
                    <span style={S.infoValue}>{claim.treatment}</span>
                  </div>

                  <div style={S.paymentBox}>
                    <h4 style={S.paymentTitle}>💰 Payment Details</h4>
                    <div style={S.paymentRow}>
                      <span>Total Bill:</span>
                      <span style={{ fontWeight: "bold" }}>
                        {web3.utils.fromWei(claim.claimAmount.toString(), "ether")} ETH
                      </span>
                    </div>
                    <div style={S.paymentRow}>
                      <span>Insurer Pays:</span>
                      <span style={{ color: "#27ae60", fontWeight: "bold" }}>
                        {web3.utils.fromWei(claim.insurerPaysAmount.toString(), "ether")} ETH
                      </span>
                    </div>
                    <div style={{ ...S.paymentRow, borderTop: "2px solid #ecf0f1", paddingTop: "10px", marginTop: "5px" }}>
                      <span style={{ fontWeight: "bold" }}>You Pay:</span>
                      <span style={{ color: "#e74c3c", fontWeight: "bold", fontSize: "16px" }}>
                        {web3.utils.fromWei(claim.patientPaysAmount.toString(), "ether")} ETH
                      </span>
                    </div>
                    <div style={{ fontSize: "11px", color: "#95a5a6", marginTop: "8px" }}>
                      (Includes {web3.utils.fromWei(claim.deductibleAmount.toString(), "ether")} ETH deductible + {web3.utils.fromWei(claim.copayAmount.toString(), "ether")} ETH co-pay)
                    </div>
                  </div>

                  {claim.status === "Rejected" && (
                    <div style={S.rejectionBox}>
                      <strong>Rejection Reason:</strong> {claim.rejectionReason}
                    </div>
                  )}

                  {claim.status === "Approved" && (
                    <div style={S.approvedBox}>
                      ✅ Claim approved! Please pay {web3.utils.fromWei(claim.patientPaysAmount.toString(), "ether")} ETH to the hospital.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const S = {
  page: { backgroundColor: "#f0f4f8", minHeight: "100vh", padding: "40px 20px", fontFamily: "Arial, sans-serif" },
  center: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh" },
  header: { textAlign: "center", marginBottom: "25px" },
  title: { fontSize: "30px", color: "#2c3e50", marginBottom: "8px" },
  badge: { display: "inline-block", backgroundColor: "#eafaf1", color: "#27ae60", padding: "5px 14px", borderRadius: "20px", fontSize: "12px", marginBottom: "10px", wordBreak: "break-all" },
  headerBtns: { display: "flex", justifyContent: "center", gap: "10px", marginTop: "10px" },
  refreshBtn: { backgroundColor: "#3498db", color: "white", padding: "9px 20px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px" },
  backBtn: { backgroundColor: "#95a5a6", color: "white", padding: "9px 20px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px" },
  coverageCard: { backgroundColor: "white", padding: "25px", borderRadius: "15px", maxWidth: "900px", margin: "0 auto 25px auto", boxShadow: "0 4px 15px rgba(0,0,0,0.08)" },
  cardTitle: { fontSize: "18px", color: "#2c3e50", marginBottom: "20px", textAlign: "center" },
  coverageGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "25px" },
  coverageItem: { textAlign: "center" },
  coverageLabel: { fontSize: "11px", color: "#95a5a6", marginBottom: "5px", textTransform: "uppercase" },
  coverageValue: { fontSize: "18px", fontWeight: "bold", color: "#2c3e50" },
  progressContainer: { marginTop: "20px" },
  progressLabel: { fontSize: "12px", color: "#7f8c8d", marginBottom: "8px" },
  progressBar: { height: "20px", backgroundColor: "#ecf0f1", borderRadius: "10px", overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#3498db", transition: "width 0.3s ease" },
  progressText: { fontSize: "11px", color: "#95a5a6", marginTop: "5px", textAlign: "right" },
  tableCard: { backgroundColor: "white", borderRadius: "15px", maxWidth: "900px", margin: "0 auto", boxShadow: "0 4px 15px rgba(0,0,0,0.08)", overflow: "hidden" },
  tableTopRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 25px", borderBottom: "1px solid #f0f4f8" },
  tableTitle: { fontSize: "16px", fontWeight: "bold", color: "#2c3e50", marginRight: "10px" },
  countPill: { backgroundColor: "#f3e5ff", color: "#9b59b6", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" },
  claimsList: { padding: "20px" },
  claimCard: { backgroundColor: "#f8f9fa", borderRadius: "12px", marginBottom: "15px", overflow: "hidden", border: "1px solid #e9ecef" },
  claimHeader: { backgroundColor: "white", padding: "12px 15px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e9ecef" },
  claimId: { fontSize: "14px", fontWeight: "bold", color: "#2c3e50", marginRight: "10px" },
  statusPill: { padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "bold" },
  claimDate: { fontSize: "11px", color: "#95a5a6" },
  claimBody: { padding: "15px" },
  infoRow: { display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #ecf0f1", fontSize: "13px" },
  infoLabel: { color: "#7f8c8d", fontWeight: "bold" },
  infoValue: { color: "#2c3e50", wordBreak: "break-all", maxWidth: "60%", textAlign: "right" },
  paymentBox: { backgroundColor: "white", padding: "15px", borderRadius: "10px", marginTop: "15px" },
  paymentTitle: { fontSize: "13px", color: "#2c3e50", marginBottom: "10px" },
  paymentRow: { display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "13px" },
  rejectionBox: { backgroundColor: "#fdf2f2", color: "#e74c3c", padding: "10px", borderRadius: "8px", fontSize: "12px", marginTop: "10px" },
  approvedBox: { backgroundColor: "#eafaf1", color: "#27ae60", padding: "10px", borderRadius: "8px", fontSize: "12px", marginTop: "10px" },
};

export default ViewMyClaims;
