'use client';

import { motion } from "framer-motion";
import Link from "next/link";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight,
  GraduationCap,
  Loader2,
  Monitor,
  Building
} from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Course } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";

const CoursesPage = () => {
  const firestore = useFirestore();

  const coursesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'courses'), where('status', '==', 'active'), orderBy('name'));
  }, [firestore]);

  const { data: courses, isLoading } = useCollection<Course>(coursesQuery);

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
              with personalized one-on-one coaching. All courses are available online or physically.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Courses List */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses?.map((course, index) => (
                <motion.div
                  key={course.id}
                  id={course.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="h-full"
                >
                  <Card className="h-full flex flex-col transition-all hover:shadow-xl hover:-translate-y-1">
                    <CardHeader>
                       <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                         <GraduationCap className="w-8 h-8 text-primary" />
                       </div>
                      <CardTitle>{course.name}</CardTitle>
                      <CardDescription>One-on-one personalized coaching.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                       <div className="flex items-baseline gap-3">
                          <Monitor className="w-5 h-5 text-muted-foreground"/>
                          <div>
                            <p className="text-2xl font-bold text-primary">LKR {course.priceOnline?.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">Online Class</p>
                          </div>
                       </div>
                       <div className="flex items-baseline gap-3">
                          <Building className="w-5 h-5 text-muted-foreground"/>
                           <div>
                            <p className="text-2xl font-bold text-primary">LKR {course.pricePhysical?.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">Physical Class</p>
                          </div>
                       </div>
                    </CardContent>
                    <CardFooter>
                       <Link href="/dashboard/book" className="w-full">
                        <Button className="w-full group">
                          Check Availability
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
          {courses?.length === 0 && !isLoading && (
            <p className="text-center text-muted-foreground">No active courses found at the moment. Please check back later.</p>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default CoursesPage;
