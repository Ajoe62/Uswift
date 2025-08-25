import React from 'react'

export default function CTAButton({ children, href, className = '', ...props }: any) {
  const base = 'inline-block bg-uswift-accent text-white px-4 py-2 rounded-lg font-bold shadow hover:brightness-90 border border-uswift-accent card-magic card-magic--glow focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-uswift-accent'
  if (href) {
    return (
      <a href={href} className={`${base} ${className}`} {...props}>
        {children}
      </a>
    )
  }

  return (
    <button className={`${base} ${className}`} {...props}>
      {children}
    </button>
  )
}
