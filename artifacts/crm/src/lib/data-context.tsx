import { createContext, useContext, useState, ReactNode } from "react";

export type CompanyType = "Investor" | "Bank" | "Investment Bank" | "Borrower" | "Service Provider";
export type RelationshipStrength = "Strong" | "Medium" | "Weak";
export type ActivityType = "Note" | "Meeting" | "Call" | "Email";
export type TaskStatus = "Open" | "Completed";

export interface Company {
  id: string;
  name: string;
  type: CompanyType;
  subType: string;
  tags: string[];
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  title: string;
  role: string;
  linkedin: string;
  relationshipStrength: RelationshipStrength;
  lastContactDate: string;
  companyId: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  content: string;
  date: string;
  companyId?: string;
  contactId?: string;
}

export interface Task {
  id: string;
  title: string;
  dueDate: string;
  status: TaskStatus;
  companyId?: string;
  contactId?: string;
}

interface AppContextType {
  companies: Company[];
  contacts: Contact[];
  activities: Activity[];
  tasks: Task[];
  addCompany: (company: Omit<Company, "id">) => void;
  addContact: (contact: Omit<Contact, "id">) => void;
  addActivity: (activity: Omit<Activity, "id">) => void;
  addTask: (task: Omit<Task, "id">) => void;
  completeTask: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([
    { id: "1", name: "Acme Capital", type: "Investor", subType: "Venture Capital", tags: ["tech", "early-stage"] },
    { id: "2", name: "Globex Bank", type: "Bank", subType: "Commercial Bank", tags: ["corporate", "lending"] },
    { id: "3", name: "Initech Securities", type: "Investment Bank", subType: "M&A Advisory", tags: ["advisory", "mid-market"] },
    { id: "4", name: "Soylent Corp", type: "Borrower", subType: "Corporate Issuer", tags: ["high-yield", "consumer"] },
    { id: "5", name: "Massive Dynamic", type: "Service Provider", subType: "Legal Counsel", tags: ["legal", "compliance"] },
  ]);

  const [contacts, setContacts] = useState<Contact[]>([
    { id: "1", name: "Alice Smith", email: "alice@acmecapital.com", phone: "+1 212 555 0101", title: "Managing Director", role: "Lead Investor", linkedin: "linkedin.com/in/alice-smith", relationshipStrength: "Strong", lastContactDate: "2026-04-01", companyId: "1" },
    { id: "2", name: "Bob Jones", email: "bob@acmecapital.com", phone: "+1 212 555 0102", title: "Vice President", role: "Deal Sourcing", linkedin: "linkedin.com/in/bob-jones", relationshipStrength: "Medium", lastContactDate: "2026-03-15", companyId: "1" },
    { id: "3", name: "Carol Williams", email: "carol@globexbank.com", phone: "+1 312 555 0201", title: "Director", role: "Relationship Manager", linkedin: "linkedin.com/in/carol-williams", relationshipStrength: "Strong", lastContactDate: "2026-03-28", companyId: "2" },
    { id: "4", name: "Dave Brown", email: "dave@initech.com", phone: "+1 415 555 0301", title: "Senior Associate", role: "M&A Analyst", linkedin: "linkedin.com/in/dave-brown", relationshipStrength: "Weak", lastContactDate: "2026-02-10", companyId: "3" },
    { id: "5", name: "Eve Davis", email: "eve@soylent.com", phone: "+1 646 555 0401", title: "CFO", role: "Treasury", linkedin: "linkedin.com/in/eve-davis", relationshipStrength: "Medium", lastContactDate: "2026-03-05", companyId: "4" },
    { id: "6", name: "Frank Miller", email: "frank@massivedynamic.com", phone: "+1 617 555 0501", title: "Partner", role: "Legal Counsel", linkedin: "linkedin.com/in/frank-miller", relationshipStrength: "Strong", lastContactDate: "2026-04-07", companyId: "5" },
    { id: "7", name: "Grace Wilson", email: "grace@massivedynamic.com", phone: "+1 617 555 0502", title: "Associate", role: "Compliance", linkedin: "linkedin.com/in/grace-wilson", relationshipStrength: "Weak", lastContactDate: "2026-01-22", companyId: "5" },
  ]);

  const [activities, setActivities] = useState<Activity[]>([
    { id: "a1", type: "Meeting", content: "Intro call to discuss Series B participation. Alice is interested but wants to see updated financials first.", date: "2026-04-01", companyId: "1", contactId: "1" },
    { id: "a2", type: "Note", content: "Bob flagged a competing term sheet from Sequoia. Need to move quickly on our proposal.", date: "2026-03-15", companyId: "1", contactId: "2" },
    { id: "a3", type: "Email", content: "Sent NDA and deal room access to Carol. Awaiting counter-signature.", date: "2026-03-28", companyId: "2", contactId: "3" },
    { id: "a4", type: "Call", content: "15-min check-in with Carol. Loan facility terms look favorable. Follow up next week.", date: "2026-03-10", companyId: "2", contactId: "3" },
    { id: "a5", type: "Note", content: "Initiated M&A mandate discussion with Dave. Company evaluating three potential targets in DACH region.", date: "2026-02-10", companyId: "3", contactId: "4" },
    { id: "a6", type: "Meeting", content: "Board meeting observer call. Eve confirmed they intend to refinance the 2028 notes early.", date: "2026-03-05", companyId: "4", contactId: "5" },
    { id: "a7", type: "Email", content: "Shared draft credit agreement with Frank for review. Flagged covenants section for discussion.", date: "2026-04-07", companyId: "5", contactId: "6" },
  ]);

  const [tasks, setTasks] = useState<Task[]>([
    { id: "t1", title: "Send updated financials to Alice Smith", dueDate: "2026-04-10", status: "Open", companyId: "1", contactId: "1" },
    { id: "t2", title: "Prepare counter-proposal to Sequoia term sheet", dueDate: "2026-04-10", status: "Open", companyId: "1", contactId: "2" },
    { id: "t3", title: "Follow up on NDA counter-signature — Globex Bank", dueDate: "2026-04-08", status: "Open", companyId: "2", contactId: "3" },
    { id: "t4", title: "Review DACH target list from Initech Securities", dueDate: "2026-04-07", status: "Open", companyId: "3", contactId: "4" },
    { id: "t5", title: "Draft refinancing memo — Soylent Corp", dueDate: "2026-04-15", status: "Open", companyId: "4", contactId: "5" },
    { id: "t6", title: "Review covenants section with Frank Miller", dueDate: "2026-04-18", status: "Open", companyId: "5", contactId: "6" },
    { id: "t7", title: "Schedule quarterly review call with Acme Capital", dueDate: "2026-04-09", status: "Open", companyId: "1" },
    { id: "t8", title: "Send loan facility summary to Carol Williams", dueDate: "2026-04-22", status: "Open", companyId: "2", contactId: "3" },
  ]);

  const addCompany = (company: Omit<Company, "id">) => {
    setCompanies((prev) => [...prev, { ...company, id: Math.random().toString(36).substr(2, 9) }]);
  };

  const addContact = (contact: Omit<Contact, "id">) => {
    setContacts((prev) => [...prev, { ...contact, id: Math.random().toString(36).substr(2, 9) }]);
  };

  const addActivity = (activity: Omit<Activity, "id">) => {
    setActivities((prev) => [...prev, { ...activity, id: Math.random().toString(36).substr(2, 9) }]);
  };

  const addTask = (task: Omit<Task, "id">) => {
    setTasks((prev) => [...prev, { ...task, id: Math.random().toString(36).substr(2, 9) }]);
  };

  const completeTask = (id: string) => {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status: "Completed" } : t));
  };

  return (
    <AppContext.Provider value={{ companies, contacts, activities, tasks, addCompany, addContact, addActivity, addTask, completeTask }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
