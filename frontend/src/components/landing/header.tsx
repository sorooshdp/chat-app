import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";
import { NavLink, Sidebar } from "./side-bar";
import { Button } from "../ui/button";
import { useState } from "react";

const NAV_LINKS: ReadonlyArray<NavLink> = [
  { href: "/signup", label: "Get Started" },
  { href: "/login", label: "Log in" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#about", label: "About" },
] as const;

export default function Header() {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  return (
    <>
      <header className="container mx-auto py-6 px-4 md:px-14 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Image src="/nexus.png" alt="Logo" width={40} height={40} />
          <span className="font-bold text-xl text-amber-50">Nexus</span>
        </div>

        {/* Desktop Navigation - Hidden on small screens */}
        <nav className="hidden md:flex gap-8 justify-center items-center">
          {NAV_LINKS.filter((link) => !["/login", "/signup"].includes(link.href)).map((link) => (
            <Link key={link.href} href={link.href} className="text-amber-50 hover:text-blue-500 transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Action buttons - Hidden on small screens */}
        <div className="hidden md:flex gap-4">
          <Button variant="ghost" className="text-amber-50 hover:bg-amber-50 hover:text-blue-400">
            <Link href="/login">Log in</Link>
          </Button>
          <Button className="text-amber-50 bg-blue-600 hover:bg-blue-500">
            <Link href="/signup">Sign up</Link>
          </Button>
        </div>

        {/* Mobile menu button - Visible only on small screens */}
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="md:hidden p-2 rounded-md hover:bg-slate-800 text-amber-50 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>
      {/* Sidebar for mobile */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} links={NAV_LINKS} />
    </>
  );
}
