import React from "react";
import TestimonialCard from "./TestimonialCard";
import testimonials from "../data/testimonials.json";

type Testimonial = {
  id: string;
  name: string;
  role?: string;
  quote: string;
  avatar?: string;
  title?: string;
  rating?: number;
};

export default function Testimonials(): React.ReactElement {
  const items: Testimonial[] = (testimonials as unknown as Testimonial[]) || [];

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-900">
          What early users say
        </h2>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
          {items.map((t) => (
            <TestimonialCard
              key={t.id}
              name={t.name}
              role={t.role || t.title}
              quote={t.quote}
              avatar={t.avatar}
              rating={t.rating}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
