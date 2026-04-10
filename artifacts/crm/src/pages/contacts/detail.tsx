import { useRoute, Link } from "wouter";
import { useApp } from "@/lib/data-context";
import { ArrowLeft, User, Building2, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  return (
    <div className="space-y-6">
      <div>
        <Link href="/contacts" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 mb-4 w-fit">
          <ArrowLeft className="w-4 h-4" />
          Back to Contacts
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{contact.name}</h1>
            <div className="mt-1 flex items-center gap-2 text-muted-foreground">
              <Mail className="w-4 h-4" />
              <span>{contact.email}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5 text-muted-foreground" />
              Company Affiliation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {company ? (
              <div className="p-4 border rounded-lg bg-muted/20">
                <Link href={`/companies/${company.id}`} className="font-semibold text-lg hover:underline text-primary block">
                  {company.name}
                </Link>
                <p className="text-sm text-muted-foreground mt-1">{company.type}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No company affiliated.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-muted-foreground" />
              Contact Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="text-muted-foreground font-medium">Email Address</p>
              <p className="mt-1 font-medium">{contact.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-medium">Internal ID</p>
              <p className="mt-1 font-mono text-xs">{contact.id}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-medium">Record Created</p>
              <p className="mt-1">Just now</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
