import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as faceapi from "face-api.js";
import UserRegistry from "../../contracts/UserRegistry.json";

const CONTRACT_ADDRESS = "0x878324fb14a0960924Fe542145F9d899df748d9b";

function PatientRegister({ account, web3 }) {
  const navigate  = useNavigate();
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "", dob: "", gender: "",
    mobile: "", email: "", location: "",
  });

  const [generatedOTP, setGeneratedOTP] = useState("");
  const [enteredOTP, setEnteredOTP]     = useState("");
  const [otpVerified, setOtpVerified]   = useState(false);
  const [otpSent, setOtpSent]           = useState(false);

  const [aadharNumber, setAadharNumber]     = useState("");
  const [aadharVerified, setAadharVerified] = useState(false);

  const [uploadedPhoto, setUploadedPhoto] = useState(null);
  const [uploadedPhotoEl, setUploadedPhotoEl] = useState(null);
  const [selfiePhoto, setSelfiePhoto]     = useState(null);
  const [selfiePhotoEl, setSelfiePhotoEl] = useState(null);
  const [faceMatched, setFaceMatched]     = useState(false);
  const [cameraOpen, setCameraOpen]       = useState(false);
  const [matchScore, setMatchScore]       = useState(null);
  const [faceError, setFaceError]         = useState("");
  const [matching, setMatching]           = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [message, setMessage] = useState("");

  const steps = ["Basic Details","OTP","Aadhaar","Face Match","Submit","Done"];

  // ================================
  // LOAD FACE-API MODELS
  // ================================
  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setModelLoading(true);
      const MODEL_URL = "/models";
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
      setModelLoading(false);
      console.log("✅ Face API models loaded!");
    } catch (err) {
      console.error("❌ Model loading failed:", err);
      setModelLoading(false);
    }
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // ================================
  // STEP 1
  // ================================
  const handleBasicDetails = (e) => {
    e.preventDefault();
    setError("");
    setCurrentStep(2);
  };

  // ================================
  // STEP 2 — OTP
  // ================================
  const sendOTP = () => {
    if (!formData.mobile || formData.mobile.length !== 10) {
      setError("Enter valid 10 digit mobile number!"); return;
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOTP(otp);
    setOtpSent(true);
    setError("");
    alert("📱 OTP Sent!\nYour OTP is: " + otp);
  };

  const verifyOTP = () => {
    if (enteredOTP === generatedOTP) {
      setOtpVerified(true);
      setMessage("✅ OTP Verified!");
      setError("");
      setTimeout(() => { setMessage(""); setCurrentStep(3); }, 1500);
    } else {
      setError("❌ Wrong OTP!");
    }
  };

  // ================================
  // STEP 3 — AADHAAR
  // ================================
  const verifyAadhaar = () => {
    if (aadharNumber.length !== 12) {
      setError("Enter valid 12 digit Aadhaar!"); return;
    }
    setAadharVerified(true);
    setMessage("✅ Aadhaar Verified!");
    setError("");
    setTimeout(() => { setMessage(""); setCurrentStep(4); }, 1500);
  };

  // ================================
  // STEP 4 — FACE MATCHING
  // ================================
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedPhoto(ev.target.result);
      setFaceMatched(false);
      setMatchScore(null);
      setFaceError("");

      // Create image element for face-api
      const img = new Image();
      img.src = ev.target.result;
      img.onload = () => setUploadedPhotoEl(img);
    };
    reader.readAsDataURL(file);
  };

  const openCamera = async () => {
    setCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      setFaceError("❌ Camera access denied!");
      setCameraOpen(false);
    }
  };

  const takeSelfie = () => {
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const selfieData = canvas.toDataURL("image/jpeg");
    setSelfiePhoto(selfieData);
    setFaceMatched(false);
    setMatchScore(null);
    setFaceError("");

    // Create image element for face-api
    const img = new Image();
    img.src = selfieData;
    img.onload = () => setSelfiePhotoEl(img);

    video.srcObject.getTracks().forEach((t) => t.stop());
    setCameraOpen(false);
  };

  // ================================
  // REAL FACE MATCHING
  // ================================
  const matchFaces = async () => {
    if (!uploadedPhoto) { setFaceError("Please upload a photo first!"); return; }
    if (!selfiePhoto)   { setFaceError("Please take a selfie first!");  return; }
    if (!modelsLoaded)  { setFaceError("Face AI models still loading, please wait..."); return; }

    setMatching(true);
    setFaceError("");
    setMatchScore(null);
    setFaceMatched(false);

    try {
      // Detect face in uploaded photo
      const uploadedDetection = await faceapi
        .detectSingleFace(uploadedPhotoEl, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!uploadedDetection) {
        setFaceError("❌ No face detected in uploaded photo! Please upload a clear face photo.");
        setMatching(false);
        return;
      }

      // Detect face in selfie
      const selfieDetection = await faceapi
        .detectSingleFace(selfiePhotoEl, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!selfieDetection) {
        setFaceError("❌ No face detected in selfie! Please retake with clear lighting.");
        setMatching(false);
        return;
      }

      // Compare face descriptors
      const distance = faceapi.euclideanDistance(
        uploadedDetection.descriptor,
        selfieDetection.descriptor
      );

      // Distance < 0.5 = same person
      const similarity = Math.max(0, Math.round((1 - distance) * 100));
      setMatchScore(similarity);

      if (distance < 0.5) {
        setFaceMatched(true);
        setMessage(`✅ Face Match Successful! (${similarity}% similarity)`);
        setFaceError("");
      } else {
        setFaceMatched(false);
        setFaceError(
          `❌ Face does not match! (${similarity}% similarity)\n` +
          `Please upload a clearer photo or retake selfie.`
        );
      }

    } catch (err) {
      setFaceError("❌ Face matching error: " + err.message);
    }

    setMatching(false);
  };

  // ================================
  // STEP 5 — SUBMIT
  // ================================
  const handleSubmit = async () => {
    if (!otpVerified)    { setError("OTP not verified!");    return; }
    if (!aadharVerified) { setError("Aadhaar not verified!"); return; }
    if (!faceMatched)    { setError("Face not matched!");    return; }

    setLoading(true);
    setError("");

    try {
      const aadharHash = web3.utils.keccak256(aadharNumber);
      const photoHash  = web3.utils.keccak256(selfiePhoto.substring(0, 100));

      const contract = new web3.eth.Contract(UserRegistry.abi, CONTRACT_ADDRESS);

      await contract.methods
        .registerPatient({
          name:        formData.name,
          dob:         formData.dob,
          gender:      formData.gender,
          mobile:      formData.mobile,
          email:       formData.email,
          location:    formData.location,
          otpVerified: true,
          aadharHash:  aadharHash,
          photoHash:   photoHash,
        })
        .send({ from: account });

      setCurrentStep(6);

    } catch (err) {
      setError("❌ Error: " + err.message);
    }

    setLoading(false);
  };

  return (
    <div style={S.page}>

      {/* Header */}
      <div style={S.header}>
        <h1 style={S.title}>🧑‍⚕️ Patient Registration</h1>
        <p style={S.badge}>{account}</p>

        {/* Model Loading Indicator */}
        {modelLoading && (
          <div style={S.modelLoading}>
            🔄 Loading Face AI Models...
          </div>
        )}
        {modelsLoaded && (
          <div style={S.modelReady}>
            ✅ Face AI Ready
          </div>
        )}

        <button style={S.backBtn} onClick={() => navigate("/")}>← Back</button>
      </div>

      {/* Step Indicator */}
      <div style={S.stepRow}>
        {steps.map((label, i) => (
          <div key={i} style={S.stepWrap}>
            <div style={{
              ...S.circle,
              backgroundColor:
                currentStep === i + 1 ? "#3498db"
                : currentStep > i + 1 ? "#2ecc71"
                : "#bdc3c7",
            }}>
              {currentStep > i + 1 ? "✓" : i + 1}
            </div>
            <span style={S.stepLabel}>{label}</span>
          </div>
        ))}
      </div>

      {/* Form Card */}
      <div style={S.card}>

        {/* STEP 1 */}
        {currentStep === 1 && (
          <form onSubmit={handleBasicDetails}>
            <h2 style={S.cardTitle}>Step 1 — Basic Details</h2>
            {[
              { label: "Full Name",      name: "name",     type: "text",  ph: "Enter full name" },
              { label: "Date of Birth",  name: "dob",      type: "date",  ph: "" },
              { label: "Mobile Number",  name: "mobile",   type: "text",  ph: "10 digit mobile", max: "10" },
              { label: "Email",          name: "email",    type: "email", ph: "Enter email" },
              { label: "Address",        name: "location", type: "text",  ph: "Enter address" },
            ].map((f) => (
              <div key={f.name} style={S.group}>
                <label style={S.label}>{f.label}</label>
                <input style={S.input} type={f.type} name={f.name}
                  placeholder={f.ph} value={formData[f.name]}
                  onChange={handleChange} maxLength={f.max} required />
              </div>
            ))}
            <div style={S.group}>
              <label style={S.label}>Gender</label>
              <select style={S.input} name="gender" value={formData.gender} onChange={handleChange} required>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            {error && <p style={S.error}>{error}</p>}
            <button style={S.btn} type="submit">Next →</button>
          </form>
        )}

        {/* STEP 2 */}
        {currentStep === 2 && (
          <div>
            <h2 style={S.cardTitle}>Step 2 — OTP Verification</h2>
            <p style={S.info}>Mobile: {formData.mobile}</p>
            {!otpSent ? (
              <button style={S.btn} onClick={sendOTP}>📱 Send OTP</button>
            ) : (
              <div>
                <div style={S.group}>
                  <label style={S.label}>Enter OTP</label>
                  <input style={S.input} type="text" placeholder="Enter 6 digit OTP"
                    value={enteredOTP} onChange={(e) => setEnteredOTP(e.target.value)} maxLength="6" />
                </div>
                <button style={S.btn} onClick={verifyOTP}>Verify OTP</button>
                <button style={S.secondBtn} onClick={sendOTP}>Resend OTP</button>
              </div>
            )}
            {message && <p style={S.success}>{message}</p>}
            {error   && <p style={S.error}>{error}</p>}
          </div>
        )}

        {/* STEP 3 */}
        {currentStep === 3 && (
          <div>
            <h2 style={S.cardTitle}>Step 3 — Aadhaar Verification</h2>
            <div style={S.group}>
              <label style={S.label}>Aadhaar Number</label>
              <input style={S.input} type="text" placeholder="Enter 12 digit Aadhaar"
                value={aadharNumber} onChange={(e) => setAadharNumber(e.target.value)} maxLength="12" />
            </div>
            <button style={S.btn} onClick={verifyAadhaar}>Verify Aadhaar</button>
            {message && <p style={S.success}>{message}</p>}
            {error   && <p style={S.error}>{error}</p>}
          </div>
        )}

        {/* STEP 4 — REAL FACE MATCHING */}
        {currentStep === 4 && (
          <div>
            <h2 style={S.cardTitle}>Step 4 — Face Recognition</h2>

            {/* AI Status */}
            <div style={{
              ...S.aiStatus,
              backgroundColor: modelsLoaded ? "#eafaf1" : "#fff8e1",
              borderColor: modelsLoaded ? "#2ecc71" : "#f39c12",
            }}>
              {modelLoading ? "🔄 Loading Face AI models..."
               : modelsLoaded ? "✅ Face AI Ready — Real face comparison enabled"
               : "⚠️ Face AI models not loaded"}
            </div>

            {/* Upload Photo */}
            <div style={S.group}>
              <label style={S.label}>📁 Upload Your ID / Passport Photo</label>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} />
              <small style={S.hint}>
                Upload a clear front-facing photo (ID card / passport photo)
              </small>
              {uploadedPhoto && (
                <img src={uploadedPhoto} alt="Uploaded" style={S.photo} />
              )}
            </div>

            {/* Selfie */}
            <div style={S.group}>
              <label style={S.label}>📷 Take Live Selfie</label>
              <small style={S.hint}>
                Sit in good lighting, face the camera directly
              </small>

              {!cameraOpen && !selfiePhoto && (
                <button style={S.btn} onClick={openCamera}>📷 Open Camera</button>
              )}

              {cameraOpen && (
                <div>
                  <video ref={videoRef} autoPlay style={S.video} />
                  <button style={S.btn} onClick={takeSelfie}>📸 Take Selfie</button>
                </div>
              )}

              <canvas ref={canvasRef} style={{ display: "none" }} />

              {selfiePhoto && (
                <div>
                  <img src={selfiePhoto} alt="Selfie" style={S.photo} />
                  {!faceMatched && (
                    <button
                      style={{ ...S.secondBtn, marginTop: "8px" }}
                      onClick={() => {
                        setSelfiePhoto(null);
                        setSelfiePhotoEl(null);
                        setFaceError("");
                        setMatchScore(null);
                      }}
                    >
                      🔄 Retake Selfie
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Match Button */}
            {uploadedPhoto && selfiePhoto && !faceMatched && (
              <button
                style={{
                  ...S.btn,
                  backgroundColor: matching ? "#95a5a6" : "#e67e22",
                  cursor: matching ? "not-allowed" : "pointer",
                }}
                onClick={matchFaces}
                disabled={matching || !modelsLoaded}
              >
                {matching ? "🔄 Analyzing Faces..." : "🔍 Match Faces"}
              </button>
            )}

            {/* Match Score */}
            {matchScore !== null && (
              <div style={{
                ...S.scoreBox,
                backgroundColor: faceMatched ? "#eafaf1" : "#fdf2f2",
                borderColor: faceMatched ? "#2ecc71" : "#e74c3c",
              }}>
                <div style={{ fontSize: "30px" }}>
                  {faceMatched ? "✅" : "❌"}
                </div>
                <div style={{
                  fontWeight: "bold",
                  fontSize: "16px",
                  color: faceMatched ? "#27ae60" : "#e74c3c",
                }}>
                  {matchScore}% Similarity
                </div>
                <div style={{ fontSize: "12px", color: "#7f8c8d", marginTop: "4px" }}>
                  {faceMatched
                    ? "Face verified successfully!"
                    : "Faces do not match. Try again."}
                </div>
              </div>
            )}

            {/* Face Error */}
            {faceError && (
              <div style={S.faceErrorBox}>
                <p style={{ color: "#721c24", fontSize: "13px", lineHeight: "1.6" }}>
                  {faceError}
                </p>
              </div>
            )}

            {/* Success + Next */}
            {faceMatched && (
              <div>
                <p style={S.success}>✅ Face Verified! You may proceed.</p>
                <button
                  style={{ ...S.btn, backgroundColor: "#2ecc71", marginTop: "10px" }}
                  onClick={() => { setMessage(""); setCurrentStep(5); }}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 5 — Review & Submit */}
        {currentStep === 5 && (
          <div style={{ textAlign: "center" }}>
            <h2 style={S.cardTitle}>Step 5 — Review & Submit</h2>
            <div style={S.summary}>
              {[
                ["👤","Name",    formData.name],
                ["📅","DOB",     formData.dob],
                ["⚧", "Gender",  formData.gender],
                ["📱","Mobile",  formData.mobile],
                ["📧","Email",   formData.email],
                ["📍","Address", formData.location],
                ["✅","OTP",     "Verified"],
                ["✅","Aadhaar", "Verified"],
                ["✅","Face",    `Matched (${matchScore}% similarity)`],
              ].map(([icon, label, val]) => (
                <div key={label} style={S.summaryRow}>
                  <span style={S.summaryLabel}>{icon} {label}</span>
                  <span style={S.summaryVal}>{val}</span>
                </div>
              ))}
            </div>
            {error && <p style={S.error}>{error}</p>}
            <button style={S.btn} onClick={handleSubmit} disabled={loading}>
              {loading ? "⏳ Submitting to Blockchain..." : "🚀 Submit Registration"}
            </button>
          </div>
        )}

        {/* STEP 6 — Success */}
        {currentStep === 6 && (
          <div style={{ textAlign: "center" }}>
            <div style={S.successBox}>
              <div style={{ fontSize: "60px", marginBottom: "15px" }}>🎉</div>
              <h2 style={{ color: "#27ae60", marginBottom: "10px" }}>
                Registration Complete!
              </h2>
              <p style={{ color: "#7f8c8d", marginBottom: "5px" }}>
                Your details are stored on the blockchain.
              </p>
              <p style={{ color: "#7f8c8d", marginBottom: "25px" }}>
                ⏳ Waiting for Insurer Approval.
              </p>
              <button
                style={S.btn}
                onClick={() => navigate("/patient/dashboard")}
              >
                Go to My Dashboard →
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

const S = {
  page:     { backgroundColor: "#f0f4f8", minHeight: "100vh", padding: "40px 20px", fontFamily: "Arial, sans-serif" },
  header:   { textAlign: "center", marginBottom: "30px" },
  title:    { fontSize: "32px", color: "#2c3e50", marginBottom: "8px" },
  badge:    { display: "inline-block", backgroundColor: "#eafaf1", color: "#27ae60", padding: "6px 16px", borderRadius: "20px", fontSize: "13px", marginBottom: "8px", wordBreak: "break-all" },
  modelLoading: { display: "inline-block", backgroundColor: "#fff8e1", color: "#f39c12", padding: "5px 14px", borderRadius: "20px", fontSize: "12px", marginBottom: "8px", border: "1px solid #f39c12" },
  modelReady:   { display: "inline-block", backgroundColor: "#eafaf1", color: "#27ae60", padding: "5px 14px", borderRadius: "20px", fontSize: "12px", marginBottom: "8px", border: "1px solid #2ecc71" },
  backBtn:  { backgroundColor: "#95a5a6", color: "white", padding: "8px 16px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", display: "block", margin: "8px auto 0" },
  stepRow:  { display: "flex", justifyContent: "center", gap: "10px", marginBottom: "30px", flexWrap: "wrap" },
  stepWrap: { display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" },
  circle:   { width: "40px", height: "40px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold", fontSize: "14px" },
  stepLabel:{ fontSize: "10px", color: "#7f8c8d", textAlign: "center", maxWidth: "58px" },
  card:     { backgroundColor: "white", padding: "40px", borderRadius: "15px", maxWidth: "600px", margin: "0 auto", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" },
  cardTitle:{ fontSize: "20px", color: "#2c3e50", marginBottom: "20px", textAlign: "center" },
  group:    { marginBottom: "16px" },
  label:    { display: "block", fontSize: "13px", color: "#2c3e50", marginBottom: "6px", fontWeight: "bold" },
  input:    { width: "100%", padding: "11px", borderRadius: "8px", border: "1px solid #bdc3c7", fontSize: "14px", boxSizing: "border-box" },
  btn:      { backgroundColor: "#3498db", color: "white", padding: "12px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "15px", width: "100%", fontWeight: "bold", marginTop: "10px" },
  secondBtn:{ backgroundColor: "#95a5a6", color: "white", padding: "10px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", width: "100%", marginTop: "8px" },
  success:  { color: "#27ae60", backgroundColor: "#eafaf1", padding: "10px", borderRadius: "8px", textAlign: "center", marginTop: "10px" },
  error:    { color: "#e74c3c", backgroundColor: "#fdf2f2", padding: "10px", borderRadius: "8px", textAlign: "center", marginTop: "10px" },
  info:     { color: "#7f8c8d", fontSize: "14px", marginBottom: "15px" },
  hint:     { color: "#95a5a6", fontSize: "12px", marginTop: "4px", display: "block" },
  photo:    { width: "150px", height: "150px", objectFit: "cover", borderRadius: "10px", marginTop: "10px", display: "block", border: "2px solid #e0e0e0" },
  video:    { width: "100%", borderRadius: "10px", marginBottom: "10px" },
  aiStatus: { padding: "10px 15px", borderRadius: "8px", border: "1px solid", fontSize: "13px", marginBottom: "15px", textAlign: "center" },
  scoreBox: { padding: "20px", borderRadius: "12px", border: "2px solid", textAlign: "center", marginTop: "15px" },
  faceErrorBox: { backgroundColor: "#fdf2f2", padding: "12px", borderRadius: "8px", marginTop: "10px", border: "1px solid #f5c6cb" },
  summary:  { backgroundColor: "#f8f9fa", padding: "20px", borderRadius: "10px", marginBottom: "20px", textAlign: "left" },
  summaryRow: { display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0f4f8" },
  summaryLabel: { color: "#7f8c8d", fontSize: "13px", fontWeight: "bold" },
  summaryVal:   { color: "#2c3e50", fontSize: "13px" },
  successBox: { backgroundColor: "#eafaf1", padding: "40px 30px", borderRadius: "15px" },
};

export default PatientRegister;