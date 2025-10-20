import React from 'react';

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
}

export function SkipLink({ href, children }: SkipLinkProps) {
  return (
    <a
      href={href}
      className="skip-link focus:top-6 focus:left-6 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium z-50 absolute -top-10 left-6 transition-all duration-200"
      onFocus={(e) => {
        // Ensure the link is visible when focused
        e.currentTarget.style.top = '1.5rem';
      }}
      onBlur={(e) => {
        // Hide the link when focus is lost
        e.currentTarget.style.top = '-2.5rem';
      }}
    >
      {children}
    </a>
  );
}