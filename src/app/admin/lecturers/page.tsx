
'use client';

import { useState } from 'react';
import { useFirestore, useCollection, updateDocumentNonBlocking, useMemoFirebase, useStorage, setDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
import { Loader2, Plus, Pencil, Percent, User as UserIcon } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { logActivity } from '@/lib/logger';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function LecturersPage() {
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const { profile: adminProfile } = useUserProfile();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLecturer, setEditingLecturer] = useState<Lecturer | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [payoutRate, setPayoutRate] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !adminProfile || !firestore || !storage) {
        toast({ title: "Please fill all fields", variant: "destructive" });
        return;
    }
    
    setIsLoading(true);
    try {
      const lecturerId = editingLecturer ? editingLecturer.id : doc(collection(firestore, 'lecturers')).id;
      let imageUrl = editingLecturer?.imageUrl || '';

      if (imageFile) {
        const imageRef = ref(storage, `lecturers/${lecturerId}`);
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      const lecturerData = {
        name,
        courses: selectedCourses,
        payoutRate: parseFloat(payoutRate) || 0,
        imageUrl: imageUrl,
      };

      if (editingLecturer) {
        await updateDocumentNonBlocking(doc(firestore, 'lecturers', editingLecturer.id), lecturerData);
        logActivity(firestore, {
            actorId: adminProfile.id,
            actorName: adminProfile.name || 'Admin',
            actorEmail: adminProfile.email,
            action: 'lecturer.update',
            entityType: 'lecturer',
            entityId: editingLecturer.id,
            details: { name: lecturerData.name, courses: lecturerData.courses.length, payoutRate: lecturerData.payoutRate },
        });
        toast({ title: 'Lecturer updated successfully' });
      } else {
        await setDocumentNonBlocking(doc(firestore, 'lecturers', lecturerId), {
            ...lecturerData,
            id: lecturerId,
            averageRating: 0,
            reviewCount: 0,
        }, { merge: true });
        logActivity(firestore, {
          actorId: adminProfile.id,
          actorName: adminProfile.name || 'Admin',
          actorEmail: adminProfile.email,
          action: 'lecturer.create',
          entityType: 'lecturer',
          entityId: lecturerId,
          details: { name: lecturerData.name },
        });
        toast({ title: 'Lecturer added successfully' });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
      toast({ title: 'Error saving lecturer', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (lecturer: Lecturer) => {
    setEditingLecturer(lecturer);
    setName(lecturer.name);
    setSelectedCourses(lecturer.courses || []);
    setPayoutRate(lecturer.payoutRate?.toString() || '0');
    setPreviewUrl(lecturer.imageUrl || null);
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingLecturer(null);
    setName('');
    setSelectedCourses([]);
    setPayoutRate('');
    setImageFile(null);
    setPreviewUrl(null);
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
            <Button><Plus className="mr-2 h-4 w-4" /> Add Lecturer</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>{editingLecturer ? 'Edit Lecturer' : 'Add New Lecturer'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={previewUrl || ''} alt={name} />
                  <AvatarFallback className="text-4xl"><UserIcon /></AvatarFallback>
                </Avatar>
                <Input id="image" type="file" onChange={handleImageChange} accept="image/*" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label htmlFor="name">Lecturer Name</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label htmlFor="payoutRate">Payout Rate</Label>
                    <div className="relative">
                        <Input id="payoutRate" type="number" value={payoutRate} onChange={(e) => setPayoutRate(e.target.value)} placeholder="e.g. 70" required />
                        <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Assigned Courses</Label>
                <div className="grid grid-cols-2 gap-2 border p-4 rounded-md max-h-48 overflow-y-auto">
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
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
            <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Courses</TableHead>
                  <TableHead>Payout Rate</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lecturers?.map((lecturer) => (
                  <TableRow key={lecturer.id}>
                    <TableCell className="font-medium flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={lecturer.imageUrl} />
                            <AvatarFallback>{lecturer.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {lecturer.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-xs">
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
                    <TableCell>
                      <span className="font-medium">{lecturer.payoutRate || 0}%</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(lecturer)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {lecturers?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">No lecturers found.</TableCell>
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
