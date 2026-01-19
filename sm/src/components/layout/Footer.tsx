import { Link } from "react-router-dom";
import { BookOpen, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-accent-foreground" />
              </div>
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
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 rounded-full bg-white/10 hover:bg-accent hover:text-accent-foreground transition-all">
                <Instagram className="w-5 h-5" />
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
                <Link to="/courses" className="text-primary-foreground/80 hover:text-accent transition-colors">
                  Our Courses
                </Link>
              </li>
              <li>
                <Link to="/booking" className="text-primary-foreground/80 hover:text-accent transition-colors">
                  Book a Class
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-primary-foreground/80 hover:text-accent transition-colors">
                  Student Dashboard
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-primary-foreground/80 hover:text-accent transition-colors">
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
                <Link to="/courses#pte" className="text-primary-foreground/80 hover:text-accent transition-colors">
                  PTE Academic
                </Link>
              </li>
              <li>
                <Link to="/courses#ielts" className="text-primary-foreground/80 hover:text-accent transition-colors">
                  IELTS Preparation
                </Link>
              </li>
              <li>
                <Link to="/courses#celpip" className="text-primary-foreground/80 hover:text-accent transition-colors">
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
                  123 Education Street, Learning City, LC 12345
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-accent flex-shrink-0" />
                <a href="tel:+11234567890" className="text-primary-foreground/80 hover:text-accent transition-colors">
                  +1 (123) 456-7890
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-accent flex-shrink-0" />
                <a href="mailto:hello@smartlabs.edu" className="text-primary-foreground/80 hover:text-accent transition-colors">
                  hello@smartlabs.edu
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-primary-foreground/60 text-sm">
            © {new Date().getFullYear()} SmartLabs. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="text-primary-foreground/60 hover:text-accent transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-primary-foreground/60 hover:text-accent transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
