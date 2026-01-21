'use client';

import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/useUserProfile';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { UserProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function AdminUsersPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { profile: adminProfile } = useUserProfile();

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: users, isLoading } = useCollection<UserProfile>(usersQuery);

  const handleUpdateUser = (userId: string, data: Partial<UserProfile>) => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', userId);
    updateDocumentNonBlocking(userRef, data);
    toast({
      title: "User Updated",
      description: `User has been updated.`,
    });
  };

  const getStatusVariant = (status?: 'active' | 'suspended') => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Users Management</h2>

      <Card>
        <CardHeader>
          <CardTitle>Registered Users</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' || user.role === 'developer' ? 'destructive' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </TableCell>
                     <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs capitalize ${getStatusVariant(user.status)}`}>
                        {user.status || 'active'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {user.createdAt?.toDate ? format(user.createdAt.toDate(), 'yyyy-MM-dd') : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0" disabled={user.id === adminProfile?.id}>
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          
                          {adminProfile?.role === 'developer' && (
                             <>
                               <DropdownMenuSeparator />
                               <DropdownMenuItem onClick={() => handleUpdateUser(user.id, { role: 'developer' })}>Make Developer</DropdownMenuItem>
                               <DropdownMenuItem onClick={() => handleUpdateUser(user.id, { role: 'admin' })}>Make Admin</DropdownMenuItem>
                               <DropdownMenuItem onClick={() => handleUpdateUser(user.id, { role: 'student' })}>Make Student</DropdownMenuItem>
                             </>
                          )}

                          <DropdownMenuSeparator />
                           <DropdownMenuItem
                            className="text-yellow-600 focus:text-yellow-700"
                            onClick={() => handleUpdateUser(user.id, { status: 'suspended' })}
                            disabled={user.role === 'developer'}>
                            Suspend User
                           </DropdownMenuItem>
                          <DropdownMenuItem
                             className="text-green-600 focus:text-green-700"
                            onClick={() => handleUpdateUser(user.id, { status: 'active' })}>
                            Activate User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {users?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">No users found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
