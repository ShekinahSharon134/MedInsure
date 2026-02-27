import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Web3 from "web3";

// Insurer Pages
import InsurerDashboard    from "./components/Insurer/InsurerDashboard";
import RegisterHospital    from "./components/Insurer/RegisterHospital";
import ApprovePatient      from "./components/Insurer/ApprovePatient";
import CreatePolicy        from "./components/Insurer/CreatePolicy";
import ViewSubscriptions   from "./components/Insurer/ViewSubscriptions";

// Patient Pages
import PatientDashboard    from "./components/Patient/PatientDashboard";
import PatientRegister     from "./components/Patient/PatientRegister";
import SubscribePolicy     from "./components/Patient/SubscribePolicy";

// Hospital Pages
import HospitalDashboard   from "./components/Hospital/HospitalDashboard";

// Home
import Home                from "./components/Home";

// Contracts
import UserRegistry        from "./contracts/UserRegistry.json";
import HospitalRegistry    from "./contracts/HospitalRegistry.json";

// ================================
// CONTRACT ADDRESSES
// ================================
const USER_REGISTRY_ADDRESS     = "0xe8bF5993C4162Eda2dcb92d5488a9f978B6805Bd";
const HOSPITAL_REGISTRY_ADDRESS = "0xA39cE24807ae652039E1D7c88f0A23D71cDB4A81";

// ================================
// INSURER WALLET (Account 1)
// ================================
const INSURER_ADDRESS = "0x7aeb3B8Be43D2fCB48216B08ce8115252968A99E"; // ← PASTE YOUR GANACHE ACCOUNT[0] ADDRESS HERE

function App() {
  const [web3, setWeb3]       = useState(null);
  const [account, setAccount] = useState(null);
  const [role, setRole]       = useState(null); // "insurer" | "patient" | "hospital" | null
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initWeb3();
  }, []);

  // ================================
  // INIT WEB3 + DETECT ROLE
  // ================================
  const initWeb3 = async () => {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask!");
        setLoading(false);
        return;
      }

      const w3 = new Web3(window.ethereum);
      await window.ethereum.request({ method: "eth_requestAccounts" });

      const accounts = await w3.eth.getAccounts();
      const current  = accounts[0];

      setWeb3(w3);
      setAccount(current);

      // Detect role
      const detectedRole = await detectRole(w3, current);
      setRole(detectedRole);

      setLoading(false);

      // Listen for account changes
      window.ethereum.on("accountsChanged", async (newAccounts) => {
        const newAccount = newAccounts[0];
        setAccount(newAccount);
        setRole(null);
        setLoading(true);
        const newRole = await detectRole(w3, newAccount);
        setRole(newRole);
        setLoading(false);
      });

    } catch (err) {
      console.error("Web3 init error:", err);
      setLoading(false);
    }
  };

  // ================================
  // DETECT ROLE FROM BLOCKCHAIN
  // ================================
  const detectRole = async (w3, currentAccount) => {
    try {
      // Check if Insurer
      if (
        INSURER_ADDRESS &&
        currentAccount.toLowerCase() === INSURER_ADDRESS.toLowerCase()
      ) {
        return "insurer";
      }

      // Check if Hospital
      const hospitalContract = new w3.eth.Contract(
        HospitalRegistry.abi,
        HOSPITAL_REGISTRY_ADDRESS
      );
      const isHospital = await hospitalContract.methods
        .checkHospital(currentAccount)
        .call();

      if (isHospital) return "hospital";

      // Check if Patient (registered or not — still patient role)
      const userContract = new w3.eth.Contract(
        UserRegistry.abi,
        USER_REGISTRY_ADDRESS
      );
      const isPatient = await userContract.methods
        .checkPatientRegistered(currentAccount)
        .call();

      if (isPatient) return "patient";

      // Default → Patient (new user)
      return "patient";

    } catch (err) {
      console.error("Role detection error:", err);
      return "patient";
    }
  };

  // ================================
  // LOADING SCREEN
  // ================================
  if (loading) {
    return (
      <div style={loadingStyle}>
        <div style={{ fontSize: "50px", marginBottom: "20px" }}>🏥</div>
        <h2 style={{ color: "#fff", marginBottom: "10px" }}>MedInsure</h2>
        <p style={{ color: "#aaa" }}>Connecting to blockchain...</p>
        <div style={spinner} />
      </div>
    );
  }

  // ================================
  // ROUTES
  // ================================
  return (
    <Router>
      <Routes>

        {/* HOME */}
        <Route
          path="/"
          element={<Home account={account} web3={web3} role={role} />}
        />

        {/* ── INSURER ROUTES ── */}
        <Route
          path="/insurer"
          element={
            role === "insurer"
              ? <InsurerDashboard account={account} web3={web3} />
              : <Navigate to="/" />
          }
        />
        <Route
          path="/insurer/register-hospital"
          element={
            role === "insurer"
              ? <RegisterHospital account={account} web3={web3} />
              : <Navigate to="/" />
          }
        />
        <Route
          path="/insurer/approve-patient"
          element={
            role === "insurer"
              ? <ApprovePatient account={account} web3={web3} />
              : <Navigate to="/" />
          }
        />
        <Route
          path="/insurer/create-policy"
          element={
            role === "insurer"
              ? <CreatePolicy account={account} web3={web3} />
              : <Navigate to="/" />
          }
        />
        <Route
          path="/insurer/subscriptions"
          element={
            role === "insurer"
              ? <ViewSubscriptions account={account} web3={web3} />
              : <Navigate to="/" />
          }
        />

        {/* ── PATIENT ROUTES ── */}
        <Route
          path="/patient/dashboard"
          element={
            role === "patient"
              ? <PatientDashboard account={account} web3={web3} />
              : <Navigate to="/" />
          }
        />
        <Route
          path="/patient/register"
          element={
            role === "patient"
              ? <PatientRegister account={account} web3={web3} />
              : <Navigate to="/" />
          }
        />
        <Route
          path="/patient/subscribe-policy"
          element={
            role === "patient"
              ? <SubscribePolicy account={account} web3={web3} />
              : <Navigate to="/" />
          }
        />

        {/* ── HOSPITAL ROUTES ── */}
        <Route
          path="/hospital/dashboard"
          element={
            role === "hospital"
              ? <HospitalDashboard account={account} web3={web3} />
              : <Navigate to="/" />
          }
        />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </Router>
  );
}

const loadingStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "100vh",
  backgroundColor: "#060d1f",
  fontFamily: "Arial, sans-serif",
};

const spinner = {
  width: "40px",
  height: "40px",
  border: "3px solid rgba(255,255,255,0.1)",
  borderTop: "3px solid #00c9ff",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
  marginTop: "20px",
};

export default App;