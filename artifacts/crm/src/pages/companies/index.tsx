import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useApp, CompanyType } from "@/lib/data-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

const COMPANY_TYPES: CompanyType[] = [
  "Investor",
  "Bank",
  "Investment Bank",
  "Borrower",
  "Service Provider",
];

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["Investor", "Bank", "Investment Bank", "Borrower", "Service Provider"]),
  subType: z.string().optional().default(""),
  tags: z.string().optional().default(""),
});

type FormValues = z.infer<typeof formSchema>;

const TYPE_BADGE_STYLES: Record<CompanyType, string> = {
  "Investor": "bg-violet-100 text-violet-800 border-violet-200",
  "Bank": "bg-blue-100 text-blue-800 border-blue-200",
  "Investment Bank": "bg-sky-100 text-sky-800 border-sky-200",
  "Borrower": "bg-amber-100 text-amber-800 border-amber-200",
  "Service Provider": "bg-slate-100 text-slate-700 border-slate-200",
};

export default function Companies() {
  const { companies, addCompany } = useApp();
  const [open, setOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "Borrower",
      subType: "",
      tags: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    addCompany({
      name: values.name,
      type: values.type,
      subType: values.subType ?? "",
      tags: values.tags
        ? values.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
    });
    setOpen(false);
    form.reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
          <p className="text-muted-foreground mt-2">Manage your organizations and businesses.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-company">
              <Plus className="w-4 h-4 mr-2" />
              Add Company
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Company</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Blackstone Group" {...field} data-testid="input-company-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-company-type">
                            <SelectValue placeholder="Select a type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {COMPANY_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sub-type <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Venture Capital, M&A Advisory" {...field} data-testid="input-company-subtype" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags <span className="text-muted-foreground font-normal">(comma-separated)</span></FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. tech, early-stage, lending" {...field} data-testid="input-company-tags" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" data-testid="button-submit-company">
                  Save Company
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Sub-type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                  No companies yet. Add your first one.
                </TableCell>
              </TableRow>
            ) : (
              companies.map((company) => (
                <TableRow key={company.id} data-testid={`row-company-${company.id}`}>
                  <TableCell className="font-medium">
                    <Link href={`/companies/${company.id}`} className="hover:underline text-primary">
                      {company.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${TYPE_BADGE_STYLES[company.type]}`}
                    >
                      {company.type}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {company.subType || <span className="text-muted-foreground/50">—</span>}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
