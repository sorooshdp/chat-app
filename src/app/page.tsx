import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button"
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-black">
      <div>
        <header className="container mx-auto py-6 px-14 flex justify-between items-centerr">
          <div className="flex items-center gap-2 px-4">
            <MessageSquare className="h-6 w-6 text-blue-600"/>
            <span className="font-bold text-xl text-amber-50">Nexus</span>
          </div>
          <nav className="md:flex gap-8 justify-center items-center">
              <Link href="/features" className="text-amber-50 hover:text-blue-500 transition-colors">Features</Link>
              <Link href="/pricing" className="text-amber-50 hover:text-blue-500 transition-colors">Pricing</Link>
              <Link href="/about" className="text-amber-50 hover:text-blue-500 transition-colors">About</Link>
          </nav>
          <div className="flex gap-4">
            <Button variant="ghost" className=" text-amber-50 hover:bg-amber-50 hover:text-blue-400">
              <Link href="/login">Log in</Link>
            </Button>
            <Button className=" text-amber-50 bg-blue-600 hover:bg-blue-500">
              <Link href="/signup">Sign up</Link>
            </Button>
          </div>
        </header>
        <main>

        </main>
        <section>

        </section>
        <footer>

        </footer>
      </div>
    </div>
  );
}
