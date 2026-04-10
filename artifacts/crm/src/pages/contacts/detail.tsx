import { useRoute, Link } from "wouter";
import { useApp, RelationshipStrength } from "@/lib/data-context";
import { ArrowLeft, User, Building2, Mail, Phone, Briefcase, Linkedin, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityTimeline } from "@/components/activity-timeline";

const STRENGTH_STYLES: Record<RelationshipStrength, string> = {
  Strong: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Medium: "bg-amber-100 text-amber-800 border-amber-200",
  Weak: "bg-slate-100 text-slate-600 border-slate-200",
};

function DetailRow({ icon, label, value, href }: {
  icon: React.ReactNode;
  label: string;
  value: string | undefined | null;
  href?: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
        {href ? (
          <a
            href={href.startsWith("http") ? href : `https://${href}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline mt-0.5 block"
          >
            {value}
          </a>
        ) : (
          <p className="text-sm text-foreground mt-0.5">{value}</p>
        )}
      </div>
    </div>
  );
}

export default function ContactDetail() {
  const [, params] = useRoute("/contacts/:id");
  const { contacts, companies } = useApp();

  const id = params?.id;
  const contact = contacts.find((c) => c.id === id);
  const company = contact ? companies.find((c) => c.id === contact.companyId) : null;

  if (!contact) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Contact not found</h2>
        <Link href="/contacts" className="text-primary hover:underline mt-4 inline-block">
          Return to contacts
        </Link>
      </div>
    );
  }

  const formatDate = (date: string) => {
    if (!date) return null;
    try {
      return new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    } catch {
      return date;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/contacts" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 mb-4 w-fit">
          <ArrowLeft className="w-4 h-4" />
          Back to Contacts
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{contact.name}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {contact.title && <span className="text-muted-foreground text-sm">{contact.title}</span>}
              {contact.title && contact.role && <span className="text-muted-foreground/40 text-sm">·</span>}
              {contact.role && <span className="text-muted-foreground text-sm">{contact.role}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ActivityTimeline contactId={contact.id} />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DetailRow icon={<Mail className="w-4 h-4" />} label="Email" value={contact.email} href={`mailto:${contact.email}`} />
              <DetailRow icon={<Phone className="w-4 h-4" />} label="Phone" value={contact.phone} href={`tel:${contact.phone}`} />
              <DetailRow icon={<Linkedin className="w-4 h-4" />} label="LinkedIn" value={contact.linkedin} href={contact.linkedin} />
              <DetailRow icon={<Briefcase className="w-4 h-4" />} label="Title" value={contact.title} />
              <DetailRow icon={<Briefcase className="w-4 h-4" />} label="Role" value={contact.role} />
              <DetailRow icon={<Calendar className="w-4 h-4" />} label="Last Contact Date" value={formatDate(contact.lastContactDate)} />
            </CardContent>
          </Card>

          {company && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  Company
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 border rounded-lg bg-muted/20 flex items-center justify-between">
                  <div>
                    <Link href={`/companies/${company.id}`} className="font-semibold hover:underline text-primary block">
                      {company.name}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{company.type}</span>
                      {company.subType && (
                        <>
                          <span className="text-muted-foreground/40 text-xs">·</span>
                          <span className="text-xs text-muted-foreground">{company.subType}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Link href={`/companies/${company.id}`} className="text-xs text-primary hover:underline">
                    View company
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Relationship</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 text-sm">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Strength</p>
                <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium border ${STRENGTH_STYLES[contact.relationshipStrength]}`}>
                  {contact.relationshipStrength}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Last Contact</p>
                <p className="text-foreground">
                  {formatDate(contact.lastContactDate) ?? <span className="text-muted-foreground/50 italic">Not recorded</span>}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
