import { createContext, useContext, useState, ReactNode } from "react";

export type CompanyType = "Investor" | "Bank" | "Investment Bank" | "Borrower" | "Service Provider";
export type RelationshipStrength = "Strong" | "Medium" | "Weak";

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

interface AppContextType {
  companies: Company[];
  contacts: Contact[];
  addCompany: (company: Omit<Company, "id">) => void;
  addContact: (contact: Omit<Contact, "id">) => void;
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
    {
      id: "1", name: "Alice Smith", email: "alice@acmecapital.com",
      phone: "+1 212 555 0101", title: "Managing Director", role: "Lead Investor",
      linkedin: "linkedin.com/in/alice-smith", relationshipStrength: "Strong",
      lastContactDate: "2026-04-01", companyId: "1",
    },
    {
      id: "2", name: "Bob Jones", email: "bob@acmecapital.com",
      phone: "+1 212 555 0102", title: "Vice President", role: "Deal Sourcing",
      linkedin: "linkedin.com/in/bob-jones", relationshipStrength: "Medium",
      lastContactDate: "2026-03-15", companyId: "1",
    },
    {
      id: "3", name: "Carol Williams", email: "carol@globexbank.com",
      phone: "+1 312 555 0201", title: "Director", role: "Relationship Manager",
      linkedin: "linkedin.com/in/carol-williams", relationshipStrength: "Strong",
      lastContactDate: "2026-03-28", companyId: "2",
    },
    {
      id: "4", name: "Dave Brown", email: "dave@initech.com",
      phone: "+1 415 555 0301", title: "Senior Associate", role: "M&A Analyst",
      linkedin: "linkedin.com/in/dave-brown", relationshipStrength: "Weak",
      lastContactDate: "2026-02-10", companyId: "3",
    },
    {
      id: "5", name: "Eve Davis", email: "eve@soylent.com",
      phone: "+1 646 555 0401", title: "CFO", role: "Treasury",
      linkedin: "linkedin.com/in/eve-davis", relationshipStrength: "Medium",
      lastContactDate: "2026-03-05", companyId: "4",
    },
    {
      id: "6", name: "Frank Miller", email: "frank@massivedynamic.com",
      phone: "+1 617 555 0501", title: "Partner", role: "Legal Counsel",
      linkedin: "linkedin.com/in/frank-miller", relationshipStrength: "Strong",
      lastContactDate: "2026-04-07", companyId: "5",
    },
    {
      id: "7", name: "Grace Wilson", email: "grace@massivedynamic.com",
      phone: "+1 617 555 0502", title: "Associate", role: "Compliance",
      linkedin: "linkedin.com/in/grace-wilson", relationshipStrength: "Weak",
      lastContactDate: "2026-01-22", companyId: "5",
    },
  ]);

  const addCompany = (company: Omit<Company, "id">) => {
    const newCompany = { ...company, id: Math.random().toString(36).substr(2, 9) };
    setCompanies((prev) => [...prev, newCompany]);
  };

  const addContact = (contact: Omit<Contact, "id">) => {
    const newContact = { ...contact, id: Math.random().toString(36).substr(2, 9) };
    setContacts((prev) => [...prev, newContact]);
  };

  return (
    <AppContext.Provider value={{ companies, contacts, addCompany, addContact }}>
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
