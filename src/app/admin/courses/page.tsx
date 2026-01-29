
'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useCollection, addDocumentNonBlocking, updateDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Course } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Pencil } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { logActivity } from '@/lib/logger';

export default function CoursesPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { profile: adminProfile } = useUserProfile();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const coursesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'courses'), orderBy('name'));
  }, [firestore]);

  const { data: courses, isLoading: isCoursesLoading } = useCollection<Course>(coursesQuery);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || !adminProfile || !firestore) {
        toast({ title: "Please fill all fields", variant: "destructive" });
        return;
    }
    
    setIsLoading(true);
    try {
      const courseData = {
        name,
        description,
        status: isActive ? 'active' : 'inactive',
      };

      if (editingCourse) {
        await updateDocumentNonBlocking(doc(firestore, 'courses', editingCourse.id), courseData);
        logActivity(firestore, {
          actorId: adminProfile.id,
          actorName: adminProfile.name || 'Admin',
          actorEmail: adminProfile.email,
          action: 'course.update',
          entityType: 'course',
          entityId: editingCourse.id,
          details: { name: courseData.name, status: courseData.status },
        });
        toast({ title: 'Course updated successfully' });
      } else {
        const docRef = await addDocumentNonBlocking(collection(firestore, 'courses'), courseData);
        if (docRef) {
          logActivity(firestore, {
            actorId: adminProfile.id,
            actorName: adminProfile.name || 'Admin',
            actorEmail: adminProfile.email,
            action: 'course.create',
            entityType: 'course',
            entityId: docRef.id,
            details: { name: courseData.name },
          });
        }
        toast({ title: 'Course added successfully' });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
      toast({ title: 'Error saving course', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setName(course.name);
    setDescription(course.description);
    setIsActive(course.status === 'active');
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingCourse(null);
    setName('');
    setDescription('');
    setIsActive(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Courses Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Course</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>{editingCourse ? 'Edit Course' : 'Add New Course'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Course Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Course Description</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required />
              </div>
              
              <div className="flex items-center space-x-2 pt-4 border-t">
                <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
                <Label htmlFor="active">Active</Label>
              </div>
              <DialogFooter className="mt-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingCourse ? 'Update Course' : 'Create Course'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Courses</CardTitle>
        </CardHeader>
        <CardContent>
          {isCoursesLoading ? (
            <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses?.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">{course.name}</TableCell>
                    <TableCell className="max-w-sm truncate">{course.description}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${course.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {course.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(course)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {courses?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">No courses found.</TableCell>
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

    