
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
import { Switch } from '@/components/ui/switch';
import { Course } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Pencil } from 'lucide-react';

export default function CoursesPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [priceOnline, setPriceOnline] = useState('');
  const [pricePhysical, setPricePhysical] = useState('');
  const [priceOnlineAddHour, setPriceOnlineAddHour] = useState('');
  const [pricePhysicalAddHour, setPricePhysicalAddHour] = useState('');
  const [isActive, setIsActive] = useState(true);

  const coursesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'courses'), orderBy('name'));
  }, [firestore]);

  const { data: courses, isLoading: isCoursesLoading } = useCollection<Course>(coursesQuery);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !priceOnline || !pricePhysical || !priceOnlineAddHour || !pricePhysicalAddHour) {
        toast({ title: "Please fill all fields", variant: "destructive" });
        return;
    }
    
    setIsLoading(true);
    try {
      const courseData = {
        name,
        priceOnline: parseFloat(priceOnline),
        pricePhysical: parseFloat(pricePhysical),
        priceOnlineAddHour: parseFloat(priceOnlineAddHour),
        pricePhysicalAddHour: parseFloat(pricePhysicalAddHour),
        status: isActive ? 'active' : 'inactive',
      };

      if (editingCourse) {
        await updateDocumentNonBlocking(doc(firestore, 'courses', editingCourse.id), courseData);
        toast({ title: 'Course updated successfully' });
      } else {
        await addDocumentNonBlocking(collection(firestore, 'courses'), courseData);
        toast({ title: 'Course added successfully' });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ title: 'Error saving course', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setName(course.name);
    setPriceOnline(course.priceOnline?.toString() || '0');
    setPricePhysical(course.pricePhysical?.toString() || '0');
    setPriceOnlineAddHour(course.priceOnlineAddHour?.toString() || '0');
    setPricePhysicalAddHour(course.pricePhysicalAddHour?.toString() || '0');
    setIsActive(course.status === 'active');
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingCourse(null);
    setName('');
    setPriceOnline('');
    setPricePhysical('');
    setPriceOnlineAddHour('');
    setPricePhysicalAddHour('');
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
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingCourse ? 'Edit Course' : 'Add New Course'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Course Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priceOnline">Price Online (LKR) for 1h</Label>
                  <Input id="priceOnline" type="number" value={priceOnline} onChange={(e) => setPriceOnline(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pricePhysical">Price Physical (LKR) for 1h</Label>
                  <Input id="pricePhysical" type="number" value={pricePhysical} onChange={(e) => setPricePhysical(e.target.value)} required />
                </div>
              </div>
               <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priceOnlineAddHour">Add. Hour Online (LKR)</Label>
                  <Input id="priceOnlineAddHour" type="number" value={priceOnlineAddHour} onChange={(e) => setPriceOnlineAddHour(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pricePhysicalAddHour">Add. Hour Physical (LKR)</Label>
                  <Input id="pricePhysicalAddHour" type="number" value={pricePhysicalAddHour} onChange={(e) => setPricePhysicalAddHour(e.target.value)} required />
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
                <Label htmlFor="active">Active</Label>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingCourse ? 'Update' : 'Create'}
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
                  <TableHead>Online (1h / +1h)</TableHead>
                  <TableHead>Physical (1h / +1h)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses?.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">{course.name}</TableCell>
                    <TableCell>
                        <div>LKR {course.priceOnline?.toLocaleString() || 0}</div>
                        <div className="text-xs text-muted-foreground">+ LKR {course.priceOnlineAddHour?.toLocaleString() || 0}</div>
                    </TableCell>
                    <TableCell>
                        <div>LKR {course.pricePhysical?.toLocaleString() || 0}</div>
                        <div className="text-xs text-muted-foreground">+ LKR {course.pricePhysicalAddHour?.toLocaleString() || 0}</div>
                    </TableCell>
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
                    <TableCell colSpan={5} className="text-center text-muted-foreground">No courses found.</TableCell>
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
