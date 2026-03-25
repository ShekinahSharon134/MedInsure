import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ClaimsContract from "../../contracts/ClaimsContract.json";
import PolicyContract from "../../contracts/PolicyContract.json";
import UserRegistry from "../../contracts/UserRegistry.json";
import { uploadMultipleToIPFS, uploadJSONToIPFS, isPinataConfigured } from "../../utils/ipfs";
import { debugClaimSubmission } from "../../utils/claimDebug";

const CONTRACT_ADDRESS = "0xcE9ccAc431181CAD1CC44f5D84f5233B32E4A80f";
const POLICY_CONTRACT_ADDRESS = "0xaEBbe2F7c19Afde253EAF5f6Fa4a95408321438A";
const USER_REGISTRY_ADDRESS = "0x71924c5065c8Fa224C48346D01763d40A5635C0C";

function SubmitClaim({ account, web3 }) {
  const navigate = useNavigate();

  // Step 1: Patient Search
  const [patientAddress, setPatientAddress] = useState("");
  const [patientData, setPatientData] = useState(null);
  const [policyData, setPolicyData] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  // Step 2: Claim Details - Enhanced with medical information
  const [formData, setFormData] = useState({
    // Basic Info
    treatmentName: "",
    treatmentDate: "",
    admissionDate: "",
    dischargeDate: "",
    claimAmount: "",
    description: "",
    
    // Medical Details
    primaryDiagnosis: "",
    icdCode: "",
    procedurePerformed: "",
    lengthOfStay: "",
    wardRoom: "",
    attendingDoctor: "",
    doctorRegNo: "",
    
    // Billing Breakdown
    surgeryCharges: "",
    otCharges: "",
    anaesthesiaCharges: "",
    wardCharges: "",
    medicinesCharges: "",
    labCharges: "",
  });
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Payout calculation
  const [payoutBreakdown, setPayoutBreakdown] = useState(null);

  const searchPatient = async () => {
    if (!patientAddress || !web3) return;
    
    setSearching(true);
    setSearchError("");
    setPatientData(null);
    setPolicyData(null);
    setPayoutBreakdown(null);

    try {
      // Get patient details
      const userRegistry = new web3.eth.Contract(
        UserRegistry.abi,
        USER_REGISTRY_ADDRESS
      );
      
      const patient = await userRegistry.methods.getPatient(patientAddress).call();
      
      // Get policy details
      const policyContract = new web3.eth.Contract(
        PolicyContract.abi,
        POLICY_CONTRACT_ADDRESS
      );
      
      const subscription = await policyContract.methods.getSubscription(patientAddress).call();
      const policy = await policyContract.methods.getPolicy(subscription.policyId).call();
      
      setPatientData(patient);
      setPolicyData({ subscription, policy });
      
    } catch (err) {
      console.error(err);
      setSearchError("Patient not found or not subscribed to any policy");
    }
    
    setSearching(false);
  };

  // Calculate payout when claim amount changes
  React.useEffect(() => {
    if (formData.claimAmount && policyData) {
      const claimAmt = parseFloat(formData.claimAmount);
      const deductible = parseFloat(web3.utils.fromWei(policyData.policy.deductible.toString(), 'ether'));
      const copayPercent = parseInt(policyData.policy.copayPercentage.toString());
      
      let deductibleAmt = Math.min(claimAmt, deductible);
      let remaining = claimAmt - deductibleAmt;
      let copayAmt = (remaining * copayPercent) / 100;
      let insurerPays = remaining - copayAmt;
      let patientPays = deductibleAmt + copayAmt;
      
      setPayoutBreakdown({
        claimAmount: claimAmt,
        deductible: deductibleAmt,
        copay: copayAmt,
        insurerPays: insurerPays,
        patientPays: patientPays,
      });
    } else {
      setPayoutBreakdown(null);
    }
  }, [formData.claimAmount, policyData, web3]);

  // Auto-verification: Cross-check claim details with policy coverage
  const [verificationStatus, setVerificationStatus] = useState(null);
  
  React.useEffect(() => {
    if (formData.claimAmount && policyData && formData.primaryDiagnosis) {
      const claimAmt = parseFloat(formData.claimAmount);
      const coverageLimit = parseFloat(web3.utils.fromWei(policyData.policy.coverageLimit.toString(), 'ether'));
      
      // Calculate total from breakdown if available
      const calculatedTotal = [
        formData.surgeryCharges,
        formData.otCharges,
        formData.anaesthesiaCharges,
        formData.wardCharges,
        formData.medicinesCharges,
        formData.labCharges
      ].reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
      
      const checks = {
        withinCoverage: claimAmt <= coverageLimit,
        amountMatches: calculatedTotal === 0 || Math.abs(calculatedTotal - claimAmt) < 0.0001,
        hasDocumentation: files.length > 0,
        hasDiagnosis: formData.primaryDiagnosis.length > 0,
        hasDoctor: formData.attendingDoctor.length > 0,
        hasICD: formData.icdCode.length > 0,
      };
      
      const passedChecks = Object.values(checks).filter(v => v).length;
      const totalChecks = Object.keys(checks).length;
      const score = Math.round((passedChecks / totalChecks) * 100);
      
      setVerificationStatus({
        score,
        checks,
        recommendation: score >= 80 ? "Auto-Approve Recommended" : score >= 60 ? "Manual Review Required" : "Additional Documentation Needed"
      });
    } else {
      setVerificationStatus(null);
    }
  }, [formData, policyData, files, web3]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (submitting || uploading) return;
    
    setSubmitting(true);
    setError("");
    setSuccess("");
    setUploadProgress("");

    try {
      // Debug check
      setUploadProgress("🔍 Checking patient eligibility...");
      const debugResult = await debugClaimSubmission(
        web3,
        patientAddress,
        POLICY_CONTRACT_ADDRESS,
        CONTRACT_ADDRESS
      );

      if (!debugResult.success) {
        throw new Error(debugResult.error);
      }

      let ipfsCID = "";

      // Upload files
      if (files.length > 0) {
        if (!isPinataConfigured()) {
          ipfsCID = "QmTest" + Date.now();
        } else {
          setUploading(true);
          setUploadProgress("📤 Uploading documents to IPFS...");

          const uploadResults = await uploadMultipleToIPFS(files);
          const failedUploads = uploadResults.filter(r => !r.success);
          
          if (failedUploads.length > 0) {
            throw new Error(`Failed to upload ${failedUploads.length} file(s)`);
          }

          const metadata = {
            // Basic Information
            treatmentName: formData.treatmentName,
            treatmentDate: formData.treatmentDate,
            admissionDate: formData.admissionDate,
            dischargeDate: formData.dischargeDate,
            description: formData.description,
            
            // Medical Details
            primaryDiagnosis: formData.primaryDiagnosis,
            icdCode: formData.icdCode,
            procedurePerformed: formData.procedurePerformed,
            lengthOfStay: formData.lengthOfStay,
            wardRoom: formData.wardRoom,
            attendingDoctor: formData.attendingDoctor,
            doctorRegNo: formData.doctorRegNo,
            
            // Billing Breakdown
            billingDetails: {
              surgeryCharges: formData.surgeryCharges,
              otCharges: formData.otCharges,
              anaesthesiaCharges: formData.anaesthesiaCharges,
              wardCharges: formData.wardCharges,
              medicinesCharges: formData.medicinesCharges,
              labCharges: formData.labCharges,
              totalAmount: formData.claimAmount,
            },
            
            // Verification
            verificationStatus: verificationStatus,
            
            // Patient & Policy Info
            patientAddress: patientAddress,
            patientName: patientData.name,
            policyName: policyData.policy.policyName,
            policyId: policyData.subscription.policyId.toString(),
            
            // Documents
            files: uploadResults.map(r => ({
              fileName: r.fileName,
              cid: r.cid,
              url: r.url,
            })),
            
            // Metadata
            uploadedAt: new Date().toISOString(),
            uploadedBy: account,
            hospitalAddress: account,
          };

          setUploadProgress("📝 Creating metadata...");
          const metadataResult = await uploadJSONToIPFS(metadata, 'claim-metadata.json');
          
          if (!metadataResult.success) {
            throw new Error('Failed to upload metadata');
          }

          ipfsCID = metadataResult.cid;
          setUploadProgress(`✅ Documents uploaded! CID: ${ipfsCID}`);
          setUploading(false);
        }
      } else {
        ipfsCID = "QmTest" + Date.now();
      }

      // Submit claim
      setUploadProgress("⛓️ Submitting claim to blockchain...");
      const contract = new web3.eth.Contract(
        ClaimsContract.abi,
        CONTRACT_ADDRESS
      );

      const treatment = `${formData.treatmentName} - ${formData.description}`;

      await contract.methods
        .submitClaim(
          patientAddress,
          web3.utils.toWei(formData.claimAmount, "ether"),
          treatment,
          ipfsCID
        )
        .send({ from: account });

      setSuccess("✅ Claim Submitted Successfully!");
      
      // Reset form
      setTimeout(() => {
        navigate("/hospital/dashboard");
      }, 2000);

    } catch (err) {
      console.error("Claim submission error:", err);
      setError("❌ Error: " + (err.message || "Failed to submit claim"));
    }

    setSubmitting(false);
    setUploading(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        .claim-page {
          min-height: 100vh;
          background: #F5F7FA;
          font-family: 'Inter', sans-serif;
          padding: 2rem;
        }

        .claim-container {
          max-width: 1000px;
          margin: 0 auto;
        }

        .claim-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem;
        }

        .claim-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #2D3748;
        }

        .back-btn {
          background: #FFFFFF;
          color: #4A5568;
          padding: 0.625rem 1.25rem;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .back-btn:hover {
          background: #F7FAFC;
          border-color: #CBD5E0;
        }

        /* STEP CARD */
        .step-card {
          background: #FFFFFF;
          border-radius: 12px;
          padding: 2rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .step-header {
          font-size: 1.125rem;
          font-weight: 600;
          color: #2D3748;
          margin-bottom: 1.5rem;
          padding-bottom: 0.75rem;
          border-bottom: 2px solid #E2E8F0;
        }

        /* SEARCH SECTION */
        .search-row {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .search-input {
          flex: 1;
          padding: 0.75rem 1rem;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          font-size: 0.875rem;
          font-family: 'Inter', monospace;
        }

        .search-btn {
          background: #3182CE;
          color: #FFFFFF;
          padding: 0.75rem 2rem;
          border: none;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .search-btn:hover {
          background: #2C5282;
        }

        .search-btn:disabled {
          background: #CBD5E0;
          cursor: not-allowed;
        }

        /* PATIENT INFO */
        .patient-info {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .info-label {
          font-size: 0.75rem;
          color: #718096;
          font-weight: 600;
        }

        .info-value {
          font-size: 0.875rem;
          color: #2D3748;
          font-weight: 500;
        }

        /* ACTIVE POLICY */
        .active-policy {
          background: linear-gradient(135deg, #E9D5FF 0%, #DDD6FE 100%);
          border-radius: 12px;
          padding: 1.5rem;
          margin-top: 1.5rem;
        }

        .policy-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
          color: #6B21A8;
          margin-bottom: 1rem;
        }

        .policy-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .policy-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .policy-label {
          font-size: 0.75rem;
          color: #7C3AED;
          font-weight: 600;
        }

        .policy-value {
          font-size: 0.875rem;
          color: #6B21A8;
          font-weight: 600;
        }

        /* FORM */
        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #2D3748;
        }

        .form-input {
          padding: 0.75rem 1rem;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          font-size: 0.875rem;
          font-family: 'Inter', sans-serif;
        }

        .form-input:focus {
          outline: none;
          border-color: #3182CE;
          box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
        }

        .form-textarea {
          padding: 0.75rem 1rem;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          font-size: 0.875rem;
          font-family: 'Inter', sans-serif;
          resize: vertical;
          min-height: 100px;
        }

        .file-input {
          padding: 0.75rem;
          border: 2px dashed #E2E8F0;
          border-radius: 8px;
          font-size: 0.875rem;
          cursor: pointer;
        }

        /* PAYOUT BREAKDOWN */
        .payout-breakdown {
          background: #F7FAFC;
          border-radius: 12px;
          padding: 1.5rem;
          margin-top: 1.5rem;
        }

        .payout-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
          color: #2D3748;
          margin-bottom: 1rem;
        }

        .payout-row {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem 0;
          border-bottom: 1px solid #E2E8F0;
        }

        .payout-row:last-child {
          border-bottom: none;
          padding-top: 1rem;
          margin-top: 0.5rem;
          border-top: 2px solid #E2E8F0;
        }

        .payout-label {
          font-size: 0.875rem;
          color: #718096;
        }

        .payout-value {
          font-size: 0.875rem;
          font-weight: 600;
          color: #2D3748;
        }

        .payout-value.highlight {
          font-size: 1rem;
          color: #38A169;
        }

        .payout-value.patient {
          color: #E53E3E;
        }

        /* SUBMIT BUTTON */
        .submit-btn {
          width: 100%;
          background: #E53E3E;
          color: #FFFFFF;
          padding: 1rem;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 2rem;
        }

        .submit-btn:hover {
          background: #C53030;
        }

        .submit-btn:disabled {
          background: #CBD5E0;
          cursor: not-allowed;
        }

        /* MESSAGES */
        .error-msg {
          background: #FED7D7;
          color: #C53030;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }

        .success-msg {
          background: #C6F6D5;
          color: #2F855A;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }

        .progress-msg {
          background: #BEE3F8;
          color: #2C5282;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }

        @media (max-width: 768px) {
          .claim-page {
            padding: 1rem;
          }
          
          .form-grid,
          .patient-info,
          .policy-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="claim-page">
        <div className="claim-container">
          <div className="claim-header">
            <h1 className="claim-title">Submit Insurance Claim</h1>
            <button className="back-btn" onClick={() => navigate("/hospital/dashboard")}>
              ← Back to Dashboard
            </button>
          </div>

          {error && <div className="error-msg">{error}</div>}
          {success && <div className="success-msg">{success}</div>}
          {uploadProgress && <div className="progress-msg">{uploadProgress}</div>}

          {/* STEP 1: FIND PATIENT */}
          <div className="step-card">
            <h2 className="step-header">Step 1 — Find Patient</h2>
            
            <div className="search-row">
              <input
                type="text"
                className="search-input"
                placeholder="Enter patient wallet address (0x...)"
                value={patientAddress}
                onChange={(e) => setPatientAddress(e.target.value)}
              />
              <button
                className="search-btn"
                onClick={searchPatient}
                disabled={searching || !patientAddress}
              >
                <span>🔍</span>
                {searching ? "Searching..." : "Search"}
              </button>
            </div>

            {searchError && <div className="error-msg">{searchError}</div>}

            {patientData && (
              <>
                <div className="patient-info">
                  <div className="info-item">
                    <span className="info-label">Name:</span>
                    <span className="info-value">{patientData.name}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Mobile:</span>
                    <span className="info-value">{patientData.mobile}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Gender:</span>
                    <span className="info-value">{patientData.gender}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Status:</span>
                    <span className="info-value">{patientData.status}</span>
                  </div>
                </div>

                {policyData && (
                  <div className="active-policy">
                    <div className="policy-title">
                      <span>🛡️</span>
                      Active Policy
                    </div>
                    <div className="policy-grid">
                      <div className="policy-item">
                        <span className="policy-label">Policy:</span>
                        <span className="policy-value">{policyData.policy.policyName}</span>
                      </div>
                      <div className="policy-item">
                        <span className="policy-label">Coverage:</span>
                        <span className="policy-value">
                          {web3.utils.fromWei(policyData.policy.coverageLimit.toString(), 'ether')} ETH
                        </span>
                      </div>
                      <div className="policy-item">
                        <span className="policy-label">Co-pay:</span>
                        <span className="policy-value">{policyData.policy.copayPercentage.toString()}%</span>
                      </div>
                      <div className="policy-item">
                        <span className="policy-label">Deductible:</span>
                        <span className="policy-value">
                          {web3.utils.fromWei(policyData.policy.deductible.toString(), 'ether')} ETH
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* STEP 2: CLAIM DETAILS */}
          {patientData && policyData && (
            <form onSubmit={handleSubmit}>
              <div className="step-card">
                <h2 className="step-header">Step 2 — Claim Details</h2>

                <div className="form-grid">
                  {/* Basic Treatment Info */}
                  <div className="form-group">
                    <label className="form-label">Treatment / Procedure Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., Arthroscopic Partial Medial Meniscectomy"
                      value={formData.treatmentName}
                      onChange={(e) => setFormData({...formData, treatmentName: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Primary Diagnosis *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., Medial Meniscus Tear — Right Knee"
                      value={formData.primaryDiagnosis}
                      onChange={(e) => setFormData({...formData, primaryDiagnosis: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">ICD-10 Code</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., M23.201"
                      value={formData.icdCode}
                      onChange={(e) => setFormData({...formData, icdCode: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Procedure Performed</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., Arthroscopic Surgery"
                      value={formData.procedurePerformed}
                      onChange={(e) => setFormData({...formData, procedurePerformed: e.target.value})}
                    />
                  </div>

                  {/* Dates */}
                  <div className="form-group">
                    <label className="form-label">Admission Date *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.admissionDate}
                      onChange={(e) => setFormData({...formData, admissionDate: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Discharge Date *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.dischargeDate}
                      onChange={(e) => setFormData({...formData, dischargeDate: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Treatment Date *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.treatmentDate}
                      onChange={(e) => setFormData({...formData, treatmentDate: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Length of Stay (days)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g., 2"
                      value={formData.lengthOfStay}
                      onChange={(e) => setFormData({...formData, lengthOfStay: e.target.value})}
                    />
                  </div>

                  {/* Ward & Doctor Info */}
                  <div className="form-group">
                    <label className="form-label">Ward / Room</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., Orthopaedic Ward — Room 204"
                      value={formData.wardRoom}
                      onChange={(e) => setFormData({...formData, wardRoom: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Attending Doctor *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., Dr. Ramesh Nair, MS (Ortho)"
                      value={formData.attendingDoctor}
                      onChange={(e) => setFormData({...formData, attendingDoctor: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Doctor Registration No</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., TN-MED-48291"
                      value={formData.doctorRegNo}
                      onChange={(e) => setFormData({...formData, doctorRegNo: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Upload Documents (discharge summary, bills) *</label>
                    <input
                      type="file"
                      className="file-input"
                      multiple
                      onChange={handleFileChange}
                      required
                    />
                  </div>

                  {/* Billing Breakdown Section */}
                  <div className="form-group full-width" style={{ marginTop: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#2D3748', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid #E2E8F0' }}>
                      💰 Billing Breakdown
                    </h3>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Surgery Charges (ETH)</label>
                    <input
                      type="number"
                      step="0.0001"
                      className="form-input"
                      placeholder="e.g., 1.0000"
                      value={formData.surgeryCharges}
                      onChange={(e) => setFormData({...formData, surgeryCharges: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">OT Charges (ETH)</label>
                    <input
                      type="number"
                      step="0.0001"
                      className="form-input"
                      placeholder="e.g., 0.2000"
                      value={formData.otCharges}
                      onChange={(e) => setFormData({...formData, otCharges: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Anaesthesia Charges (ETH)</label>
                    <input
                      type="number"
                      step="0.0001"
                      className="form-input"
                      placeholder="e.g., 0.1000"
                      value={formData.anaesthesiaCharges}
                      onChange={(e) => setFormData({...formData, anaesthesiaCharges: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Ward Charges (ETH)</label>
                    <input
                      type="number"
                      step="0.0001"
                      className="form-input"
                      placeholder="e.g., 0.1000"
                      value={formData.wardCharges}
                      onChange={(e) => setFormData({...formData, wardCharges: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Medicines & Consumables (ETH)</label>
                    <input
                      type="number"
                      step="0.0001"
                      className="form-input"
                      placeholder="e.g., 0.0700"
                      value={formData.medicinesCharges}
                      onChange={(e) => setFormData({...formData, medicinesCharges: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Lab Investigations (ETH)</label>
                    <input
                      type="number"
                      step="0.0001"
                      className="form-input"
                      placeholder="e.g., 0.0300"
                      value={formData.labCharges}
                      onChange={(e) => setFormData({...formData, labCharges: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Total Claim Amount (ETH) *</label>
                    <input
                      type="number"
                      step="0.0001"
                      className="form-input"
                      placeholder="e.g., 1.5000"
                      value={formData.claimAmount}
                      onChange={(e) => setFormData({...formData, claimAmount: e.target.value})}
                      required
                      style={{ fontWeight: '700', fontSize: '1.125rem', color: '#2D3748' }}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label">Additional Notes / Discharge Instructions</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Enter any additional medical notes, discharge instructions, or follow-up requirements..."
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>
                </div>

                {/* Verification Status */}
                {verificationStatus && (
                  <div style={{ 
                    background: verificationStatus.score >= 80 ? '#E8F5E9' : verificationStatus.score >= 60 ? '#FFF8E1' : '#FFEBEE',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    marginTop: '1.5rem',
                    border: `2px solid ${verificationStatus.score >= 80 ? '#00C853' : verificationStatus.score >= 60 ? '#FFA000' : '#E53E3E'}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>
                        {verificationStatus.score >= 80 ? '✅' : verificationStatus.score >= 60 ? '⚠️' : '❌'}
                      </span>
                      <div>
                        <div style={{ fontSize: '1rem', fontWeight: '700', color: '#2D3748' }}>
                          Verification Score: {verificationStatus.score}%
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#4A5568', marginTop: '0.25rem' }}>
                          {verificationStatus.recommendation}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.875rem' }}>
                      <div style={{ color: verificationStatus.checks.withinCoverage ? '#00C853' : '#E53E3E' }}>
                        {verificationStatus.checks.withinCoverage ? '✓' : '✗'} Within Coverage Limit
                      </div>
                      <div style={{ color: verificationStatus.checks.amountMatches ? '#00C853' : '#E53E3E' }}>
                        {verificationStatus.checks.amountMatches ? '✓' : '✗'} Amount Breakdown Matches
                      </div>
                      <div style={{ color: verificationStatus.checks.hasDocumentation ? '#00C853' : '#E53E3E' }}>
                        {verificationStatus.checks.hasDocumentation ? '✓' : '✗'} Documents Uploaded
                      </div>
                      <div style={{ color: verificationStatus.checks.hasDiagnosis ? '#00C853' : '#E53E3E' }}>
                        {verificationStatus.checks.hasDiagnosis ? '✓' : '✗'} Diagnosis Provided
                      </div>
                      <div style={{ color: verificationStatus.checks.hasDoctor ? '#00C853' : '#E53E3E' }}>
                        {verificationStatus.checks.hasDoctor ? '✓' : '✗'} Doctor Information
                      </div>
                      <div style={{ color: verificationStatus.checks.hasICD ? '#00C853' : '#E53E3E' }}>
                        {verificationStatus.checks.hasICD ? '✓' : '✗'} ICD Code Provided
                      </div>
                    </div>
                  </div>
                )}

                {payoutBreakdown && (
                  <div className="payout-breakdown">
                    <div className="payout-title">
                      <span>💰</span>
                      Payout Breakdown
                    </div>
                    <div className="payout-row">
                      <span className="payout-label">Claim Amount</span>
                      <span className="payout-value">{payoutBreakdown.claimAmount.toFixed(4)} ETH</span>
                    </div>
                    <div className="payout-row">
                      <span className="payout-label">Patient Pays (Deductible + Co-pay)</span>
                      <span className="payout-value patient">{payoutBreakdown.patientPays.toFixed(4)} ETH</span>
                    </div>
                    <div className="payout-row">
                      <span className="payout-label">Insurer Pays → Hospital</span>
                      <span className="payout-value highlight">{payoutBreakdown.insurerPays.toFixed(4)} ETH</span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="submit-btn"
                  disabled={submitting || uploading}
                >
                  <span>🚀</span>
                  {submitting ? "Submitting..." : "Submit Claim"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

export default SubmitClaim;
