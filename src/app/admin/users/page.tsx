
'use client';

import * as React from 'react';
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
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
import { Loader2, MoreHorizontal, FileDown, ArrowUpDown, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { UserProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { logActivity } from '@/lib/logger';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/react-table";
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

const roleHierarchy: Record<UserProfile['role'], number> = {
    student: 0,
    admin: 1,
    superadmin: 2,
    developer: 3,
};

const exportToCsv = (filename: string, rows: object[]) => {
    if (!rows || rows.length === 0) {
        return;
    }
    const separator = ',';
    const keys = Object.keys(rows[0]);
    const csvContent =
        keys.join(separator) +
        '\n' +
        rows.map(row => {
            return keys.map((k: any) => {
                let cell = (row as any)[k] === null || (row as any)[k] === undefined ? '' : (row as any)[k];
                cell = cell instanceof Date 
                    ? cell.toLocaleString() 
                    : cell.toString().replace(/"/g, '""');
                if (cell.search(/("|,|\n)/g) >= 0) {
                    cell = `"${cell}"`;
                }
                return cell;
            }).join(separator);
        }).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
     if (typeof window !== 'undefined' && window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveOrOpenBlob(blob, filename);
    } else {
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
};

export default function AdminUsersPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { profile: adminProfile } = useUserProfile();

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: users, isLoading } = useCollection<UserProfile>(usersQuery);
  
  const handleUpdateUser = (userId: string, data: Partial<UserProfile>) => {
    if (!firestore || !adminProfile) return;
    const userRef = doc(firestore, 'users', userId);
    updateDocumentNonBlocking(userRef, data);
    
    const targetUser = users?.find(u => u.id === userId);
    const action = data.role ? 'user.role.change' : 'user.status.change';
    
    logActivity(firestore, {
      actorId: adminProfile.id,
      actorName: adminProfile.name || 'Admin',
      actorEmail: adminProfile.email,
      action: action,
      entityType: 'user',
      entityId: userId,
      details: data,
      targetUserId: userId,
      targetUserName: targetUser?.name,
    });
    
    toast({
      title: "User Updated",
      description: `User has been updated.`,
    });
  };
  
  const handleExport = () => {
    if (users) {
        const dataToExport = users.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status || 'active',
            phoneNumber: user.phoneNumber || '',
            joinedDate: user.createdAt?.toDate ? format(user.createdAt.toDate(), 'yyyy-MM-dd') : 'N/A',
        }));
        exportToCsv(`smartlabs_users_${format(new Date(), 'yyyy-MM-dd')}.csv`, dataToExport);
    }
  };

  const getRoleVariant = (role?: UserProfile['role']) => {
    switch(role) {
      case 'developer': return 'destructive';
      case 'superadmin': return 'destructive';
      case 'admin': return 'secondary';
      default: return 'outline';
    }
  };
  
  const canManage = (targetUser: UserProfile) => {
    if (!adminProfile) return false;
    if (adminProfile.id === targetUser.id) return false; // Can't manage self

    const adminLevel = roleHierarchy[adminProfile.role];
    const targetLevel = roleHierarchy[targetUser.role];

    return adminLevel > targetLevel;
  };

  const availableRolesToAssign = () => {
    if (!adminProfile) return [];
    const adminLevel = roleHierarchy[adminProfile.role];
    return (Object.keys(roleHierarchy) as Array<UserProfile['role']>).filter(
      role => adminLevel > roleHierarchy[role]
    );
  };
  
  const columns: ColumnDef<UserProfile>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <Badge variant={getRoleVariant(row.original.role)}>
          {row.original.role}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'suspended' ? 'destructive' : 'default'} className={row.original.status === 'suspended' ? '' : 'bg-green-100 text-green-800'}>
          {row.original.status || 'active'}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Joined Date",
      cell: ({ row }) => (
         <span>{row.original.createdAt?.toDate ? format(row.original.createdAt.toDate(), 'yyyy-MM-dd') : 'N/A'}</span>
      )
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0" disabled={!canManage(user)}>
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs font-light">Change Role</DropdownMenuLabel>
              {availableRolesToAssign().map(role => (
                 <DropdownMenuItem key={role} onClick={() => handleUpdateUser(user.id, { role: role as UserProfile['role'] })}>
                    Make {role.charAt(0).toUpperCase() + role.slice(1)}
                 </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
               <DropdownMenuItem
                className="text-yellow-600 focus:text-yellow-700"
                onClick={() => handleUpdateUser(user.id, { status: 'suspended' })}>
                Suspend User
               </DropdownMenuItem>
              <DropdownMenuItem
                 className="text-green-600 focus:text-green-700"
                onClick={() => handleUpdateUser(user.id, { status: 'active' })}>
                Activate User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: users || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Users Management</h2>
        <Button onClick={handleExport} disabled={!users || users.length === 0}>
            <FileDown className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered Users</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
          ) : (
            <div>
              <div className="flex items-center py-4">
                <Input
                  placeholder="Filter by name..."
                  value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                  onChange={(event) =>
                    table.getColumn("name")?.setFilterValue(event.target.value)
                  }
                  className="max-w-sm"
                />
                 <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="ml-auto">
                      View <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {table
                      .getAllColumns()
                      .filter(
                        (column) => column.getCanHide()
                      )
                      .map((column) => {
                        return (
                          <DropdownMenuCheckboxItem
                            key={column.id}
                            className="capitalize"
                            checked={column.getIsVisible()}
                            onCheckedChange={(value) =>
                              column.toggleVisibility(!!value)
                            }
                          >
                            {column.id}
                          </DropdownMenuCheckboxItem>
                        )
                      })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                          return (
                            <TableHead key={header.id}>
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                            </TableHead>
                          )
                        })}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() && "selected"}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="h-24 text-center">
                          No results.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
               <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
