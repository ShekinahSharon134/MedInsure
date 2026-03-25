import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ClaimsContract from "../../contracts/ClaimsContract.json";

const CONTRACT_ADDRESS = "0xcE9ccAc431181CAD1CC44f5D84f5233B32E4A80f";

function ViewClaims({ account, web3 }) {
  const navigate = useNavigate();

  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectClaimId, setRejectClaimId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [claimMetadata, setClaimMetadata] = useState({});

  useEffect(() => {
    if (web3 && account) loadClaims();
  }, [web3, account]);

  const loadClaims = async () => {
    try {
      setLoading(true);
      const contract = new web3.eth.Contract(
        ClaimsContract.abi,
        CONTRACT_ADDRESS
      );

      const claimIds = await contract.methods.getAllClaims().call();
      const claimsList = [];
      const metadataMap = {};

      for (let id of claimIds) {
        const claim = await contract.methods.getClaim(id).call();
        claimsList.push(claim);
        
        // Try to fetch metadata from IPFS if it's a real CID
        if (claim.ipfsCID && !claim.ipfsCID.startsWith("QmTest")) {
          try {
            const response = await fetch(`https://rose-persistent-cephalopod-766.mypinata.cloud/ipfs/${claim.ipfsCID}`);
            if (response.ok) {
              const metadata = await response.json();
              metadataMap[claim.claimId.toString()] = metadata;
            }
          } catch (err) {
            console.log("Could not fetch metadata for claim", id);
          }
        }
      }

      setClaims(claimsList);
      setClaimMetadata(metadataMap);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleApprove = async (claimId, insurerPaysAmount) => {
    setProcessing(claimId);
    setError("");
    setSuccess("");

    try {
      const contract = new web3.eth.Contract(
        ClaimsContract.abi,
        CONTRACT_ADDRESS
      );

      await contract.methods
        .approveClaim(claimId)
        .send({
          from: account,
          value: insurerPaysAmount,
        });

      setSuccess(`✅ Claim #${claimId} Approved Successfully!`);
      loadClaims();
    } catch (err) {
      setError("❌ Error: " + err.message);
    }

    setProcessing(null);
  };

  const handleReject = async (claimId) => {
    setRejectClaimId(claimId);
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!rejectionReason.trim()) {
      setError("Please enter a rejection reason");
      return;
    }

    setProcessing(rejectClaimId);
    setError("");
    setSuccess("");
    setShowRejectModal(false);

    try {
      const contract = new web3.eth.Contract(
        ClaimsContract.abi,
        CONTRACT_ADDRESS
      );

      await contract.methods.rejectClaim(rejectClaimId, rejectionReason).send({ from: account });

      setSuccess(`✅ Claim #${rejectClaimId} Rejected`);
      setRejectionReason("");
      loadClaims();
    } catch (err) {
      setError("❌ Error: " + err.message);
    }

    setProcessing(null);
    setRejectClaimId(null);
  };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>📋 Insurance Claims</h1>
        <p style={S.badge}>{account}</p>
        <div style={S.headerBtns}>
          <button style={S.refreshBtn} onClick={loadClaims}>
            🔄 Refresh
          </button>
          <button style={S.backBtn} onClick={() => navigate("/insurer")}>
            ← Back
          </button>
        </div>
      </div>

      {success && <p style={S.successMsg}>{success}</p>}
      {error && <p style={S.errorMsg}>{error}</p>}

      <div style={S.tableCard}>
        <div style={S.tableTopRow}>
          <div>
            <span style={S.tableTitle}>All Claims</span>
            <span style={S.countPill}>{claims.length} Total</span>
          </div>
        </div>

        {loading ? (
          <p style={S.center}>🔄 Loading claims...</p>
        ) : claims.length === 0 ? (
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
                  <div style={S.infoGrid}>
                    <InfoItem label="Patient" value={claim.patientAddress} />
                    <InfoItem label="Hospital" value={claim.hospitalAddress} />
                    <InfoItem label="Treatment" value={claim.treatment} />
                    <InfoItem
                      label="Documents"
                      value={
                        claim.ipfsCID.startsWith("QmTest") || claim.ipfsCID.startsWith("Qm") === false ? (
                          <span style={{ color: "#95a5a6", fontSize: "12px" }}>
                            📄 Demo CID: {claim.ipfsCID.substring(0, 20)}...
                            <br />
                            <span style={{ fontSize: "10px" }}>
                              (Configure Pinata for real IPFS storage)
                            </span>
                          </span>
                        ) : (
                          <>
                            <a
                              href={`https://rose-persistent-cephalopod-766.mypinata.cloud/ipfs/${claim.ipfsCID}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: "#3498db", textDecoration: "underline", display: "block", marginBottom: "5px" }}
                            >
                              📄 View on Pinata (Fast)
                            </a>
                            <a
                              href={`https://ipfs.io/ipfs/${claim.ipfsCID}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: "#9b59b6", textDecoration: "underline", fontSize: "11px" }}
                            >
                              View on IPFS.io (Backup)
                            </a>
                          </>
                        )
                      }
                    />
                  </div>

                  <div style={S.paymentBreakdown}>
                    <h4 style={S.breakdownTitle}>💰 Payment Breakdown</h4>
                    <div style={S.breakdownGrid}>
                      <div style={S.breakdownItem}>
                        <span style={S.breakdownLabel}>Total Claim</span>
                        <span style={S.breakdownValue}>
                          {web3.utils.fromWei(claim.claimAmount.toString(), "ether")} ETH
                        </span>
                      </div>
                      <div style={S.breakdownItem}>
                        <span style={S.breakdownLabel}>Deductible</span>
                        <span style={{ ...S.breakdownValue, color: "#e67e22" }}>
                          -{web3.utils.fromWei(claim.deductibleAmount.toString(), "ether")} ETH
                        </span>
                      </div>
                      <div style={S.breakdownItem}>
                        <span style={S.breakdownLabel}>Co-pay</span>
                        <span style={{ ...S.breakdownValue, color: "#e67e22" }}>
                          -{web3.utils.fromWei(claim.copayAmount.toString(), "ether")} ETH
                        </span>
                      </div>
                      <div style={{ ...S.breakdownItem, borderTop: "2px solid #ecf0f1", paddingTop: "10px" }}>
                        <span style={{ ...S.breakdownLabel, fontWeight: "bold" }}>Insurer Pays</span>
                        <span style={{ ...S.breakdownValue, color: "#27ae60", fontWeight: "bold", fontSize: "16px" }}>
                          {web3.utils.fromWei(claim.insurerPaysAmount.toString(), "ether")} ETH
                        </span>
                      </div>
                      <div style={S.breakdownItem}>
                        <span style={{ ...S.breakdownLabel, fontWeight: "bold" }}>Patient Pays</span>
                        <span style={{ ...S.breakdownValue, color: "#e74c3c", fontWeight: "bold" }}>
                          {web3.utils.fromWei(claim.patientPaysAmount.toString(), "ether")} ETH
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Verification Status */}
                  {claimMetadata[claim.claimId.toString()]?.verificationStatus && (
                    <div style={S.verificationBox}>
                      <div style={S.verificationHeader}>
                        <h4 style={S.verificationTitle}>Automatic Verification</h4>
                        <div
                          style={{
                            ...S.verificationScore,
                            backgroundColor:
                              claimMetadata[claim.claimId.toString()].verificationStatus.score >= 80
                                ? "#d4edda"
                                : claimMetadata[claim.claimId.toString()].verificationStatus.score >= 60
                                ? "#fff3cd"
                                : "#f8d7da",
                            color:
                              claimMetadata[claim.claimId.toString()].verificationStatus.score >= 80
                                ? "#155724"
                                : claimMetadata[claim.claimId.toString()].verificationStatus.score >= 60
                                ? "#856404"
                                : "#721c24",
                          }}
                        >
                          Score: {claimMetadata[claim.claimId.toString()].verificationStatus.score}%
                        </div>
                      </div>
                      <div style={S.verificationRecommendation}>
                        <strong>Recommendation:</strong>{" "}
                        {claimMetadata[claim.claimId.toString()].verificationStatus.recommendation}
                      </div>
                      <div style={S.verificationChecks}>
                        {Object.entries(claimMetadata[claim.claimId.toString()].verificationStatus.checks).map(
                          ([key, passed]) => (
                            <div key={key} style={S.checkItem}>
                              <span style={{ color: passed ? "#27ae60" : "#e74c3c", marginRight: "8px" }}>
                                {passed ? "✓" : "✕"}
                              </span>
                              <span style={{ fontSize: "12px", color: "#2c3e50" }}>
                                {key === "withinCoverage" && "Within Coverage Limit"}
                                {key === "amountMatches" && "Billing Breakdown Matches"}
                                {key === "hasDocumentation" && "Documents Uploaded"}
                                {key === "hasDiagnosis" && "Diagnosis Provided"}
                                {key === "hasDoctor" && "Doctor Information Complete"}
                                {key === "hasICD" && "ICD Code Provided"}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                      
                      {/* Medical Details from Metadata */}
                      {claimMetadata[claim.claimId.toString()].primaryDiagnosis && (
                        <div style={S.medicalDetails}>
                          <h5 style={S.medicalTitle}>Medical Information</h5>
                          <div style={S.medicalGrid}>
                            <InfoItem label="Treatment" value={claimMetadata[claim.claimId.toString()].treatmentName} />
                            <InfoItem label="Diagnosis" value={claimMetadata[claim.claimId.toString()].primaryDiagnosis} />
                            <InfoItem label="ICD-10 Code" value={claimMetadata[claim.claimId.toString()].icdCode || "N/A"} />
                            <InfoItem label="Doctor" value={claimMetadata[claim.claimId.toString()].attendingDoctor} />
                            <InfoItem label="Admission Date" value={claimMetadata[claim.claimId.toString()].admissionDate} />
                            <InfoItem label="Discharge Date" value={claimMetadata[claim.claimId.toString()].dischargeDate} />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {claim.status === "Pending" && (
                    <div style={S.actionBtns}>
                      <button
                        style={S.approveBtn}
                        onClick={() => handleApprove(claim.claimId, claim.insurerPaysAmount)}
                        disabled={processing === claim.claimId.toString()}
                      >
                        {processing === claim.claimId.toString() ? "⏳ Processing..." : "✅ Approve"}
                      </button>
                      <button
                        style={S.rejectBtn}
                        onClick={() => handleReject(claim.claimId)}
                        disabled={processing === claim.claimId.toString()}
                      >
                        ❌ Reject
                      </button>
                    </div>
                  )}

                  {claim.status === "Rejected" && (
                    <div style={S.rejectionBox}>
                      <strong>Rejection Reason:</strong> {claim.rejectionReason}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div style={S.modalOverlay}>
          <div style={S.modal}>
            <h3 style={S.modalTitle}>❌ Reject Claim #{rejectClaimId}</h3>
            <p style={S.modalText}>Please provide a reason for rejecting this claim:</p>
            <textarea
              style={S.textarea}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason (e.g., Insufficient documentation, Treatment not covered, etc.)"
              rows="4"
            />
            <div style={S.modalBtns}>
              <button
                style={S.modalCancelBtn}
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason("");
                  setRejectClaimId(null);
                }}
              >
                Cancel
              </button>
              <button style={S.modalConfirmBtn} onClick={confirmReject}>
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div style={{ marginBottom: "10px" }}>
      <div style={{ fontSize: "11px", color: "#95a5a6", marginBottom: "3px" }}>{label}</div>
      <div style={{ fontSize: "13px", color: "#2c3e50", wordBreak: "break-all" }}>{value}</div>
    </div>
  );
}

const S = {
  page: { backgroundColor: "#f0f4f8", minHeight: "100vh", padding: "40px 20px", fontFamily: "Arial, sans-serif" },
  header: { textAlign: "center", marginBottom: "25px" },
  title: { fontSize: "30px", color: "#2c3e50", marginBottom: "8px" },
  badge: { display: "inline-block", backgroundColor: "#eafaf1", color: "#27ae60", padding: "5px 14px", borderRadius: "20px", fontSize: "12px", marginBottom: "10px" },
  headerBtns: { display: "flex", justifyContent: "center", gap: "10px", marginTop: "10px" },
  refreshBtn: { backgroundColor: "#3498db", color: "white", padding: "9px 20px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px" },
  backBtn: { backgroundColor: "#95a5a6", color: "white", padding: "9px 20px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px" },
  successMsg: { color: "#27ae60", backgroundColor: "#eafaf1", padding: "12px", borderRadius: "8px", textAlign: "center", maxWidth: "1000px", margin: "0 auto 20px auto" },
  errorMsg: { color: "#e74c3c", backgroundColor: "#fdf2f2", padding: "12px", borderRadius: "8px", textAlign: "center", maxWidth: "1000px", margin: "0 auto 20px auto" },
  tableCard: { backgroundColor: "white", borderRadius: "15px", maxWidth: "1100px", margin: "0 auto", boxShadow: "0 4px 15px rgba(0,0,0,0.08)", overflow: "hidden" },
  tableTopRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 25px", borderBottom: "1px solid #f0f4f8" },
  tableTitle: { fontSize: "16px", fontWeight: "bold", color: "#2c3e50", marginRight: "10px" },
  countPill: { backgroundColor: "#f3e5ff", color: "#9b59b6", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" },
  center: { textAlign: "center", padding: "40px", color: "#7f8c8d" },
  claimsList: { padding: "20px" },
  claimCard: { backgroundColor: "#f8f9fa", borderRadius: "12px", marginBottom: "20px", overflow: "hidden", border: "1px solid #e9ecef" },
  claimHeader: { backgroundColor: "white", padding: "15px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e9ecef" },
  claimId: { fontSize: "16px", fontWeight: "bold", color: "#2c3e50", marginRight: "10px" },
  statusPill: { padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "bold" },
  claimDate: { fontSize: "12px", color: "#95a5a6" },
  claimBody: { padding: "20px" },
  infoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "20px" },
  paymentBreakdown: { backgroundColor: "white", padding: "15px", borderRadius: "10px", marginBottom: "15px" },
  breakdownTitle: { fontSize: "14px", color: "#2c3e50", marginBottom: "12px" },
  breakdownGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" },
  breakdownItem: { display: "flex", justifyContent: "space-between", padding: "8px 0" },
  breakdownLabel: { fontSize: "12px", color: "#7f8c8d" },
  breakdownValue: { fontSize: "13px", color: "#2c3e50", fontWeight: "600" },
  actionBtns: { display: "flex", gap: "10px" },
  approveBtn: { flex: 1, backgroundColor: "#27ae60", color: "white", padding: "10px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" },
  rejectBtn: { flex: 1, backgroundColor: "#e74c3c", color: "white", padding: "10px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" },
  rejectionBox: { backgroundColor: "#fdf2f2", color: "#e74c3c", padding: "12px", borderRadius: "8px", fontSize: "13px" },
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modal: { backgroundColor: "white", borderRadius: "15px", padding: "30px", maxWidth: "500px", width: "90%", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" },
  modalTitle: { fontSize: "20px", color: "#2c3e50", marginBottom: "15px" },
  modalText: { fontSize: "14px", color: "#7f8c8d", marginBottom: "15px" },
  textarea: { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px", fontFamily: "Arial, sans-serif", resize: "vertical", marginBottom: "20px" },
  modalBtns: { display: "flex", gap: "10px" },
  modalCancelBtn: { flex: 1, backgroundColor: "#95a5a6", color: "white", padding: "12px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "bold" },
  modalConfirmBtn: { flex: 1, backgroundColor: "#e74c3c", color: "white", padding: "12px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "bold" },
  
  // Verification Styles
  verificationBox: { backgroundColor: "#f8f9fa", padding: "15px", borderRadius: "10px", marginBottom: "15px", border: "1px solid #e9ecef" },
  verificationHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" },
  verificationTitle: { fontSize: "14px", color: "#2c3e50", fontWeight: "bold" },
  verificationScore: { padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" },
  verificationRecommendation: { fontSize: "13px", color: "#2c3e50", marginBottom: "12px", padding: "10px", backgroundColor: "white", borderRadius: "6px" },
  verificationChecks: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" },
  checkItem: { display: "flex", alignItems: "center", fontSize: "12px" },
  medicalDetails: { backgroundColor: "white", padding: "12px", borderRadius: "8px", marginTop: "12px" },
  medicalTitle: { fontSize: "13px", color: "#2c3e50", marginBottom: "10px", fontWeight: "bold" },
  medicalGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" },
};

export default ViewClaims;
