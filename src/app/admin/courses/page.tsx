
'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useCollection, addDocumentNonBlocking, updateDocumentNonBlocking, useMemoFirebase, useDoc } from '@/firebase';
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
import { Course, AdminSettings, CoursePrice } from '@/types';
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
  const [prices, setPrices] = useState<{ [key: string]: Partial<CoursePrice> }>({});
  const [isActive, setIsActive] = useState(true);

  const coursesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'courses'), orderBy('name'));
  }, [firestore]);

  const { data: courses, isLoading: isCoursesLoading } = useCollection<Course>(coursesQuery);

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'admin') : null, [firestore]);
  const { data: settings } = useDoc<AdminSettings>(settingsRef);
  
  useEffect(() => {
    // Initialize prices state with all available currencies
    if (settings?.currencies) {
        const initialPrices: { [key: string]: Partial<CoursePrice> } = {};
        settings.currencies.forEach(c => {
            initialPrices[c.code] = { priceOnline: 0, pricePhysical: 0, priceOnlineAddHour: 0, pricePhysicalAddHour: 0 };
        });
        if (!editingCourse) {
           setPrices(initialPrices);
        }
    }
  }, [settings, isDialogOpen, editingCourse]);


  const handlePriceChange = (currencyCode: string, field: keyof CoursePrice, value: string) => {
    const numericValue = parseFloat(value) || 0;
    setPrices(prev => ({
      ...prev,
      [currencyCode]: {
        ...prev[currencyCode],
        [field]: numericValue,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !adminProfile || !firestore) {
        toast({ title: "Please fill all fields", variant: "destructive" });
        return;
    }
    
    setIsLoading(true);
    try {
      const courseData = {
        name,
        prices,
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
    setPrices(course.prices || {});
    setIsActive(course.status === 'active');
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingCourse(null);
    setName('');
    setPrices({});
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
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingCourse ? 'Edit Course' : 'Add New Course'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
              <div className="space-y-2">
                <Label htmlFor="name">Course Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              
              <div className="space-y-4 pt-4 border-t">
                <Label className="font-semibold">Pricing</Label>
                {settings?.currencies?.map(currency => (
                  <div key={currency.code} className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">{currency.country} ({currency.code})</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`priceOnline-${currency.code}`}>Online (1h)</Label>
                        <Input id={`priceOnline-${currency.code}`} type="number" value={prices[currency.code]?.priceOnline || ''} onChange={(e) => handlePriceChange(currency.code, 'priceOnline', e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`pricePhysical-${currency.code}`}>Physical (1h)</Label>
                        <Input id={`pricePhysical-${currency.code}`} type="number" value={prices[currency.code]?.pricePhysical || ''} onChange={(e) => handlePriceChange(currency.code, 'pricePhysical', e.target.value)} required />
                      </div>
                       <div className="space-y-2">
                        <Label htmlFor={`priceOnlineAddHour-${currency.code}`}>Add. Hour Online</Label>
                        <Input id={`priceOnlineAddHour-${currency.code}`} type="number" value={prices[currency.code]?.priceOnlineAddHour || ''} onChange={(e) => handlePriceChange(currency.code, 'priceOnlineAddHour', e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`pricePhysicalAddHour-${currency.code}`}>Add. Hour Physical</Label>
                        <Input id={`pricePhysicalAddHour-${currency.code}`} type="number" value={prices[currency.code]?.pricePhysicalAddHour || ''} onChange={(e) => handlePriceChange(currency.code, 'pricePhysicalAddHour', e.target.value)} required />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center space-x-2 pt-4 border-t">
                <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
                <Label htmlFor="active">Active</Label>
              </div>
              <DialogFooter className="mt-4 sticky bottom-0 bg-background py-4">
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
                  <TableHead>Online Price (LKR)</TableHead>
                  <TableHead>Physical Price (LKR)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses?.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">{course.name}</TableCell>
                    <TableCell>
                        LKR {course.prices?.LKR?.priceOnline?.toLocaleString() || 0}
                    </TableCell>
                    <TableCell>
                        LKR {course.prices?.LKR?.pricePhysical?.toLocaleString() || 0}
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
