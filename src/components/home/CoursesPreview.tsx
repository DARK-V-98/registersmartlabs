
'use client';

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Clock, Users, Monitor, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { Course } from '@/types';

const CoursesPreview = () => {
  const firestore = useFirestore();

  const coursesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'courses'),
      where('status', '==', 'active'),
      orderBy('name'),
      limit(3)
    );
  }, [firestore]);

  const { data: courses, isLoading } = useCollection<Course>(coursesQuery);

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

        {isLoading ? (
          <div className="flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses?.map((course, index) => (
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
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-3xl text-primary-foreground`}>
                      🎓
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
                  <p className="text-muted-foreground mb-6 flex-1">
                    {course.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-6 py-4 border-t border-border mb-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      Individual Classes
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      Lecturer-based pricing
                    </div>
                  </div>

                  {/* CTA */}
                  <Link href="/dashboard/book">
                    <Button className="w-full group">
                      View Lecturers & Book
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-12"
        >
          <Link href="/courses">
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

    