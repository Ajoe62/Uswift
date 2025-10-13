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

export default function TestimonialCard({ name, role, quote, avatar, rating = 5 }: Props) {
  const stars = Array.from({ length: 5 }).map((_, i) => i < rating)

  return (
    <article className="bg-white rounded-lg shadow p-5 border border-gray-100 card-magic">
      <div className="flex items-start gap-4">
        {avatar ? (
          <img src={avatar} alt={`${name} avatar`} className="w-12 h-12 rounded-full object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
            <UserCircleIcon className="h-10 w-10" aria-hidden />
          </div>
        )}
        <div className="flex-1">
          <blockquote className="text-gray-700 italic" aria-label={`Quote from ${name}`}>
            “{quote}”
          </blockquote>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <div className="font-semibold">{name}</div>
              {role && <div className="text-sm text-gray-500">{role}</div>}
            </div>
            <div className="flex items-center gap-1" aria-hidden>
              {stars.map((filled, i) => (
                <StarIcon key={i} className={`h-4 w-4 ${filled ? 'text-yellow-400' : 'text-gray-200'}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
