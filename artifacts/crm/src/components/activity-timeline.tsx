import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useApp, Activity, ActivityType, Contact } from "@/lib/data-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Users, Phone, Mail, Plus, ChevronDown, ChevronUp } from "lucide-react";

const ACTIVITY_TYPES: ActivityType[] = ["Note", "Meeting", "Call", "Email"];

const TYPE_CONFIG: Record<ActivityType, { icon: React.ReactNode; color: string; bg: string }> = {
  Note:    { icon: <FileText className="w-3.5 h-3.5" />, color: "text-slate-600",  bg: "bg-slate-100 border-slate-200" },
  Meeting: { icon: <Users className="w-3.5 h-3.5" />,    color: "text-violet-600", bg: "bg-violet-100 border-violet-200" },
  Call:    { icon: <Phone className="w-3.5 h-3.5" />,    color: "text-emerald-600",bg: "bg-emerald-100 border-emerald-200" },
  Email:   { icon: <Mail className="w-3.5 h-3.5" />,     color: "text-blue-600",   bg: "bg-blue-100 border-blue-200" },
};

const formSchema = z.object({
  type: z.enum(["Note", "Meeting", "Call", "Email"]),
  content: z.string().min(1, "Content is required"),
  date: z.string().min(1, "Date is required"),
  contactId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function formatDate(date: string) {
  if (!date) return "";
  try {
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return date;
  }
}

function today() {
  return new Date().toISOString().split("T")[0];
}

interface ActivityTimelineProps {
  companyId?: string;
  contactId?: string;
  /** When on a company page, pass in the company's contacts to allow linking */
  availableContacts?: Contact[];
}

export function ActivityTimeline({ companyId, contactId, availableContacts }: ActivityTimelineProps) {
  const { activities, contacts, addActivity } = useApp();
  const [showForm, setShowForm] = useState(false);

  const filtered = activities
    .filter((a) => {
      if (contactId) return a.contactId === contactId;
      if (companyId) return a.companyId === companyId;
      return false;
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "Note",
      content: "",
      date: today(),
      contactId: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    addActivity({
      type: values.type,
      content: values.content,
      date: values.date,
      companyId: companyId,
      contactId: values.contactId && values.contactId !== "__none__" ? values.contactId : contactId,
    });
    form.reset({ type: "Note", content: "", date: today(), contactId: "" });
    setShowForm(false);
  };

  const getContactName = (id?: string) => {
    if (!id) return null;
    return contacts.find((c) => c.id === id)?.name ?? null;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Activity</CardTitle>
        <Button
          size="sm"
          variant={showForm ? "secondary" : "default"}
          onClick={() => setShowForm((v) => !v)}
          data-testid="button-toggle-activity-form"
          className="h-8 gap-1.5 text-xs"
        >
          {showForm ? (
            <><ChevronUp className="w-3.5 h-3.5" /> Cancel</>
          ) : (
            <><Plus className="w-3.5 h-3.5" /> Log Activity</>
          )}
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {showForm && (
          <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-8 text-sm" data-testid="select-activity-type">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ACTIVITY_TYPES.map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Date</FormLabel>
                        <FormControl>
                          <Input type="date" className="h-8 text-sm" {...field} data-testid="input-activity-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {availableContacts && availableContacts.length > 0 && (
                  <FormField
                    control={form.control}
                    name="contactId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Contact <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-8 text-sm" data-testid="select-activity-contact">
                              <SelectValue placeholder="Select a contact" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="__none__">No specific contact</SelectItem>
                            {availableContacts.map((c) => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What happened? Key takeaways, next steps..."
                          className="text-sm resize-none"
                          rows={3}
                          {...field}
                          data-testid="textarea-activity-content"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button type="submit" size="sm" className="h-8 text-xs" data-testid="button-submit-activity">
                    Save Activity
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}

        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No activities yet. Log your first one.
          </p>
        ) : (
          <div className="relative">
            <div className="absolute left-[18px] top-0 bottom-0 w-px bg-border" />
            <div className="space-y-4">
              {filtered.map((activity) => {
                const cfg = TYPE_CONFIG[activity.type];
                const contactName = getContactName(activity.contactId);
                return (
                  <div key={activity.id} className="flex gap-3 pl-1" data-testid={`activity-${activity.id}`}>
                    <div className={`relative z-10 flex-shrink-0 w-9 h-9 rounded-full border flex items-center justify-center ${cfg.bg} ${cfg.color}`}>
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-semibold ${cfg.color}`}>{activity.type}</span>
                        {contactName && (
                          <span className="text-xs text-muted-foreground">with {contactName}</span>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">{formatDate(activity.date)}</span>
                      </div>
                      <p className="text-sm text-foreground mt-1 leading-relaxed">{activity.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
