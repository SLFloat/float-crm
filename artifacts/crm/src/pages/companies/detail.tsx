import { useRoute, Link } from "wouter";
import { useApp, CompanyType, PipelineCategory, PipelineStage } from "@/lib/data-context";
import { ArrowLeft, Building2, Mail, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityTimeline } from "@/components/activity-timeline";
import { TaskList } from "@/components/task-list";

const TYPE_BADGE_STYLES: Record<CompanyType, string> = {
  "Investor":        "bg-violet-100 text-violet-800 border-violet-200",
  "Bank":            "bg-blue-100 text-blue-800 border-blue-200",
  "Investment Bank": "bg-sky-100 text-sky-800 border-sky-200",
  "Borrower":        "bg-amber-100 text-amber-800 border-amber-200",
  "Service Provider":"bg-slate-100 text-slate-700 border-slate-200",
};

const CATEGORY_STYLES: Record<PipelineCategory, string> = {
  "Fundraising":   "bg-violet-100 text-violet-800 border-violet-200",
  "Co-invest":     "bg-sky-100 text-sky-800 border-sky-200",
  "Deal Sourcing": "bg-amber-100 text-amber-800 border-amber-200",
};

const STAGE_STYLES: Record<PipelineStage, string> = {
  Initial:   "text-slate-600",
  Contacted: "text-blue-700",
  NDA:       "text-amber-700",
  Engaged:   "text-violet-700",
  Closed:    "text-emerald-700",
};

export default function CompanyDetail() {
  const [, params] = useRoute("/companies/:id");
  const { companies, contacts, pipelines, pipelineEntries } = useApp();

  const id = params?.id;
  const company = companies.find((c) => c.id === id);
  const companyContacts = contacts.filter((c) => c.companyId === id);

  const companyPipelineEntries = pipelineEntries.filter((e) => e.companyId === id);
  const companyPipelines = companyPipelineEntries.map((entry) => ({
    entry,
    pipeline: pipelines.find((p) => p.id === entry.pipelineId),
  })).filter((x) => x.pipeline != null);

  if (!company) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Company not found</h2>
        <Link href="/companies" className="text-primary hover:underline mt-4 inline-block">
          Return to companies
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/companies" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 mb-4 w-fit">
          <ArrowLeft className="w-4 h-4" />
          Back to Companies
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{company.name}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${TYPE_BADGE_STYLES[company.type]}`}>
                {company.type}
              </span>
              {company.subType && (
                <span className="text-sm text-muted-foreground">{company.subType}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TaskList companyId={company.id} availableContacts={companyContacts} />
          <ActivityTimeline companyId={company.id} availableContacts={companyContacts} />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contacts ({companyContacts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {companyContacts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No contacts associated with this company.</p>
              ) : (
                <div className="space-y-3">
                  {companyContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      data-testid={`contact-row-${contact.id}`}
                    >
                      <div>
                        <Link href={`/contacts/${contact.id}`} className="font-medium hover:underline text-primary block text-sm">
                          {contact.name}
                        </Link>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                          {contact.title && <span>{contact.title}</span>}
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />{contact.email}
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild className="text-xs h-7">
                        <Link href={`/contacts/${contact.id}`}>View</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 text-sm">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Type</p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${TYPE_BADGE_STYLES[company.type]}`}>
                  {company.type}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Sub-type</p>
                <p className="text-foreground">
                  {company.subType || <span className="text-muted-foreground/50 italic">Not specified</span>}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Tags</p>
                {company.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {company.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground border"
                        data-testid={`tag-${tag}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground/50 italic">No tags</span>
                )}
              </div>
            </CardContent>
          </Card>

          {companyPipelines.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-muted-foreground" />
                  Pipelines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {companyPipelines.map(({ entry, pipeline }) => (
                  <Link
                    key={entry.id}
                    href={`/pipelines/${pipeline!.id}`}
                    className="block p-3 border rounded-lg hover:bg-muted/40 transition-colors group"
                    data-testid={`pipeline-ref-${entry.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                        {pipeline!.name}
                      </p>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border flex-shrink-0 ${CATEGORY_STYLES[pipeline!.category]}`}>
                        {pipeline!.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs font-semibold ${STAGE_STYLES[entry.stage]}`}>
                        {entry.stage}
                      </span>
                      {entry.nextStep && (
                        <span className="text-xs text-muted-foreground truncate">· {entry.nextStep}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
