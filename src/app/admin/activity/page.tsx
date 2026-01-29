'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useUserProfile } from '@/hooks/useUserProfile';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, History, Search } from 'lucide-react';
import { ActivityLog } from '@/types';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const ACTION_CATEGORIES: Record<string, string> = {
    booking: 'Booking',
    user: 'User Management',
    course: 'Course',
    lecturer: 'Lecturer',
    schedule: 'Schedule',
    settings: 'Settings',
};

const getActionCategory = (action: string) => {
    const prefix = action.split('.')[0];
    return ACTION_CATEGORIES[prefix] || 'General';
};

const formatDetails = (details: Record<string, any> | undefined) => {
    if (!details) return 'N/A';
    return Object.entries(details).map(([key, value]) => `${key}: ${value}`).join(', ');
};

export default function ActivityLogPage() {
  const { profile, isLoading: isProfileLoading } = useUserProfile();
  const firestore = useFirestore();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const activityQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'activityLogs'), orderBy('timestamp', 'desc'));
  }, [firestore]);

  const { data: activities, isLoading: isActivitiesLoading } = useCollection<ActivityLog>(activityQuery);

  const filteredActivities = useMemo(() => {
    if (!activities) return [];
    return activities.filter(activity => {
        const category = getActionCategory(activity.action);
        const categoryMatch = categoryFilter === 'all' || category === categoryFilter;

        const searchMatch = searchTerm === '' ||
            activity.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (activity.actorEmail && activity.actorEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
            activity.targetUserName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            activity.entityId.toLowerCase().includes(searchTerm.toLowerCase());
        
        return categoryMatch && searchMatch;
    });
  }, [activities, searchTerm, categoryFilter]);


  if (isProfileLoading || isActivitiesLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
  }
  
  if (profile?.role !== 'developer' && profile?.role !== 'superadmin') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>You do not have permission to view this page.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
       <div>
            <h2 className="text-2xl font-bold flex items-center gap-2"><History/> Activity Log</h2>
            <p className="text-muted-foreground">An audit trail of all administrative actions taken on the platform.</p>
        </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>All Activities</CardTitle>
              <div className="flex gap-2 w-full sm:w-auto">
                 <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search by name, email, or ID..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                 </div>
                 <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                     <SelectTrigger className="w-full sm:w-[180px]">
                         <SelectValue placeholder="Filter by category" />
                     </SelectTrigger>
                     <SelectContent>
                         <SelectItem value="all">All Categories</SelectItem>
                         {Object.values(ACTION_CATEGORIES).map(cat => (
                             <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                         ))}
                     </SelectContent>
                 </Select>
              </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Date & Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredActivities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>
                      <div className="font-medium">{activity.actorName}</div>
                      {activity.actorEmail && <div className="text-sm text-muted-foreground">{activity.actorEmail}</div>}
                  </TableCell>
                  <TableCell>
                      <Badge variant="secondary" className="mb-1">{getActionCategory(activity.action)}</Badge>
                      <div className="font-mono text-xs">{activity.action}</div>
                  </TableCell>
                  <TableCell>
                      <p className="text-sm">{formatDetails(activity.details)}</p>
                      {activity.targetUserName && (
                          <p className="text-xs text-muted-foreground">Target: {activity.targetUserName}</p>
                      )}
                  </TableCell>
                  <TableCell>
                    {activity.timestamp ? format(activity.timestamp.toDate(), 'PPpp') : 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
               {filteredActivities.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">No activities found for the current filters.</TableCell>
                  </TableRow>
                )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
