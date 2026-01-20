'use client';

import { motion } from "framer-motion";
import { Users, Award, Calendar, Star } from "lucide-react";

const stats = [
  {
    icon: Users,
    value: "5,000+",
    label: "Students Trained",
    color: "bg-primary",
  },
  {
    icon: Award,
    value: "95%",
    label: "Success Rate",
    color: "bg-accent",
  },
  {
    icon: Calendar,
    value: "10,000+",
    label: "Classes Delivered",
    color: "bg-success",
  },
  {
    icon: Star,
    value: "4.9/5",
    label: "Student Rating",
    color: "bg-primary",
  },
];

const StatsSection = () => {
  return (
    <section className="py-24 bg-primary relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
            Trusted by Thousands
          </h2>
          <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
            Join our growing community of successful test-takers
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 md:p-8 text-center border border-white/20"
            >
              <div className={`w-14 h-14 rounded-2xl ${stat.color} flex items-center justify-center mx-auto mb-4`}>
                <stat.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-2">
                {stat.value}
              </h3>
              <p className="text-primary-foreground/70">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
