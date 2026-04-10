import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useApp,
  PIPELINE_STAGES,
  PipelineStage,
  PipelineCategory,
  CompanyType,
} from "@/lib/data-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, X, Building2, Trash2 } from "lucide-react";

const CATEGORY_STYLES: Record<PipelineCategory, string> = {
  "Fundraising":   "bg-violet-100 text-violet-800 border-violet-200",
  "Co-invest":     "bg-sky-100 text-sky-800 border-sky-200",
  "Deal Sourcing": "bg-amber-100 text-amber-800 border-amber-200",
};

const STAGE_STYLES: Record<PipelineStage, { bar: string; label: string }> = {
  Initial:   { bar: "bg-slate-400",   label: "text-slate-600" },
  Contacted: { bar: "bg-blue-400",    label: "text-blue-700" },
  NDA:       { bar: "bg-amber-400",   label: "text-amber-700" },
  Engaged:   { bar: "bg-violet-500",  label: "text-violet-700" },
  Closed:    { bar: "bg-emerald-500", label: "text-emerald-700" },
};

const COMPANY_TYPE_STYLES: Record<CompanyType, string> = {
  "Investor":        "bg-violet-100 text-violet-800 border-violet-200",
  "Bank":            "bg-blue-100 text-blue-800 border-blue-200",
  "Investment Bank": "bg-sky-100 text-sky-800 border-sky-200",
  "Borrower":        "bg-amber-100 text-amber-800 border-amber-200",
  "Service Provider":"bg-slate-100 text-slate-700 border-slate-200",
};

const formSchema = z.object({
  companyId: z.string().min(1, "Select a company"),
  stage: z.enum(["Initial", "Contacted", "NDA", "Engaged", "Closed"]),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function PipelineDetail() {
  const [, params] = useRoute("/pipelines/:id");
  const { pipelines, pipelineEntries, companies, addPipelineEntry, updatePipelineEntryStage, removePipelineEntry } = useApp();
  const [showForm, setShowForm] = useState(false);

  const pipelineId = params?.id;
  const pipeline = pipelines.find((p) => p.id === pipelineId);
  const entries = pipelineEntries.filter((e) => e.pipelineId === pipelineId);

  const usedCompanyIds = new Set(entries.map((e) => e.companyId));
  const availableCompanies = companies.filter((c) => !usedCompanyIds.has(c.id));

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { companyId: "", stage: "Initial", notes: "" },
  });

  const onSubmit = (values: FormValues) => {
    addPipelineEntry({
      pipelineId: pipelineId!,
      companyId: values.companyId,
      stage: values.stage,
      notes: values.notes ?? "",
    });
    form.reset({ companyId: "", stage: "Initial", notes: "" });
    setShowForm(false);
  };

  if (!pipeline) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Pipeline not found</h2>
        <Link href="/pipelines" className="text-primary hover:underline mt-4 inline-block">
          Return to pipelines
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/pipelines" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 mb-4 w-fit">
          <ArrowLeft className="w-4 h-4" />
          Back to Pipelines
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{pipeline.name}</h1>
            <div className="mt-1.5">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${CATEGORY_STYLES[pipeline.category]}`}>
                {pipeline.category}
              </span>
            </div>
          </div>
          {availableCompanies.length > 0 && (
            <Button
              onClick={() => setShowForm((v) => !v)}
              variant={showForm ? "secondary" : "default"}
              className="gap-2 flex-shrink-0"
              data-testid="button-add-company"
            >
              {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showForm ? "Cancel" : "Add Company"}
            </Button>
          )}
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Add Company to Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="companyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Company</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-9" data-testid="select-entry-company">
                              <SelectValue placeholder="Select a company" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableCompanies.map((c) => (
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
                    name="stage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Stage</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-9" data-testid="select-entry-stage">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PIPELINE_STAGES.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Notes <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any context about this company's position..."
                          className="text-sm resize-none"
                          rows={2}
                          {...field}
                          data-testid="textarea-entry-notes"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="flex justify-end">
                  <Button type="submit" className="h-9 text-sm" data-testid="button-submit-entry">
                    Add to Pipeline
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {entries.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Building2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No companies in this pipeline yet.</p>
          <p className="text-sm mt-1">Use the "Add Company" button to get started.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {PIPELINE_STAGES.map((stage) => {
            const stageEntries = entries.filter((e) => e.stage === stage);
            if (stageEntries.length === 0) return null;
            const style = STAGE_STYLES[stage];
            return (
              <div key={stage} data-testid={`stage-section-${stage}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${style.bar}`} />
                  <h2 className={`text-sm font-bold uppercase tracking-wider ${style.label}`}>{stage}</h2>
                  <span className="text-xs text-muted-foreground">
                    {stageEntries.length} {stageEntries.length === 1 ? "company" : "companies"}
                  </span>
                </div>
                <div className="space-y-2 pl-5">
                  {stageEntries.map((entry) => {
                    const company = companies.find((c) => c.id === entry.companyId);
                    if (!company) return null;
                    return (
                      <div
                        key={entry.id}
                        className="flex items-center gap-4 p-3.5 border rounded-lg bg-card hover:bg-muted/30 transition-colors"
                        data-testid={`entry-${entry.id}`}
                      >
                        <div className="flex-1 min-w-0 flex items-center gap-3">
                          <Link
                            href={`/companies/${company.id}`}
                            className="font-medium text-sm hover:text-primary hover:underline truncate"
                          >
                            {company.name}
                          </Link>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border flex-shrink-0 ${COMPANY_TYPE_STYLES[company.type]}`}>
                            {company.type}
                          </span>
                          {entry.notes && (
                            <span className="text-xs text-muted-foreground truncate hidden md:block">
                              {entry.notes}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Select
                            value={entry.stage}
                            onValueChange={(val) => updatePipelineEntryStage(entry.id, val as PipelineStage)}
                          >
                            <SelectTrigger
                              className="h-8 text-xs w-32"
                              data-testid={`select-stage-${entry.id}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PIPELINE_STAGES.map((s) => (
                                <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                            onClick={() => removePipelineEntry(entry.id)}
                            data-testid={`button-remove-${entry.id}`}
                            aria-label="Remove from pipeline"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
