import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as faceapi from "face-api.js";
import emailjs from "@emailjs/browser";
import UserRegistry from "../../contracts/UserRegistry.json";

const CONTRACT_ADDRESS = "0xc13889F84aB7351841CC70A807E9FF3AE1f3b401";

const EMAILJS_SERVICE_ID  = "service_1p06ot8";
const EMAILJS_TEMPLATE_ID = "template_b1wg18o";
const EMAILJS_PUBLIC_KEY  = "5SpQHRXsZROlc4cFo";

function PatientRegister({ account, web3 }) {
  const navigate  = useNavigate();
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);

  const steps = ["Member ID", "Basic Details", "Email OTP", "Face Match", "Submit", "Done"];
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1
  const [memberId, setMemberId]               = useState("");
  const [memberIdVerified, setMemberIdVerified] = useState(false);
  const [verifying, setVerifying]             = useState(false);
  // Step 1 detail fields (used for on-chain hash verification)
  const [verifyName,   setVerifyName]   = useState("");
  const [verifyDob,    setVerifyDob]    = useState("");
  const [verifyMobile, setVerifyMobile] = useState("");

  // Step 2
  const [formData, setFormData] = useState({
    name: "", dob: "", gender: "", mobile: "", email: "", location: "",
  });

  // Step 3
  const [generatedOTP, setGeneratedOTP] = useState("");
  const [enteredOTP, setEnteredOTP]     = useState("");
  const [otpVerified, setOtpVerified]   = useState(false);
  const [otpSent, setOtpSent]           = useState(false);
  const [sendingOTP, setSendingOTP]     = useState(false);

  // Step 4
  const [modelsLoaded, setModelsLoaded]       = useState(false);
  const [modelLoading, setModelLoading]       = useState(false);
  const [uploadedPhoto, setUploadedPhoto]     = useState(null);
  const [uploadedPhotoEl, setUploadedPhotoEl] = useState(null);
  const [selfiePhoto, setSelfiePhoto]         = useState(null);
  const [selfiePhotoEl, setSelfiePhotoEl]     = useState(null);
  const [faceMatched, setFaceMatched]         = useState(false);
  const [cameraOpen, setCameraOpen]           = useState(false);
  const [matchScore, setMatchScore]           = useState(null);
  const [faceError, setFaceError]             = useState("");
  const [matching, setMatching]               = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => { loadModels(); }, []);

  const loadModels = async () => {
    setModelLoading(true);
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
        faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
        faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
      ]);
      setModelsLoaded(true);
    } catch (err) { console.error("Model load failed:", err); }
    setModelLoading(false);
  };

  const verifyMemberId = async () => {
    if (!memberId.trim())    { setError("Enter your Member ID."); return; }
    if (!verifyName.trim())  { setError("Enter your full name."); return; }
    if (!verifyDob.trim())   { setError("Enter your date of birth."); return; }
    if (!verifyMobile.trim()){ setError("Enter your mobile number."); return; }

    setVerifying(true); setError("");
    try {
      const contract = new web3.eth.Contract(UserRegistry.abi, CONTRACT_ADDRESS);

      // Hash all fields client-side — raw data never leaves the browser
      const memberIdHash = web3.utils.keccak256(memberId.trim());
      const nameHash     = web3.utils.keccak256(verifyName.trim());
      const dobHash      = web3.utils.keccak256(verifyDob.trim());
      const mobileHash   = web3.utils.keccak256(verifyMobile.trim());

      const valid = await contract.methods
        .verifyMemberDetails(memberIdHash, nameHash, dobHash, mobileHash)
        .call();

      if (valid) {
        setMemberIdVerified(true);
        // Pre-fill Step 2 with the verified details
        setFormData(f => ({ ...f, name: verifyName.trim(), dob: verifyDob.trim(), mobile: verifyMobile.trim() }));
        setMessage("Identity verified. Proceed to complete your details.");
        setTimeout(() => { setMessage(""); setCurrentStep(2); }, 1500);
      } else {
        setError("Details do not match insurer records. Check your Member ID, name, date of birth, and mobile number.");
      }
    } catch (err) { setError("Verification failed: " + err.message); }
    setVerifying(false);
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleBasicDetails = (e) => { e.preventDefault(); setError(""); setCurrentStep(3); };

  const sendOTP = async () => {
    if (!formData.email) { setError("Email is required."); return; }
    setSendingOTP(true); setError("");
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOTP(otp);
    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID,
        { to_email: formData.email, to_name: formData.name, otp_code: otp },
        EMAILJS_PUBLIC_KEY);
      setOtpSent(true);
      setMessage("OTP sent to " + formData.email);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) { setError("Failed to send OTP: " + (err.text || err.message)); }
    setSendingOTP(false);
  };

  const verifyOTP = () => {
    if (enteredOTP === generatedOTP) {
      setOtpVerified(true);
      setMessage("Email verified successfully.");
      setTimeout(() => { setMessage(""); setCurrentStep(4); }, 1500);
    } else { setError("Incorrect OTP. Please try again."); }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedPhoto(ev.target.result);
      setFaceMatched(false); setMatchScore(null); setFaceError("");
      const img = new Image(); img.src = ev.target.result;
      img.onload = () => setUploadedPhotoEl(img);
    };
    reader.readAsDataURL(file);
  };

  const openCamera = async () => {
    setCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch { setFaceError("Camera access denied!"); setCameraOpen(false); }
  };

  const takeSelfie = () => {
    const canvas = canvasRef.current, video = videoRef.current;
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const data = canvas.toDataURL("image/jpeg");
    setSelfiePhoto(data); setFaceMatched(false); setMatchScore(null); setFaceError("");
    const img = new Image(); img.src = data; img.onload = () => setSelfiePhotoEl(img);
    video.srcObject.getTracks().forEach(t => t.stop());
    setCameraOpen(false);
  };

  const matchFaces = async () => {
    if (!uploadedPhoto) { setFaceError("Upload a photo first!"); return; }
    if (!selfiePhoto)   { setFaceError("Take a selfie first!"); return; }
    if (!modelsLoaded)  { setFaceError("Face AI still loading..."); return; }
    setMatching(true); setFaceError(""); setMatchScore(null); setFaceMatched(false);
    try {
      const d1 = await faceapi.detectSingleFace(uploadedPhotoEl, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks().withFaceDescriptor();
      if (!d1) { setFaceError("No face in uploaded photo."); setMatching(false); return; }
      const d2 = await faceapi.detectSingleFace(selfiePhotoEl, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks().withFaceDescriptor();
      if (!d2) { setFaceError("No face in selfie."); setMatching(false); return; }
      const dist = faceapi.euclideanDistance(d1.descriptor, d2.descriptor);
      const sim  = Math.max(0, Math.round((1 - dist) * 100));
      setMatchScore(sim);
      if (dist < 0.5) {
        setFaceMatched(true);
        setMessage(`Face matched! (${sim}% similarity)`);
        setFaceError("");
      } else { setFaceError(`Face does not match (${sim}% similarity). Try again.`); }
    } catch (err) { setFaceError("Face error: " + err.message); }
    setMatching(false);
  };

  const handleSubmit = async () => {
    if (!otpVerified) { setError("Email OTP not verified!"); return; }
    if (!faceMatched) { setError("Face not matched!"); return; }
    setLoading(true); setError("");
    try {
      const memberIdHash = web3.utils.keccak256(memberId.trim());
      const photoHash    = web3.utils.keccak256(selfiePhoto.substring(0, 100));
      const contract     = new web3.eth.Contract(UserRegistry.abi, CONTRACT_ADDRESS);
      await contract.methods.registerPatient({
        name: formData.name, dob: formData.dob, gender: formData.gender,
        mobile: formData.mobile, email: formData.email, location: formData.location,
        otpVerified: true, memberIdHash, photoHash,
      }).send({ from: account });
      setCurrentStep(6);
    } catch (err) { setError("Registration failed: " + err.message); }
    setLoading(false);
  };

  return (
    <div style={S.page}>
      <div style={S.topbar}>
        <div style={S.topbarBrand}>
          <div style={S.topbarLogo}>M</div>
          <div>
            <div style={S.topbarName}>MedInsure</div>
            <div style={S.topbarSub}>Blockchain Health Insurance</div>
          </div>
        </div>
        <div style={S.topbarCenter}><span style={S.pageLabel}>Patient Registration</span></div>
        <div style={S.topbarRight}>
          {modelLoading && <div style={S.pillAmber}>Loading Face AI...</div>}
          {modelsLoaded && <div style={S.pillGreen}>Face AI Ready</div>}
          <div style={S.walletPill}>
            <div style={S.walletDot} />
            <span>{account.slice(0, 8)}...{account.slice(-6)}</span>
          </div>
          <button style={S.backBtn} onClick={() => navigate("/")}>← Home</button>
        </div>
      </div>

      <div style={S.body}>
        <div style={S.pageHead}>
          <div style={S.secLabel}>PATIENT PORTAL</div>
          <h1 style={S.pageTitle}>Create Your Account</h1>
          <p style={S.pageSub}>Complete all steps to register on the MedInsure blockchain platform</p>
        </div>

        {/* STEP INDICATOR */}
        <div style={S.stepRow}>
          {steps.map((label, i) => {
            const n = i + 1, done = currentStep > n, active = currentStep === n;
            return (
              <React.Fragment key={i}>
                <div style={S.stepItem}>
                  <div style={{ ...S.stepCircle,
                    background: done ? "#15803D" : active ? "#1D4ED8" : "#DBEAFE",
                    color: (done || active) ? "#fff" : "#64748B",
                    boxShadow: active ? "0 0 0 4px rgba(21,101,192,0.15)" : "none" }}>
                    {done ? "" : n}
                  </div>
                  <span style={{ ...S.stepLabel,
                    color: done ? "#15803D" : active ? "#1D4ED8" : "#94A3B8",
                    fontWeight: active ? "700" : "500" }}>{label}</span>
                </div>
                {i < steps.length - 1 && <div style={{ ...S.stepConnector, background: done ? "#15803D" : "#DBEAFE" }} />}
              </React.Fragment>
            );
          })}
        </div>

        {message && <div style={S.alertGreen}><div style={S.alertIconGreen}></div><span>{message}</span></div>}
        {error   && <div style={S.alertRed}><div style={S.alertIconRed}>!</div><span>{error}</span></div>}

        <div style={S.card}>
          {/* STEP 1 */}
          {currentStep === 1 && (
            <div>
              <div style={S.cardHead}>
                <div style={S.stepBadge}>01</div>
                <div>
                  <div style={S.cardHeadTitle}>Member ID Verification</div>
                  <div style={S.cardHeadSub}>Enter your Member ID and the details you provided at the insurance office</div>
                </div>
              </div>
              <div style={S.cardBody}>
                <div style={S.fGroup}>
                  <label style={S.fLabel}>Member ID</label>
                  <input style={{ ...S.fInput, letterSpacing: "3px", fontSize: "16px" }}
                    type="text" placeholder="e.g. MED-2024-00123"
                    value={memberId} onChange={e => { setMemberId(e.target.value); setError(""); }} />
                  <span style={S.hint}>Issued by your insurer after your office visit.</span>
                </div>
                <div style={S.grid2}>
                  <div style={S.fGroup}>
                    <label style={S.fLabel}>Full Name</label>
                    <input style={S.fInput} type="text" placeholder="As given to insurer"
                      value={verifyName} onChange={e => { setVerifyName(e.target.value); setError(""); }} />
                  </div>
                  <div style={S.fGroup}>
                    <label style={S.fLabel}>Date of Birth</label>
                    <input style={S.fInput} type="date"
                      value={verifyDob} onChange={e => { setVerifyDob(e.target.value); setError(""); }} />
                  </div>
                </div>
                <div style={S.fGroup}>
                  <label style={S.fLabel}>Registered Mobile Number</label>
                  <input style={S.fInput} type="text" placeholder="Mobile number given at office"
                    value={verifyMobile} onChange={e => { setVerifyMobile(e.target.value); setError(""); }} maxLength="10" />
                  <span style={S.hint}>These details are verified against insurer records on the blockchain.</span>
                </div>
                <button style={{ ...S.btnPrimary, background: verifying ? "#90a4ae" : "#1D4ED8", cursor: verifying ? "not-allowed" : "pointer" }}
                  onClick={verifyMemberId} disabled={verifying}>
                  {verifying ? "Verifying on blockchain..." : "Verify Identity →"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {currentStep === 2 && (
            <form onSubmit={handleBasicDetails}>
              <div style={S.cardHead}>
                <div style={S.stepBadge}>02</div>
                <div><div style={S.cardHeadTitle}>Basic Details</div><div style={S.cardHeadSub}>Enter your personal information</div></div>
              </div>
              <div style={S.cardBody}>
                <div style={S.grid2}>
                  {[
                    { label: "Full Name",     name: "name",   type: "text",  ph: "Enter your full name" },
                    { label: "Date of Birth", name: "dob",    type: "date",  ph: "" },
                    { label: "Mobile Number", name: "mobile", type: "text",  ph: "10-digit mobile", max: "10" },
                    { label: "Email Address", name: "email",  type: "email", ph: "Enter your email" },
                  ].map(f => (
                    <div key={f.name} style={S.fGroup}>
                      <label style={S.fLabel}>{f.label}</label>
                      <input style={S.fInput} type={f.type} name={f.name}
                        placeholder={f.ph} value={formData[f.name]}
                        onChange={handleChange} maxLength={f.max} required />
                    </div>
                  ))}
                </div>
                <div style={S.fGroup}>
                  <label style={S.fLabel}>Gender</label>
                  <select style={S.fInput} name="gender" value={formData.gender} onChange={handleChange} required>
                    <option value="">Select Gender</option>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
                <div style={S.fGroup}>
                  <label style={S.fLabel}>Residential Address</label>
                  <input style={S.fInput} type="text" name="location"
                    placeholder="Enter your full address" value={formData.location} onChange={handleChange} required />
                </div>
                <button style={S.btnPrimary} type="submit">Continue to Email OTP →</button>
              </div>
            </form>
          )}

          {/* STEP 3 */}
          {currentStep === 3 && (
            <div>
              <div style={S.cardHead}>
                <div style={S.stepBadge}>03</div>
                <div><div style={S.cardHeadTitle}>Email OTP Verification</div><div style={S.cardHeadSub}>A 6-digit code will be sent to your email</div></div>
              </div>
              <div style={S.cardBody}>
                <div style={S.infoRow}>
                  <span style={S.infoLbl}>Sending OTP to</span>
                  <span style={S.infoVal}>{formData.email}</span>
                </div>
                {!otpSent ? (
                  <button style={{ ...S.btnPrimary, background: sendingOTP ? "#90a4ae" : "#1D4ED8", cursor: sendingOTP ? "not-allowed" : "pointer" }}
                    onClick={sendOTP} disabled={sendingOTP}>
                    {sendingOTP ? "Sending..." : "Send OTP to Email →"}
                  </button>
                ) : (
                  <>
                    <div style={S.fGroup}>
                      <label style={S.fLabel}>Enter OTP</label>
                      <input style={{ ...S.fInput, letterSpacing: "8px", fontSize: "22px", textAlign: "center", fontWeight: "700" }}
                        type="text" placeholder="——————" value={enteredOTP}
                        onChange={e => setEnteredOTP(e.target.value)} maxLength="6" />
                      <span style={S.hint}>Check your inbox (and spam folder) for the 6-digit code.</span>
                    </div>
                    <button style={S.btnPrimary} onClick={verifyOTP}>Verify OTP →</button>
                    <button style={{ ...S.btnGhost, opacity: sendingOTP ? 0.6 : 1 }} onClick={sendOTP} disabled={sendingOTP}>
                      {sendingOTP ? "Resending..." : "Resend OTP"}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {currentStep === 4 && (
            <div>
              <div style={S.cardHead}>
                <div style={S.stepBadge}>04</div>
                <div><div style={S.cardHeadTitle}>Face Recognition</div><div style={S.cardHeadSub}>Biometric verification using AI face comparison</div></div>
                <div style={{ ...S.aiBadge, background: modelsLoaded ? "#F0FDF4" : "#fff8e1", color: modelsLoaded ? "#15803D" : "#EA580C", border: `1px solid ${modelsLoaded ? "#86EFAC" : "#ffe082"}` }}>
                  {modelLoading ? "Loading AI..." : modelsLoaded ? "AI Ready" : "AI Unavailable"}
                </div>
              </div>
              <div style={S.cardBody}>
                <div style={S.faceBlock}>
                  <div style={S.faceSectionTitle}>Step 1 — Upload ID / Passport Photo</div>
                  <label style={S.fileRow}>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: "none" }} />
                    <span style={S.filePickerBtn}>Choose Photo</span>
                    <span style={S.hint}>Clear front-facing photo</span>
                  </label>
                  {uploadedPhoto && (
                    <div style={S.photoBox}>
                      <img src={uploadedPhoto} alt="Uploaded" style={S.photoImg} />
                      <span style={S.photoCaption}>Uploaded Photo</span>
                    </div>
                  )}
                </div>
                <div style={S.faceDivider} />
                <div style={S.faceBlock}>
                  <div style={S.faceSectionTitle}>Step 2 — Take a Live Selfie</div>
                  <span style={S.hint}>Good lighting, face the camera directly.</span>
                  {!cameraOpen && !selfiePhoto && (
                    <button style={{ ...S.btnPrimary, marginTop: "12px" }} onClick={openCamera}>Open Camera →</button>
                  )}
                  {cameraOpen && (
                    <div style={{ marginTop: "12px" }}>
                      <video ref={videoRef} autoPlay style={S.video} />
                      <button style={S.btnPrimary} onClick={takeSelfie}>Capture Selfie</button>
                    </div>
                  )}
                  <canvas ref={canvasRef} style={{ display: "none" }} />
                  {selfiePhoto && (
                    <div style={S.photoBox}>
                      <img src={selfiePhoto} alt="Selfie" style={S.photoImg} />
                      <span style={S.photoCaption}>Your Selfie</span>
                      {!faceMatched && (
                        <button style={{ ...S.btnGhost, marginTop: "8px" }}
                          onClick={() => { setSelfiePhoto(null); setSelfiePhotoEl(null); setFaceError(""); setMatchScore(null); }}>
                          Retake
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {uploadedPhoto && selfiePhoto && !faceMatched && (
                  <button style={{ ...S.btnPrimary, background: matching ? "#90a4ae" : "#EA580C", cursor: matching ? "not-allowed" : "pointer" }}
                    onClick={matchFaces} disabled={matching || !modelsLoaded}>
                    {matching ? "Analyzing..." : "Run Face Match →"}
                  </button>
                )}
                {matchScore !== null && (
                  <div style={{ ...S.scoreBox, background: faceMatched ? "#F0FDF4" : "#FEF2F2", border: `1.5px solid ${faceMatched ? "#86EFAC" : "#FCA5A5"}` }}>
                    <div style={{ fontSize: "30px", marginBottom: "6px" }}>{faceMatched ? "" : ""}</div>
                    <div style={{ fontSize: "22px", fontWeight: "900", color: faceMatched ? "#15803D" : "#DC2626", marginBottom: "4px" }}>{matchScore}% Similarity</div>
                    <div style={{ fontSize: "13px", color: "#475569" }}>{faceMatched ? "Identity verified." : "Faces do not match. Try again."}</div>
                  </div>
                )}
                {faceError && <div style={S.alertRed}><div style={S.alertIconRed}>!</div><span>{faceError}</span></div>}
                {faceMatched && (
                  <button style={{ ...S.btnPrimary, background: "#15803D", marginTop: "16px" }}
                    onClick={() => { setMessage(""); setCurrentStep(5); }}>
                    Continue to Review →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 5 */}
          {currentStep === 5 && (
            <div>
              <div style={S.cardHead}>
                <div style={S.stepBadge}>05</div>
                <div><div style={S.cardHeadTitle}>Review & Submit</div><div style={S.cardHeadSub}>Confirm your details before submitting to the blockchain</div></div>
              </div>
              <div style={S.cardBody}>
                <div style={S.summaryBox}>
                  <div style={S.summarySection}>Personal Information</div>
                  {[["Name", formData.name], ["DOB", formData.dob], ["Gender", formData.gender],
                    ["Mobile", formData.mobile], ["Email", formData.email], ["Address", formData.location]
                  ].map(([lbl, val]) => (
                    <div key={lbl} style={S.summaryRow}>
                      <span style={S.summaryLbl}>{lbl}</span>
                      <span style={S.summaryVal}>{val}</span>
                    </div>
                  ))}
                  <div style={S.summarySection}>Verification Status</div>
                  {[["Member ID", "Verified"], ["Email OTP", "Verified"],
                    ["Face Recognition", `Matched — ${matchScore}% similarity`]
                  ].map(([lbl, val]) => (
                    <div key={lbl} style={S.summaryRow}>
                      <span style={S.summaryLbl}>{lbl}</span>
                      <span style={{ ...S.summaryVal, color: "#15803D", fontWeight: "700" }}>{val}</span>
                    </div>
                  ))}
                </div>
                <div style={S.submitNote}>
                  Your data will be recorded on the Ethereum blockchain. Member ID and face data are stored only as cryptographic hashes.
                </div>
                <button style={{ ...S.btnPrimary, background: loading ? "#90a4ae" : "#1D4ED8", cursor: loading ? "not-allowed" : "pointer" }}
                  onClick={handleSubmit} disabled={loading}>
                  {loading ? "Submitting to Blockchain..." : "Submit Registration →"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 6 */}
          {currentStep === 6 && (
            <div style={S.successWrap}>
              <div style={S.successIcon}></div>
              <h2 style={S.successTitle}>Registration Complete!</h2>
              <p style={S.successDesc}>Your details have been recorded on the Ethereum blockchain.</p>
              <div style={S.successNote}>Your KYC is pending insurer approval. You can subscribe to a health plan once approved.</div>
              <button style={S.btnPrimary} onClick={() => navigate("/patient/dashboard")}>Go to My Dashboard →</button>
            </div>
          )}
        </div>
      </div>

      <div style={S.footer}>
        <span>© 2026 MedInsure</span>
        <span>Powered by Ethereum Blockchain</span>
        <span>Patient Portal</span>
      </div>
    </div>
  );
}

const S = {
  page:         { background: "#F8FAFC", minHeight: "100vh", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: "#1E3A8A", display: "flex", flexDirection: "column" },
  topbar:       { background: "#fff", borderBottom: "1px solid #dde3ef", height: "68px", padding: "0 36px", display: "flex", alignItems: "center", gap: "16px", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" },
  topbarBrand:  { display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 },
  topbarLogo:   { width: "38px", height: "38px", background: "#1D4ED8", borderRadius: "9px", color: "#fff", fontSize: "19px", fontWeight: "900", display: "flex", alignItems: "center", justifyContent: "center" },
  topbarName:   { fontSize: "16px", fontWeight: "800", color: "#1E3A8A", lineHeight: 1.2 },
  topbarSub:    { fontSize: "10px", color: "#94A3B8", letterSpacing: "0.4px" },
  topbarCenter: { flex: 1, display: "flex", justifyContent: "center" },
  pageLabel:    { fontSize: "13px", fontWeight: "700", color: "#334155", background: "#EFF6FF", padding: "6px 16px", borderRadius: "5px" },
  topbarRight:  { display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 },
  pillAmber:    { fontSize: "11px", fontWeight: "700", background: "#fff8e1", color: "#EA580C", border: "1px solid #ffe082", padding: "5px 12px", borderRadius: "20px" },
  pillGreen:    { fontSize: "11px", fontWeight: "700", background: "#F0FDF4", color: "#15803D", border: "1px solid #a5d6a7", padding: "5px 12px", borderRadius: "20px" },
  walletPill:   { display: "flex", alignItems: "center", gap: "7px", background: "#EFF6FF", border: "1px solid #c5d5e8", borderRadius: "20px", padding: "6px 14px", fontSize: "12px", color: "#1E3A8A", fontWeight: "700" },
  walletDot:    { width: "8px", height: "8px", borderRadius: "50%", background: "#15803D", flexShrink: 0 },
  backBtn:      { background: "#fff", color: "#1D4ED8", border: "2px solid #1565c0", padding: "7px 16px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "700" },
  body:         { flex: 1, maxWidth: "680px", width: "100%", margin: "0 auto", padding: "36px 20px 60px" },
  pageHead:     { textAlign: "center", marginBottom: "32px" },
  secLabel:     { display: "inline-block", background: "#DBEAFE", color: "#1D4ED8", padding: "4px 12px", borderRadius: "3px", fontSize: "11px", fontWeight: "800", letterSpacing: "1.2px", marginBottom: "10px" },
  pageTitle:    { fontSize: "28px", fontWeight: "700", color: "#0F172A", margin: "0 0 8px", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  pageSub:      { fontSize: "14px", color: "#64748B", margin: 0 },
  stepRow:      { display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "32px" },
  stepItem:     { display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" },
  stepCircle:   { width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "13px", transition: "all 0.3s", flexShrink: 0 },
  stepLabel:    { fontSize: "10px", textAlign: "center", maxWidth: "60px", lineHeight: 1.3 },
  stepConnector:{ height: "2px", flex: 1, minWidth: "16px", maxWidth: "36px", marginBottom: "16px" },
  alertGreen:   { display: "flex", alignItems: "center", gap: "10px", background: "#F0FDF4", border: "1px solid #a5d6a7", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px", fontSize: "14px", color: "#15803D", fontWeight: "600" },
  alertRed:     { display: "flex", alignItems: "center", gap: "10px", background: "#FEF2F2", border: "1px solid #ef9a9a", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px", fontSize: "14px", color: "#DC2626", fontWeight: "600" },
  alertIconGreen: { width: "22px", height: "22px", borderRadius: "50%", background: "#15803D", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "900", flexShrink: 0 },
  alertIconRed:   { width: "22px", height: "22px", borderRadius: "50%", background: "#DC2626", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "900", flexShrink: 0 },
  card:         { background: "#fff", borderRadius: "14px", border: "1px solid #dde3ef", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", overflow: "hidden" },
  cardHead:     { display: "flex", alignItems: "center", gap: "14px", padding: "20px 28px", borderBottom: "1px solid #eef1f8", background: "#fafbfe" },
  stepBadge:    { width: "36px", height: "36px", borderRadius: "9px", background: "#1D4ED8", color: "#fff", fontSize: "14px", fontWeight: "900", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  cardHeadTitle:{ fontSize: "16px", fontWeight: "700", color: "#0F172A", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", marginBottom: "2px" },
  cardHeadSub:  { fontSize: "12px", color: "#94A3B8" },
  aiBadge:      { marginLeft: "auto", fontSize: "11px", fontWeight: "700", padding: "5px 12px", borderRadius: "20px", flexShrink: 0 },
  cardBody:     { padding: "28px" },
  grid2:        { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "4px" },
  fGroup:       { display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" },
  fLabel:       { fontSize: "11px", fontWeight: "800", color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px" },
  fInput:       { padding: "11px 14px", border: "1.5px solid #dde3ef", borderRadius: "8px", fontSize: "14px", color: "#0F172A", outline: "none", fontFamily: "inherit", background: "#fafbfe" },
  hint:         { fontSize: "11px", color: "#94A3B8", marginTop: "2px" },
  infoRow:      { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F8FAFC", border: "1px solid #dde3ef", borderRadius: "8px", padding: "12px 16px", marginBottom: "20px" },
  infoLbl:      { fontSize: "12px", color: "#64748B", fontWeight: "700" },
  infoVal:      { fontSize: "14px", color: "#1D4ED8", fontWeight: "700" },
  btnPrimary:   { width: "100%", padding: "13px", background: "#1D4ED8", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "700", cursor: "pointer", marginBottom: "10px", fontFamily: "inherit" },
  btnGhost:     { width: "100%", padding: "11px", background: "#fff", color: "#1D4ED8", border: "2px solid #1565c0", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer", marginBottom: "10px", fontFamily: "inherit" },
  faceBlock:    { marginBottom: "20px" },
  faceSectionTitle: { fontSize: "13px", fontWeight: "700", color: "#1E3A8A", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" },
  faceDivider:  { height: "1px", background: "#eef1f8", margin: "20px 0" },
  fileRow:      { display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" },
  filePickerBtn:{ background: "#EFF6FF", color: "#1D4ED8", border: "1.5px solid #c5d5e8", borderRadius: "6px", padding: "8px 16px", fontSize: "13px", fontWeight: "700", cursor: "pointer" },
  photoBox:     { display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", marginTop: "12px" },
  photoImg:     { width: "160px", height: "160px", objectFit: "cover", borderRadius: "10px", border: "2px solid #dde3ef" },
  photoCaption: { fontSize: "11px", color: "#64748B", fontWeight: "700" },
  video:        { width: "100%", maxWidth: "320px", borderRadius: "10px", marginBottom: "12px", display: "block" },
  scoreBox:     { borderRadius: "10px", padding: "20px", textAlign: "center", marginTop: "16px", marginBottom: "8px" },
  summaryBox:   { background: "#F8FAFC", border: "1px solid #dde3ef", borderRadius: "10px", padding: "20px", marginBottom: "20px" },
  summarySection:{ fontSize: "11px", fontWeight: "800", color: "#1D4ED8", textTransform: "uppercase", letterSpacing: "0.8px", margin: "12px 0 8px" },
  summaryRow:   { display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #eef1f8" },
  summaryLbl:   { fontSize: "12px", color: "#64748B", fontWeight: "700" },
  summaryVal:   { fontSize: "13px", color: "#0F172A", fontWeight: "500" },
  submitNote:   { fontSize: "12px", color: "#64748B", background: "#F8FAFC", border: "1px solid #dde3ef", borderRadius: "8px", padding: "12px", marginBottom: "20px", lineHeight: 1.6 },
  successWrap:  { padding: "48px 28px", textAlign: "center" },
  successIcon:  { width: "64px", height: "64px", borderRadius: "50%", background: "#15803D", color: "#fff", fontSize: "28px", fontWeight: "900", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" },
  successTitle: { fontSize: "24px", fontWeight: "700", color: "#0F172A", margin: "0 0 10px", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  successDesc:  { fontSize: "14px", color: "#64748B", margin: "0 0 20px" },
  successNote:  { background: "#F0FDF4", border: "1px solid #a5d6a7", borderRadius: "8px", padding: "14px", fontSize: "13px", color: "#15803D", marginBottom: "24px", lineHeight: 1.6 },
  footer:       { background: "#fff", borderTop: "1px solid #dde3ef", padding: "16px 36px", display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94A3B8" },
};

export default PatientRegister;
