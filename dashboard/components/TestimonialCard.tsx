"use client";

import React from "react";
import { StarIcon, UserCircleIcon } from "@heroicons/react/24/solid";

type Props = {
  id?: string;
  name: string;
  role?: string;
  quote: string;
  avatar?: string;
  rating?: number;
};

const TestimonialCard = React.memo(function TestimonialCard({
  id,
  name,
  role,
  quote,
  avatar,
  rating = 5,
}: Props) {
  const stars = Array.from({ length: 5 }).map((_, i) => i < rating);
  const headingId = id
    ? `${id}-name`
    : `${name.replace(/\s+/g, "-").toLowerCase()}-name`;

  return (
    <article className="bg-white rounded-lg shadow p-5 border border-gray-100 card-magic">
      <div className="flex items-start gap-4">
        {avatar ? (
          <img
            src={avatar}
            alt={`${name} avatar`}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
            <UserCircleIcon className="h-10 w-10" aria-hidden />
          </div>
        )}
        <div className="flex-1">
          <blockquote
            className="text-gray-700 italic"
            aria-label={`Quote from ${name}`}
          >
            â€œ{quote}â€
          </blockquote>

          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
            <div className="text-center sm:text-left">
              <h4 id={headingId} className="font-semibold text-gray-900">
                {name}
              </h4>
              {role && <div className="text-xs sm:text-sm text-gray-500">{role}</div>}
            </div>

            <div
              className="flex items-center gap-1 mt-2 sm:mt-0"
              aria-hidden="true"
            >
              {stars.map((filled, i) => (
                <StarIcon
                  key={i}
                  className={`h-4 w-4 ${filled ? "text-yellow-400" : "text-gray-200"}`}
                  aria-hidden="true"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
});

export default TestimonialCard;
