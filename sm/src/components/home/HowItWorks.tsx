import { motion } from "framer-motion";
import { UserPlus, BookOpen, CalendarCheck, GraduationCap } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Create Account",
    description: "Sign up in seconds with your email or social accounts",
  },
  {
    icon: BookOpen,
    title: "Choose Course",
    description: "Select from PTE, IELTS, or CELPIP based on your goals",
  },
  {
    icon: CalendarCheck,
    title: "Book a Slot",
    description: "Pick your preferred date, time, and class type",
  },
  {
    icon: GraduationCap,
    title: "Start Learning",
    description: "Join your 1-on-1 session and achieve your target score",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-accent/10 text-accent-dark font-medium text-sm mb-4">
            Simple Process
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Book your individual class in just a few simple steps
          </p>
        </motion.div>

        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                <div className="bg-white rounded-2xl p-8 text-center relative z-10 border border-border hover:border-primary/30 hover:shadow-xl transition-all duration-300">
                  {/* Step Number */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-accent text-accent-foreground font-bold flex items-center justify-center text-sm">
                    {index + 1}
                  </div>

                  {/* Icon */}
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <step.icon className="w-10 h-10 text-primary" />
                  </div>

                  <h3 className="font-display text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
