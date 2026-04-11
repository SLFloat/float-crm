import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useApp,
  DealStatus,
  DealDecision,
  DealSettlementType,
  DEAL_STATUSES,
  DEAL_DECISIONS,
  DEAL_SETTLEMENT_TYPES,
} from "@/lib/data-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, Plus, X, ChevronRight } from "lucide-react";

const STATUS_STYLES: Record<DealStatus, string> = {
  "New":           "bg-slate-100 text-slate-700 border-slate-200",
  "Underwriting":  "bg-blue-100 text-blue-800 border-blue-200",
  "Decision Made": "bg-violet-100 text-violet-800 border-violet-200",
};

const DECISION_STYLES: Record<DealDecision, string> = {
  "Pass":     "bg-red-100 text-red-700 border-red-200",
  "Fund":     "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Co-invest":"bg-sky-100 text-sky-800 border-sky-200",
  "Both":     "bg-violet-100 text-violet-800 border-violet-200",
};

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  borrowerId: z.string().min(1, "Borrower is required"),
  sourceId: z.string().min(1, "Source is required"),
  indicativePrice: z.string().optional(),
  indicativeSize: z.string().optional(),
  settlementType: z.enum(["Assignment", "Participation", "Both"]),
  status: z.enum(["New", "Underwriting", "Decision Made"]),
  decision: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function Deals() {
  const { deals, companies, addDeal } = useApp();
  const [showForm, setShowForm] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "", borrowerId: "", sourceId: "",
      indicativePrice: "", indicativeSize: "",
      settlementType: "Assignment", status: "New", decision: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    addDeal({
      name: values.name,
      borrowerId: values.borrowerId,
      sourceId: values.sourceId,
      indicativePrice: values.indicativePrice ?? "",
      indicativeSize: values.indicativeSize ?? "",
      settlementType: values.settlementType,
      status: values.status,
      decision: (values.decision as DealDecision) || "",
    });
    form.reset();
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deals</h1>
          <p className="text-muted-foreground mt-1">Track loan and investment opportunities through underwriting.</p>
        </div>
        <Button
          onClick={() => setShowForm((v) => !v)}
          variant={showForm ? "secondary" : "default"}
          className="gap-2"
          data-testid="button-new-deal"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cancel" : "New Deal"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Basic</p>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="col-span-1">
                          <FormLabel className="text-xs">Deal Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Project Falcon" className="h-9" {...field} data-testid="input-deal-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="borrowerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Borrower</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-9" data-testid="select-deal-borrower">
                                <SelectValue placeholder="Select company" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {companies.map((c) => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="sourceId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Source</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-9" data-testid="select-deal-source">
                                <SelectValue placeholder="Select company" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {companies.map((c) => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Sourcing</p>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="indicativePrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Indicative Price</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 95.5 or Par" className="h-9" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="indicativeSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Indicative Size</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. $150M" className="h-9" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="settlementType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Settlement Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {DEAL_SETTLEMENT_TYPES.map((s) => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Underwriting</p>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {DEAL_STATUSES.map((s) => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="decision"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Decision <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="No decision yet" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="__none__">No decision yet</SelectItem>
                              {DEAL_DECISIONS.map((d) => (
                                <SelectItem key={d} value={d}>{d}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Button type="submit" className="h-9" data-testid="button-submit-deal">
                    Create Deal
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {deals.length === 0 ? (
        <div className="text-center py-20">
          <Briefcase className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-lg">No deals yet</p>
          <p className="text-muted-foreground text-sm mt-1">Create your first deal to start tracking opportunities.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Deal</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Borrower</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Source</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Size</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Decision</th>
                <th className="w-8 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {deals.map((deal) => {
                const borrower = companies.find((c) => c.id === deal.borrowerId);
                const source = companies.find((c) => c.id === deal.sourceId);
                return (
                  <tr
                    key={deal.id}
                    className="bg-card hover:bg-muted/30 transition-colors cursor-pointer group"
                    onClick={() => window.location.href = `${import.meta.env.BASE_URL}deals/${deal.id}`}
                    data-testid={`deal-row-${deal.id}`}
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/deals/${deal.id}`}
                        className="font-semibold text-sm group-hover:text-primary transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {deal.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/companies/${borrower?.id}`}
                        className="text-sm text-muted-foreground hover:text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {borrower?.name ?? "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/companies/${source?.id}`}
                        className="text-sm text-muted-foreground hover:text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {source?.name ?? "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{deal.indicativeSize || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${STATUS_STYLES[deal.status]}`}>
                        {deal.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {deal.decision ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${DECISION_STYLES[deal.decision as DealDecision]}`}>
                          {deal.decision}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/50 italic">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
