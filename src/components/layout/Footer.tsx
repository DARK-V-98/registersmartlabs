import Link from "next/link";
import Image from "next/image";
import { PiEnvelopeSimple, PiPhone, PiMapPin, PiFacebookLogo, PiTwitterLogo, PiInstagramLogo, PiLinkedinLogo } from "react-icons/pi";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/logo.png" alt="SmartLabs Logo" width={40} height={40} className="rounded-xl" />
              <span className="font-display font-bold text-xl">SmartLabs</span>
            </Link>
            <p className="text-primary-foreground/80 leading-relaxed">
              Your trusted partner for achieving excellence in English proficiency tests. 
              Book individual classes tailored to your goals.
            </p>
            <div className="flex gap-4 pt-2">
              <a href="#" className="p-2 rounded-full bg-white/10 hover:bg-accent hover:text-accent-foreground transition-all">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 rounded-full bg-white/10 hover:bg-accent hover:text-accent-foreground transition-all">
                <PiTwitterLogo className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 rounded-full bg-white/10 hover:bg-accent hover:text-accent-foreground transition-all">
                <PiInstagramLogo className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 rounded-full bg-white/10 hover:bg-accent hover:text-accent-foreground transition-all">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold text-lg mb-6">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/courses" className="text-primary-foreground/80 hover:text-accent transition-colors">
                  Our Courses
                </Link>
              </li>
              <li>
                <Link href="/booking" className="text-primary-foreground/80 hover:text-accent transition-colors">
                  Book a Class
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-primary-foreground/80 hover:text-accent transition-colors">
                  Student Dashboard
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-primary-foreground/80 hover:text-accent transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Courses */}
          <div>
            <h4 className="font-display font-semibold text-lg mb-6">Courses</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/courses#pte" className="text-primary-foreground/80 hover:text-accent transition-colors">
                  PTE Academic
                </Link>
              </li>
              <li>
                <Link href="/courses#ielts" className="text-primary-foreground/80 hover:text-accent transition-colors">
                  IELTS Preparation
                </Link>
              </li>
              <li>
                <Link href="/courses#celpip" className="text-primary-foreground/80 hover:text-accent transition-colors">
                  CELPIP Training
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold text-lg mb-6">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <span className="text-primary-foreground/80">
                  3rd Floor, No. 326, Jana Jaya Building, Rajagiriya
                </span>
              </li>
              <li className="flex items-center gap-3">
                <PiPhone className="w-5 h-5 text-accent flex-shrink-0" />
                <span className="text-primary-foreground/80">
                  <a href="tel:0766914650" className="hover:text-accent transition-colors">076 691 4650</a> | <a href="tel:0774533233" className="hover:text-accent transition-colors">077 453 3233</a>
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-accent flex-shrink-0" />
                <a href="mailto:info@smartlabs.lk" className="text-primary-foreground/80 hover:text-accent transition-colors">
                  info@smartlabs.lk
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-primary-foreground/60 text-sm">
            © {new Date().getFullYear()} SmartLabs. All rights reserved.
          </p>
          <p className="text-primary-foreground/60 text-sm">
            Website Powered and Hosted by Esystemlk
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
