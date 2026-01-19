'use client';

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Clock, 
  Video, 
  MapPin, 
  Plus,
  History,
  Settings,
  LogOut,
  ChevronRight,
  X,
  RefreshCw,
  User as UserIcon
} from "lucide-react";
import { useAuth, useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy, Timestamp } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";


interface Booking {
  id: string;
  courseName: string;
  courseIcon: string;
  date: Timestamp;
  time: string;
  type: 'online' | 'physical';
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
}

const Dashboard = () => {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

  const bookingsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, `users/${user.uid}/courseEnrollments`),
      orderBy("date", "desc")
    );
  }, [user, firestore]);

  const { data: bookings, isLoading: bookingsLoading } = useCollection<Booking>(bookingsQuery);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/");
  };

  const handleDeleteBooking = (bookingId: string) => {
    if (!user || !firestore) return;
    const docRef = doc(firestore, `users/${user.uid}/courseEnrollments`, bookingId);
    deleteDocumentNonBlocking(docRef);
    toast({
      title: "Booking Cancelled",
      description: "Your booking has been cancelled.",
    });
  }

  if (isUserLoading || bookingsLoading) {
    return <Layout><div>Loading dashboard...</div></Layout>;
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  const now = new Date();
  const upcomingBookings = bookings?.filter(b => b.date.toDate() >= now && b.status !== 'cancelled') || [];
  const pastBookings = bookings?.filter(b => b.date.toDate() < now || b.status === 'cancelled') || [];

  const displayedBookings = activeTab === "upcoming" ? upcomingBookings : pastBookings;

  return (
    <Layout>
      <section className="py-12 bg-secondary/30 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-2xl p-6 border border-border sticky top-24"
              >
                <div className="text-center pb-6 border-b border-border mb-6">
                  <div className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    {user.displayName?.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="font-display font-semibold text-lg">{user.displayName}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-secondary/50 rounded-xl p-4 text-center">
                    <p className="font-display text-2xl font-bold text-primary">{upcomingBookings.length}</p>
                    <p className="text-xs text-muted-foreground">Upcoming</p>
                  </div>
                  <div className="bg-secondary/50 rounded-xl p-4 text-center">
                    <p className="font-display text-2xl font-bold text-accent-dark">{pastBookings.length}</p>
                    <p className="text-xs text-muted-foreground">Past</p>
                  </div>
                </div>

                <nav className="space-y-2">
                  <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-primary/10 text-primary font-medium">
                    <Calendar className="w-5 h-5" />
                    My Bookings
                  </button>
                  <button onClick={handleSignOut} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-destructive">
                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </button>
                </nav>
              </motion.div>
            </div>

            <div className="lg:col-span-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                  <div>
                    <h1 className="font-display text-3xl font-bold mb-2">My Bookings</h1>
                    <p className="text-muted-foreground">Manage your scheduled classes</p>
                  </div>
                  <Link href="/booking">
                    <Button className="btn-accent">
                      <Plus className="w-4 h-4 mr-2" />
                      Book New Class
                    </Button>
                  </Link>
                </div>

                <div className="flex gap-4 mb-6">
                  <button
                    onClick={() => setActiveTab("upcoming")}
                    className={`px-6 py-3 rounded-xl font-medium transition-all ${
                      activeTab === "upcoming"
                        ? "bg-primary text-primary-foreground"
                        : "bg-white text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    Upcoming ({upcomingBookings.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("past")}
                    className={`px-6 py-3 rounded-xl font-medium transition-all ${
                      activeTab === "past"
                        ? "bg-primary text-primary-foreground"
                        : "bg-white text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    Past Classes ({pastBookings.length})
                  </button>
                </div>

                <div className="space-y-4">
                  {displayedBookings.length > 0 ? displayedBookings.map((booking, index) => (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="bg-white rounded-2xl p-6 border border-border hover:border-primary/30 hover:shadow-lg transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center text-2xl">
                            {booking.courseIcon}
                          </div>
                          <div>
                            <h3 className="font-display font-semibold text-lg">{booking.courseName}</h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {booking.date.toDate().toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {booking.time}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end flex-wrap gap-4 w-full sm:w-auto">
                          <div className="flex items-center gap-3">
                            <span className={booking.type === "online" ? "badge-online" : "badge-physical"}>
                              {booking.type === "online" ? <Video className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                              {booking.type === "online" ? "Online" : "Physical"}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              booking.status === "confirmed"
                                ? "bg-success/10 text-success"
                                : booking.status === "pending"
                                ? "bg-amber-100 text-amber-700"
                                : booking.status === 'cancelled'
                                ? "bg-destructive/10 text-destructive"
                                : "bg-secondary text-muted-foreground"
                            }`}>
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {activeTab === "upcoming" && booking.status !== 'cancelled' && (
                              <div className="flex gap-2">
                                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteBooking(booking.id)}>
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            )}

                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )) : (
                    <div className="bg-white rounded-2xl p-12 text-center border border-border">
                        <Calendar className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="font-display text-xl font-semibold mb-2">No bookings yet</h3>
                        <p className="text-muted-foreground mb-6">
                          {activeTab === "upcoming"
                            ? "You don't have any upcoming classes scheduled."
                            : "You haven't completed any classes yet."}
                        </p>
                        <Link href="/booking">
                          <Button className="btn-accent">Book Your First Class</Button>
                        </Link>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Dashboard;
