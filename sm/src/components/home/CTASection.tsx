import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Calendar, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary-dark p-12 md:p-16 text-center"
        >
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
          </div>

          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6">
              Ready to Achieve Your
              <span className="block text-accent">Target Score?</span>
            </h2>
            <p className="text-lg md:text-xl text-primary-foreground/80 mb-10">
              Book your first individual class today and take the first step towards your dream score. 
              Our expert trainers are ready to guide you.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/booking">
                <Button size="lg" className="btn-accent text-lg px-8 py-6 group">
                  <Calendar className="w-5 h-5 mr-2" />
                  Book Your Class Now
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 bg-transparent border-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                  Talk to an Advisor
                </Button>
              </Link>
            </div>

            <p className="mt-8 text-primary-foreground/60 text-sm">
              ✨ First consultation is free • No commitment required
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
