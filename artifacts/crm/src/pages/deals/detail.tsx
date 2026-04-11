import { useState } from "react";
import { useRoute, Link } from "wouter";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Briefcase, Pencil, X, Building2 } from "lucide-react";

const STATUS_STYLES: Record<DealStatus, string> = {
  "New":           "bg-slate-100 text-slate-700 border-slate-200",
  "Underwriting":  "bg-blue-100 text-blue-800 border-blue-200",
  "Decision Made": "bg-violet-100 text-violet-800 border-violet-200",
};

const DECISION_STYLES: Record<DealDecision, { badge: string; label: string }> = {
  "Pass":     { badge: "bg-red-100 text-red-700 border-red-200",         label: "text-red-700" },
  "Fund":     { badge: "bg-emerald-100 text-emerald-800 border-emerald-200", label: "text-emerald-700" },
  "Co-invest":{ badge: "bg-sky-100 text-sky-800 border-sky-200",         label: "text-sky-700" },
  "Both":     { badge: "bg-violet-100 text-violet-800 border-violet-200", label: "text-violet-700" },
};

function FieldRow({ label, value, empty }: { label: string; value?: string | null; empty?: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">{label}</p>
      <p className={`text-sm ${value ? "text-foreground" : "text-muted-foreground/50 italic"}`}>
        {value || empty || "—"}
      </p>
    </div>
  );
}

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

export default function DealDetail() {
  const [, params] = useRoute("/deals/:id");
  const { deals, companies, updateDeal } = useApp();
  const [editing, setEditing] = useState(false);

  const id = params?.id;
  const deal = deals.find((d) => d.id === id);
  const borrower = deal ? companies.find((c) => c.id === deal.borrowerId) : null;
  const source = deal ? companies.find((c) => c.id === deal.sourceId) : null;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: deal ? {
      name: deal.name,
      borrowerId: deal.borrowerId,
      sourceId: deal.sourceId,
      indicativePrice: deal.indicativePrice,
      indicativeSize: deal.indicativeSize,
      settlementType: deal.settlementType,
      status: deal.status,
      decision: deal.decision || "",
    } : undefined,
  });

  const onSubmit = (values: FormValues) => {
    updateDeal(id!, {
      name: values.name,
      borrowerId: values.borrowerId,
      sourceId: values.sourceId,
      indicativePrice: values.indicativePrice ?? "",
      indicativeSize: values.indicativeSize ?? "",
      settlementType: values.settlementType,
      status: values.status,
      decision: values.decision === "__none__" ? "" : (values.decision as DealDecision) || "",
    });
    setEditing(false);
  };

  if (!deal) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Deal not found</h2>
        <Link href="/deals" className="text-primary hover:underline mt-4 inline-block">Return to deals</Link>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="space-y-6">
        <div>
          <Link href="/deals" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 mb-4 w-fit">
            <ArrowLeft className="w-4 h-4" />
            Back to Deals
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Edit Deal</h1>
            <Button variant="ghost" size="sm" onClick={() => { form.reset(); setEditing(false); }} className="gap-2">
              <X className="w-4 h-4" /> Cancel
            </Button>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide font-semibold">Basic</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Deal Name</FormLabel>
                      <FormControl>
                        <Input className="h-9" {...field} data-testid="input-edit-deal-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="borrowerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Borrower</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-9">
                              <SelectValue />
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
                            <SelectTrigger className="h-9">
                              <SelectValue />
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide font-semibold">Sourcing</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="indicativePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Indicative Price</FormLabel>
                      <FormControl>
                        <Input className="h-9" placeholder="e.g. 95.5 or Par" {...field} />
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
                        <Input className="h-9" placeholder="e.g. $150M" {...field} />
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
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide font-semibold">Underwriting</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
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
                      <FormLabel className="text-xs">Decision</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || "__none__"}>
                        <FormControl>
                          <SelectTrigger className="h-9"><SelectValue placeholder="No decision yet" /></SelectTrigger>
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
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" className="h-9 px-6" data-testid="button-save-deal">
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/deals" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 mb-4 w-fit">
          <ArrowLeft className="w-4 h-4" />
          Back to Deals
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{deal.name}</h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${STATUS_STYLES[deal.status]}`}>
                  {deal.status}
                </span>
                {deal.decision && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${DECISION_STYLES[deal.decision as DealDecision].badge}`}>
                    {deal.decision}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 flex-shrink-0"
            onClick={() => {
              form.reset({
                name: deal.name, borrowerId: deal.borrowerId, sourceId: deal.sourceId,
                indicativePrice: deal.indicativePrice, indicativeSize: deal.indicativeSize,
                settlementType: deal.settlementType, status: deal.status,
                decision: deal.decision || "",
              });
              setEditing(true);
            }}
            data-testid="button-edit-deal"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide font-semibold">Sourcing</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-6">
              <FieldRow label="Indicative Price" value={deal.indicativePrice} empty="Not specified" />
              <FieldRow label="Indicative Size" value={deal.indicativeSize} empty="Not specified" />
              <FieldRow label="Settlement Type" value={deal.settlementType} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide font-semibold">Underwriting</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Status</p>
                <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium border ${STATUS_STYLES[deal.status]}`}>
                  {deal.status}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Decision</p>
                {deal.decision ? (
                  <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium border ${DECISION_STYLES[deal.decision as DealDecision].badge}`}>
                    {deal.decision}
                  </span>
                ) : (
                  <p className="text-sm text-muted-foreground/50 italic">No decision yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Parties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Borrower</p>
                {borrower ? (
                  <Link
                    href={`/companies/${borrower.id}`}
                    className="flex items-center gap-2 p-2.5 border rounded-lg hover:bg-muted/40 transition-colors group"
                  >
                    <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">{borrower.name}</p>
                      <p className="text-xs text-muted-foreground">{borrower.type}</p>
                    </div>
                  </Link>
                ) : (
                  <p className="text-sm text-muted-foreground/50 italic">Not set</p>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Source</p>
                {source ? (
                  <Link
                    href={`/companies/${source.id}`}
                    className="flex items-center gap-2 p-2.5 border rounded-lg hover:bg-muted/40 transition-colors group"
                  >
                    <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">{source.name}</p>
                      <p className="text-xs text-muted-foreground">{source.type}</p>
                    </div>
                  </Link>
                ) : (
                  <p className="text-sm text-muted-foreground/50 italic">Not set</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
