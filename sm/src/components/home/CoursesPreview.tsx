import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Clock, Users, Monitor, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const courses = [
  {
    id: "pte",
    name: "PTE Academic",
    description: "Master the Pearson Test of English with personalized coaching. Computer-based exam preparation with real-time feedback.",
    duration: "60 min/class",
    students: "1,200+",
    color: "from-blue-500 to-blue-600",
    icon: "🎯",
    features: ["AI-powered practice", "Instant scoring", "All 4 skills covered"],
  },
  {
    id: "ielts",
    name: "IELTS",
    description: "Comprehensive IELTS preparation for Academic and General Training. Band 7+ strategies from certified trainers.",
    duration: "60 min/class",
    students: "2,100+",
    color: "from-emerald-500 to-emerald-600",
    icon: "📚",
    features: ["Speaking mock tests", "Writing corrections", "Reading strategies"],
  },
  {
    id: "celpip",
    name: "CELPIP",
    description: "Canadian English Language Proficiency Index Program preparation. Focus on Canadian English nuances and CLB scores.",
    duration: "60 min/class",
    students: "800+",
    color: "from-red-500 to-red-600",
    icon: "🍁",
    features: ["Canadian accent training", "Task-specific drills", "Score prediction"],
  },
];

const CoursesPreview = () => {
  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4">
            Our Courses
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Choose Your Path to Success
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Expert-led individual classes tailored to your learning style and goals
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="course-card h-full flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${course.color} flex items-center justify-center text-3xl`}>
                    {course.icon}
                  </div>
                  <div className="flex gap-2">
                    <span className="badge-online">
                      <Monitor className="w-3.5 h-3.5" />
                      Online
                    </span>
                    <span className="badge-physical">
                      <MapPin className="w-3.5 h-3.5" />
                      Physical
                    </span>
                  </div>
                </div>

                {/* Content */}
                <h3 className="font-display text-2xl font-bold mb-3">{course.name}</h3>
                <p className="text-muted-foreground mb-6 flex-1">{course.description}</p>

                {/* Features */}
                <ul className="space-y-2 mb-6">
                  {course.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                        <span className="text-accent-dark text-xs">✓</span>
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Stats */}
                <div className="flex items-center gap-6 py-4 border-t border-border mb-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {course.duration}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    {course.students} students
                  </div>
                </div>

                {/* CTA */}
                <Link to={`/booking?course=${course.id}`}>
                  <Button className="w-full group">
                    Check Availability
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-12"
        >
          <Link to="/courses">
            <Button variant="outline" size="lg" className="group">
              View All Course Details
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default CoursesPreview;
