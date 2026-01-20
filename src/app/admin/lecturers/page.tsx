'use client';

import { useState } from 'react';
import { useFirestore, useCollection, addDocumentNonBlocking, updateDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Lecturer, Course } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { PiSpinner, PiPlus, PiPencilSimple } from 'react-icons/pi';

export default function LecturersPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLecturer, setEditingLecturer] = useState<Lecturer | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

  const lecturersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'lecturers'), orderBy('name'));
  }, [firestore]);

  const { data: lecturers, isLoading: isLecturersLoading } = useCollection<Lecturer>(lecturersQuery);

  const coursesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'courses'), orderBy('name'));
  }, [firestore]);

  const { data: courses } = useCollection<Course>(coursesQuery);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    
    setIsLoading(true);
    try {
      const lecturerData = {
        name,
        courses: selectedCourses,
      };

      if (editingLecturer) {
        await updateDocumentNonBlocking(doc(firestore, 'lecturers', editingLecturer.id), lecturerData);
        toast({ title: 'Lecturer updated successfully' });
      } else {
        await addDocumentNonBlocking(collection(firestore, 'lecturers'), lecturerData);
        toast({ title: 'Lecturer added successfully' });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ title: 'Error saving lecturer', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (lecturer: Lecturer) => {
    setEditingLecturer(lecturer);
    setName(lecturer.name);
    setSelectedCourses(lecturer.courses || []);
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingLecturer(null);
    setName('');
    setSelectedCourses([]);
  };

  const toggleCourse = (courseId: string) => {
    setSelectedCourses(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Lecturers Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button><PiPlus className="mr-2 h-4 w-4" /> Add Lecturer</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingLecturer ? 'Edit Lecturer' : 'Add New Lecturer'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Lecturer Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Assigned Courses</Label>
                <div className="grid grid-cols-2 gap-2 border p-4 rounded-md">
                  {courses?.map(course => (
                    <div key={course.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`course-${course.id}`} 
                        checked={selectedCourses.includes(course.id)}
                        onCheckedChange={() => toggleCourse(course.id)}
                      />
                      <Label htmlFor={`course-${course.id}`} className="text-sm font-normal cursor-pointer">
                        {course.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <PiSpinner className="mr-2 h-4 w-4 animate-spin" />}
                  {editingLecturer ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Lecturers</CardTitle>
        </CardHeader>
        <CardContent>
          {isLecturersLoading ? (
            <div className="flex justify-center p-4"><PiSpinner className="animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Courses</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lecturers?.map((lecturer) => (
                  <TableRow key={lecturer.id}>
                    <TableCell className="font-medium">{lecturer.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {lecturer.courses?.map(courseId => {
                          const course = courses?.find(c => c.id === courseId);
                          return course ? (
                            <span key={courseId} className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full text-xs">
                              {course.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(lecturer)}>
                        <PiPencilSimple className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {lecturers?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">No lecturers found.</TableCell>
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
