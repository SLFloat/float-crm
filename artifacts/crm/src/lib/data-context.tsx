import { createContext, useContext, useState, ReactNode } from "react";

export type CompanyType = "Investor" | "Bank" | "Investment Bank" | "Borrower" | "Service Provider";

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
    { id: "1", name: "Alice Smith", email: "alice@acmecapital.com", companyId: "1" },
    { id: "2", name: "Bob Jones", email: "bob@acmecapital.com", companyId: "1" },
    { id: "3", name: "Carol Williams", email: "carol@globexbank.com", companyId: "2" },
    { id: "4", name: "Dave Brown", email: "dave@initech.com", companyId: "3" },
    { id: "5", name: "Eve Davis", email: "eve@soylent.com", companyId: "4" },
    { id: "6", name: "Frank Miller", email: "frank@massivedynamic.com", companyId: "5" },
    { id: "7", name: "Grace Wilson", email: "grace@massivedynamic.com", companyId: "5" },
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
