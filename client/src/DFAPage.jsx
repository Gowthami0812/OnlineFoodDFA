
import React from "react";
import "./DFAPage.css";
const states = [
  { id: "q0", name: "PLACED" },
  { id: "q1", name: "PREPARING" },
  { id: "q2", name: "READY_FOR_PICKUP" },
  { id: "q3", name: "OUT_FOR_DELIVERY" },
  { id: "q4", name: "DELIVERED" },
];

const transitions = [
  { current: "q0 — PLACED", input: "a", next: "q1 — PREPARING", meaning: "Order preparation begins" },
  { current: "q1 — PREPARING", input: "b", next: "q2 — READY_FOR_PICKUP", meaning: "Order is ready for pickup" },
  { current: "q2 — READY_FOR_PICKUP", input: "c", next: "q3 — OUT_FOR_DELIVERY", meaning: "Order goes out for delivery" },
  { current: "q3 — OUT_FOR_DELIVERY", input: "d", next: "q4 — DELIVERED", meaning: "Order is delivered" },
  { current: "q4 — DELIVERED", input: "Any further input", next: "Rejected", meaning: "No further transition allowed" },
];

export default function DFAPage() {
  return (
    <main className="dfa-page">
      <header className="dfa-heading">
        <p className="dfa-label">FLAT INDIVIDUAL PROJECT</p>
        <h1>FoodFlow DFA</h1>
        <p>
          Online Food Ordering and Delivery Tracking System
          using Deterministic Finite Automaton
        </p>
      </header>

      <section className="dfa-card">
        <h2>1. DFA State Transition Diagram</h2>
        <p className="dfa-description">
          Each state represents one stage of the food delivery process.
          Only the forward transitions shown below are permitted.
        </p>

        <div className="dfa-diagram-scroll">
          <svg
            className="dfa-svg"
            viewBox="0 0 1100 280"
            role="img"
            aria-label="DFA diagram with five delivery states and four forward transitions"
          >
            <defs>
              <marker
                id="dfa-arrow"
                markerWidth="9"
                markerHeight="9"
                refX="7"
                refY="3"
                orient="auto"
              >
                <path d="M0,0 L0,6 L8,3 z" fill="#2563eb" />
              </marker>
            </defs>

            <text x="550" y="30" textAnchor="middle" className="dfa-svg-title">
              Valid Delivery State Sequence
            </text>

            <path d="M25 135 H48" className="dfa-start-arrow" />
            <path d="M25 135 H48" className="dfa-arrow" />

            {[105, 325, 545, 765, 985].map((x, i) => (
              <g key={states[i].id}>
                <circle
                  cx={x}
                  cy="135"
                  r="49"
                  className={i === 4 ? "dfa-final-state" : "dfa-state"}
                />
                {i === 4 && (
                  <circle cx={x} cy="135" r="42" className="dfa-final-inner" />
                )}
                <text x={x} y="128" textAnchor="middle" className="dfa-state-id">
                  {states[i].id}
                </text>
                <text x={x} y="148" textAnchor="middle" className="dfa-state-name">
                  {["PLACED", "PREPARING", "READY", "OUT FOR", "DELIVERED"][i]}
                </text>
                {i === 2 && (
                  <text x={x} y="164" textAnchor="middle" className="dfa-state-name">
                    PICKUP
                  </text>
                )}
                {i === 3 && (
                  <text x={x} y="164" textAnchor="middle" className="dfa-state-name">
                    DELIVERY
                  </text>
                )}
              </g>
            ))}

            {[154, 374, 594, 814].map((x, i) => (
              <g key={x}>
                <path
                  d={`M${x} 135 H${x + 120}`}
                  className="dfa-arrow"
                  markerEnd="url(#dfa-arrow)"
                />
                <text x={x + 60} y="112" textAnchor="middle" className="dfa-input">
                  {["a", "b", "c", "d"][i]}
                </text>
              </g>
            ))}

            <text x="550" y="230" textAnchor="middle" className="dfa-svg-note">
              Initial state: q0 (PLACED)
            </text>
            <text x="550" y="252" textAnchor="middle" className="dfa-svg-final-note">
              Final state: q4 (DELIVERED)
            </text>
          </svg>
        </div>

        <div className="dfa-legend">
          <span><b>a</b> — Begin preparation</span>
          <span><b>b</b> — Ready for pickup</span>
          <span><b>c</b> — Out for delivery</span>
          <span><b>d</b> — Delivered</span>
        </div>
      </section>

      <section className="dfa-card">
        <h2>2. DFA Transition Table</h2>
        <div className="dfa-table-scroll">
          <table className="dfa-table">
            <thead>
              <tr>
                <th>Current State</th>
                <th>Input</th>
                <th>Next State</th>
                <th>Meaning</th>
              </tr>
            </thead>
            <tbody>
              {transitions.map((t, i) => (
                <tr key={i}>
                  <td>{t.current}</td>
                  <td><code>{t.input}</code></td>
                  <td className={i === 4 ? "dfa-rejected" : ""}>{t.next}</td>
                  <td>{t.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="dfa-card">
        <h2>3. Formal Definition</h2>
        <p className="dfa-formula">M = (Q, Σ, δ, q0, F)</p>
        <ul className="dfa-definition">
          <li><b>Q:</b> {"{q0, q1, q2, q3, q4}"} — finite set of states</li>
          <li><b>Σ:</b> {"{a, b, c, d}"} — input alphabet</li>
          <li><b>δ:</b> Transition function defining valid state changes</li>
          <li><b>q0:</b> Initial state, PLACED</li>
          <li><b>F:</b> {"{q4}"} — final state, DELIVERED</li>
        </ul>
      </section>

      <section className="dfa-card dfa-rule">
        <h2>4. DFA Validation Rule</h2>
        <p>
          FoodFlow allows only the next valid delivery state.
          For example, PLACED → PREPARING is accepted, while
          DELIVERED → PREPARING is rejected.
        </p>
        <p>
          The symbols a, b, c, and d are theoretical input labels
          for the FLAT model. The application itself uses named
          delivery statuses.
        </p>
      </section>
    </main>
  );
}
