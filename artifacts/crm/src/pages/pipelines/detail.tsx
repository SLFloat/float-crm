import { useState, useRef, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useApp,
  PIPELINE_STAGES,
  PipelineStage,
  PipelineCategory,
  PipelineEntry,
  CompanyType,
} from "@/lib/data-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, X, Building2, Trash2, Pencil, Check, CalendarDays } from "lucide-react";

const CATEGORY_STYLES: Record<PipelineCategory, string> = {
  "Fundraising":   "bg-violet-100 text-violet-800 border-violet-200",
  "Co-invest":     "bg-sky-100 text-sky-800 border-sky-200",
  "Deal Sourcing": "bg-amber-100 text-amber-800 border-amber-200",
};

const STAGE_STYLES: Record<PipelineStage, { dot: string; heading: string; bg: string }> = {
  Initial:   { dot: "bg-slate-400",   heading: "text-slate-600",  bg: "bg-slate-50 border-slate-200" },
  Contacted: { dot: "bg-blue-400",    heading: "text-blue-700",   bg: "bg-blue-50 border-blue-200" },
  NDA:       { dot: "bg-amber-400",   heading: "text-amber-700",  bg: "bg-amber-50 border-amber-200" },
  Engaged:   { dot: "bg-violet-500",  heading: "text-violet-700", bg: "bg-violet-50 border-violet-200" },
  Closed:    { dot: "bg-emerald-500", heading: "text-emerald-700",bg: "bg-emerald-50 border-emerald-200" },
};

const COMPANY_TYPE_STYLES: Record<CompanyType, string> = {
  "Investor":        "bg-violet-100 text-violet-800 border-violet-200",
  "Bank":            "bg-blue-100 text-blue-800 border-blue-200",
  "Investment Bank": "bg-sky-100 text-sky-800 border-sky-200",
  "Borrower":        "bg-amber-100 text-amber-800 border-amber-200",
  "Service Provider":"bg-slate-100 text-slate-700 border-slate-200",
};

function formatDate(date: string) {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch { return "—"; }
}

function InlineEdit({ value, onSave, placeholder }: { value: string; onSave: (v: string) => void; placeholder: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const save = () => { onSave(draft); setEditing(false); };
  const cancel = () => { setDraft(value); setEditing(false); };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5 flex-1">
        <Input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
          className="h-7 text-xs flex-1"
          placeholder={placeholder}
        />
        <button onClick={save} className="text-emerald-600 hover:text-emerald-700 flex-shrink-0" aria-label="Save">
          <Check className="w-3.5 h-3.5" />
        </button>
        <button onClick={cancel} className="text-muted-foreground hover:text-foreground flex-shrink-0" aria-label="Cancel">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-1.5 group/edit cursor-pointer flex-1 min-w-0"
      onClick={() => { setDraft(value); setEditing(true); }}
    >
      {value ? (
        <span className="text-xs text-foreground truncate">{value}</span>
      ) : (
        <span className="text-xs text-muted-foreground/50 italic">{placeholder}</span>
      )}
      <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover/edit:opacity-100 flex-shrink-0 transition-opacity" />
    </div>
  );
}

const entryFormSchema = z.object({
  companyId: z.string().min(1, "Select a company"),
  stage: z.enum(["Initial", "Contacted", "NDA", "Engaged", "Closed"]),
  nextStep: z.string().optional(),
});
type EntryFormValues = z.infer<typeof entryFormSchema>;

function today() {
  return new Date().toISOString().split("T")[0];
}

export default function PipelineDetail() {
  const [, params] = useRoute("/pipelines/:id");
  const { pipelines, pipelineEntries, companies, addPipelineEntry, updatePipelineEntry, removePipelineEntry } = useApp();
  const [showForm, setShowForm] = useState(false);

  const pipelineId = params?.id;
  const pipeline = pipelines.find((p) => p.id === pipelineId);
  const entries = pipelineEntries.filter((e) => e.pipelineId === pipelineId);

  const usedCompanyIds = new Set(entries.map((e) => e.companyId));
  const availableCompanies = companies.filter((c) => !usedCompanyIds.has(c.id));

  const form = useForm<EntryFormValues>({
    resolver: zodResolver(entryFormSchema),
    defaultValues: { companyId: "", stage: "Initial", nextStep: "" },
  });

  const onSubmit = (values: EntryFormValues) => {
    addPipelineEntry({
      pipelineId: pipelineId!,
      companyId: values.companyId,
      stage: values.stage,
      nextStep: values.nextStep ?? "",
      lastActivityDate: today(),
      status: "Active",
    });
    form.reset({ companyId: "", stage: "Initial", nextStep: "" });
    setShowForm(false);
  };

  if (!pipeline) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Pipeline not found</h2>
        <Link href="/pipelines" className="text-primary hover:underline mt-4 inline-block">Return to pipelines</Link>
      </div>
    );
  }

  const activeEntries = entries.filter((e) => e.status === "Active");
  const closedEntries = entries.filter((e) => e.status === "Closed");

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
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${CATEGORY_STYLES[pipeline.category]}`}>
                {pipeline.category}
              </span>
              {pipeline.parentName && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Building2 className="w-3.5 h-3.5" />
                  {pipeline.parentType}: <span className="font-medium text-foreground">{pipeline.parentName}</span>
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {activeEntries.length} active · {closedEntries.length} closed
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
                  name="nextStep"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Next Step <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Schedule intro call" className="h-9 text-sm" {...field} data-testid="input-entry-nextstep" />
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
        <div className="space-y-8">
          {PIPELINE_STAGES.map((stage) => {
            const stageEntries = activeEntries.filter((e) => e.stage === stage);
            if (stageEntries.length === 0) return null;
            const style = STAGE_STYLES[stage];
            return (
              <div key={stage} data-testid={`stage-section-${stage}`}>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${style.dot}`} />
                  <h2 className={`text-sm font-bold uppercase tracking-wider ${style.heading}`}>{stage}</h2>
                  <span className="text-xs text-muted-foreground">{stageEntries.length} {stageEntries.length === 1 ? "company" : "companies"}</span>
                </div>

                <div className="space-y-2 pl-5">
                  {/* Column headers */}
                  <div className="grid grid-cols-[1fr_180px_160px_120px_36px] gap-3 px-3.5 pb-1">
                    <span className="text-xs text-muted-foreground font-medium">Company</span>
                    <span className="text-xs text-muted-foreground font-medium">Next Step</span>
                    <span className="text-xs text-muted-foreground font-medium">Last Activity</span>
                    <span className="text-xs text-muted-foreground font-medium">Stage</span>
                    <span />
                  </div>

                  {stageEntries.map((entry) => {
                    const company = companies.find((c) => c.id === entry.companyId);
                    if (!company) return null;
                    return (
                      <div
                        key={entry.id}
                        className="grid grid-cols-[1fr_180px_160px_120px_36px] gap-3 items-center px-3.5 py-2.5 border rounded-lg bg-card hover:bg-muted/20 transition-colors"
                        data-testid={`entry-${entry.id}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Link
                            href={`/companies/${company.id}`}
                            className="font-medium text-sm hover:text-primary hover:underline truncate"
                          >
                            {company.name}
                          </Link>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border flex-shrink-0 ${COMPANY_TYPE_STYLES[company.type]}`}>
                            {company.type}
                          </span>
                        </div>

                        <InlineEdit
                          value={entry.nextStep}
                          onSave={(v) => updatePipelineEntry(entry.id, { nextStep: v })}
                          placeholder="Add next step…"
                        />

                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CalendarDays className="w-3 h-3 flex-shrink-0" />
                          {formatDate(entry.lastActivityDate)}
                        </div>

                        <Select
                          value={entry.stage}
                          onValueChange={(val) => {
                            if (val === "__close__") {
                              updatePipelineEntry(entry.id, { status: "Closed" });
                            } else {
                              updatePipelineEntry(entry.id, { stage: val as PipelineStage });
                            }
                          }}
                        >
                          <SelectTrigger className="h-7 text-xs" data-testid={`select-stage-${entry.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PIPELINE_STAGES.map((s) => (
                              <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                            ))}
                            <SelectItem value="__close__" className="text-xs text-muted-foreground border-t mt-1 pt-1">Mark Closed</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                          onClick={() => removePipelineEntry(entry.id)}
                          data-testid={`button-remove-${entry.id}`}
                          aria-label="Remove from pipeline"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {closedEntries.length > 0 && (
            <div data-testid="stage-section-closed">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-gray-300" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">Closed</h2>
                <span className="text-xs text-muted-foreground">{closedEntries.length} {closedEntries.length === 1 ? "company" : "companies"}</span>
              </div>
              <div className="space-y-2 pl-5">
                {closedEntries.map((entry) => {
                  const company = companies.find((c) => c.id === entry.companyId);
                  if (!company) return null;
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between px-3.5 py-2.5 border rounded-lg bg-muted/20 opacity-60"
                      data-testid={`entry-closed-${entry.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm line-through text-muted-foreground">{company.name}</span>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${COMPANY_TYPE_STYLES[company.type]}`}>
                          {company.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => updatePipelineEntry(entry.id, { status: "Active", stage: "Initial" })}
                        >
                          Reopen
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                          onClick={() => removePipelineEntry(entry.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
