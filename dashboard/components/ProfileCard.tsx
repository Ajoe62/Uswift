import React from "react";

export default function ProfileCard() {
  const id = "profile-resume-card";

  return (
    <article
      id={id}
      role="region"
      aria-labelledby={`${id}-title`}
      data-animate="reveal"
      className="card bg-white text-black rounded-lg shadow p-4 mb-4 card-magic card-magic--glow transform-gpu hover:-translate-y-0.5 transition-transform"
    >
      <h4
        id={`${id}-title`}
        className="font-bold"
        data-parallax="0.08"
      >
        Resume
      </h4>

      <p className="text-sm text-gray-600 mt-1">
        Last updated:{" "}
        <time dateTime="2025-08-01" aria-label="Last updated August 2025">
          Aug 2025
        </time>
      </p>
    </article>
  );
}