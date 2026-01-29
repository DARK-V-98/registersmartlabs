
'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useCollection, updateDocumentNonBlocking, useMemoFirebase, useStorage, setDocumentNonBlocking, useDoc } from '@/firebase';
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
import { Lecturer, Course, CoursePrice, AdminSettings, CurrencySetting } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Pencil, User as UserIcon } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { logActivity } from '@/lib/logger';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pricing, setPricing] = useState<{ [courseId: string]: { [currencyCode: string]: Partial<CoursePrice> } }>({});

  const { data: lecturers, isLoading: isLecturersLoading } = useCollection<Lecturer>(
    useMemoFirebase(() => firestore ? query(collection(firestore, 'lecturers'), orderBy('name')) : null, [firestore])
  );

  const { data: courses } = useCollection<Course>(
    useMemoFirebase(() => firestore ? query(collection(firestore, 'courses'), orderBy('name')) : null, [firestore])
  );

  const { data: settings } = useDoc<AdminSettings>(
    useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'admin') : null, [firestore])
  );

  const currenciesToDisplay = useMemo((): CurrencySetting[] => {
    const defaultCurrency = { code: 'LKR', country: 'Sri Lanka', symbol: 'LKR' };
    if (settings?.currencies && settings.currencies.length > 0) {
      // Ensure LKR is always first if it exists
      const lkr = settings.currencies.find(c => c.code === 'LKR');
      const others = settings.currencies.filter(c => c.code !== 'LKR');
      return lkr ? [lkr, ...others] : [defaultCurrency, ...others];
    }
    return [defaultCurrency];
  }, [settings]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handlePriceChange = (courseId: string, currencyCode: string, field: keyof CoursePrice, value: string) => {
    const numericValue = parseFloat(value) || 0;
    setPricing(prev => ({
      ...prev,
      [courseId]: {
        ...prev[courseId],
        [currencyCode]: {
          ...prev[courseId]?.[currencyCode],
          [field]: numericValue
        }
      }
    }));
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

      const lecturerData: Partial<Lecturer> = {
        name,
        courses: selectedCourses,
        imageUrl: imageUrl,
        pricing: pricing,
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
            details: { name: lecturerData.name, courses: lecturerData.courses?.length },
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
    setPreviewUrl(lecturer.imageUrl || null);
    setPricing(lecturer.pricing || {});
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingLecturer(null);
    setName('');
    setSelectedCourses([]);
    setImageFile(null);
    setPreviewUrl(null);
    setPricing({});
  };

  const toggleCourse = (courseId: string) => {
    const isSelected = selectedCourses.includes(courseId);
    if (isSelected) {
      setSelectedCourses(prev => prev.filter(id => id !== courseId));
      setPricing(prev => {
        const newPricing = { ...prev };
        delete newPricing[courseId];
        return newPricing;
      });
    } else {
      setSelectedCourses(prev => [...prev, courseId]);
    }
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
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingLecturer ? 'Edit Lecturer' : 'Add New Lecturer'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={previewUrl || ''} alt={name} />
                  <AvatarFallback className="text-4xl"><UserIcon /></AvatarFallback>
                </Avatar>
                <Input id="image" type="file" onChange={handleImageChange} accept="image/*" />
              </div>

              <div className="space-y-2">
                  <Label htmlFor="name">Lecturer Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              
              <div className="space-y-2 border-t pt-4">
                <Label>Assigned Courses & Pricing</Label>
                <div className="border p-4 rounded-md max-h-60 overflow-y-auto">
                  <Accordion type="multiple" className="w-full">
                    {courses?.map(course => (
                      <AccordionItem value={course.id} key={course.id}>
                        <div className="flex items-center gap-4">
                           <Checkbox 
                              id={`course-${course.id}`} 
                              checked={selectedCourses.includes(course.id)}
                              onCheckedChange={() => toggleCourse(course.id)}
                            />
                          <AccordionTrigger className="flex-1">
                              <Label htmlFor={`course-${course.id}`} className="text-sm font-medium cursor-pointer">
                                {course.name}
                              </Label>
                          </AccordionTrigger>
                        </div>
                        <AccordionContent>
                          {selectedCourses.includes(course.id) ? (
                            <div className="pl-8 pt-4 space-y-4">
                              {currenciesToDisplay.map(currency => (
                                <div key={currency.code} className="p-4 border rounded-lg bg-secondary/50">
                                  <h4 className="font-medium mb-2">{currency.country} ({currency.code})</h4>
                                  <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`priceOnline-${course.id}-${currency.code}`}>Online (1h)</Label>
                                        <Input id={`priceOnline-${course.id}-${currency.code}`} type="number" value={pricing[course.id]?.[currency.code]?.priceOnline || ''} onChange={(e) => handlePriceChange(course.id, currency.code, 'priceOnline', e.target.value)} required />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`pricePhysical-${course.id}-${currency.code}`}>Physical (1h)</Label>
                                        <Input id={`pricePhysical-${course.id}-${currency.code}`} type="number" value={pricing[course.id]?.[currency.code]?.pricePhysical || ''} onChange={(e) => handlePriceChange(course.id, currency.code, 'pricePhysical', e.target.value)} required />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`priceOnlineAddHour-${course.id}-${currency.code}`}>Add. Hour Online</Label>
                                        <Input id={`priceOnlineAddHour-${course.id}-${currency.code}`} type="number" value={pricing[course.id]?.[currency.code]?.priceOnlineAddHour || ''} onChange={(e) => handlePriceChange(course.id, currency.code, 'priceOnlineAddHour', e.target.value)} required />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`pricePhysicalAddHour-${course.id}-${currency.code}`}>Add. Hour Physical</Label>
                                        <Input id={`pricePhysicalAddHour-${course.id}-${currency.code}`} type="number" value={pricing[course.id]?.[currency.code]?.pricePhysicalAddHour || ''} onChange={(e) => handlePriceChange(course.id, currency.code, 'pricePhysicalAddHour', e.target.value)} required />
                                      </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                             <p className="pl-8 pt-4 text-sm text-muted-foreground">Select this course to set its price for this lecturer.</p>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
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
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(lecturer)}>
                        <Pencil className="h-4 w-4" />
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
