import { MessageSquare} from "lucide-react";
import { Button } from "@/components/ui/button"
import Link from "next/link";
import TypeAnimation from "@/components/ui/typeAnimation";

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
        <div className="bg-[radial-gradient(circle,rgba(255,255,255,1)_1%,rgba(255,255,255,0.05)_100%)] mx-auto h-0.5 opacity-50 "></div>
        <main className="">
          <div className="container text-amber-50">
            <TypeAnimation speed={30} />
          </div>
        </main>
        <section>

        </section>
        <footer className="text-amber-50 border-slate-700 border-t">
          <div className="container mx-auto gap-4 text-center text-slate-400">
            <div className="flex justify-center gap-6 mb-6">
              <Link href="" className="hover:text-amber-50 transition-colors">Terms</Link>
              <Link href="#" className="hover:text-amber-50 transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-amber-50 transition-colors">Contact</Link>
            </div>
            <p>© 2025 All lefts reserved 🤭.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
