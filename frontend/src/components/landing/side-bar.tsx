'use client';

import Link from 'next/link';
import { X } from 'lucide-react';
import { useEffect } from 'react';

export interface NavLink {
  href: string;
  label: string;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  links: ReadonlyArray<NavLink>;
}

export function Sidebar({ isOpen, onClose, links }: SidebarProps) {
  // Prevent body scroll when sidebar is open (Performance: avoid layout thrashing)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close on Escape key (Accessibility)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar panel */}
      <aside
        className={`fixed top-0 right-0 h-full w-64 bg-slate-900 border-l border-slate-800 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Navigation sidebar"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex flex-col h-full p-6">
          {/* Close button */}
          <button
            onClick={onClose}
            className="self-end p-2 rounded-md hover:bg-slate-800 text-amber-50 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Navigation links */}
          <nav className="flex flex-col gap-6 mt-8">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className="text-amber-50 text-lg hover:text-blue-500 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
