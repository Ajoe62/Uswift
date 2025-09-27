import React from "react";

export default function ProfileCard() {
  const id = "profile-resume-card";

  return (
    <article
      id={id}
      role="region"
      aria-labelledby={`${id}-title`}
      data-animate="reveal"
      className="card bg-white text-black rounded-lg shadow p-3 sm:p-4 mb-4 card-magic card-magic--glow transform-gpu hover:-translate-y-0.5 transition-transform" // Changed: p-3 for mobile, sm:p-4 for larger screens
    >
      <h4
        id={`${id}-title`}
        className="font-bold text-base sm:text-lg" // Changed: text-base for mobile, sm:text-lg for larger screens
        data-parallax="0.08"
      >
        Resume
      </h4>

      <p className="text-xs sm:text-sm text-gray-600 mt-1"> {/* Changed: text-xs for mobile, sm:text-sm for larger screens */}
        Last updated:{" "}
        <time dateTime="2025-08-01" aria-label="Last updated August 2025">
          Aug 2025
        </time>
      </p>
    </article>
  );
}