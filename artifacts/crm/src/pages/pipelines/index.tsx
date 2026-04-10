import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useApp, PIPELINE_CATEGORIES, PipelineCategory, PipelineParentType } from "@/lib/data-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GitBranch, Plus, ChevronRight, X, Building2 } from "lucide-react";

const CATEGORY_STYLES: Record<PipelineCategory, string> = {
  "Fundraising":   "bg-violet-100 text-violet-800 border-violet-200",
  "Co-invest":     "bg-sky-100 text-sky-800 border-sky-200",
  "Deal Sourcing": "bg-amber-100 text-amber-800 border-amber-200",
};

const PARENT_LABELS: Record<PipelineCategory, { show: boolean; type: PipelineParentType | null; label: string }> = {
  "Fundraising":   { show: true,  type: "Fund", label: "Fund" },
  "Co-invest":     { show: true,  type: "Deal", label: "Deal" },
  "Deal Sourcing": { show: false, type: null,   label: "" },
};

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.enum(["Fundraising", "Co-invest", "Deal Sourcing"]),
  parentName: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function Pipelines() {
  const { pipelines, pipelineEntries, addPipeline } = useApp();
  const [showForm, setShowForm] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", category: "Fundraising", parentName: "" },
  });

  const watchedCategory = form.watch("category");
  const parentConfig = PARENT_LABELS[watchedCategory];

  const onSubmit = (values: FormValues) => {
    addPipeline({
      name: values.name,
      category: values.category,
      parentType: parentConfig.type ?? undefined,
      parentName: values.parentName?.trim() || undefined,
    });
    form.reset({ name: "", category: "Fundraising", parentName: "" });
    setShowForm(false);
  };

  const entryCount = (pipelineId: string) =>
    pipelineEntries.filter((e) => e.pipelineId === pipelineId).length;

  const activeCount = (pipelineId: string) =>
    pipelineEntries.filter((e) => e.pipelineId === pipelineId && e.status === "Active").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pipelines</h1>
          <p className="text-muted-foreground mt-1">Track companies through fundraising and deal workflows.</p>
        </div>
        <Button
          onClick={() => setShowForm((v) => !v)}
          variant={showForm ? "secondary" : "default"}
          className="gap-2"
          data-testid="button-new-pipeline"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cancel" : "New Pipeline"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Pipeline Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Series C Investors" className="h-9" {...field} data-testid="input-pipeline-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-9" data-testid="select-pipeline-category">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PIPELINE_CATEGORIES.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {parentConfig.show && (
                  <FormField
                    control={form.control}
                    name="parentName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">
                          Linked {parentConfig.label}{" "}
                          <span className="text-muted-foreground font-normal">(optional)</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={parentConfig.type === "Fund" ? "e.g. Horizon Growth Fund IV" : "e.g. Project Apollo"}
                            className="h-9"
                            {...field}
                            data-testid="input-pipeline-parent"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}

                <div className="flex justify-end">
                  <Button type="submit" className="h-9" data-testid="button-submit-pipeline">
                    Create Pipeline
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {pipelines.length === 0 ? (
        <div className="text-center py-20">
          <GitBranch className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-lg">No pipelines yet</p>
          <p className="text-muted-foreground text-sm mt-1">Create your first pipeline to start tracking companies.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pipelines.map((pipeline) => {
            const total = entryCount(pipeline.id);
            const active = activeCount(pipeline.id);
            return (
              <Link key={pipeline.id} href={`/pipelines/${pipeline.id}`} data-testid={`pipeline-row-${pipeline.id}`}>
                <div className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/40 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <GitBranch className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm group-hover:text-primary transition-colors">{pipeline.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${CATEGORY_STYLES[pipeline.category]}`}>
                          {pipeline.category}
                        </span>
                        {pipeline.parentName && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Building2 className="w-3 h-3" />
                            {pipeline.parentType}: {pipeline.parentName}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {active} active · {total} total
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
