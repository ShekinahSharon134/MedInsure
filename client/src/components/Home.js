import React from "react";
import { useNavigate } from "react-router-dom";

function Home({ account, role }) {
  const navigate = useNavigate();

  const handleLogin = (requestedRole) => {
    if (role === requestedRole) {
      // Correct account → go to dashboard
      if (requestedRole === "insurer")  navigate("/insurer");
      if (requestedRole === "hospital") navigate("/hospital/dashboard");
      if (requestedRole === "patient")  navigate("/patient/dashboard");
    } else {
      alert(`❌ Please switch MetaMask to your ${requestedRole} account first!`);
    }
  };

  const cards = [
    {
      icon: "👨‍💼",
      title: "Insurer",
      role: "insurer",
      description: "Register hospitals, approve patients and create insurance policies",
      buttonText: "Login as Insurer",
      accent: "#b388ff",
      gradient: "linear-gradient(135deg, #b388ff22, #7c4dff11)",
    },
    {
      icon: "🧑‍⚕️",
      title: "Patient",
      role: "patient",
      description: "Register with KYC and subscribe to insurance policies",
      buttonText: "Login as Patient",
      accent: "#00e676",
      gradient: "linear-gradient(135deg, #00e67622, #00bfa511)",
    },
    {
      icon: "🏨",
      title: "Hospital",
      role: "hospital",
      description: "Submit claims and manage patient medical records",
      buttonText: "Login as Hospital",
      accent: "#00c9ff",
      gradient: "linear-gradient(135deg, #00c9ff22, #0077ff11)",
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .home-bg {
          min-height: 100vh;
          background: #060d1f;
          background-image:
            radial-gradient(ellipse at 15% 20%, rgba(0,201,255,0.07) 0%, transparent 50%),
            radial-gradient(ellipse at 85% 80%, rgba(124,77,255,0.07) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(0,230,118,0.03) 0%, transparent 60%);
          font-family: 'Inter', sans-serif;
        }

        /* NAV */
        .home-nav {
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

        .home-logo {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-size: 1.2rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.02em;
        }

        .home-logo-icon {
          width: 34px;
          height: 34px;
          background: linear-gradient(135deg, #00c9ff, #7c4dff);
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
        }

        .home-wallet {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.72rem;
          color: #00c9ff;
          background: rgba(0,201,255,0.08);
          border: 1px solid rgba(0,201,255,0.2);
          padding: 0.4rem 0.9rem;
          border-radius: 8px;
        }

        /* HERO */
        .home-hero {
          text-align: center;
          padding: 5rem 2rem 3rem;
        }

        .home-eyebrow {
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
          margin-bottom: 1.8rem;
        }

        .home-eyebrow-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #00c9ff;
          animation: blink 2s infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .home-hero h1 {
          font-size: clamp(2.2rem, 5vw, 3.8rem);
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 1.1;
          color: #fff;
          margin-bottom: 1.2rem;
        }

        .home-hero h1 span {
          background: linear-gradient(135deg, #00c9ff, #b388ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .home-hero p {
          color: rgba(255,255,255,0.4);
          font-size: 1.05rem;
          max-width: 480px;
          margin: 0 auto 1rem;
          line-height: 1.7;
        }

        /* ROLE NOTE */
        .home-role-note {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.82rem;
          font-family: 'JetBrains Mono', monospace;
          padding: 0.5rem 1.2rem;
          border-radius: 20px;
          margin-bottom: 0.5rem;
        }

        .role-insurer  { background: rgba(179,136,255,0.12); color: #b388ff; border: 1px solid rgba(179,136,255,0.25); }
        .role-hospital { background: rgba(0,201,255,0.12);   color: #00c9ff; border: 1px solid rgba(0,201,255,0.25); }
        .role-patient  { background: rgba(0,230,118,0.12);   color: #00e676; border: 1px solid rgba(0,230,118,0.25); }
        .role-unknown  { background: rgba(239,68,68,0.12);   color: #fca5a5; border: 1px solid rgba(239,68,68,0.25); }

        /* FEATURES ROW */
        .home-features {
          display: flex;
          justify-content: center;
          gap: 0.8rem;
          flex-wrap: wrap;
          padding: 0 2rem 3.5rem;
        }

        .home-feature-chip {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          padding: 0.45rem 1rem;
          border-radius: 20px;
          font-size: 0.8rem;
          color: rgba(255,255,255,0.4);
        }

        .home-feature-chip span { font-size: 0.9rem; }

        /* CARDS */
        .home-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
          gap: 1.2rem;
          padding: 0 2.5rem 4rem;
          max-width: 980px;
          margin: 0 auto;
        }

        .home-card {
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          padding: 2rem;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .home-card:hover {
          transform: translateY(-6px);
          border-color: rgba(255,255,255,0.14);
          box-shadow: 0 24px 48px rgba(0,0,0,0.4);
        }

        /* Active role card glows */
        .home-card.is-my-role {
          border-width: 1.5px;
        }

        .home-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }

        .home-card-icon {
          width: 54px;
          height: 54px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.6rem;
        }

        .home-card-tag {
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 0.3rem 0.7rem;
          border-radius: 20px;
        }

        .home-card-title {
          font-size: 1.2rem;
          font-weight: 700;
          color: #fff;
          margin-bottom: 0.5rem;
        }

        .home-card-desc {
          font-size: 0.85rem;
          color: rgba(255,255,255,0.4);
          line-height: 1.6;
          margin-bottom: 1.8rem;
        }

        .home-card-btn {
          width: 100%;
          padding: 0.75rem 1.2rem;
          border: none;
          border-radius: 10px;
          font-family: 'Inter', sans-serif;
          font-size: 0.88rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: 0.01em;
        }

        .home-card-btn:hover {
          opacity: 0.88;
          transform: translateY(-1px);
        }

        .home-card-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
          transform: none;
        }

        /* WRONG ROLE HINT */
        .home-card-hint {
          font-size: 0.72rem;
          color: rgba(255,255,255,0.25);
          text-align: center;
          margin-top: 0.6rem;
          font-family: 'JetBrains Mono', monospace;
        }

        /* FOOTER */
        .home-footer {
          text-align: center;
          padding: 2rem;
          border-top: 1px solid rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.2);
          font-size: 0.78rem;
          font-family: 'JetBrains Mono', monospace;
        }

        @media (max-width: 600px) {
          .home-nav  { padding: 1rem 1.2rem; }
          .home-hero { padding: 3rem 1.5rem 2rem; }
          .home-cards { padding: 0 1.2rem 3rem; }
          .home-wallet { display: none; }
        }
      `}</style>

      <div className="home-bg">

        {/* NAV */}
        <nav className="home-nav">
          <div className="home-logo">
            <div className="home-logo-icon">🏥</div>
            MedInsure
          </div>
          {account && (
            <span className="home-wallet">
              {account.slice(0, 6)}...{account.slice(-4)}
            </span>
          )}
        </nav>

        {/* HERO */}
        <div className="home-hero">
          <div className="home-eyebrow">
            <div className="home-eyebrow-dot" />
            Blockchain Health Insurance
          </div>
          <h1>
            Decentralized<br />
            <span>Medical Insurance</span>
          </h1>
          <p>
            Trustless claims, transparent policies and automated settlements — all powered by Ethereum smart contracts.
          </p>

          {/* Show detected role */}
          {role && (
            <div className={`home-role-note role-${role}`}>
              {role === "insurer"  && "👨‍💼 Insurer account detected"}
              {role === "hospital" && "🏨 Hospital account detected"}
              {role === "patient"  && "🧑‍⚕️ Patient account detected"}
              {role === "unknown"  && "⚠ Unregistered account"}
            </div>
          )}
        </div>

        {/* FEATURE CHIPS */}
        <div className="home-features">
          <div className="home-feature-chip"><span>⛓</span> Ethereum Blockchain</div>
          <div className="home-feature-chip"><span>📁</span> IPFS via Pinata</div>
          <div className="home-feature-chip"><span>🔐</span> KYC Verified</div>
          <div className="home-feature-chip"><span>🤖</span> ML Fraud Detection</div>
          <div className="home-feature-chip"><span>🦊</span> MetaMask</div>
        </div>

        {/* ROLE CARDS */}
        <div className="home-cards">
          {cards.map((card, i) => {
            const isMyRole = role === card.role;
            const isDisabled = role !== "unknown" && !isMyRole;
            return (
              <div
                key={i}
                className={`home-card ${isMyRole ? "is-my-role" : ""}`}
                style={{
                  background: card.gradient,
                  borderColor: isMyRole
                    ? `${card.accent}55`
                    : "rgba(255,255,255,0.07)",
                  boxShadow: isMyRole
                    ? `0 0 30px ${card.accent}15`
                    : "none",
                }}
              >
                <div className="home-card-top">
                  <div
                    className="home-card-icon"
                    style={{
                      background: `${card.accent}18`,
                      border: `1px solid ${card.accent}30`,
                    }}
                  >
                    {card.icon}
                  </div>
                  {isMyRole && (
                    <div
                      className="home-card-tag"
                      style={{
                        background: `${card.accent}18`,
                        color: card.accent,
                        border: `1px solid ${card.accent}30`,
                      }}
                    >
                      Your Role
                    </div>
                  )}
                </div>

                <div className="home-card-title">{card.title}</div>
                <div className="home-card-desc">{card.description}</div>

                <button
                  className="home-card-btn"
                  disabled={isDisabled}
                  style={{
                    background: isMyRole
                      ? `linear-gradient(135deg, ${card.accent}cc, ${card.accent}88)`
                      : "rgba(255,255,255,0.06)",
                    color: isMyRole ? "#060d1f" : "rgba(255,255,255,0.3)",
                    border: isMyRole ? "none" : "1px solid rgba(255,255,255,0.08)",
                  }}
                  onClick={() => handleLogin(card.role)}
                >
                  {isMyRole ? `${card.buttonText} →` : card.buttonText}
                </button>

                {/* Hint for wrong role */}
                {isDisabled && (
                  <div className="home-card-hint">
                    Switch to {card.role} account
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* FOOTER */}
        <div className="home-footer">
          MedInsure · Ethereum Blockchain · Ganache Local Network
        </div>

      </div>
    </>
  );
}

export default Home;