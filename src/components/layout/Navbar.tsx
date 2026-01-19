
'use client';

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Calendar, User, LogOut, Shield, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useAuth } from "@/firebase";
import { useUserProfile } from "@/hooks/useUserProfile";
import { signOut } from "firebase/auth";

const navLinks = [
  { path: "/", label: "Home" },
  { path: "/courses", label: "Courses" },
  { path: "/booking", label: "Book a Class" },
  { path: "/contact", label: "Contact" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, profile, isLoading } = useUserProfile();
  const auth = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth);
      router.push("/");
    }
  };

  return (
    <header className="fixed top-9 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="SmartLabs Logo" width={40} height={40} className="rounded-xl" />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`nav-link animated-underline ${
                  pathname === link.path ? "active" : ""
                }`}
              >
                {link.label}
              </Link>
            ))}
             {profile?.role === 'admin' && (
              <Link href="/admin" className="nav-link animated-underline flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Admin
              </Link>
            )}
          </div>

          <div className="hidden md:flex items-center gap-4">
            {isLoading ? (
              <div />
            ) : user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" className="font-medium">
                    <User className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <a href="https://www.smartlabs.lk" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="font-medium">
                    <ExternalLink className="w-4 h-4 mr-2"/>
                    Main Site
                  </Button>
                </a>
                <Button onClick={handleSignOut} variant="ghost">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="font-medium">
                    Sign In
                  </Button>
                </Link>
                <a href="https://www.smartlabs.lk" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="font-medium">
                    <ExternalLink className="w-4 h-4 mr-2"/>
                    Main Site
                  </Button>
                </a>
                <Link href="/booking">
                  <Button className="btn-accent">
                    <Calendar className="w-4 h-4 mr-2" />
                    Book Now
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-xl hover:bg-secondary transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-border overflow-hidden"
          >
            <div className="container mx-auto px-4 py-6 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`block py-3 px-4 rounded-xl transition-colors ${
                    pathname === link.path
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-secondary"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
               {profile?.role === 'admin' && (
                  <Link href="/admin" onClick={() => setIsOpen(false)} className="block py-3 px-4 rounded-xl hover:bg-secondary">
                    Admin
                  </Link>
               )}
              <div className="pt-4 border-t border-border space-y-3">
                {user ? (
                  <>
                    <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" className="w-full">
                        <User className="w-4 h-4 mr-2" />
                        Dashboard
                      </Button>
                    </Link>
                    <a href="https://www.smartlabs.lk" target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="w-full">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Main Site
                      </Button>
                    </a>
                    <Button onClick={() => { handleSignOut(); setIsOpen(false); }} className="w-full">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" className="w-full">
                        <User className="w-4 h-4 mr-2" />
                        Sign In
                      </Button>
                    </Link>
                    <a href="https://www.smartlabs.lk" target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="w-full">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Main Site
                      </Button>
                    </a>
                    <Link href="/booking" onClick={() => setIsOpen(false)}>
                      <Button className="w-full btn-accent">
                        <Calendar className="w-4 h-4 mr-2" />
                        Book Now
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
