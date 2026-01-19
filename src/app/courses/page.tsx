'use client';

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { 
  ChevronDown, 
  ArrowRight, 
  Clock, 
  Users, 
  Monitor, 
  MapPin,
  Target,
  CheckCircle2,
  BookOpen,
  GraduationCap,
  Mic,
  PenTool,
  Headphones,
  FileText
} from "lucide-react";

const courses = [
  {
    id: "pte",
    name: "PTE Academic",
    tagline: "Computer-Based English Proficiency",
    icon: "🎯",
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    description: "The Pearson Test of English Academic is a computer-based English language test that measures your ability to communicate in academic settings.",
    whoIsItFor: [
      "Students applying to universities abroad",
      "Professionals seeking visa for Australia, UK, NZ",
      "Those who prefer computer-based testing",
      "People needing quick results (48 hours)"
    ],
    benefits: [
      "AI-powered instant scoring",
      "Results available in 48 hours",
      "Accepted by 3000+ institutions",
      "Fair and unbiased computer scoring"
    ],
    structure: [
      { name: "Speaking & Writing", duration: "54-67 min", icon: Mic },
      { name: "Reading", duration: "29-30 min", icon: FileText },
      { name: "Listening", duration: "30-43 min", icon: Headphones },
    ],
    duration: "60 min/class",
    students: "1,200+",
    targetScore: "65-90",
  },
  {
    id: "ielts",
    name: "IELTS",
    tagline: "World's Most Popular English Test",
    icon: "📚",
    color: "from-emerald-500 to-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    description: "The International English Language Testing System is the world's most popular high-stakes English language proficiency test for study, work, and migration.",
    whoIsItFor: [
      "University applicants worldwide",
      "Immigration to UK, Canada, Australia",
      "Professional registration requirements",
      "Those preferring face-to-face speaking tests"
    ],
    benefits: [
      "Recognized by 11,000+ organizations",
      "Available in 140+ countries",
      "Academic & General Training options",
      "Human examiner for speaking test"
    ],
    structure: [
      { name: "Listening", duration: "30 min", icon: Headphones },
      { name: "Reading", duration: "60 min", icon: BookOpen },
      { name: "Writing", duration: "60 min", icon: PenTool },
      { name: "Speaking", duration: "11-14 min", icon: Mic },
    ],
    duration: "60 min/class",
    students: "2,100+",
    targetScore: "Band 6.5-8.5",
  },
  {
    id: "celpip",
    name: "CELPIP",
    tagline: "Canadian English Proficiency",
    icon: "🍁",
    color: "from-red-500 to-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    description: "The Canadian English Language Proficiency Index Program is designed for those seeking Canadian immigration or citizenship. It tests practical, everyday English.",
    whoIsItFor: [
      "Canadian permanent residency applicants",
      "Canadian citizenship applicants",
      "Professional designation in Canada",
      "Those preferring Canadian English accent"
    ],
    benefits: [
      "Focuses on Canadian English",
      "100% computer-based",
      "Results in 4-5 business days",
      "Directly linked to CLB scores"
    ],
    structure: [
      { name: "Listening", duration: "47-55 min", icon: Headphones },
      { name: "Reading", duration: "55-60 min", icon: FileText },
      { name: "Writing", duration: "53-60 min", icon: PenTool },
      { name: "Speaking", duration: "15-20 min", icon: Mic },
    ],
    duration: "60 min/class",
    students: "800+",
    targetScore: "CLB 7-12",
  },
];

const Courses = () => {
  const [expandedCourse, setExpandedCourse] = useState<string | null>("pte");

  return (
    <Layout>
      {/* Hero */}
      <section className="py-24 bg-dots">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4">
              Our Courses
            </span>
            <h1 className="font-display text-5xl md:text-6xl font-bold mb-6">
              Choose Your
              <span className="text-gradient-primary block">Exam Path</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Comprehensive preparation courses designed to help you achieve your target score 
              with personalized one-on-one coaching.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Courses List */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="space-y-8">
            {courses.map((course, index) => (
              <motion.div
                key={course.id}
                id={course.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`bg-white rounded-3xl border-2 ${
                  expandedCourse === course.id ? course.borderColor : "border-border"
                } overflow-hidden transition-all duration-300`}
              >
                {/* Course Header */}
                <button
                  onClick={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)}
                  className="w-full p-6 md:p-8 flex items-center justify-between hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${course.color} flex items-center justify-center text-3xl`}>
                      {course.icon}
                    </div>
                    <div className="text-left">
                      <h2 className="font-display text-2xl md:text-3xl font-bold">{course.name}</h2>
                      <p className="text-muted-foreground">{course.tagline}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden md:flex gap-2">
                      <span className="badge-online">
                        <Monitor className="w-3.5 h-3.5" />
                        Online
                      </span>
                      <span className="badge-physical">
                        <MapPin className="w-3.5 h-3.5" />
                        Physical
                      </span>
                    </div>
                    <ChevronDown 
                      className={`w-6 h-6 text-muted-foreground transition-transform ${
                        expandedCourse === course.id ? "rotate-180" : ""
                      }`} 
                    />
                  </div>
                </button>

                {/* Expanded Content */}
                <AnimatePresence>
                  {expandedCourse === course.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className={`p-6 md:p-8 pt-0 ${course.bgColor}`}>
                        <div className="grid lg:grid-cols-2 gap-8">
                          {/* Left Column */}
                          <div className="space-y-8">
                            {/* Description */}
                            <div>
                              <h3 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-primary" />
                                About This Course
                              </h3>
                              <p className="text-muted-foreground leading-relaxed">
                                {course.description}
                              </p>
                            </div>

                            {/* Who is it for */}
                            <div>
                              <h3 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
                                <Target className="w-5 h-5 text-primary" />
                                Who Is It For?
                              </h3>
                              <ul className="space-y-2">
                                {course.whoIsItFor.map((item, i) => (
                                  <li key={i} className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                                    <span className="text-muted-foreground">{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Benefits */}
                            <div>
                              <h3 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
                                <GraduationCap className="w-5 h-5 text-primary" />
                                Key Benefits
                              </h3>
                              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {course.benefits.map((benefit, i) => (
                                  <li key={i} className="flex items-center gap-2 text-sm">
                                    <div className="w-2 h-2 rounded-full bg-accent" />
                                    {benefit}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {/* Right Column */}
                          <div className="space-y-8">
                            {/* Exam Structure */}
                            <div>
                              <h3 className="font-display text-lg font-semibold mb-4">
                                Exam Structure
                              </h3>
                              <div className="bg-white rounded-2xl p-6 space-y-4">
                                {course.structure.map((section, i) => (
                                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <section.icon className="w-5 h-5 text-primary" />
                                      </div>
                                      <span className="font-medium">{section.name}</span>
                                    </div>
                                    <span className="text-sm text-muted-foreground">{section.duration}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Stats & CTA */}
                            <div className="bg-white rounded-2xl p-6">
                              <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="text-center">
                                  <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
                                  <p className="text-sm text-muted-foreground">Duration</p>
                                  <p className="font-semibold">{course.duration}</p>
                                </div>
                                <div className="text-center">
                                  <Users className="w-6 h-6 text-primary mx-auto mb-2" />
                                  <p className="text-sm text-muted-foreground">Students</p>
                                  <p className="font-semibold">{course.students}</p>
                                </div>
                                <div className="text-center">
                                  <Target className="w-6 h-6 text-accent mx-auto mb-2" />
                                  <p className="text-sm text-muted-foreground">Target</p>
                                  <p className="font-semibold">{course.targetScore}</p>
                                </div>
                              </div>
                              <Link href={`/booking?course=${course.id}`}>
                                <Button className="w-full btn-accent group" size="lg">
                                  Check Availability
                                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Courses;
