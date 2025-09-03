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
      className="card bg-white rounded-lg shadow p-5 border border-gray-100 card-magic"
      role="article"
      aria-labelledby={headingId}
    >
      <div className="flex items-start gap-4">
        {avatar ? (
          <img
            src={avatar}
            alt={`${name} avatar`}
            className="w-12 h-12 rounded-full object-cover"
            data-parallax="0.12"
          />
        ) : (
          <div
            className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400"
            aria-hidden="true"
            data-parallax="0.12"
          >
            <UserCircleIcon className="h-10 w-10" aria-hidden />
          </div>
        )}

        <div className="flex-1">
          <blockquote
            className="text-gray-700 italic"
            aria-label={`Quote from ${name}`}
            role="blockquote"
          >
            “{quote}”
          </blockquote>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <h4 id={headingId} className="font-semibold text-gray-900">
                {name}
              </h4>
              {role && <div className="text-sm text-gray-500">{role}</div>}
            </div>

            <div className="flex items-center gap-1" aria-hidden="true">
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