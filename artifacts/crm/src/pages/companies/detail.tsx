import { useRoute, Link } from "wouter";
import { useApp, CompanyType } from "@/lib/data-context";
import { ArrowLeft, Building2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityTimeline } from "@/components/activity-timeline";

const TYPE_BADGE_STYLES: Record<CompanyType, string> = {
  "Investor": "bg-violet-100 text-violet-800 border-violet-200",
  "Bank": "bg-blue-100 text-blue-800 border-blue-200",
  "Investment Bank": "bg-sky-100 text-sky-800 border-sky-200",
  "Borrower": "bg-amber-100 text-amber-800 border-amber-200",
  "Service Provider": "bg-slate-100 text-slate-700 border-slate-200",
};

export default function CompanyDetail() {
  const [, params] = useRoute("/companies/:id");
  const { companies, contacts } = useApp();

  const id = params?.id;
  const company = companies.find((c) => c.id === id);
  const companyContacts = contacts.filter((c) => c.companyId === id);

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
          <ActivityTimeline
            companyId={company.id}
            availableContacts={companyContacts}
          />

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
        </div>
      </div>
    </div>
  );
}
