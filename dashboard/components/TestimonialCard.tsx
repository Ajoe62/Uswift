import React from 'react'
import { StarIcon, UserCircleIcon } from '@heroicons/react/24/solid'

type Props = {
  id?: string
  name: string
  role?: string
  quote: string
  avatar?: string
  rating?: number
}

export default function TestimonialCard({
  id,
  name,
  role,
  quote,
  avatar,
  rating = 5,
}: Props) {
  const stars = Array.from({ length: 5 }).map((_, i) => i < rating)
  const headingId = id ? `${id}-name` : `${name.replace(/\s+/g, '-').toLowerCase()}-name`

  return (
    <article
      data-animate="reveal"
      className="card bg-white rounded-lg shadow p-4 sm:p-5 border border-gray-100 card-magic" // Changed: p-4 for mobile, sm:p-5 for larger screens
      role="article"
      aria-labelledby={headingId}
    >
      <div className="flex flex-col sm:flex-row items-start gap-4"> {/* Changed: flex-col for mobile, sm:flex-row for larger screens */}
        {avatar ? (
          <img
            src={avatar}
            alt={`${name} avatar`}
            className="w-12 h-12 rounded-full object-cover mx-auto sm:mx-0" // Changed: mx-auto for mobile, sm:mx-0 for larger screens
            data-parallax="0.12"
          />
        ) : (
          <div
            className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mx-auto sm:mx-0" // Changed: mx-auto for mobile, sm:mx-0 for larger screens
            aria-hidden="true"
            data-parallax="0.12"
          >
            <UserCircleIcon className="h-10 w-10" aria-hidden />
          </div>
        )}

        <div className="flex-1 mt-4 sm:mt-0"> {/* Changed: mt-4 for mobile, sm:mt-0 for larger screens */}
          <blockquote
            className="text-sm sm:text-base text-gray-700 italic" // Changed: text-sm for mobile, sm:text-base for larger screens
            aria-label={`Quote from ${name}`}
            role="blockquote"
          >
            “{quote}”
          </blockquote>

          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0"> {/* Changed: flex-col for mobile, sm:flex-row for larger screens; gap-2 for mobile, sm:gap-0 for larger screens */}
            <div className="text-center sm:text-left"> {/* Changed: text-center for mobile, sm:text-left for larger screens */}
              <h4 id={headingId} className="font-semibold text-gray-900">
                {name}
              </h4>
              {role && <div className="text-xs sm:text-sm text-gray-500">{role}</div>} {/* Changed: text-xs for mobile, sm:text-sm for larger screens */}
            </div>

            <div className="flex items-center gap-1 mt-2 sm:mt-0" aria-hidden="true"> {/* Changed: mt-2 for mobile, sm:mt-0 for larger screens */}
              {stars.map((filled, i) => (
                <StarIcon
                  key={i}
                  className={`h-4 w-4 ${filled ? 'text-yellow-400' : 'text-gray-200'}`}
                  aria-hidden="true"
                />
              ))}
              <span className="sr-only">{rating} out of 5 stars</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}