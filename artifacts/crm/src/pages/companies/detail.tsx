import { useRoute, Link } from "wouter";
import { useApp } from "@/lib/data-context";
import { ArrowLeft, Building2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
            <div className="mt-1">
              <Badge variant="secondary">{company.type}</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Associated Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              {companyContacts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No contacts found for this company.</p>
              ) : (
                <div className="space-y-4">
                  {companyContacts.map((contact) => (
                    <div key={contact.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div>
                        <Link href={`/contacts/${contact.id}`} className="font-medium hover:underline text-primary block">
                          {contact.name}
                        </Link>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Mail className="w-3 h-3" />
                          {contact.email}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/contacts/${contact.id}`}>View</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground font-medium">Internal ID</p>
                <p className="mt-1 font-mono text-xs">{company.id}</p>
              </div>
              <div>
                <p className="text-muted-foreground font-medium">Record Created</p>
                <p className="mt-1">Just now</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
