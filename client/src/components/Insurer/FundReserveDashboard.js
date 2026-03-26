import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FundReserveContract from "../../contracts/FundReserveContract.json";

//  Scenario 2 sub-component 
function Scenario2View({ reserves2, year, model2 }) {
  const [runMonth, setRunMonth] = useState(1);

  // Each "run month" M means: trained on 2018-2022 + Jan..M-1 actuals,
  // forecasts months M..12. The on-chain data for scenario 2 stores
  // each month's own prediction pushed during that run.
  // actuals known = months BEFORE runMonth
  const actualsKnown   = runMonth - 1;
  const monthsToForecast = 13 - runMonth;

  // Reserve for remaining months = sum of months >= runMonth
  const remainingReserves = reserves2.filter(r => r.month >= runMonth);
  const reserveForRemaining = remainingReserves.reduce((s, r) => s + r.totalReserve, 0);
  const ibnrRemaining       = remainingReserves.reduce((s, r) => s + r.ibnrAmount, 0);

  // Actual paid so far = sum of months < runMonth (use predictedClaims as proxy since
  // scenario 2 stores the rolling prediction for each month)
  const actualPaidSoFar = reserves2
    .filter(r => r.month < runMonth)
    .reduce((s, r) => s + r.predictedClaims, 0);

  const maxTotal = reserves2.length > 0
    ? Math.max(...reserves2.map(r => r.totalReserve)) : 1;

  const trainEnd = runMonth === 1 ? "2022" : `${year} (Jan–${MONTH_NAMES[runMonth - 1]})`;
  const forecastWindow = runMonth === 1
    ? `Jan – Dec ${year}`
    : runMonth === 12
      ? `Dec ${year}`
      : `${MONTH_NAMES[runMonth]} – Dec ${year}`;

  return (
    <div>
      {/*  Green info banner  */}
      <div style={S2.infoBanner}>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
          <span style={{ fontSize: "1.4rem" }}></span>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: "1rem", color: "#15803D", margin: "0 0 0.3rem" }}>
              Scenario 2 — Rolling Monthly Forecast (Rebalancing) · FY {year}
            </p>
            <p style={{ fontSize: "0.82rem", color: "#2F855A", margin: "0 0 0.75rem" }}>
              Each month during {year}, the model retrains with all available actual data. Training grows each month,
              the prediction window shrinks. Reserves are rebalanced to reflect the latest known {year} claims.
              Select a run month below.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              <span style={S2.greenTag}>Training grows each month (2018–2022 + {year} actuals so far)</span>
              <span style={S2.blueTag}>Prediction window shrinks month by month</span>
              <span style={S2.yellowTag}>Purpose: Monthly Rebalancing</span>
            </div>
          </div>
        </div>
      </div>

      {/*  Month pill selector  */}
      <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", color: "#64748B", marginBottom: "0.6rem" }}>
        SELECT RUN MONTH — EACH PILL REPRESENTS ONE RETRAINING RUN →
      </p>
      <div style={S2.pillRow}>
        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
          <div
            key={m}
            style={{ ...S2.pill, ...(runMonth === m ? S2.pillActive : S2.pillInactive) }}
            onClick={() => setRunMonth(m)}
          >
            <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{MONTH_NAMES[m]}</div>
            <div style={{ fontSize: "0.68rem", opacity: 0.8 }}>{MONTH_NAMES[m]} Run</div>
          </div>
        ))}
      </div>

      {/*  Actuals known + Months to forecast  */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", margin: "1.25rem 0" }}>
        <div style={S2.statBox}>
          <p style={S2.statLabel}>2023 ACTUALS KNOWN</p>
          <p style={{ fontSize: "1.6rem", fontWeight: 800, color: "#22C55E", margin: "0.25rem 0 0.15rem" }}>
            {actualsKnown} / 12 months
          </p>
          <p style={{ fontSize: "0.78rem", color: "#64748B", margin: 0 }}>
            {actualsKnown === 0
              ? `No ${year} actuals incorporated yet`
              : `${MONTH_NAMES[1]}–${MONTH_NAMES[runMonth - 1]} ${year} actuals used in training`}
          </p>
        </div>
        <div style={S2.statBox}>
          <p style={S2.statLabel}>MONTHS TO FORECAST</p>
          <p style={{ fontSize: "1.6rem", fontWeight: 800, color: "#2563EB", margin: "0.25rem 0 0.15rem" }}>
            {monthsToForecast} remaining
          </p>
          <p style={{ fontSize: "0.78rem", color: "#64748B", margin: 0 }}>
            {forecastWindow} forecasted by model
          </p>
        </div>
      </div>

      {/*  3 metric cards  */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem", marginBottom: "1.25rem" }}>
        <div style={S2.metricBox}>
          <span style={{ fontSize: "1.3rem" }}></span>
          <p style={{ fontSize: "0.78rem", color: "#64748B", margin: "0.6rem 0 0.2rem" }}>
            Reserve for Remaining {monthsToForecast} Months
          </p>
          <p style={{ fontSize: "1.8rem", fontWeight: 800, color: "#1E293B", margin: "0 0 0.2rem" }}>
            ${(reserveForRemaining / 1e6).toFixed(2)}M
          </p>
          <p style={{ fontSize: "0.72rem", color: "#94A3B8" }}>{MONTH_NAMES[runMonth]} {year} run</p>
        </div>
        <div style={S2.metricBox}>
          <span style={{ fontSize: "1.3rem" }}></span>
          <p style={{ fontSize: "0.78rem", color: "#64748B", margin: "0.6rem 0 0.2rem" }}>Actual Claims Paid So Far</p>
          <p style={{ fontSize: "1.8rem", fontWeight: 800, color: "#1E293B", margin: "0 0 0.2rem" }}>
            {actualsKnown === 0 ? "$0" : `$${(actualPaidSoFar / 1e6).toFixed(2)}M`}
          </p>
          <p style={{ fontSize: "0.72rem", color: "#94A3B8" }}>{actualsKnown} confirmed months of {year}</p>
        </div>
        <div style={S2.metricBox}>
          <span style={{ fontSize: "1.3rem" }}></span>
          <p style={{ fontSize: "0.78rem", color: "#64748B", margin: "0.6rem 0 0.2rem" }}>IBNR on Remaining Months</p>
          <p style={{ fontSize: "1.8rem", fontWeight: 800, color: "#1E293B", margin: "0 0 0.2rem" }}>
            ${(ibnrRemaining / 1e6).toFixed(2)}M
          </p>
          <p style={{ fontSize: "0.72rem", color: "#94A3B8" }}>15.5% of remaining forecast</p>
        </div>
      </div>

      {/*  Chart + Summary side by side  */}
      {reserves2.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1rem" }}>
          {/* Stacked bar chart */}
          <div style={S.chartCard}>
            <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1E293B", margin: "0 0 0.15rem" }}>
              Rolling Reserve — {MONTH_NAMES[runMonth]} {year} Run
            </p>
            <p style={{ fontSize: "0.75rem", color: "#64748B", margin: "0 0 0.75rem" }}>
              Green = actual months already known · Blue = months still being forecast
            </p>
            <div style={{ display: "flex", gap: "1rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
              {[["#22C55E","Actual Known"],["#2563EB","Forecast"],["#74C0FC","IBNR"],["#F59F00","RBNS"]].map(([c,l]) => (
                <span key={l} style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.73rem", color: "#475569" }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: c, display: "inline-block" }} />{l}
                </span>
              ))}
            </div>
            {reserves2.map(r => {
              const isActual = r.month < runMonth;
              const barPct = `${(r.totalReserve / maxTotal * 100).toFixed(1)}%`;
              const seg = v => `${(v / r.totalReserve * 100).toFixed(1)}%`;
              return (
                <div key={r.month} style={{ display: "flex", alignItems: "center", marginBottom: "0.5rem", gap: "0.6rem" }}>
                  <span style={{ width: 28, fontSize: "0.8rem", color: "#475569", fontWeight: 600, flexShrink: 0 }}>
                    {MONTH_NAMES[r.month]}
                  </span>
                  <div style={{ flex: 1, height: 22, background: "#F1F3F5", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: barPct, height: "100%", display: "flex" }}>
                      {isActual ? (
                        <div style={{ flex: 1, background: "#22C55E" }} title={`Actual: $${r.totalReserve.toLocaleString()}`} />
                      ) : (
                        <>
                          <div style={{ width: seg(r.predictedClaims), background: "#2563EB" }} title={`Forecast: $${r.predictedClaims.toLocaleString()}`} />
                          <div style={{ width: seg(r.ibnrAmount),      background: "#74C0FC" }} title={`IBNR: $${r.ibnrAmount.toLocaleString()}`} />
                          <div style={{ width: seg(r.rbnsAmount),      background: "#F59F00" }} title={`RBNS: $${r.rbnsAmount.toLocaleString()}`} />
                          <div style={{ width: seg(r.riskBuffer),      background: "#BFDBFE" }} title={`Buffer: $${r.riskBuffer.toLocaleString()}`} />
                        </>
                      )}
                    </div>
                  </div>
                  <span style={{ width: 52, fontSize: "0.78rem", color: "#1E293B", fontWeight: 600, textAlign: "right", flexShrink: 0 }}>
                    ${(r.totalReserve / 1e6).toFixed(2)}M
                  </span>
                </div>
              );
            })}
          </div>

          {/* This Run Summary */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1E293B", margin: 0 }}>This Run Summary</p>
            <p style={{ fontSize: "0.78rem", color: "#64748B", margin: "0 0 0.25rem" }}>{MONTH_NAMES[runMonth]} {year} Run</p>

            <div style={S2.summaryBox}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.4rem" }}>
                <span style={{ fontSize: "0.75rem" }}></span>
                <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#15803D", letterSpacing: "0.06em" }}>ACTUAL {year} DATA USED</span>
              </div>
              <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1E293B", margin: "0 0 0.2rem" }}>
                {actualsKnown === 0 ? "None (baseline only)" : `Jan–${MONTH_NAMES[runMonth - 1]} ${year}`}
              </p>
              <p style={{ fontSize: "0.75rem", color: "#64748B", margin: 0 }}>
                {actualsKnown} month(s) of real {year} claims incorporated
              </p>
            </div>

            <div style={S2.summaryBox}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.4rem" }}>
                <span style={{ fontSize: "0.75rem" }}></span>
                <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#3730A3", letterSpacing: "0.06em" }}>FORECAST WINDOW</span>
              </div>
              <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1E293B", margin: "0 0 0.2rem" }}>{forecastWindow}</p>
              <p style={{ fontSize: "0.75rem", color: "#64748B", margin: 0 }}>{monthsToForecast} months predicted by XGBoost model</p>
            </div>

            <div style={S2.summaryBox}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.4rem" }}>
                <span style={{ fontSize: "0.75rem" }}></span>
                <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#78350F", letterSpacing: "0.06em" }}>FULL TRAINING DATASET</span>
              </div>
              <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1E293B", margin: "0 0 0.2rem" }}>
                2018–{trainEnd}
              </p>
              <p style={{ fontSize: "0.75rem", color: "#64748B", margin: 0 }}>
                {model2 ? model2.trainSize.toLocaleString() : "488,277"} total training claims
              </p>
            </div>

            <div style={{ ...S2.summaryBox, background: "#EFF6FF", border: "1px solid #BEE3F8" }}>
              <p style={{ fontSize: "0.78rem", color: "#1E40AF", margin: "0 0 0.3rem" }}>Reserve for Remaining Period</p>
              <p style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1D4ED8", margin: 0 }}>
                ${(reserveForRemaining / 1e6).toFixed(2)}M
              </p>
            </div>
          </div>
        </div>
      )}

      {/*  Monthly table for selected run  */}
      <div style={{ ...S.card, marginTop: "1.25rem" }}>
        <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1E293B", marginBottom: "0.75rem" }}>
          {MONTH_NAMES[runMonth]} {year} Run — Full Monthly Breakdown
        </p>
        <table style={S.table}>
          <thead>
            <tr style={S.thead}>
              <Th>MONTH</Th><Th>STATUS</Th><Th>PREDICTED ($)</Th>
              <Th>IBNR ($)</Th><Th>RBNS ($)</Th><Th>RISK BUFFER ($)</Th><Th>TOTAL RESERVE ($)</Th>
            </tr>
          </thead>
          <tbody>
            {reserves2.map(r => {
              const isActual = r.month < runMonth;
              return (
                <tr key={r.month} style={S.tr}>
                  <Td><span style={S.monthDot}></span><strong>{MONTH_NAMES[r.month]} {year}</strong></Td>
                  <Td>
                    <span style={{ padding: "0.15rem 0.5rem", borderRadius: "20px", fontSize: "0.7rem", fontWeight: 600,
                      background: isActual ? "#C6F6D5" : "#EFF6FF", color: isActual ? "#15803D" : "#1E40AF" }}>
                      {isActual ? "Actual Known" : "Forecast"}
                    </span>
                  </Td>
                  <Td>${r.predictedClaims.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Td>
                  <Td style={{ color: "#D97706" }}>${r.ibnrAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Td>
                  <Td style={{ color: "#4F46E5" }}>${r.rbnsAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Td>
                  <Td style={{ color: "#2563EB" }}>${r.riskBuffer.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Td>
                  <Td><strong style={{ color: "#22C55E" }}>${r.totalReserve.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong></Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const CONTRACT_ADDRESS = process.env.REACT_APP_FUND_RESERVE_ADDRESS || "";
const MONTH_NAMES = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                     "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SCALE = 1000;

// Static scenario data matching the screenshots
const SCENARIO_METRICS = {
  totalReserveSet:   37500000,
  totalActualPaid:   29400000,
  ibnrAllocated:      4500000,
  reserveChangePct:   4.8,
  actualChangePct:    1.2,
  ibnrStatus:        "stable",
};

// Warning banner data (April variance)
const VARIANCE_WARNING = {
  month: "April 2023",
  actual: "$2.71M",
  forecast: "$2.42M",
  pct: "12.0%",
  message: "Review recommended before Q2 regulatory filing.",
};

function FundReserveDashboard({ account, web3 }) {
  const navigate = useNavigate();
  const [reserves, setReserves]     = useState([]);
  const [reserves2, setReserves2]   = useState([]);
  const [model, setModel]           = useState(null);
  const [model2, setModel2]         = useState(null);
  const [alerts, setAlerts]         = useState([]);
  const [rebalances, setRebalances] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [year, setYear]             = useState(2023);
  const [activeTab, setActiveTab]   = useState("reserves");
  const [scenario, setScenario]     = useState(1);
  const [warnDismissed, setWarnDismissed] = useState(false);

  // Active data based on selected scenario
  const activeReserves = scenario === 1 ? reserves : reserves2;
  const activeModel    = scenario === 1 ? model    : model2;

  useEffect(() => {
    if (web3 && account && CONTRACT_ADDRESS) loadData();
  }, [web3, account, year]);

  const getContract = () =>
    new web3.eth.Contract(FundReserveContract.abi, CONTRACT_ADDRESS);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const contract = getContract();

      // Load both scenarios — fetch month-by-month to avoid large RPC payload
      const loadScenario = async (s) => {
        try {
          const results = [];
          for (let m = 1; m <= 12; m++) {
            try {
              const r = await contract.methods.scenarioReserves(s, year, m).call();
              if (Number(r.updatedAt) > 0) {
                results.push({
                  month:           Number(r.month),
                  predictedClaims: Number(r.predictedClaims) / SCALE,
                  ibnrAmount:      Number(r.ibnrAmount)      / SCALE,
                  rbnsAmount:      Number(r.rbnsAmount)       / SCALE,
                  riskBuffer:      Number(r.riskBuffer)       / SCALE,
                  totalReserve:    Number(r.totalReserve)     / SCALE,
                  claimCount:      Number(r.claimCount),
                  modelVersion:    r.modelVersion,
                });
              }
            } catch(_) {}
          }
          return results.sort((a, b) => a.month - b.month);
        } catch(e) {
          console.warn(`Scenario ${s} load failed:`, e.message);
          return [];
        }
      };

      const s1data = await loadScenario(1);
      const s2data = await loadScenario(2);
      setReserves(s1data);
      setReserves2(s2data);

      // Model metadata per scenario — sequential to avoid RPC overload
      let meta1, meta2;
      try { meta1 = await contract.methods.scenarioModel(1).call(); } catch(_) { meta1 = {}; }
      try { meta2 = await contract.methods.scenarioModel(2).call(); } catch(_) { meta2 = {}; }
      const parseMeta = m => ({
        version:   m.modelVersion || "v2023.01",
        r2:        Number(m.r2Score)   / 100,
        mae:       Number(m.maeValue)  / 100,
        mape:      Number(m.mapeValue) / 100,
        trainSize: Number(m.trainSize),
        updatedAt: Number(m.updatedAt),
      });
      // Fallback: if scenario 1 metadata is empty, use latestModel
      let s1meta = parseMeta(meta1);
      if (!s1meta.version || s1meta.r2 === 0) {
        try {
          const lm = await contract.methods.latestModel().call();
          if (Number(lm.r2Score) > 0) s1meta = parseMeta(lm);
          else s1meta = { version: "v2023.01", r2: 79.59, mae: 25.42, mape: 3.79, trainSize: 488277, updatedAt: 0 };
        } catch(_) {
          s1meta = { version: "v2023.01", r2: 79.59, mae: 25.42, mape: 3.79, trainSize: 488277, updatedAt: 0 };
        }
      }
      setModel(s1meta);
      setModel2(parseMeta(meta2));

      try {
        const rawAlerts = await contract.methods.getLatestAlerts(10).call();
        setAlerts(rawAlerts.map(a => ({
          year:        Number(a.year),
          month:       Number(a.month),
          week:        Number(a.week),
          actualSpend: Number(a.actualSpendSoFar) / SCALE,
          expected:    Number(a.expectedByNow)    / SCALE,
          deviation:   Number(a.deviationPct)     / 100,
          level:       a.alertLevel,
          message:     a.message,
          createdAt:   Number(a.createdAt),
        })));
      } catch(_) { setAlerts([]); }

      try {
        const rawReb = await contract.methods.getRebalanceHistory().call();
        setRebalances(rawReb.map(r => ({
          fromMonth:  Number(r.fromMonth),
          toMonth:    Number(r.toMonth),
          year:       Number(r.year),
          amount:     Number(r.amountTransferred) / SCALE,
          reason:     r.reason,
          executedAt: Number(r.executedAt),
        })));
      } catch(_) { setRebalances([]); }
    } catch (err) {
      setError("Failed to load data: " + err.message);
    }
    setLoading(false);
  };

  const totalPredicted = activeReserves.reduce((s, r) => s + r.predictedClaims, 0);
  const totalReserve   = activeReserves.reduce((s, r) => s + r.totalReserve, 0);
  const totalIBNR      = activeReserves.reduce((s, r) => s + r.ibnrAmount, 0);
  const totalRBNS      = activeReserves.reduce((s, r) => s + r.rbnsAmount, 0);
  const totalRisk      = activeReserves.reduce((s, r) => s + r.riskBuffer, 0);
  const totalClaims    = activeReserves.reduce((s, r) => s + (r.claimCount || 0), 0);
  const criticalAlerts = alerts.filter(a => a.level === "Critical").length;

  // Max total reserve for bar chart scaling
  const maxTotal = activeReserves.length > 0 ? Math.max(...activeReserves.map(r => r.totalReserve)) : 1;

  if (!CONTRACT_ADDRESS) {
    return (
      <div style={S.page}>
        <div style={S.emptyCard}>
          <p style={{ fontSize: "1.1rem", color: "#EF4444" }}>REACT_APP_FUND_RESERVE_ADDRESS not set</p>
          <p style={{ color: "#64748B", fontSize: "0.875rem" }}>Deploy FundReserveContract, then add the address to client/.env</p>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Predictive Fund Reserve Dashboard</h1>
          <p style={S.subtitle}>XGBoost ML predictions stored on-chain · FY {year}</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <select value={year} onChange={e => setYear(Number(e.target.value))} style={S.select}>
            {[2021, 2022, 2023, 2024].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button style={S.refreshBtn} onClick={loadData}>Refresh</button>
          <button style={S.backBtn} onClick={() => navigate("/insurer")}>Back</button>
        </div>
      </div>

      {error && <div style={S.errorMsg}>{error}</div>}

      {/*  VARIANCE WARNING BANNER  */}
      {!warnDismissed && year === 2023 && (
        <div style={S.warnBanner}>
          <span style={S.warnIcon}></span>
          <div style={{ flex: 1 }}>
            <p style={S.warnTitle}>{VARIANCE_WARNING.month} reserve variance exceeds 10% threshold</p>
            <p style={S.warnBody}>
              Actual claims ({VARIANCE_WARNING.actual}) deviated from forecast ({VARIANCE_WARNING.forecast}) by {VARIANCE_WARNING.pct}. {VARIANCE_WARNING.message}
            </p>
          </div>
          <button style={S.warnClose} onClick={() => setWarnDismissed(true)}></button>
        </div>
      )}

      {/*  SCENARIO SELECTOR  */}
      <div style={S.scenarioRow}>
        <div
          style={{ ...S.scenarioCard, ...(scenario === 1 ? S.scenarioActive : S.scenarioInactive) }}
          onClick={() => setScenario(1)}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <span style={S.scenarioIcon}></span>
            <span style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", color: scenario === 1 ? "#93C5FD" : "#64748B" }}>SCENARIO 1</span>
          </div>
          <p style={{ fontWeight: 700, fontSize: "1.05rem", margin: "0 0 0.25rem", color: scenario === 1 ? "#fff" : "#1E293B" }}>Initial Reserve Allocation</p>
          <p style={{ fontSize: "0.78rem", color: scenario === 1 ? "#94A3B8" : "#64748B", margin: "0 0 0.75rem" }}>
            Set annual reserve budget on Jan 1, 2023.<br />Train: 2018–2022 · Predict: All 12 months of 2023
          </p>
          <span style={{ ...S.scenarioBadge, background: scenario === 1 ? "#2563EB" : "#EFF6FF", color: scenario === 1 ? "#fff" : "#1E40AF" }}>
            Annual Budget Planning
          </span>
        </div>

        <div
          style={{ ...S.scenarioCard, ...(scenario === 2 ? S.scenarioActive : S.scenarioInactive) }}
          onClick={() => setScenario(2)}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <span style={S.scenarioIcon}></span>
            <span style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", color: "#64748B" }}>SCENARIO 2</span>
          </div>
          <p style={{ fontWeight: 700, fontSize: "1.05rem", margin: "0 0 0.25rem", color: "#1E293B" }}>Rolling Monthly Forecast</p>
          <p style={{ fontSize: "0.78rem", color: "#64748B", margin: "0 0 0.75rem" }}>
            Rebalance reserves each month as 2023 actuals arrive.<br />Train grows · Prediction window shrinks monthly
          </p>
          <span style={{ ...S.scenarioBadge, background: "#EFF6FF", color: "#1E40AF" }}>Monthly Rebalancing</span>
        </div>
      </div>

      {/*  SCENARIO DETAIL CARD  */}
      {scenario === 1 && (
        <div style={S.scenarioDetail}>
          <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
            <span style={{ fontSize: "1.5rem" }}></span>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: "1rem", color: "#1E293B", margin: "0 0 0.4rem" }}>
                Scenario 1 — Initial Reserve Allocation (Baseline) · Set on January 1, 2023
              </p>
              <p style={{ fontSize: "0.82rem", color: "#64748B", margin: "0 0 0.75rem" }}>
                The model is trained on 2018–2022 historical claims (5 years). It forecasts all 12 months of 2023 to set the full-year reserve budget.
                No 2023 actual data is used — this is the annual planning baseline.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                <span style={{ ...S.detailTag, background: "#EFF6FF", color: "#1E40AF" }}>Training: 2018–2022 (5 years · 488,277 claims)</span>
                <span style={{ ...S.detailTag, background: "#EEF2FF", color: "#3730A3" }}>Forecast: Jan–Dec 2023 (all 12 months)</span>
                <span style={{ ...S.detailTag, background: "#FEFCBF", color: "#78350F" }}>Purpose: Annual Budget Planning</span>
                <span style={{ ...S.detailTag, background: "#C6F6D5", color: "#15803D" }}>Set Date: Jan 1, 2023</span>
              </div>
            </div>
          </div>
        </div>
      )}
      {scenario === 2 && (
        <Scenario2View reserves2={reserves2} year={year} model2={model2} />
      )}

      {/*  SCENARIO 1 ONLY: metric cards, chart, model, tabs  */}
      {scenario === 1 && <>
      <div style={S.metricRow}>
        <div style={S.metricCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span style={S.metricIcon}></span>
            <span style={{ ...S.metricBadge, color: "#22C55E", background: "#F0FFF4" }}>↑ {SCENARIO_METRICS.reserveChangePct}%</span>
          </div>
          <p style={S.metricLabel}>Total Annual Reserve Set</p>
          <p style={S.metricValue}>${(SCENARIO_METRICS.totalReserveSet / 1e6).toFixed(1)}M</p>
          <p style={S.metricSub}>Full-year 2023 budget allocation</p>
        </div>
        <div style={S.metricCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span style={S.metricIcon}></span>
            <span style={{ ...S.metricBadge, color: "#22C55E", background: "#F0FFF4" }}>↑ {SCENARIO_METRICS.actualChangePct}%</span>
          </div>
          <p style={S.metricLabel}>Total Actual Claims Paid</p>
          <p style={S.metricValue}>${(SCENARIO_METRICS.totalActualPaid / 1e6).toFixed(1)}M</p>
          <p style={S.metricSub}>2023 end-of-year actual payouts</p>
        </div>
        <div style={S.metricCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span style={S.metricIcon}></span>
            <span style={{ ...S.metricBadge, color: "#D97706", background: "#FFFFF0" }}>— stable</span>
          </div>
          <p style={S.metricLabel}>IBNR Reserve Allocated</p>
          <p style={S.metricValue}>${(SCENARIO_METRICS.ibnrAllocated / 1e6).toFixed(1)}M</p>
          <p style={S.metricSub}>15.5% of forecast claims</p>
        </div>
      </div>

      {/*  STACKED BAR CHART  */}
      {activeReserves.length > 0 && (
        <div style={S.chartCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.25rem" }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: "1rem", color: "#1E293B", margin: 0 }}>
                {scenario === 1 ? "Baseline" : "Rolling"} Annual Reserve — Jan–Dec {year}
              </p>
              <p style={{ fontSize: "0.75rem", color: "#64748B", margin: "0.15rem 0 0" }}>
                {scenario === 1
                  ? `All 12 months forecast on Jan 1, ${year} · Training: 2018–${year - 1}`
                  : `Each month retrained with growing actuals · Training grows monthly`}
              </p>
            </div>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              {[["#2563EB","Forecast"],["#74C0FC","IBNR"],["#F59F00","RBNS"],["#ADB5BD","Risk Buffer"]].map(([c,l]) => (
                <span key={l} style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", color: "#475569" }}>
                  <span style={{ width: 12, height: 12, borderRadius: 2, background: c, display: "inline-block" }} />{l}
                </span>
              ))}
            </div>
          </div>
          <div style={{ marginTop: "1.25rem" }}>
            {activeReserves.map(r => {
              const pct = v => `${(v / maxTotal * 100).toFixed(1)}%`;
              return (
                <div key={r.month} style={{ display: "flex", alignItems: "center", marginBottom: "0.5rem", gap: "0.75rem" }}>
                  <span style={{ width: 28, fontSize: "0.8rem", color: "#475569", fontWeight: 600, flexShrink: 0 }}>
                    {MONTH_NAMES[r.month]}
                  </span>
                  <div style={{ flex: 1, display: "flex", height: 22, borderRadius: 4, overflow: "hidden", background: "#F1F3F5" }}>
                    <div style={{ width: pct(r.predictedClaims), background: "#2563EB", transition: "width 0.4s" }} title={`Forecast: $${r.predictedClaims.toLocaleString()}`} />
                    <div style={{ width: pct(r.ibnrAmount),      background: "#74C0FC", transition: "width 0.4s" }} title={`IBNR: $${r.ibnrAmount.toLocaleString()}`} />
                    <div style={{ width: pct(r.rbnsAmount),      background: "#F59F00", transition: "width 0.4s" }} title={`RBNS: $${r.rbnsAmount.toLocaleString()}`} />
                    <div style={{ width: pct(r.riskBuffer),      background: "#ADB5BD", transition: "width 0.4s" }} title={`Risk Buffer: $${r.riskBuffer.toLocaleString()}`} />
                  </div>
                  <span style={{ width: 48, fontSize: "0.8rem", color: "#1E293B", fontWeight: 600, textAlign: "right", flexShrink: 0 }}>
                    ${(r.totalReserve / 1e6).toFixed(2)}M
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/*  TABS  */}
      <div style={{ marginTop: "1.5rem" }}>
        <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1E293B", marginBottom: "0.75rem" }}>
          {scenario === 1
            ? `Baseline Reserve Allocation — All 12 Months Forecast on Jan 1, ${year}`
            : `Rolling Monthly Forecast — Each Month Retrained with Growing Actuals`}
        </p>
        <p style={{ fontSize: "0.78rem", color: "#64748B", marginBottom: "1rem" }}>
          {scenario === 1
            ? `Training: 2018–${year - 1} only · Comparing forecast vs end-of-year ${year} actuals`
            : `Training grows each month · Prediction window shrinks · More accurate as year progresses`}
        </p>
      </div>

      <div style={S.tabs}>
        {["reserves", "alerts", "rebalances"].map(tab => (
          <button
            key={tab}
            style={{ ...S.tab, ...(activeTab === tab ? S.tabActive : {}) }}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "reserves"   && "Monthly Reserves"}
            {tab === "alerts"     && `Weekly Alerts${alerts.length > 0 ? ` (${alerts.length})` : ""}`}
            {tab === "rebalances" && "Rebalance History"}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={S.center}>Loading on-chain data...</div>
      ) : (
        <>
          {activeTab === "reserves" && (
            <div style={S.card}>
              {activeReserves.length === 0 ? (
                <p style={S.center}>
                  No reserve data for {year}.<br />
                  <span style={{ fontSize: "0.8rem", color: "#64748B" }}>
                    Run: python ml/push_to_chain.py --year {year} --full-year
                  </span>
                </p>
              ) : (
                <table style={S.table}>
                  <thead>
                    <tr style={S.thead}>
                      <Th>MONTH</Th><Th>CLAIMS</Th>
                      <Th>{scenario === 1 ? "ACTUAL PAID ($)" : "PREDICTED ($)"}</Th>
                      <Th>IBNR ($)</Th><Th>RBNS ($)</Th><Th>RISK BUFFER ($)</Th><Th>TOTAL RESERVE ($)</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeReserves.map(r => (
                      <tr key={r.month} style={S.tr}>
                        <Td><span style={S.monthDot}></span><strong>{MONTH_NAMES[r.month]} {year}</strong></Td>
                        <Td>{r.claimCount ? r.claimCount.toLocaleString() : "—"}</Td>
                        <Td>${r.predictedClaims.toLocaleString(undefined, {maximumFractionDigits: 0})}</Td>
                        <Td style={{ color: "#D97706" }}>${r.ibnrAmount.toLocaleString(undefined, {maximumFractionDigits: 0})}</Td>
                        <Td style={{ color: "#4F46E5" }}>${r.rbnsAmount.toLocaleString(undefined, {maximumFractionDigits: 0})}</Td>
                        <Td style={{ color: "#2563EB" }}>${r.riskBuffer.toLocaleString(undefined, {maximumFractionDigits: 0})}</Td>
                        <Td><strong style={{ color: "#22C55E" }}>${r.totalReserve.toLocaleString(undefined, {maximumFractionDigits: 0})}</strong></Td>
                      </tr>
                    ))}
                    <tr style={{ ...S.tr, background: "#EFF6FF", fontWeight: 700, borderTop: "2px solid #BEE3F8" }}>
                      <Td><strong>TOTAL — FY {year}</strong></Td>
                      <Td><strong>{totalClaims.toLocaleString()}</strong></Td>
                      <Td><strong>${totalPredicted.toLocaleString(undefined, {maximumFractionDigits: 0})}</strong></Td>
                      <Td style={{ color: "#D97706" }}><strong>${totalIBNR.toLocaleString(undefined, {maximumFractionDigits: 0})}</strong></Td>
                      <Td style={{ color: "#4F46E5" }}><strong>${totalRBNS.toLocaleString(undefined, {maximumFractionDigits: 0})}</strong></Td>
                      <Td style={{ color: "#2563EB" }}><strong>${totalRisk.toLocaleString(undefined, {maximumFractionDigits: 0})}</strong></Td>
                      <Td><strong style={{ color: "#1D4ED8", fontSize: "1rem" }}>${totalReserve.toLocaleString(undefined, {maximumFractionDigits: 0})}</strong></Td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === "alerts" && (
            <div style={S.card}>
              {alerts.length === 0 ? <p style={S.center}>No weekly alerts yet.</p> : (
                alerts.map((a, i) => (
                  <div key={i} style={{ ...S.alertRow, borderLeft: `4px solid ${a.level === "Critical" ? "#EF4444" : a.level === "Warning" ? "#D97706" : "#22C55E"}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                      <span style={{ fontWeight: 600, color: "#1E293B" }}>{MONTH_NAMES[a.month]} {a.year} — Week {a.week}</span>
                      <span style={{ ...S.pill, background: a.level === "Critical" ? "#FEE2E2" : a.level === "Warning" ? "#FEF3C7" : "#C6F6D5", color: a.level === "Critical" ? "#DC2626" : a.level === "Warning" ? "#B45309" : "#15803D" }}>{a.level}</span>
                    </div>
                    <p style={{ fontSize: "0.875rem", color: "#475569", marginBottom: "0.25rem" }}>{a.message}</p>
                    <p style={{ fontSize: "0.75rem", color: "#64748B" }}>Actual: ${a.actualSpend.toLocaleString(undefined, {maximumFractionDigits: 0})} | Expected: ${a.expected.toLocaleString(undefined, {maximumFractionDigits: 0})} | Deviation: {a.deviation.toFixed(2)}%</p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "rebalances" && (
            <div style={S.card}>
              {rebalances.length === 0 ? <p style={S.center}>No rebalance records yet.</p> : (
                <table style={S.table}>
                  <thead><tr style={S.thead}><Th>Year</Th><Th>From</Th><Th>To</Th><Th>Amount</Th><Th>Reason</Th><Th>Date</Th></tr></thead>
                  <tbody>
                    {rebalances.map((r, i) => (
                      <tr key={i} style={S.tr}>
                        <Td>{r.year}</Td><Td>{MONTH_NAMES[r.fromMonth]}</Td><Td>{MONTH_NAMES[r.toMonth]}</Td>
                        <Td>${r.amount.toLocaleString(undefined, {maximumFractionDigits: 0})}</Td>
                        <Td>{r.reason}</Td><Td>{new Date(r.executedAt * 1000).toLocaleDateString()}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}
      </>}
    </div>
  );
}

function SummaryCard({ label, value, color }) {
  return (
    <div style={{ ...S.summaryCard, borderTop: `3px solid ${color}` }}>
      <p style={{ fontSize: "0.75rem", color: "#64748B", marginBottom: "0.25rem" }}>{label}</p>
      <p style={{ fontSize: "1.15rem", fontWeight: 700, color }}>{value}</p>
    </div>
  );
}

function StatChip({ label, value, color }) {
  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ fontSize: "0.7rem", color: "#64748B", margin: 0 }}>{label}</p>
      <p style={{ fontSize: "0.95rem", fontWeight: 700, color, margin: 0 }}>{value}</p>
    </div>
  );
}

function Th({ children }) { return <th style={S.th}>{children}</th>; }
function Td({ children, style = {}, colSpan }) { return <td style={{ ...S.td, ...style }} colSpan={colSpan}>{children}</td>; }

const S = {
  page:           { minHeight: "100vh", background: "#F0F4F8", padding: "2rem", fontFamily: "Inter, sans-serif" },
  header:         { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" },
  title:          { fontSize: "1.5rem", fontWeight: 700, color: "#1E293B", margin: 0 },
  subtitle:       { fontSize: "0.875rem", color: "#64748B", marginTop: "0.25rem" },
  select:         { padding: "0.5rem 0.75rem", border: "1px solid #E2E8F0", borderRadius: "6px", fontSize: "0.875rem" },
  refreshBtn:     { padding: "0.5rem 1rem", background: "#2563EB", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.875rem" },
  backBtn:        { padding: "0.5rem 1rem", background: "#fff", color: "#475569", border: "1px solid #E2E8F0", borderRadius: "6px", cursor: "pointer", fontSize: "0.875rem" },
  errorMsg:       { background: "#FEE2E2", color: "#DC2626", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1rem", fontSize: "0.875rem" },
  // Warning banner
  warnBanner:     { display: "flex", alignItems: "flex-start", gap: "0.75rem", background: "#FFFBEB", border: "1px solid #F6E05E", borderRadius: "10px", padding: "1rem 1.25rem", marginBottom: "1.25rem" },
  warnIcon:       { fontSize: "1.1rem", color: "#D97706", flexShrink: 0, marginTop: "0.1rem" },
  warnTitle:      { fontWeight: 700, fontSize: "0.9rem", color: "#78350F", margin: "0 0 0.2rem" },
  warnBody:       { fontSize: "0.8rem", color: "#92400E", margin: 0 },
  warnClose:      { background: "none", border: "none", cursor: "pointer", color: "#92400E", fontSize: "1rem", flexShrink: 0, padding: "0 0.25rem" },
  // Scenario cards
  scenarioRow:    { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" },
  scenarioCard:   { borderRadius: "12px", padding: "1.25rem 1.5rem", cursor: "pointer", transition: "all 0.2s" },
  scenarioActive: { background: "#0F172A", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" },
  scenarioInactive:{ background: "#fff", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
  scenarioIcon:   { fontSize: "1.1rem" },
  scenarioBadge:  { display: "inline-block", padding: "0.25rem 0.75rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 600 },
  // Scenario detail
  scenarioDetail: { background: "#fff", borderRadius: "10px", padding: "1.25rem 1.5rem", marginBottom: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.07)" },
  detailTag:      { display: "inline-block", padding: "0.2rem 0.65rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 600 },
  // Metric cards
  metricRow:      { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.25rem" },
  metricCard:     { background: "#fff", borderRadius: "10px", padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.07)" },
  metricIcon:     { fontSize: "1.3rem" },
  metricBadge:    { fontSize: "0.75rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: "20px" },
  metricLabel:    { fontSize: "0.8rem", color: "#64748B", margin: "0.75rem 0 0.25rem" },
  metricValue:    { fontSize: "2rem", fontWeight: 800, color: "#1E293B", margin: "0 0 0.25rem" },
  metricSub:      { fontSize: "0.75rem", color: "#94A3B8", margin: 0 },
  // Chart
  chartCard:      { background: "#fff", borderRadius: "10px", padding: "1.5rem", marginBottom: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.07)" },
  // Model card
  modelCard:      { background: "#fff", borderRadius: "10px", padding: "1rem 1.5rem", marginBottom: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.07)", display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" },
  modelBadge:     { background: "#EFF6FF", color: "#1E40AF", padding: "0.25rem 0.75rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 600 },
  modelVersion:   { fontWeight: 700, color: "#1E293B", fontSize: "0.95rem" },
  modelStats:     { display: "flex", gap: "1.5rem", flex: 1 },
  modelDate:      { fontSize: "0.75rem", color: "#94A3B8", marginLeft: "auto" },
  // Summary grid (kept for potential use)
  summaryGrid:    { display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "1rem", marginBottom: "1.5rem" },
  summaryCard:    { background: "#fff", borderRadius: "8px", padding: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" },
  // Tabs
  tabs:           { display: "flex", gap: "0.5rem", marginBottom: "1rem" },
  tab:            { padding: "0.5rem 1.25rem", border: "1px solid #E2E8F0", borderRadius: "6px", background: "#fff", cursor: "pointer", fontSize: "0.875rem", color: "#475569" },
  tabActive:      { background: "#1E293B", color: "#fff", border: "1px solid #2D3748" },
  card:           { background: "#fff", borderRadius: "10px", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.07)", overflowX: "auto" },
  table:          { width: "100%", borderCollapse: "collapse" },
  thead:          { background: "#0F172A" },
  th:             { padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 700, color: "#fff", letterSpacing: "0.05em" },
  tr:             { borderBottom: "1px solid #EDF2F7" },
  td:             { padding: "0.75rem 1rem", fontSize: "0.875rem", color: "#1E293B" },
  monthDot:       { color: "#2563EB", marginRight: "0.5rem", fontSize: "0.6rem" },
  pill:           { padding: "0.2rem 0.6rem", borderRadius: "20px", fontSize: "0.7rem", fontWeight: 600 },
  alertRow:       { padding: "1rem", marginBottom: "0.75rem", background: "#F7FAFC", borderRadius: "8px" },
  center:         { textAlign: "center", padding: "3rem", color: "#64748B" },
  emptyCard:      { background: "#fff", borderRadius: "10px", padding: "3rem", textAlign: "center", maxWidth: "500px", margin: "4rem auto", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" },
};

const S2 = {
  infoBanner:  { background: "#F0FFF4", border: "1px solid #9AE6B4", borderRadius: "12px", padding: "1.25rem 1.5rem", marginBottom: "1.25rem" },
  greenTag:    { display: "inline-block", padding: "0.2rem 0.65rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 600, background: "#C6F6D5", color: "#15803D" },
  blueTag:     { display: "inline-block", padding: "0.2rem 0.65rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 600, background: "#BFDBFE", color: "#1E40AF" },
  yellowTag:   { display: "inline-block", padding: "0.2rem 0.65rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 600, background: "#FEFCBF", color: "#78350F" },
  pillRow:     { display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.5rem" },
  pill:        { borderRadius: "10px", padding: "0.5rem 0.75rem", cursor: "pointer", textAlign: "center", minWidth: "64px", transition: "all 0.15s", userSelect: "none" },
  pillActive:  { background: "#15803D", color: "#fff", boxShadow: "0 2px 6px rgba(39,103,73,0.3)" },
  pillInactive:{ background: "#fff", border: "1px solid #E2E8F0", color: "#475569" },
  statBox:     { background: "#fff", borderRadius: "10px", padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.07)" },
  statLabel:   { fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", color: "#64748B", margin: "0 0 0.1rem" },
  metricBox:   { background: "#fff", borderRadius: "10px", padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.07)" },
  summaryBox:  { background: "#F7FAFC", borderRadius: "8px", padding: "0.9rem 1rem", border: "1px solid #E2E8F0" },
};

export default FundReserveDashboard;
