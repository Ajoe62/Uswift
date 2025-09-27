import React from 'react'
import TestimonialCard from './TestimonialCard'
import testimonials from '../data/testimonials.json'

type Testimonial = {
  id: string
  name: string
  role?: string
  quote: string
  avatar?: string
  title?: string
  rating?: number
}

export default function Testimonials(): React.ReactElement {
  const items: Testimonial[] = (testimonials as Testimonial[]) || []

  return (
    <section className="py-10 sm:py-16 px-4 sm:px-6 bg-gray-50"> {/* Changed: reduced vertical padding for mobile, added sm: for scaling; horizontal padding scales up for larger screens */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-black"> {/* Changed: text-2xl for mobile, sm:text-3xl for larger screens */}
          What early users say
        </h2>

        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3"> {/* Changed: grid-cols-1 for mobile, sm:grid-cols-2 for tablets, md:grid-cols-3 for desktop */}
          {items.map((t, i) => (
            <TestimonialCard key={t.id || i} name={t.name} role={t.role} quote={t.quote} avatar={t.avatar} rating={t.rating} />
          ))}
        </div>
      </div>
    </section>
  )
}