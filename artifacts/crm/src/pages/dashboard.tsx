import { useApp } from "@/lib/data-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Activity, AlertCircle } from "lucide-react";
import { TaskItem } from "@/components/task-list";
import { FileText, Users as UsersIcon, Phone, Mail } from "lucide-react";
import { Link } from "wouter";

const ACTIVITY_TYPE_CONFIG = {
  Note:    { color: "text-slate-500",   label: "Note" },
  Meeting: { color: "text-violet-600",  label: "Meeting" },
  Call:    { color: "text-emerald-600", label: "Call" },
  Email:   { color: "text-blue-600",    label: "Email" },
} as const;

function formatDate(date: string) {
  if (!date) return "";
  try {
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return date;
  }
}

function today() {
  return new Date().toISOString().split("T")[0];
}

export default function Dashboard() {
  const { companies, contacts, activities, tasks } = useApp();

  const openTasks = tasks.filter((t) => t.status === "Open");
  const overdueTasks = openTasks.filter((t) => t.dueDate < today());
  const dueTodayTasks = openTasks.filter((t) => t.dueDate === today());
  const dashboardTasks = [
    ...overdueTasks.sort((a, b) => a.dueDate < b.dueDate ? -1 : 1),
    ...dueTodayTasks,
  ];

  const recentActivities = [...activities]
    .sort((a, b) => a.date < b.date ? 1 : -1)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Here's what's happening with your relationships today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Companies</CardTitle>
            <Building2 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="stat-companies">{companies.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Contacts</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="stat-contacts">{contacts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open Tasks</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="stat-tasks">{openTasks.length}</div>
            {overdueTasks.length > 0 && (
              <p className="text-xs text-red-600 font-medium mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {overdueTasks.length} overdue
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Tasks
              {overdueTasks.length > 0 && (
                <span className="ml-2 text-xs font-normal text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                  {overdueTasks.length} overdue
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {dashboardTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No tasks due today or overdue.
              </p>
            ) : (
              <>
                {overdueTasks.length > 0 && (
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Overdue</p>
                )}
                {overdueTasks.map((task) => (
                  <TaskItem key={task.id} task={task} showContext />
                ))}
                {dueTodayTasks.length > 0 && (
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-4 mb-2">Due Today</p>
                )}
                {dueTodayTasks.map((task) => (
                  <TaskItem key={task.id} task={task} showContext />
                ))}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No activity recorded yet.</p>
            ) : (
              <div className="relative">
                <div className="absolute left-[15px] top-0 bottom-0 w-px bg-border" />
                <div className="space-y-4">
                  {recentActivities.map((activity) => {
                    const cfg = ACTIVITY_TYPE_CONFIG[activity.type];
                    const company = companies.find((c) => c.id === activity.companyId);
                    const contact = contacts.find((c) => c.id === activity.contactId);
                    return (
                      <div key={activity.id} className="flex gap-3 pl-1">
                        <div className="relative z-10 w-7 h-7 rounded-full bg-muted border flex items-center justify-center flex-shrink-0">
                          {activity.type === "Note" && <FileText className={`w-3 h-3 ${cfg.color}`} />}
                          {activity.type === "Meeting" && <UsersIcon className={`w-3 h-3 ${cfg.color}`} />}
                          {activity.type === "Call" && <Phone className={`w-3 h-3 ${cfg.color}`} />}
                          {activity.type === "Email" && <Mail className={`w-3 h-3 ${cfg.color}`} />}
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-semibold ${cfg.color}`}>{activity.type}</span>
                            {contact && (
                              <Link href={`/contacts/${contact.id}`} className="text-xs text-muted-foreground hover:text-primary">
                                {contact.name}
                              </Link>
                            )}
                            {company && (
                              <Link href={`/companies/${company.id}`} className="text-xs text-muted-foreground hover:text-primary">
                                · {company.name}
                              </Link>
                            )}
                            <span className="text-xs text-muted-foreground ml-auto">{formatDate(activity.date)}</span>
                          </div>
                          <p className="text-sm text-foreground mt-0.5 leading-snug line-clamp-2">{activity.content}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
