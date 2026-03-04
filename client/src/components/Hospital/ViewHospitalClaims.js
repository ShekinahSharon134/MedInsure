import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ClaimsContract from "../../contracts/ClaimsContract.json";
import { getIPFSUrl } from "../../utils/ipfs";

const CONTRACT_ADDRESS = "0x8AE7c69290fDbBf611993f41A4F7E370937EB13F";

function ViewHospitalClaims({ account, web3 }) {
  const navigate = useNavigate();

  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

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

      const claimIds = await contract.methods.getHospitalClaims(account).call();
      const claimsList = [];

      for (let id of claimIds) {
        const claim = await contract.methods.getClaim(id).call();
        claimsList.push(claim);
      }

      setClaims(claimsList);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "Pending": return { bg: "#fff3cd", color: "#856404" };
      case "Approved": return { bg: "#d4edda", color: "#155724" };
      case "Rejected": return { bg: "#f8d7da", color: "#721c24" };
      default: return { bg: "#e9ecef", color: "#495057" };
    }
  };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>🏥 My Submitted Claims</h1>
        <p style={S.badge}>{account}</p>
        <div style={S.headerBtns}>
          <button style={S.refreshBtn} onClick={loadClaims}>
            🔄 Refresh
          </button>
          <button style={S.backBtn} onClick={() => navigate("/hospital/dashboard")}>
            ← Back
          </button>
        </div>
      </div>

      <div style={S.statsRow}>
        <div style={S.statCard}>
          <div style={S.statValue}>{claims.length}</div>
          <div style={S.statLabel}>Total Claims</div>
        </div>
        <div style={S.statCard}>
          <div style={{ ...S.statValue, color: "#f39c12" }}>
            {claims.filter(c => c.status === "Pending").length}
          </div>
          <div style={S.statLabel}>Pending</div>
        </div>
        <div style={S.statCard}>
          <div style={{ ...S.statValue, color: "#27ae60" }}>
            {claims.filter(c => c.status === "Approved").length}
          </div>
          <div style={S.statLabel}>Approved</div>
        </div>
        <div style={S.statCard}>
          <div style={{ ...S.statValue, color: "#e74c3c" }}>
            {claims.filter(c => c.status === "Rejected").length}
          </div>
          <div style={S.statLabel}>Rejected</div>
        </div>
      </div>

      <div style={S.tableCard}>
        <div style={S.tableTopRow}>
          <div>
            <span style={S.tableTitle}>Claims History</span>
          </div>
        </div>

        {loading ? (
          <p style={S.center}>🔄 Loading claims...</p>
        ) : claims.length === 0 ? (
          <p style={S.center}>No claims submitted yet</p>
        ) : (
          <div style={S.claimsList}>
            {claims.map((claim) => {
              const statusColors = getStatusColor(claim.status);
              return (
                <div key={claim.claimId.toString()} style={S.claimCard}>
                  <div style={S.claimHeader}>
                    <div>
                      <span style={S.claimId}>Claim #{claim.claimId.toString()}</span>
                      <span
                        style={{
                          ...S.statusPill,
                          backgroundColor: statusColors.bg,
                          color: statusColors.color,
                        }}
                      >
                        {claim.status}
                      </span>
                    </div>
                    <div style={S.claimDate}>
                      Submitted: {new Date(Number(claim.submittedOn) * 1000).toLocaleDateString()}
                    </div>
                  </div>

                  <div style={S.claimBody}>
                    <div style={S.infoGrid}>
                      <InfoItem label="Patient" value={claim.patientAddress} />
                      <InfoItem label="Treatment" value={claim.treatment} />
                      <InfoItem 
                        label="Documents" 
                        value={
                          getIPFSUrl(claim.ipfsCID) ? (
                            <a
                              href={getIPFSUrl(claim.ipfsCID)}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: "#3498db", textDecoration: "underline" }}
                            >
                              📄 View on IPFS
                            </a>
                          ) : (
                            <span style={{ color: "#95a5a6", fontSize: "12px" }}>
                              📄 Demo CID: {claim.ipfsCID.substring(0, 20)}...
                              <br />
                              <span style={{ fontSize: "10px" }}>
                                (Configure Pinata for real storage)
                              </span>
                            </span>
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
                          <span style={S.breakdownLabel}>Patient Deductible</span>
                          <span style={{ ...S.breakdownValue, color: "#e67e22" }}>
                            {web3.utils.fromWei(claim.deductibleAmount.toString(), "ether")} ETH
                          </span>
                        </div>
                        <div style={S.breakdownItem}>
                          <span style={S.breakdownLabel}>Patient Co-pay</span>
                          <span style={{ ...S.breakdownValue, color: "#e67e22" }}>
                            {web3.utils.fromWei(claim.copayAmount.toString(), "ether")} ETH
                          </span>
                        </div>
                        <div style={{ ...S.breakdownItem, borderTop: "2px solid #ecf0f1", paddingTop: "10px" }}>
                          <span style={{ ...S.breakdownLabel, fontWeight: "bold" }}>
                            You Receive from Insurer
                          </span>
                          <span style={{ ...S.breakdownValue, color: "#27ae60", fontWeight: "bold", fontSize: "16px" }}>
                            {web3.utils.fromWei(claim.insurerPaysAmount.toString(), "ether")} ETH
                          </span>
                        </div>
                        <div style={S.breakdownItem}>
                          <span style={{ ...S.breakdownLabel, fontWeight: "bold" }}>
                            Patient Pays You
                          </span>
                          <span style={{ ...S.breakdownValue, color: "#3498db", fontWeight: "bold" }}>
                            {web3.utils.fromWei(claim.patientPaysAmount.toString(), "ether")} ETH
                          </span>
                        </div>
                      </div>
                    </div>

                    {claim.status === "Approved" && claim.processedOn !== "0" && (
                      <div style={S.approvedBox}>
                        ✅ Approved on {new Date(Number(claim.processedOn) * 1000).toLocaleDateString()}
                        <br />
                        <small>ETH has been transferred to your wallet</small>
                      </div>
                    )}

                    {claim.status === "Rejected" && (
                      <div style={S.rejectionBox}>
                        <strong>Rejection Reason:</strong> {claim.rejectionReason}
                      </div>
                    )}

                    {claim.status === "Pending" && (
                      <div style={S.pendingBox}>
                        ⏳ Waiting for insurer review...
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
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
  badge: { display: "inline-block", backgroundColor: "#eafaf1", color: "#27ae60", padding: "5px 14px", borderRadius: "20px", fontSize: "12px", marginBottom: "10px", wordBreak: "break-all" },
  headerBtns: { display: "flex", justifyContent: "center", gap: "10px", marginTop: "10px" },
  refreshBtn: { backgroundColor: "#3498db", color: "white", padding: "9px 20px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px" },
  backBtn: { backgroundColor: "#95a5a6", color: "white", padding: "9px 20px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px" },
  statsRow: { display: "flex", justifyContent: "center", gap: "20px", marginBottom: "30px", flexWrap: "wrap", maxWidth: "900px", margin: "0 auto 30px auto" },
  statCard: { backgroundColor: "white", padding: "20px 30px", borderRadius: "12px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", minWidth: "150px" },
  statValue: { fontSize: "32px", fontWeight: "bold", color: "#2c3e50", marginBottom: "5px" },
  statLabel: { fontSize: "12px", color: "#7f8c8d", textTransform: "uppercase" },
  tableCard: { backgroundColor: "white", borderRadius: "15px", maxWidth: "1000px", margin: "0 auto", boxShadow: "0 4px 15px rgba(0,0,0,0.08)", overflow: "hidden" },
  tableTopRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 25px", borderBottom: "1px solid #f0f4f8" },
  tableTitle: { fontSize: "16px", fontWeight: "bold", color: "#2c3e50" },
  center: { textAlign: "center", padding: "40px", color: "#7f8c8d" },
  claimsList: { padding: "20px" },
  claimCard: { backgroundColor: "#f8f9fa", borderRadius: "12px", marginBottom: "20px", overflow: "hidden", border: "1px solid #e9ecef" },
  claimHeader: { backgroundColor: "white", padding: "15px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e9ecef" },
  claimId: { fontSize: "16px", fontWeight: "bold", color: "#2c3e50", marginRight: "10px" },
  statusPill: { padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "bold" },
  claimDate: { fontSize: "12px", color: "#95a5a6" },
  claimBody: { padding: "20px" },
  infoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", marginBottom: "20px" },
  paymentBreakdown: { backgroundColor: "white", padding: "15px", borderRadius: "10px", marginBottom: "15px" },
  breakdownTitle: { fontSize: "14px", color: "#2c3e50", marginBottom: "12px" },
  breakdownGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" },
  breakdownItem: { display: "flex", justifyContent: "space-between", padding: "8px 0" },
  breakdownLabel: { fontSize: "12px", color: "#7f8c8d" },
  breakdownValue: { fontSize: "13px", color: "#2c3e50", fontWeight: "600" },
  approvedBox: { backgroundColor: "#eafaf1", color: "#27ae60", padding: "12px", borderRadius: "8px", fontSize: "13px" },
  rejectionBox: { backgroundColor: "#fdf2f2", color: "#e74c3c", padding: "12px", borderRadius: "8px", fontSize: "13px" },
  pendingBox: { backgroundColor: "#fff3cd", color: "#856404", padding: "12px", borderRadius: "8px", fontSize: "13px" },
};

export default ViewHospitalClaims;
