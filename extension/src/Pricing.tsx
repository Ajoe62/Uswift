import "./index.css";

export default function Pricing() {
  return (
    <div
      style={{ background: "#FFFFFF", borderRadius: "1.5rem", padding: "2rem" }}
    >
      <div
        className="uswift-gradient"
        style={{ height: 8, borderRadius: 8, marginBottom: 24 }}
      />
      <h2
        style={{
          fontSize: "1.4rem",
          fontWeight: 700,
          color: "#111827",
          marginBottom: 16,
        }}
      >
        Pricing
      </h2>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <div className="uswift-card" style={{ flex: 1 }}>
          <h3 style={{ color: "#6D28D9", fontWeight: 700 }}>Free</h3>
          <ul>
            <li>Up to 10 auto applications/month</li>
            <li>Basic job tracking</li>
            <li>Email support</li>
          </ul>
        </div>
        <div className="uswift-card" style={{ flex: 1 }}>
          <h3 style={{ color: "#6D28D9", fontWeight: 700 }}>Basic</h3>
          <ul>
            <li>Up to 50 auto applications/month</li>
            <li>Advanced job tracking</li>
            <li>Priority email support</li>
          </ul>
        </div>
        <div className="uswift-card" style={{ flex: 1 }}>
          <h3 style={{ color: "#6D28D9", fontWeight: 700 }}>Premium</h3>
          <ul>
            <li>Unlimited auto applications</li>
            <li>Full analytics & dashboard</li>
            <li>Live chat support</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
