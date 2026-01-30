

export interface CurrencySetting {
  country: string;
  code: string; // e.g. USD
  symbol: string; // e.g. $
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin' | 'developer' | 'superadmin';
  status?: 'active' | 'suspended';
  createdAt?: any;
  favoriteLecturers?: string[];
  phoneNumber?: string;
  timezone?: string;
  country?: string;
  currency?: string; // e.g. LKR, USD
}

export interface CoursePrice {
  priceOnline: number;
  pricePhysical: number;
  priceOnlineAddHour: number;
  pricePhysicalAddHour: number;
}

export interface Course {
  id: string;
  name:string;
  description: string;
  status: 'active' | 'inactive';
}

export interface Lecturer {
  id: string;
  name: string;
  imageUrl?: string;
  courses: string[]; // Array of courseIds
  pricing?: {
    [courseId: string]: {
      [currencyCode: string]: CoursePrice;
    };
  };
  averageRating?: number;
  reviewCount?: number;
  payoutRate?: number;
  onlineClassEnabled?: boolean;
  physicalClassEnabled?: boolean;
}

export interface Schedule {
  id: string;
  lecturerId: string;
  date: string; // YYYY-MM-DD
  timeSlots: string[]; // Potential start times set by admin
  bookedSlots?: string[]; // 30-min blocks that are booked
}

export interface Booking {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  userPhoneNumber?: string;
  courseId: string;
  courseName?: string;
  lecturerId: string;
  lecturerName?: string;
  date: string; // YYYY-MM-DD
  time: string;
  duration: number; // 1 or 2 hours
  price?: number;
  currency?: string; // e.g. LKR, USD
  classType?: 'online' | 'physical';
  paymentStatus: 'pending' | 'paid' | 'rejected' | 'failed';
  bookingStatus: 'payment_pending' | 're_upload_receipt' | 'confirmed' | 'rejected' | 'cancelled' | 'cancellation_requested' | 'completed';
  receiptUrl?: string;
  receiptType?: string;
  createdAt?: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
  completedAt?: any; // Firestore Timestamp
  isReviewed?: boolean;
  reminderSent?: boolean;
}

export interface Message {
    id: string;
    text: string;
    senderId: string;
    senderName: string;
    createdAt: any; // Firestore Timestamp
}

export interface Review {
  id: string;
  studentId: string;
  studentName: string;
  rating: number;
  comment: string;
  createdAt: any; // Firestore Timestamp
}

export interface AdminSettings {
  bankDetails?: string;
  whatsappNumber?: string;
  whatsappContactUrl?: string;
  disabledDates?: string[];
  notificationEmails?: string[];
  physicalClassesEnabled?: boolean;
  currencies?: CurrencySetting[];
}

export interface ActivityLog {
  id: string;
  actorId: string;
  actorName: string;
  actorEmail?: string;
  action: string; // e.g., 'booking.confirm', 'user.update.role'
  entityType: string; // e.g., 'booking', 'user', 'schedule'
  entityId: string;
  timestamp: any; // Firestore Timestamp
  details?: Record<string, any>;
  targetUserId?: string;
  targetUserName?: string;
}
