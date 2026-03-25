import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import HospitalRegistry from "../../contracts/HospitalRegistry.json";

const CONTRACT_ADDRESS = "0xb100A10Adf98776d8483CaD03C4C628221F7187b";

function HospitalDashboard({ account, web3 }) {
  const navigate = useNavigate();
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notRegistered, setNotRegistered] = useState(false);

  useEffect(() => {
    if (web3 && account) loadHospitalData();
  }, [web3, account]);

  const loadHospitalData = async () => {
    try {
      setLoading(true);
      const contract = new web3.eth.Contract(HospitalRegistry.abi, CONTRACT_ADDRESS);
      const isRegistered = await contract.methods.checkHospital(account).call();

      if (!isRegistered) {
        setNotRegistered(true);
        setLoading(false);
        return;
      }

      const hospitalData = await contract.methods.getHospital(account).call();
      setHospital(hospitalData);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ fontSize: "2rem", fontWeight: "800", color: "#0052CC", marginBottom: "1rem" }}>Loading</div>
        <h2>Loading hospital details...</h2>
      </div>
    );
  }

  if (notRegistered) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@600;700;800&display=swap');
        `}</style>
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F8FAFB 0%, #E8EDF2 100%)', fontFamily: 'Inter, sans-serif', padding: '2rem' }}>
          <div style={{ maxWidth: '600px', margin: '0 auto', background: '#FFFFFF', borderRadius: '16px', padding: '3rem', textAlign: 'center', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)' }}>
            <div style={{ fontSize: "3rem", marginBottom: '1rem', fontWeight: "800", color: "#E53E3E" }}>!</div>
            <h2 style={{ color: "#E53E3E", marginBottom: "1rem", fontFamily: 'Poppins, sans-serif' }}>
              Not Registered
            </h2>
            <p style={{ color: "#4A5568", marginBottom: "1rem", lineHeight: '1.6' }}>
              Your hospital is not registered in the MedInsure network.
            </p>
            <p style={{ color: "#8B9DAF", fontSize: '0.875rem' }}>
              Please contact the insurer to register your hospital and start processing claims.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@600;700;800&display=swap');
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        .hospital-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #F8FAFB 0%, #E8EDF2 100%);
          font-family: 'Inter', sans-serif;
        }

        /* HEADER */
        .hospital-header {
          background: #FFFFFF;
          border-bottom: 1px solid #E8EDF2;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .hospital-header-content {
          max-width: 1280px;
          margin: 0 auto;
          padding: 1.25rem 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .hospital-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
        }

        .hospital-logo-icon {
          width: 42px;
          height: 42px;
          background: linear-gradient(135deg, #0052CC, #0065FF);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          box-shadow: 0 4px 12px rgba(0, 82, 204, 0.2);
        }

        .hospital-logo-text {
          font-family: 'Poppins', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: #1A202C;
          letter-spacing: -0.02em;
        }

        .hospital-logo-text span {
          color: #0052CC;
        }

        .hospital-header-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .hospital-role-badge {
          background: #E1F5FE;
          color: #0288D1;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .hospital-wallet-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #E8F5E9;
          color: #00C853;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          font-family: 'Inter', monospace;
        }

        .hospital-wallet-icon {
          width: 8px;
          height: 8px;
          background: #00C853;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* HERO */
        .hospital-hero {
          max-width: 1280px;
          margin: 0 auto;
          padding: 3rem 2rem 2rem;
          text-align: center;
        }

        .hospital-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: ${hospital.status === "Active" ? "#E8F5E9" : "#FFEBEE"};
          color: ${hospital.status === "Active" ? "#00C853" : "#E53E3E"};
          padding: 0.5rem 1.25rem;
          border-radius: 50px;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .hospital-hero h1 {
          font-family: 'Poppins', sans-serif;
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 800;
          color: #1A202C;
          line-height: 1.2;
          margin-bottom: 0.5rem;
          letter-spacing: -0.02em;
        }

        .hospital-hero-subtitle {
          font-size: 1.125rem;
          color: #4A5568;
          margin-bottom: 2rem;
        }

        /* CONTENT */
        .hospital-content {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 2rem 4rem;
        }

        .hospital-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .hospital-card {
          background: #FFFFFF;
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .hospital-card-title {
          font-family: 'Poppins', sans-serif;
          font-size: 1.25rem;
          font-weight: 700;
          color: #1A202C;
          margin-bottom: 1.5rem;
          padding-bottom: 0.75rem;
          border-bottom: 2px solid #E8EDF2;
        }

        .hospital-info-row {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem 0;
          border-bottom: 1px solid #F8FAFB;
        }

        .hospital-info-label {
          color: #8B9DAF;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .hospital-info-value {
          color: #1A202C;
          font-size: 0.875rem;
          font-weight: 500;
          text-align: right;
          max-width: 60%;
          word-break: break-word;
        }

        .hospital-actions {
          background: linear-gradient(135deg, #E1F5FE, #B3E5FC);
          border-radius: 12px;
          padding: 2rem;
          margin-top: 1.5rem;
        }

        .hospital-actions-title {
          font-size: 1rem;
          font-weight: 700;
          color: #0288D1;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .hospital-actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .hospital-action-btn {
          background: linear-gradient(135deg, #0052CC, #0065FF);
          color: #FFFFFF;
          padding: 1rem 1.5rem;
          border: none;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Inter', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .hospital-action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 82, 204, 0.3);
        }

        .hospital-action-btn.secondary {
          background: linear-gradient(135deg, #9C27B0, #BA68C8);
        }

        .hospital-refresh-btn {
          background: #F8FAFB;
          color: #4A5568;
          padding: 0.625rem 1.25rem;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0 auto;
        }

        .hospital-refresh-btn:hover {
          background: #E8EDF2;
        }

        /* FOOTER */
        .hospital-footer {
          background: #1A202C;
          color: #8B9DAF;
          padding: 2rem;
          text-align: center;
        }

        .hospital-footer-text {
          font-size: 0.875rem;
        }

        @media (max-width: 768px) {
          .hospital-header-content {
            padding: 1rem;
          }
          
          .hospital-hero {
            padding: 2rem 1.5rem 1.5rem;
          }
          
          .hospital-content {
            padding: 0 1.5rem 3rem;
          }
          
          .hospital-wallet-badge {
            display: none;
          }
        }
      `}</style>

      <div className="hospital-page">
        {/* HEADER */}
        <header className="hospital-header">
          <div className="hospital-header-content">
            <div className="hospital-logo" onClick={() => navigate("/")}>
              <div className="hospital-logo-icon">M</div>
              <div className="hospital-logo-text">
                Med<span>Insure</span>
              </div>
            </div>
            <div className="hospital-header-right">
              <div className="hospital-role-badge">Hospital</div>
              {account && (
                <div className="hospital-wallet-badge">
                  <div className="hospital-wallet-icon"></div>
                  {account.slice(0, 6)}...{account.slice(-4)}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* HERO */}
        <section className="hospital-hero">
          <div className="hospital-badge">
            <span>{hospital.status === "Active" ? "✓" : "✕"}</span>
            Hospital Status: {hospital.status}
          </div>
          
          <h1>{hospital.name}</h1>
          <p className="hospital-hero-subtitle">
            {hospital.city}, {hospital.state}
          </p>

          <button className="hospital-refresh-btn" onClick={loadHospitalData}>
            Refresh Data
          </button>
        </section>

        {/* CONTENT */}
        <section className="hospital-content">
          <div className="hospital-grid">
            {/* Hospital Details */}
            <div className="hospital-card">
              <h2 className="hospital-card-title">Hospital Information</h2>
              
              <div className="hospital-info-row">
                <span className="hospital-info-label">Hospital ID</span>
                <span className="hospital-info-value">#{hospital.hospitalId.toString()}</span>
              </div>
              <div className="hospital-info-row">
                <span className="hospital-info-label">Hospital Name</span>
                <span className="hospital-info-value">{hospital.name}</span>
              </div>
              <div className="hospital-info-row">
                <span className="hospital-info-label">Address</span>
                <span className="hospital-info-value">{hospital.location}</span>
              </div>
              <div className="hospital-info-row">
                <span className="hospital-info-label">City</span>
                <span className="hospital-info-value">{hospital.city}</span>
              </div>
              <div className="hospital-info-row">
                <span className="hospital-info-label">State</span>
                <span className="hospital-info-value">{hospital.state}</span>
              </div>
              <div className="hospital-info-row">
                <span className="hospital-info-label">Pincode</span>
                <span className="hospital-info-value">{hospital.pincode}</span>
              </div>
              <div className="hospital-info-row">
                <span className="hospital-info-label">License Number</span>
                <span className="hospital-info-value">{hospital.licenseNumber}</span>
              </div>
              <div className="hospital-info-row">
                <span className="hospital-info-label">Status</span>
                <span className="hospital-info-value">{hospital.status}</span>
              </div>
              <div className="hospital-info-row">
                <span className="hospital-info-label">Registered On</span>
                <span className="hospital-info-value">
                  {new Date(Number(hospital.timestamp) * 1000).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Blockchain Details */}
            <div className="hospital-card">
              <h2 className="hospital-card-title">Blockchain Integration</h2>
              
              <div className="hospital-info-row">
                <span className="hospital-info-label">Wallet Address</span>
                <span className="hospital-info-value">{hospital.walletAddress}</span>
              </div>

              <div style={{ background: '#F8FAFB', borderRadius: '12px', padding: '1.5rem', marginTop: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: "2rem", marginBottom: "1rem", fontWeight: "800", color: "#0052CC" }}>Network Hospital</div>
                <p style={{ color: "#4A5568", fontSize: "0.875rem", lineHeight: "1.6" }}>
                  Your hospital is registered in the MedInsure network. All patient claims are processed through blockchain technology ensuring transparency and security.
                </p>
              </div>

              <div className="hospital-actions">
                <div className="hospital-actions-title">
                  Quick Actions
                </div>
                <div className="hospital-actions-grid">
                  <button
                    className="hospital-action-btn"
                    onClick={() => navigate("/hospital/check-eligibility")}
                  >
                    Check Eligibility
                  </button>
                  <button
                    className="hospital-action-btn"
                    onClick={() => navigate("/hospital/submit-claim")}
                  >
                    Submit Claim
                  </button>
                  <button
                    className="hospital-action-btn secondary"
                    onClick={() => navigate("/hospital/view-claims")}
                  >
                    View Claims
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="hospital-footer">
          <p className="hospital-footer-text">
            © 2026 MedInsure. Blockchain-powered health insurance platform.
          </p>
        </footer>
      </div>
    </>
  );
}

export default HospitalDashboard;
