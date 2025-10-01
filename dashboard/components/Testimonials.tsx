'use client'

import React from 'react'
import dynamic from 'next/dynamic'

// Lazy load TestimonialCard for better performance
const TestimonialCard = dynamic(() => import('./TestimonialCard'), {
  loading: () => (
    <div className="bg-white rounded-lg shadow p-4 sm:p-5 border border-gray-100 animate-pulse">
      <div className="flex gap-4">
        <div className="w-12 h-12 rounded-full bg-gray-200"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    </div>
  ),
})

type Testimonial = {
  id: string
  name: string
  role?: string
  quote: string
  avatar?: string
  title?: string
  rating?: number
}

// Lazy load testimonials data
const loadTestimonials = () => import('../data/testimonials.json')

export default function Testimonials(): React.ReactElement {
  const [testimonials, setTestimonials] = React.useState<Testimonial[]>([])
  const [isVisible, setIsVisible] = React.useState(false)
  const sectionRef = React.useRef<HTMLElement>(null)

  React.useEffect(() => {
    // Intersection Observer for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isVisible) {
          setIsVisible(true)
          // Load testimonials data only when section is visible
          loadTestimonials().then((data) => {
            setTestimonials((data.default || data) as Testimonial[])
          })
        }
      },
      { rootMargin: '100px' } // Load 100px before section comes into view
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [isVisible])

  return (
    <section ref={sectionRef} className="py-10 sm:py-16 px-4 sm:px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-black">
          What early users say
        </h2>

        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {isVisible && testimonials.length > 0 ? (
            testimonials.map((t, i) => (
              <TestimonialCard
                key={t.id || i}
                id={t.id}
                name={t.name}
                role={t.role}
                quote={t.quote}
                avatar={t.avatar}
                rating={t.rating}
              />
            ))
          ) : (
            // Loading skeleton while data loads
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-4 sm:p-5 border border-gray-100 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
