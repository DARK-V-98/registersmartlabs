export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'developer';
}

export interface Course {
  id: string;
  name: string;
  price: number;
  status: 'active' | 'inactive';
}

export interface Lecturer {
  id: string;
  name: string;
  courses: string[]; // Array of courseIds
  availability?: {
    [date: string]: string[]; // date string (YYYY-MM-DD) -> array of time slots
  };
}

export interface Schedule {
  id: string;
  courseId: string;
  lecturerId: string;
  date: string; // YYYY-MM-DD
  timeSlots: string[];
  bookedSlots?: string[];
}

export interface Booking {
  id: string;
  userId: string;
  userName?: string; // Added for admin display
  courseId: string;
  courseName?: string;
  lecturerId: string;
  lecturerName?: string;
  date: string; // YYYY-MM-DD
  time: string;
  price?: number;
  classType?: 'online' | 'physical'; // Added per user requirement
  paymentStatus: 'pending' | 'confirmed' | 'rejected';
  bookingStatus: 'created' | 'payment_pending' | 'confirmed' | 'rejected' | 'cancelled';
  receiptUrl?: string;
  createdAt?: any; // Firestore Timestamp
}
