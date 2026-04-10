import { createContext, useContext, useState, ReactNode } from "react";

export type CompanyType = "Investor" | "Bank" | "Investment Bank" | "Borrower" | "Service Provider";
export type RelationshipStrength = "Strong" | "Medium" | "Weak";
export type ActivityType = "Note" | "Meeting" | "Call" | "Email";
export type TaskStatus = "Open" | "Completed";
export type PipelineCategory = "Fundraising" | "Co-invest" | "Deal Sourcing";
export type PipelineStage = "Initial" | "Contacted" | "NDA" | "Engaged" | "Closed";

export const PIPELINE_STAGES: PipelineStage[] = ["Initial", "Contacted", "NDA", "Engaged", "Closed"];
export const PIPELINE_CATEGORIES: PipelineCategory[] = ["Fundraising", "Co-invest", "Deal Sourcing"];

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

export interface Pipeline {
  id: string;
  name: string;
  category: PipelineCategory;
}

export interface PipelineEntry {
  id: string;
  pipelineId: string;
  companyId: string;
  stage: PipelineStage;
  notes: string;
}

interface AppContextType {
  companies: Company[];
  contacts: Contact[];
  activities: Activity[];
  tasks: Task[];
  pipelines: Pipeline[];
  pipelineEntries: PipelineEntry[];
  addCompany: (company: Omit<Company, "id">) => void;
  addContact: (contact: Omit<Contact, "id">) => void;
  addActivity: (activity: Omit<Activity, "id">) => void;
  addTask: (task: Omit<Task, "id">) => void;
  completeTask: (id: string) => void;
  addPipeline: (pipeline: Omit<Pipeline, "id">) => void;
  addPipelineEntry: (entry: Omit<PipelineEntry, "id">) => void;
  updatePipelineEntryStage: (id: string, stage: PipelineStage) => void;
  removePipelineEntry: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function uid() {
  return Math.random().toString(36).substr(2, 9);
}

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

  const [pipelines, setPipelines] = useState<Pipeline[]>([
    { id: "p1", name: "Series B Fundraise", category: "Fundraising" },
    { id: "p2", name: "Q2 Deal Sourcing", category: "Deal Sourcing" },
    { id: "p3", name: "Co-invest Opportunities", category: "Co-invest" },
  ]);

  const [pipelineEntries, setPipelineEntries] = useState<PipelineEntry[]>([
    { id: "pe1", pipelineId: "p1", companyId: "1", stage: "Engaged", notes: "Interested in leading the round" },
    { id: "pe2", pipelineId: "p1", companyId: "2", stage: "NDA", notes: "NDA sent, awaiting signature" },
    { id: "pe3", pipelineId: "p1", companyId: "3", stage: "Contacted", notes: "Intro call scheduled" },
    { id: "pe4", pipelineId: "p2", companyId: "3", stage: "Initial", notes: "" },
    { id: "pe5", pipelineId: "p2", companyId: "4", stage: "Contacted", notes: "Refinancing opportunity flagged" },
    { id: "pe6", pipelineId: "p2", companyId: "5", stage: "NDA", notes: "Working through due diligence" },
    { id: "pe7", pipelineId: "p3", companyId: "1", stage: "Engaged", notes: "" },
    { id: "pe8", pipelineId: "p3", companyId: "2", stage: "Initial", notes: "" },
  ]);

  const addCompany = (company: Omit<Company, "id">) =>
    setCompanies((prev) => [...prev, { ...company, id: uid() }]);

  const addContact = (contact: Omit<Contact, "id">) =>
    setContacts((prev) => [...prev, { ...contact, id: uid() }]);

  const addActivity = (activity: Omit<Activity, "id">) =>
    setActivities((prev) => [...prev, { ...activity, id: uid() }]);

  const addTask = (task: Omit<Task, "id">) =>
    setTasks((prev) => [...prev, { ...task, id: uid() }]);

  const completeTask = (id: string) =>
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status: "Completed" } : t));

  const addPipeline = (pipeline: Omit<Pipeline, "id">) =>
    setPipelines((prev) => [...prev, { ...pipeline, id: uid() }]);

  const addPipelineEntry = (entry: Omit<PipelineEntry, "id">) =>
    setPipelineEntries((prev) => [...prev, { ...entry, id: uid() }]);

  const updatePipelineEntryStage = (id: string, stage: PipelineStage) =>
    setPipelineEntries((prev) => prev.map((e) => e.id === id ? { ...e, stage } : e));

  const removePipelineEntry = (id: string) =>
    setPipelineEntries((prev) => prev.filter((e) => e.id !== id));

  return (
    <AppContext.Provider value={{
      companies, contacts, activities, tasks, pipelines, pipelineEntries,
      addCompany, addContact, addActivity, addTask, completeTask,
      addPipeline, addPipelineEntry, updatePipelineEntryStage, removePipelineEntry,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error("useApp must be used within an AppProvider");
  return context;
}
