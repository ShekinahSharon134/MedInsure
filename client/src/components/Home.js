import React from "react";
import { useNavigate } from "react-router-dom";

function Home({ account, role }) {
  const navigate = useNavigate();

  const handleLogin = (requestedRole) => {
    if (role === requestedRole) {
      if (requestedRole === "insurer")  navigate("/insurer");
      if (requestedRole === "hospital") navigate("/hospital/dashboard");
      if (requestedRole === "patient")  navigate("/patient/dashboard");
    } else {
      alert(`Please switch MetaMask to your ${requestedRole} account first!`);
    }
  };

  const cards = [
    {
      icon: "I",
      title: "Insurer Portal",
      role: "insurer",
      description: "Comprehensive insurance management system for policy administration, hospital network management, and claims processing",
      buttonText: "Access Insurer Portal",
      features: ["Hospital Network Management", "Policy Administration", "Claims Processing & Settlement"],
    },
    {
      icon: "P",
      title: "Patient Portal",
      role: "patient",
      description: "Complete health insurance services including policy purchase, premium payments, and claim status tracking",
      buttonText: "Access Patient Portal",
      features: ["Policy Purchase & Renewal", "Premium Payment", "Claim Status & History"],
    },
    {
      icon: "H",
      title: "Hospital Portal",
      role: "hospital",
      description: "Streamlined claim submission and patient eligibility verification for network hospitals",
      buttonText: "Access Hospital Portal",
      features: ["Patient Eligibility Check", "Cashless Claim Submission", "Claim Status Tracking"],
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Poppins:wght@600;700;800&display=swap');
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body { font-family: 'Inter', sans-serif; }

        .prof-home {
          min-height: 100vh;
          background: linear-gradient(135deg, #F8FAFB 0%, #E8EDF2 100%);
        }

        /* HEADER */
        .prof-header {
          background: #FFFFFF;
          border-bottom: 1px solid #E8EDF2;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .prof-header-content {
          max-width: 1280px;
          margin: 0 auto;
          padding: 1.25rem 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .prof-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .prof-logo-icon {
          width: 42px;
          height: 42px;
          background: linear-gradient(135deg, #0052CC, #0065FF);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 800;
          color: #FFFFFF;
          box-shadow: 0 4px 12px rgba(0, 82, 204, 0.2);
        }

        .prof-logo-text {
          font-family: 'Poppins', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: #1A202C;
          letter-spacing: -0.02em;
        }

        .prof-logo-text span {
          color: #0052CC;
        }

        .prof-wallet-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #E1F5FE;
          color: #0288D1;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          font-family: 'Inter', monospace;
        }

        .prof-wallet-icon {
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

        /* HERO SECTION */
        .prof-hero {
          max-width: 1280px;
          margin: 0 auto;
          padding: 4rem 2rem 3rem;
          text-align: center;
        }

        .prof-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #E1F5FE;
          color: #0288D1;
          padding: 0.5rem 1.25rem;
          border-radius: 50px;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .prof-hero h1 {
          font-family: 'Poppins', sans-serif;
          font-size: clamp(2.5rem, 5vw, 3.5rem);
          font-weight: 800;
          color: #1A202C;
          line-height: 1.2;
          margin-bottom: 1rem;
          letter-spacing: -0.02em;
        }

        .prof-hero h1 span {
          color: #0052CC;
        }

        .prof-hero-subtitle {
          font-size: 1.25rem;
          color: #4A5568;
          max-width: 700px;
          margin: 0 auto 2rem;
          line-height: 1.6;
        }

        /* ROLE STATUS */
        .prof-role-status {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          background: #FFFFFF;
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          margin-bottom: 1rem;
        }

        .prof-role-status.insurer {
          border-left: 4px solid #0052CC;
        }

        .prof-role-status.hospital {
          border-left: 4px solid #00B8D4;
        }

        .prof-role-status.patient {
          border-left: 4px solid #00C853;
        }

        .prof-role-status.unknown {
          border-left: 4px solid #FFA000;
        }

        .prof-role-icon {
          font-size: 1.5rem;
        }

        .prof-role-text {
          font-weight: 600;
          color: #1A202C;
        }

        /* FEATURES */
        .prof-features {
          display: flex;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 3rem;
        }

        .prof-feature-chip {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #FFFFFF;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.875rem;
          color: #4A5568;
          font-weight: 500;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
        }

        .prof-feature-icon {
          font-size: 1rem;
        }

        /* CARDS SECTION */
        .prof-cards-section {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 2rem 4rem;
        }

        .prof-section-title {
          text-align: center;
          font-family: 'Poppins', sans-serif;
          font-size: 2rem;
          font-weight: 700;
          color: #1A202C;
          margin-bottom: 0.5rem;
        }

        .prof-section-subtitle {
          text-align: center;
          color: #4A5568;
          margin-bottom: 3rem;
        }

        .prof-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 2rem;
        }

        .prof-card {
          background: #FFFFFF;
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
          border: 2px solid transparent;
          cursor: pointer;
        }

        .prof-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 82, 204, 0.15);
          border-color: #0052CC;
        }

        .prof-card.active {
          border-color: #0052CC;
          box-shadow: 0 8px 20px rgba(0, 82, 204, 0.2);
        }

        .prof-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }

        .prof-card-icon {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #E1F5FE, #B3E5FC);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: 800;
          color: #0052CC;
        }

        .prof-card.active .prof-card-icon {
          background: linear-gradient(135deg, #0052CC, #0065FF);
          color: #FFFFFF;
        }

        .prof-card-badge {
          background: #E8F5E9;
          color: #00C853;
          padding: 0.25rem 0.75rem;
          border-radius: 50px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .prof-card-title {
          font-family: 'Poppins', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: #1A202C;
          margin-bottom: 0.75rem;
        }

        .prof-card-description {
          color: #4A5568;
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }

        .prof-card-features {
          margin-bottom: 1.5rem;
        }

        .prof-card-feature {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #4A5568;
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
        }

        .prof-card-feature::before {
          content: "";
          color: #00C853;
          font-weight: 700;
        }

        .prof-card-button {
          width: 100%;
          background: linear-gradient(135deg, #0052CC, #0065FF);
          color: #FFFFFF;
          padding: 0.875rem 1.5rem;
          border: none;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Inter', sans-serif;
        }

        .prof-card-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 82, 204, 0.3);
        }

        .prof-card-button:disabled {
          background: #E8EDF2;
          color: #8B9DAF;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .prof-card-hint {
          text-align: center;
          color: #8B9DAF;
          font-size: 0.75rem;
          margin-top: 0.75rem;
        }

        /* FOOTER */
        .prof-footer {
          background: #1A202C;
          color: #8B9DAF;
          padding: 2rem;
          text-align: center;
        }

        .prof-footer-content {
          max-width: 1280px;
          margin: 0 auto;
        }

        .prof-footer-text {
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
        }

        .prof-footer-tech {
          display: flex;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
          font-size: 0.75rem;
        }

        .prof-footer-tech span {
          color: #4A5568;
        }

        @media (max-width: 768px) {
          .prof-header-content {
            padding: 1rem;
          }
          
          .prof-hero {
            padding: 3rem 1.5rem 2rem;
          }
          
          .prof-cards-section {
            padding: 0 1.5rem 3rem;
          }
          
          .prof-wallet-badge {
            display: none;
          }
        }
      `}</style>

      <div className="prof-home">
        {/* HEADER */}
        <header className="prof-header">
          <div className="prof-header-content">
            <div className="prof-logo">
              <div className="prof-logo-icon">M</div>
              <div className="prof-logo-text">
                Med<span>Insure</span>
              </div>
            </div>
            {account && (
              <div className="prof-wallet-badge">
                <div className="prof-wallet-icon"></div>
                {account.slice(0, 6)}...{account.slice(-4)}
              </div>
            )}
          </div>
        </header>

        {/* HERO */}
        <section className="prof-hero">
          <div className="prof-badge">
            BLOCKCHAIN-POWERED INSURANCE PLATFORM
          </div>
          
          <h1>
            Comprehensive Health Insurance<br />
            <span>For Your Peace of Mind</span>
          </h1>
          
          <p className="prof-hero-subtitle">
            Trusted by thousands of families across India. Experience transparent claim processing, 
            instant policy verification, and secure blockchain-based medical records management.
          </p>

          {role && role !== "unknown" && (
            <div className={`prof-role-status ${role}`}>
              <span className="prof-role-text">
                {role === "insurer" && "Insurer Account Connected"}
                {role === "hospital" && "Hospital Account Connected"}
                {role === "patient" && "Patient Account Connected"}
              </span>
            </div>
          )}

          <div className="prof-features">
            <div className="prof-feature-chip">
              <span className="prof-feature-icon"></span>
              Cashless Claims
            </div>
            <div className="prof-feature-chip">
              <span className="prof-feature-icon"></span>
              24/7 Support
            </div>
            <div className="prof-feature-chip">
              <span className="prof-feature-icon"></span>
              Network Hospitals
            </div>
            <div className="prof-feature-chip">
              <span className="prof-feature-icon"></span>
              Instant Verification
            </div>
            <div className="prof-feature-chip">
              <span className="prof-feature-icon"></span>
              Secure & Transparent
            </div>
          </div>
        </section>

        {/* CARDS */}
        <section className="prof-cards-section">
          <h2 className="prof-section-title">Choose Your Portal</h2>
          <p className="prof-section-subtitle">
            Select the appropriate portal based on your role in the insurance ecosystem
          </p>

          <div className="prof-cards">
            {cards.map((card, i) => {
              const isMyRole = role === card.role;
              const isDisabled = role !== "unknown" && !isMyRole;
              
              return (
                <div
                  key={i}
                  className={`prof-card ${isMyRole ? "active" : ""}`}
                  onClick={() => !isDisabled && handleLogin(card.role)}
                >
                  <div className="prof-card-header">
                    <div className="prof-card-icon">{card.icon}</div>
                    {isMyRole && (
                      <div className="prof-card-badge">Your Role</div>
                    )}
                  </div>

                  <h3 className="prof-card-title">{card.title}</h3>
                  <p className="prof-card-description">{card.description}</p>

                  <div className="prof-card-features">
                    {card.features.map((feature, idx) => (
                      <div key={idx} className="prof-card-feature">
                        {feature}
                      </div>
                    ))}
                  </div>

                  <button
                    className="prof-card-button"
                    disabled={isDisabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLogin(card.role);
                    }}
                  >
                    {card.buttonText}
                  </button>

                  {isDisabled && (
                    <p className="prof-card-hint">
                      Switch to {card.role} account in MetaMask
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="prof-footer">
          <div className="prof-footer-content">
            <p className="prof-footer-text">
              © 2026 MedInsure. Blockchain-powered health insurance platform.
            </p>
            <div className="prof-footer-tech">
              <span>Ethereum</span>
              <span>•</span>
              <span>Solidity</span>
              <span>•</span>
              <span>React</span>
              <span>•</span>
              <span>IPFS</span>
              <span>•</span>
              <span>MetaMask</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

export default Home;
