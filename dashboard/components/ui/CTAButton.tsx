import React from "react";

export default function CTAButton({
  children,
  href,
  className = "",
  ...props
}: any) {
  // Updated: Flat blue button for light mode clarity (matches Upwork style)
  const base =
    "inline-block bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:bg-blue-700 hover:shadow-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500";
  if (href) {
    return (
      <a href={href} className={`${base} ${className}`} {...props}>
        {children}
      </a>
    );
  }

  return (
    <button className={`${base} ${className}`} {...props}>
      {children}
    </button>
  );
}
