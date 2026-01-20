'use client';

import { motion } from "framer-motion";
import Link from "next/link";
import { PiCalendar, PiArrowRight, PiStar, PiUsers, PiMedal } from "react-icons/pi";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-dots">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-accent/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8 text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent-dark font-medium text-sm">
              <PiStar className="w-4 h-4 fill-accent text-accent" />
              Rated 4.9/5 by 2000+ Students
            </div>

            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              Master Your
              <span className="block text-gradient-primary">English Tests</span>
              <span className="text-accent">One-on-One</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-lg leading-relaxed mx-auto lg:mx-0">
              Book personalized individual classes for PTE, IELTS, and CELPIP. 
              Choose online or physical sessions at times that work for you.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/booking">
                <Button size="lg" className="btn-accent text-lg px-8 py-6 group">
                  <PiCalendar className="w-5 h-5 mr-2" />
                  Book Your Class
                  <PiArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/courses">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2 hover:bg-primary hover:text-primary-foreground">
                  Explore Courses
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-8 pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-display font-bold text-xl">5000+</p>
                  <p className="text-sm text-muted-foreground">Happy Students</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Award className="w-6 h-6 text-accent-dark" />
                </div>
                <div>
                  <p className="font-display font-bold text-xl">95%</p>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Content - Hero Image/Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="relative">
              {/* Main Card */}
              <div className="glass-card rounded-3xl p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
                    <PiCalendar className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-xl">Easy Booking</h3>
                    <p className="text-muted-foreground">Pick your date & time</p>
                  </div>
                </div>

                {/* Mini Calendar Preview */}
                <div className="bg-white rounded-2xl p-4 border border-border">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-semibold">January 2025</span>
                    <div className="flex gap-2">
                      <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                        ←
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                        →
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-2 text-center text-sm">
                    {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                      <div key={i} className="text-muted-foreground font-medium py-1">
                        {day}
                      </div>
                    ))}
                    {[...Array(31)].map((_, i) => (
                      <div
                        key={i}
                        className={`py-2 rounded-lg transition-all cursor-pointer ${
                          i === 14
                            ? "bg-accent text-accent-foreground font-semibold"
                            : i === 15 || i === 16 || i === 20
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-secondary"
                        }`}
                      >
                        {i + 1}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Available slots indicator */}
                <div className="flex items-center gap-4 p-4 bg-success/10 rounded-xl">
                  <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
                  <span className="text-sm font-medium text-success">12 slots available this week</span>
                </div>
              </div>

              {/* Floating elements */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-6 -right-6 bg-white rounded-2xl p-4 shadow-xl"
              >
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                    <span className="text-lg">🎯</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">PTE Academic</p>
                    <p className="text-xs text-muted-foreground">Score 79+</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-4 -left-6 bg-white rounded-2xl p-4 shadow-xl"
              >
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">A</div>
                    <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-medium">B</div>
                    <div className="w-8 h-8 rounded-full bg-success text-success-foreground flex items-center justify-center text-sm font-medium">C</div>
                  </div>
                  <span className="text-sm font-medium">+2.5k enrolled</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
