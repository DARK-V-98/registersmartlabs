'use client';

import { motion } from "framer-motion";
import Link from "next/link";
import { Calendar, ArrowRight, Star, Users, Award } from "lucide-react";
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
              <Star className="w-4 h-4 fill-accent text-accent" />
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
              <Link href="/dashboard/book">
                <Button size="lg" className="btn-accent text-lg px-8 py-6 group">
                  <Calendar className="w-5 h-5 mr-2" />
                  Book Your Class
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
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

          {/* Right Content - Hero Video */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative hidden lg:flex justify-center items-center"
          >
             <video
              autoPlay
              loop
              muted
              playsInline
              className="rounded-3xl shadow-xl w-full h-auto max-w-[500px]"
            >
              <source src="/rn.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
