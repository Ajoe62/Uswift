import "./index.css";
import { useState } from "react";

const faqs = [
  {
    q: "How does Uswift automate job applications?",
    a: "Uswift uses cloud automation to apply to jobs on supported boards, even when your device is offline.",
  },
  {
    q: "Is my data secure?",
    a: "Yes, all profiles and documents are encrypted and stored securely.",
  },
  {
    q: "What are the pricing options?",
    a: "Uswift offers Free, Basic, and Premium tiers to fit your needs.",
  },
  {
    q: "How do I get support?",
    a: "You can reach out via email or live chat, depending on your subscription.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
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
        FAQ
      </h2>
      {faqs.map((faq, idx) => (
        <div
          key={idx}
          className="uswift-card"
          style={{ cursor: "pointer" }}
          onClick={() => setOpen(open === idx ? null : idx)}
        >
          <h3 style={{ fontWeight: 700 }}>{faq.q}</h3>
          {open === idx && (
            <p style={{ color: "#4B5563", marginTop: 8 }}>{faq.a}</p>
          )}
        </div>
      ))}
    </div>
  );
}
