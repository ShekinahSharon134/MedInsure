import React from "react";
import { useNavigate } from "react-router-dom";

function InsurerDashboard({ account, web3 }) {
  const navigate = useNavigate();

  const cards = [
    {
      icon: "🏨",
      title: "Hospital Management",
      description: "Register and view all hospitals in the MedInsure network",
      buttonText: "Manage Hospitals",
      route: "/insurer/register-hospital",
      accent: "#00c9ff",
      gradient: "linear-gradient(135deg, #00c9ff22, #0077ff11)",
    },
    {
      icon: "✅",
      title: "Patient Approval",
      description: "Review KYC submissions and approve or reject patient registrations",
      buttonText: "Approve Patients",
      route: "/insurer/approve-patient",
      accent: "#00e676",
      gradient: "linear-gradient(135deg, #00e67622, #00bfa511)",
    },
    {
      icon: "📋",
      title: "Policy Management",
      description: "Create new insurance plans and view all existing policies",
      buttonText: "Manage Policies",
      route: "/insurer/create-policy",
      accent: "#b388ff",
      gradient: "linear-gradient(135deg, #b388ff22, #7c4dff11)",
    },
    {
      icon: "📊",
      title: "Subscriptions",
      description: "View all patients who subscribed to policies with payment details",
      buttonText: "View Subscriptions",
      route: "/insurer/subscriptions",
      accent: "#ffca28",
      gradient: "linear-gradient(135deg, #ffca2822, #ff980011)",
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .insurer-bg {
          min-height: 100vh;
          background: #060d1f;
          background-image:
            radial-gradient(ellipse at 10% 10%, rgba(0,201,255,0.07) 0%, transparent 50%),
            radial-gradient(ellipse at 90% 90%, rgba(124,77,255,0.07) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(0,230,118,0.03) 0%, transparent 60%);
          font-family: 'Inter', sans-serif;
        }

        .insurer-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.2rem 2.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(6,13,31,0.95);
          backdrop-filter: blur(20px);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .insurer-logo {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-size: 1.2rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.02em;
        }

        .insurer-logo-icon {
          width: 34px;
          height: 34px;
          background: linear-gradient(135deg, #00c9ff, #7c4dff);
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
        }

        .insurer-topbar-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .insurer-wallet {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.72rem;
          color: #00c9ff;
          background: rgba(0,201,255,0.08);
          border: 1px solid rgba(0,201,255,0.2);
          padding: 0.4rem 0.9rem;
          border-radius: 8px;
        }

        .insurer-role-badge {
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 0.35rem 0.75rem;
          border-radius: 20px;
          background: rgba(124,77,255,0.15);
          color: #b388ff;
          border: 1px solid rgba(124,77,255,0.3);
        }

        .insurer-hero {
          text-align: center;
          padding: 4rem 2rem 2.5rem;
        }

        .insurer-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #00c9ff;
          background: rgba(0,201,255,0.08);
          border: 1px solid rgba(0,201,255,0.2);
          padding: 0.4rem 1rem;
          border-radius: 20px;
          margin-bottom: 1.5rem;
        }

        .insurer-eyebrow-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #00c9ff;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        .insurer-hero h1 {
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 1.1;
          color: #fff;
          margin-bottom: 1rem;
        }

        .insurer-hero h1 span {
          background: linear-gradient(135deg, #00c9ff, #b388ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .insurer-hero p {
          color: rgba(255,255,255,0.4);
          font-size: 1rem;
          max-width: 440px;
          margin: 0 auto;
          line-height: 1.7;
        }

        .insurer-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 1.2rem;
          padding: 0 2.5rem 4rem;
          max-width: 1100px;
          margin: 0 auto;
        }

        .insurer-card {
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          padding: 2rem;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          text-align: left;
        }

        .insurer-card:hover {
          transform: translateY(-6px);
          border-color: rgba(255,255,255,0.14);
          box-shadow: 0 24px 48px rgba(0,0,0,0.4);
        }

        .insurer-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }

        .insurer-card-icon {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }

        .insurer-card-arrow {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
          color: rgba(255,255,255,0.3);
          transition: all 0.2s;
        }

        .insurer-card:hover .insurer-card-arrow {
          background: rgba(255,255,255,0.1);
          color: #fff;
          transform: translate(2px, -2px);
        }

        .insurer-card-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #fff;
          margin-bottom: 0.5rem;
        }

        .insurer-card-desc {
          font-size: 0.83rem;
          color: rgba(255,255,255,0.4);
          line-height: 1.6;
          margin-bottom: 1.8rem;
        }

        .insurer-card-btn {
          width: 100%;
          padding: 0.7rem 1.2rem;
          border: none;
          border-radius: 10px;
          font-family: 'Inter', sans-serif;
          font-size: 0.88rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .insurer-card-btn:hover {
          opacity: 0.88;
          transform: translateY(-1px);
        }

        .insurer-footer {
          text-align: center;
          padding: 2rem;
          border-top: 1px solid rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.2);
          font-size: 0.78rem;
          font-family: 'JetBrains Mono', monospace;
        }

        @media (max-width: 600px) {
          .insurer-topbar { padding: 1rem; }
          .insurer-hero   { padding: 3rem 1.5rem 2rem; }
          .insurer-cards  { padding: 0 1.2rem 3rem; }
          .insurer-wallet { display: none; }
        }
      `}</style>

      <div className="insurer-bg">

        {/* TOP BAR */}
        <nav className="insurer-topbar">
          <div className="insurer-logo">
            <div className="insurer-logo-icon">🏥</div>
            MedInsure
          </div>
          <div className="insurer-topbar-right">
            <span className="insurer-role-badge">Insurer</span>
            <span className="insurer-wallet">
              {account
                ? `${account.slice(0, 6)}...${account.slice(-4)}`
                : "Not connected"}
            </span>
          </div>
        </nav>

        {/* HERO */}
        <div className="insurer-hero">
          <div className="insurer-eyebrow">
            <div className="insurer-eyebrow-dot" />
            Insurer Control Panel
          </div>
          <h1>
            Manage Your<br />
            <span>Insurance Network</span>
          </h1>
          <p>
            Register hospitals, approve patients, create
            blockchain-verified policies and track subscriptions.
          </p>
        </div>

        {/* CARDS */}
        <div className="insurer-cards">
          {cards.map((card, i) => (
            <div
              key={i}
              className="insurer-card"
              style={{ background: card.gradient }}
              onClick={() => navigate(card.route)}
            >
              <div className="insurer-card-top">
                <div
                  className="insurer-card-icon"
                  style={{
                    background: `${card.accent}18`,
                    border: `1px solid ${card.accent}30`,
                  }}
                >
                  {card.icon}
                </div>
                <div className="insurer-card-arrow">↗</div>
              </div>

              <div className="insurer-card-title">{card.title}</div>
              <div className="insurer-card-desc">{card.description}</div>

              <button
                className="insurer-card-btn"
                style={{
                  background: `linear-gradient(135deg, ${card.accent}cc, ${card.accent}88)`,
                  color: "#060d1f",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(card.route);
                }}
              >
                {card.buttonText} →
              </button>
            </div>
          ))}
        </div>

        {/* FOOTER */}
        <div className="insurer-footer">
          MedInsure · Ethereum Blockchain · Ganache Local Network
        </div>

      </div>
    </>
  );
}

export default InsurerDashboard;