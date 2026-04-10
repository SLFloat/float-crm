import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "wouter";
import { useApp, Task, Contact } from "@/lib/data-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Circle, Plus, ChevronUp, AlertCircle, Building2, User } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  dueDate: z.string().min(1, "Due date is required"),
  contactId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function today() {
  return new Date().toISOString().split("T")[0];
}

function formatDate(date: string) {
  if (!date) return "";
  try {
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return date;
  }
}

function isOverdue(dueDate: string) {
  return dueDate < today();
}

function isDueToday(dueDate: string) {
  return dueDate === today();
}

interface TaskItemProps {
  task: Task;
  showContext?: boolean;
}

export function TaskItem({ task, showContext }: TaskItemProps) {
  const { completeTask, companies, contacts } = useApp();
  const overdue = task.status === "Open" && isOverdue(task.dueDate);
  const dueToday = task.status === "Open" && isDueToday(task.dueDate);
  const done = task.status === "Completed";

  const company = task.companyId ? companies.find((c) => c.id === task.companyId) : null;
  const contact = task.contactId ? contacts.find((c) => c.id === task.contactId) : null;

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${done ? "opacity-50 bg-muted/20" : "bg-card hover:bg-muted/30"}`}
      data-testid={`task-${task.id}`}
    >
      <button
        onClick={() => !done && completeTask(task.id)}
        className={`mt-0.5 flex-shrink-0 transition-colors ${done ? "text-emerald-500 cursor-default" : "text-muted-foreground hover:text-primary"}`}
        data-testid={`task-complete-${task.id}`}
        aria-label="Mark complete"
      >
        {done
          ? <CheckCircle2 className="w-5 h-5" />
          : <Circle className="w-5 h-5" />
        }
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-snug ${done ? "line-through text-muted-foreground" : ""}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {overdue && (
            <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
              <AlertCircle className="w-3 h-3" />
              Overdue · {formatDate(task.dueDate)}
            </span>
          )}
          {dueToday && (
            <span className="text-xs text-amber-600 font-medium">Due today</span>
          )}
          {!overdue && !dueToday && (
            <span className="text-xs text-muted-foreground">{formatDate(task.dueDate)}</span>
          )}
          {showContext && company && (
            <Link href={`/companies/${company.id}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
              <Building2 className="w-3 h-3" />{company.name}
            </Link>
          )}
          {showContext && contact && (
            <Link href={`/contacts/${contact.id}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
              <User className="w-3 h-3" />{contact.name}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

interface TaskListProps {
  companyId?: string;
  contactId?: string;
  /** When on company page, pass company's contacts for the contact picker */
  availableContacts?: Contact[];
  showContext?: boolean;
}

export function TaskList({ companyId, contactId, availableContacts, showContext }: TaskListProps) {
  const { tasks, addTask } = useApp();
  const [showForm, setShowForm] = useState(false);

  const filtered = tasks
    .filter((t) => {
      if (contactId) return t.contactId === contactId;
      if (companyId) return t.companyId === companyId;
      return false;
    })
    .sort((a, b) => {
      if (a.status === "Completed" && b.status !== "Completed") return 1;
      if (a.status !== "Completed" && b.status === "Completed") return -1;
      return a.dueDate < b.dueDate ? -1 : 1;
    });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "", dueDate: today(), contactId: "" },
  });

  const onSubmit = (values: FormValues) => {
    addTask({
      title: values.title,
      dueDate: values.dueDate,
      status: "Open",
      companyId,
      contactId: values.contactId && values.contactId !== "__none__" ? values.contactId : contactId,
    });
    form.reset({ title: "", dueDate: today(), contactId: "" });
    setShowForm(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Tasks</CardTitle>
        <Button
          size="sm"
          variant={showForm ? "secondary" : "default"}
          onClick={() => setShowForm((v) => !v)}
          data-testid="button-toggle-task-form"
          className="h-8 gap-1.5 text-xs"
        >
          {showForm
            ? <><ChevronUp className="w-3.5 h-3.5" /> Cancel</>
            : <><Plus className="w-3.5 h-3.5" /> Add Task</>
          }
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {showForm && (
          <div className="border rounded-lg p-4 bg-muted/30 space-y-3 mb-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Task</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Follow up on term sheet" className="h-8 text-sm" {...field} data-testid="input-task-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Due Date</FormLabel>
                        <FormControl>
                          <Input type="date" className="h-8 text-sm" {...field} data-testid="input-task-due-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {availableContacts && availableContacts.length > 0 && (
                    <FormField
                      control={form.control}
                      name="contactId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Contact <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-8 text-sm" data-testid="select-task-contact">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="__none__">No contact</SelectItem>
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
                </div>
                <div className="flex justify-end">
                  <Button type="submit" size="sm" className="h-8 text-xs" data-testid="button-submit-task">
                    Save Task
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}

        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No tasks. Add one above.</p>
        ) : (
          <div className="space-y-2">
            {filtered.map((task) => (
              <TaskItem key={task.id} task={task} showContext={showContext} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
