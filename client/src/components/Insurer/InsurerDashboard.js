import React from "react";
import { useNavigate } from "react-router-dom";

function InsurerDashboard({ account, web3 }) {
  const navigate = useNavigate();

  const cards = [
    {
      icon: "H",
      title: "Hospital Management",
      description: "Register and manage network hospitals. Monitor hospital performance and maintain quality standards",
      buttonText: "Manage Hospitals",
      route: "/insurer/register-hospital",
      color: "#1D4ED8",
    },
    {
      icon: "P",
      title: "Patient Approval",
      description: "Review KYC submissions and approve patient registrations. Verify identity documents and medical history",
      buttonText: "Approve Patients",
      route: "/insurer/approve-patient",
      color: "#1D4ED8",
    },
    {
      icon: "PL",
      title: "Policy Management",
      description: "Create new insurance plans with customized coverage, deductibles, and copay percentages",
      buttonText: "Manage Policies",
      route: "/insurer/create-policy",
      color: "#1D4ED8",
    },
    {
      icon: "C",
      title: "Claims Management",
      description: "Review, approve or reject insurance claims. Process settlements and manage claim documentation",
      buttonText: "View Claims",
      route: "/insurer/view-claims",
      color: "#1D4ED8",
    },
    {
      icon: "S",
      title: "Subscriptions",
      description: "View all active policy subscriptions, premium payment status, and renewal tracking",
      buttonText: "View Subscriptions",
      route: "/insurer/subscriptions",
      color: "#1D4ED8",
    },
    {
      icon: "FR",
      title: "Fund Reserve Dashboard",
      description: "ML-predicted monthly reserve allocations stored on-chain. View IBNR, RBNS, risk buffers and weekly early warning alerts",
      buttonText: "View Fund Reserves",
      route: "/insurer/fund-reserve",
      color: "#1D4ED8",
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@600;700;800&display=swap');
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        .insurer-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #F8FAFB 0%, #E8EDF2 100%);
          font-family: 'Inter', sans-serif;
        }

        /* HEADER */
        .insurer-header {
          background: #FFFFFF;
          border-bottom: 1px solid #E8EDF2;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .insurer-header-content {
          max-width: 1280px;
          margin: 0 auto;
          padding: 1.25rem 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .insurer-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
        }

        .insurer-logo-icon {
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

        .insurer-logo-text {
          font-family: 'Poppins', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: #1A202C;
          letter-spacing: -0.02em;
        }

        .insurer-logo-text span {
          color: #0052CC;
        }

        .insurer-header-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .insurer-role-badge {
          background: #E1F5FE;
          color: #0288D1;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .insurer-wallet-badge {
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

        .insurer-wallet-icon {
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
        .insurer-hero {
          max-width: 1280px;
          margin: 0 auto;
          padding: 4rem 2rem 3rem;
          text-align: center;
        }

        .insurer-badge {
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

        .insurer-hero h1 {
          font-family: 'Poppins', sans-serif;
          font-size: clamp(2.5rem, 5vw, 3.5rem);
          font-weight: 800;
          color: #1A202C;
          line-height: 1.2;
          margin-bottom: 1rem;
          letter-spacing: -0.02em;
        }

        .insurer-hero h1 span {
          color: #0052CC;
        }

        .insurer-hero-subtitle {
          font-size: 1.25rem;
          color: #4A5568;
          max-width: 700px;
          margin: 0 auto 2rem;
          line-height: 1.6;
        }

        /* STATS */
        .insurer-stats {
          display: flex;
          justify-content: center;
          gap: 2rem;
          flex-wrap: wrap;
          margin-bottom: 3rem;
        }

        .insurer-stat {
          background: #FFFFFF;
          padding: 1.5rem 2rem;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          text-align: center;
          min-width: 150px;
        }

        .insurer-stat-value {
          font-size: 2rem;
          font-weight: 800;
          color: #0052CC;
          margin-bottom: 0.25rem;
        }

        .insurer-stat-label {
          font-size: 0.875rem;
          color: #8B9DAF;
          font-weight: 500;
        }

        /* CARDS */
        .insurer-cards-section {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 2rem 4rem;
        }

        .insurer-section-title {
          text-align: center;
          font-family: 'Poppins', sans-serif;
          font-size: 2rem;
          font-weight: 700;
          color: #1A202C;
          margin-bottom: 0.5rem;
        }

        .insurer-section-subtitle {
          text-align: center;
          color: #4A5568;
          margin-bottom: 3rem;
        }

        .insurer-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 2rem;
        }

        .insurer-card {
          background: #FFFFFF;
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
          border: 2px solid transparent;
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }

        .insurer-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, var(--card-color), var(--card-color));
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .insurer-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 82, 204, 0.15);
          border-color: var(--card-color);
        }

        .insurer-card:hover::before {
          opacity: 1;
        }

        .insurer-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }

        .insurer-card-icon {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #E1F5FE, #B3E5FC);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 800;
          color: #0052CC;
        }

        .insurer-card-arrow {
          width: 32px;
          height: 32px;
          background: #F8FAFB;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          color: #8B9DAF;
          transition: all 0.2s;
        }

        .insurer-card:hover .insurer-card-arrow {
          background: var(--card-color);
          color: #FFFFFF;
          transform: translate(2px, -2px);
        }

        .insurer-card-title {
          font-family: 'Poppins', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: #1A202C;
          margin-bottom: 0.75rem;
        }

        .insurer-card-description {
          color: #4A5568;
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }

        .insurer-card-button {
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

        .insurer-card-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 82, 204, 0.3);
        }

        /* FOOTER */
        .insurer-footer {
          background: #1A202C;
          color: #8B9DAF;
          padding: 2rem;
          text-align: center;
        }

        .insurer-footer-content {
          max-width: 1280px;
          margin: 0 auto;
        }

        .insurer-footer-text {
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
        }

        .insurer-footer-tech {
          display: flex;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
          font-size: 0.75rem;
        }

        .insurer-footer-tech span {
          color: #4A5568;
        }

        @media (max-width: 768px) {
          .insurer-header-content {
            padding: 1rem;
          }
          
          .insurer-hero {
            padding: 3rem 1.5rem 2rem;
          }
          
          .insurer-cards-section {
            padding: 0 1.5rem 3rem;
          }
          
          .insurer-wallet-badge {
            display: none;
          }
        }
      `}</style>

      <div className="insurer-page">
        {/* HEADER */}
        <header className="insurer-header">
          <div className="insurer-header-content">
            <div className="insurer-logo" onClick={() => navigate("/")}>
              <div className="insurer-logo-icon">M</div>
              <div className="insurer-logo-text">
                Med<span>Insure</span>
              </div>
            </div>
            <div className="insurer-header-right">
              <div className="insurer-role-badge">Insurer</div>
              {account && (
                <div className="insurer-wallet-badge">
                  <div className="insurer-wallet-icon"></div>
                  {account.slice(0, 6)}...{account.slice(-4)}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* HERO */}
        <section className="insurer-hero">
          <div className="insurer-badge">
            INSURER CONTROL PANEL
          </div>
          
          <h1>
            Insurance Network<br />
            <span>Management System</span>
          </h1>
          
          <p className="insurer-hero-subtitle">
            Comprehensive insurance administration platform. Manage network hospitals, process patient registrations, 
            create customized policies, and handle claim settlements efficiently.
          </p>

          <div className="insurer-stats">
            <div className="insurer-stat">
              <div className="insurer-stat-value">5</div>
              <div className="insurer-stat-label">Management Tools</div>
            </div>
            <div className="insurer-stat">
              <div className="insurer-stat-value">100%</div>
              <div className="insurer-stat-label">Blockchain Verified</div>
            </div>
            <div className="insurer-stat">
              <div className="insurer-stat-value">24/7</div>
              <div className="insurer-stat-label">System Availability</div>
            </div>
          </div>
        </section>

        {/* CARDS */}
        <section className="insurer-cards-section">
          <h2 className="insurer-section-title">Management Dashboard</h2>
          <p className="insurer-section-subtitle">
            Access all insurance management tools from one central location
          </p>

          <div className="insurer-cards">
            {cards.map((card, i) => (
              <div
                key={i}
                className="insurer-card"
                style={{ '--card-color': card.color }}
                onClick={() => navigate(card.route)}
              >
                <div className="insurer-card-header">
                  <div className="insurer-card-icon">{card.icon}</div>
                  <div className="insurer-card-arrow">↗</div>
                </div>

                <h3 className="insurer-card-title">{card.title}</h3>
                <p className="insurer-card-description">{card.description}</p>

                <button
                  className="insurer-card-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(card.route);
                  }}
                >
                  {card.buttonText}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="insurer-footer">
          <div className="insurer-footer-content">
            <p className="insurer-footer-text">
              © 2026 MedInsure. Blockchain-powered health insurance platform.
            </p>
            <div className="insurer-footer-tech">
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

export default InsurerDashboard;
