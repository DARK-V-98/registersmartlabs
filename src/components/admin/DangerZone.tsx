'use client';

import { useState } from 'react';
import { useFirestore } from '@/firebase';
import { collection, getDocs, writeBatch, query, where, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteConfirmationDialogProps {
  collectionName: string;
  onConfirm: () => Promise<void>;
  triggerText: string;
  title: string;
  description: string;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  collectionName,
  onConfirm,
  triggerText,
  title,
  description,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const { toast } = useToast();

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      toast({
        title: 'Success',
        description: `All documents in "${collectionName}" have been deleted.`,
      });
      setIsOpen(false);
    } catch (error) {
      console.error(`Error clearing ${collectionName}:`, error);
      toast({
        title: 'Error',
        description: `Failed to clear ${collectionName}.`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setConfirmationText('');
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">{triggerText}</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description} To confirm, please type <strong>DELETE</strong> in the box below.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Input
          value={confirmationText}
          onChange={(e) => setConfirmationText(e.target.value)}
          placeholder="Type DELETE to confirm"
          className="mt-4"
        />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={confirmationText !== 'DELETE' || isLoading}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Permanently Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};


export function DangerZone() {
  const firestore = useFirestore();

  const clearCollection = async (collectionName: string) => {
    if (!firestore) return;
    const collectionRef = collection(firestore, collectionName);
    const snapshot = await getDocs(collectionRef);
    const batch = writeBatch(firestore);
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  };
  
  const clearStudentsAndUsers = async () => {
    if (!firestore) return;
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where('role', '!=', 'developer'));
    const snapshot = await getDocs(q);
    const batch = writeBatch(firestore);
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  };

  const actions = [
    {
      name: 'Bookings',
      collection: 'bookings',
      onConfirm: () => clearCollection('bookings'),
      description: "This will permanently delete all booking records from the system. This includes pending, confirmed, and cancelled bookings.",
    },
    {
      name: 'Courses',
      collection: 'courses',
      onConfirm: () => clearCollection('courses'),
      description: "This will permanently delete all course definitions. This action cannot be undone.",
    },
    {
      name: 'Lecturers',
      collection: 'lecturers',
      onConfirm: () => clearCollection('lecturers'),
      description: "This will permanently delete all lecturer profiles and their associations with courses.",
    },
    {
      name: 'Users',
      collection: 'users',
      onConfirm: clearStudentsAndUsers,
      description: "This will permanently delete all users with the 'student' or 'admin' role. Developer accounts will NOT be affected.",
    },
  ];

  return (
    <Card className="border-destructive bg-destructive/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle />
          Danger Zone
        </CardTitle>
        <CardDescription className="text-destructive/80">
          These are highly destructive actions that can result in permanent data loss. Proceed with extreme caution.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {actions.map((action) => (
          <Card key={action.name} className="flex flex-col sm:flex-row items-start justify-between p-4">
            <div>
              <h4 className="font-semibold">Clear All {action.name}</h4>
              <p className="text-sm text-muted-foreground max-w-lg">{action.description}</p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-4 flex-shrink-0">
               <DeleteConfirmationDialog
                collectionName={action.collection}
                onConfirm={action.onConfirm}
                triggerText={`Clear ${action.name}`}
                title={`Are you sure you want to delete all ${action.name.toLowerCase()}?`}
                description={action.description}
               />
            </div>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
