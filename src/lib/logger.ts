'use client';
import { Firestore, collection, Timestamp } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase';
import { ActivityLog } from '@/types';

type LogParams = Omit<ActivityLog, 'id' | 'timestamp'>;

/**
 * Logs an administrative action to the 'activityLogs' collection in Firestore.
 * This is a fire-and-forget operation and does not block the UI.
 * @param firestore - The Firestore instance.
 * @param params - The activity log data to be recorded.
 */
export const logActivity = (firestore: Firestore, params: LogParams) => {
    if (!firestore) return;

    const logData: Omit<ActivityLog, 'id'> = {
        ...params,
        timestamp: Timestamp.now(),
    };

    // This is intentionally not awaited to avoid blocking the user's action.
    addDocumentNonBlocking(collection(firestore, 'activityLogs'), logData);
};
