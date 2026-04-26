import { useEffect, useState, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

const STORAGE_KEY = "crm_data_v3";

const PIPELINE_STAGE_TEMPLATES = {
  coinvest: [
    "Sourced",
    "Outreach",
    "Interested",
    "Diligence",
    "Passed",
    "Closed",
  ],
  fund: [
    "Target",
    "Intro",
    "DD",
    "IC",
    "Commit",
    "Passed",
  ],
  sma: [
    "Target",
    "Outreach",
    "Meeting",
    "Structuring",
    "Closed",
    "Passed",
  ],
};

// fallback for old pipelines (VERY IMPORTANT for safety)
const DEFAULT_STAGES = ["New", "Interested", "Meeting", "Passed"];

// ===== HELPER FUNCTIONS =====
function getStageColor(index) {
  const colors = [
    "#e0f2fe",
    "#dcfce7",
    "#fef9c3",
    "#fee2e2",
    "#ede9fe",
    "#fce7f3",
  ];

  return colors[index % colors.length];
}

function getStageDate(entry) {
  if (!entry.activity || entry.activity.length === 0) return null;

  const moveEvent = [...entry.activity]
    .reverse()
    .find(
      (a) =>
        a.text?.startsWith("Moved to") ||
        a.text?.startsWith("Added to pipeline")
    );

  if (!moveEvent) return null;

  const d = new Date(moveEvent.date);

  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStagesForPipeline(pipeline) {
  if (!pipeline) return DEFAULT_STAGES;
  return pipeline.stages || DEFAULT_STAGES;
}

// ===== COMPONENT =====
function useCRM() {
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return {
        companies: [],
        contacts: [],
        deals: [],
        pipelines: [],
        pipelineEntries: [],
      };
    }

    try {
      return JSON.parse(saved);
    } catch (err) {
      console.error("Corrupt localStorage, resetting", err);

      return {
        companies: [],
        contacts: [],
        pipelines: [],
        pipelineEntries: [],
      };
    }
  });

  useEffect(() => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;

  const parsed = JSON.parse(saved);

    parsed.pipelines = (parsed.pipelines || []).map((p) => {
      const base = {
        ...p,
        type: p.type || "coinvest",
        dealId: p.dealId || "",
        staleDays: p.staleDays ?? 3,
        veryStaleDays: p.veryStaleDays ?? 7,
      };

      // ✅ keep existing stages if present
      if (p.stages && p.stages.length > 0) {
        return base;
      }

      // 🔧 backfill stages for old pipelines
      if (p.type === "coinvest") {
        return {
          ...base,
          stages: ["Sourced", "Outreach", "Interested", "Diligence", "Passed", "Closed"],
        };
      }

      if (p.type === "fund") {
        return {
          ...base,
          stages: ["Target", "Intro", "DD", "IC", "Commit", "Passed"],
        };
      }

      if (p.type === "sma") {
        return {
          ...base,
          stages: ["Target", "Outreach", "Meeting", "Structuring", "Closed", "Passed"],
        };
      }

      return {
        ...base,
        stages: DEFAULT_STAGES,
      };
    });

  // 🔧 MIGRATION: normalize activity (time → date)
  const normalizeActivity = (arr) =>
    (arr || []).map((a) => ({
      text: a.text,
      date:
        a.date ||
        (a.time ? new Date(a.time).toISOString() : new Date().toISOString()),
    }));

  parsed.companies = (parsed.companies || []).map((c) => ({
    ...c,
    activity: normalizeActivity(c.activity),
  }));

  parsed.contacts = (parsed.contacts || []).map((c) => ({
    ...c,
    activity: normalizeActivity(c.activity),
  }));

  parsed.pipelineEntries = (parsed.pipelineEntries || []).map((e) => ({
    ...e,
    activity: normalizeActivity(e.activity),
  }));

  setData(parsed);
}, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

const add = (type, item) => {
  setData((d) => {
    const newData = {
      ...d,
      [type]: [...d[type], { ...item, id: Date.now().toString() }],
    };
    
    return newData;
  });
};

  return { data, setData, add };
}

function Sidebar({
  page,
  setPage,
  currentUser,
  setCurrentUser,
  setSelectedCompanyId,
  setSelectedContactId,
  setSelectedDealId,
}) {
  const items = ["Dashboard", "Companies", "Contacts", "Deals", "Pipelines", "Tasks"];

  return (
    <div style={styles.sidebar}>
      <div style={styles.logo}>Float CRM</div>

      <div style={{ marginBottom: 10, fontSize: 12 }}>
          User: {currentUser}
      </div>

      {items.map((item) => (
        <div
          key={item}
          onClick={() => {
            setPage(item);

            if (item !== "Deals") {
              setSelectedDealId(null);
            }

            if (item === "Companies") {
              setSelectedCompanyId(null);
            }

            if (item === "Contacts") {
              setSelectedContactId(null);
            }
          }}
          style={{
            ...styles.navItem,
            ...styles.hoverRow,
            background: page === item ? "#1d4ed8" : "transparent",
          }}
          onMouseEnter={(e) => {
            if (page !== item) e.currentTarget.style.background = "#1e293b";
          }}
          onMouseLeave={(e) => {
            if (page !== item) e.currentTarget.style.background = "transparent";
          }}
        >
          {item}
        </div>
        ))}
          <button
            style={{
              marginTop: 20,
              padding: "8px 10px",
              borderRadius: 6,
              border: "1px solid #334155",
              background: "transparent",
              color: "white",
              cursor: "pointer",
              fontSize: 12,
            }}
            onClick={() => {
              const data = localStorage.getItem("crm_data_v3");

              const blob = new Blob([data], { type: "application/json" });
              const url = URL.createObjectURL(blob);

              const a = document.createElement("a");
              a.href = url;
              a.download = "crm-backup.json";
              a.click();

              URL.revokeObjectURL(url);
            }}
          >
            Export Data
          </button>

        </div>
  );
}

/* ---------------- COMPANIES ---------------- */

function Dashboard({
  crm,
  deals,
  currentUser,
  setPage,
  setSelectedCompanyId,
}) {
  const totalCompanies = crm.data.companies.length;
  const totalContacts = crm.data.contacts.length;

  const myTasks = crm.data.pipelineEntries.filter(
    (e) => e.owner === currentUser
  );

  const overdue = myTasks.filter(
    (e) => e.dueDate && new Date(e.dueDate) < new Date()
  );

  const activity = [
    // COMPANIES
    ...crm.data.companies.flatMap((c) =>
      (c.activity || []).map((a) => ({
        text: a.text,
        date: a.date,
        label: c.name,
        companyId: c.id,
        type: "Company",
      }))
    ),

    // CONTACTS
    ...crm.data.contacts.flatMap((c) =>
      (c.activity || []).map((a) => ({
        text: a.text,
        date: a.date,
        label: c.name,
        companyId: c.companyId,
        type: "Contact",
      }))
    ),

    // PIPELINES
    ...crm.data.pipelineEntries.flatMap((e) =>
      (e.activity || []).map((a) => {
        const company = crm.data.companies.find(
          (c) => String(c.id) === String(e.companyId)
        );

        return {
          text: a.text,
          date: a.date,
          label: company?.name || "Unknown",
          companyId: e.companyId,
          type: "Pipeline",
        };
      })
    ),

    // DEALS
    ...deals.flatMap((d) =>
      (d.activity || []).map((a) => {
        const company = crm.data.companies.find(
          (c) => String(c.id) === String(d.companyId)
        );

        return {
          text: a.text,
          date: a.date,
          label: company?.name || d.name,
          companyId: d.companyId,
          type: "Deal",
        };
      })
    ),
  ]
    .filter((a) => a.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8);

    const dealSummary = useMemo(() => {
      return deals.reduce((acc, d) => {
        const key = d.outcome || "Uncategorized";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
    }, [deals]);

    const dealStats = useMemo(() => {
      return deals.reduce(
        (acc, d) => {
          const size = parseFloat(d.dealSize || 0) || 0;
          const fund = parseFloat(d.fundSize || 0) || 0;
          const coinvest = parseFloat(d.coinvestSize || 0) || 0;
          const sma = parseFloat(d.smaSize || 0) || 0;

          acc.totalDeals += 1;
          acc.totalDealSize += size;
          acc.totalDeployed += fund + coinvest + sma;

          if (d.outcome === "Bought") acc.bought += 1;
          if (d.outcome === "Passed") acc.passed += 1;
          if (d.outcome === "Missed") acc.missed += 1;

          acc.fundTotal += fund;
          acc.coinvestTotal += coinvest;
          acc.smaTotal += sma;

          return acc;
        },
        {
          totalDeals: 0,
          totalDealSize: 0,
          totalDeployed: 0,
          bought: 0,
          passed: 0,
          missed: 0,
          fundTotal: 0,
          coinvestTotal: 0,
          smaTotal: 0,
        }
      );
    }, [deals]);

    const reasonBreakdown = useMemo(() => {
      return deals.reduce((acc, d) => {
        if (!d.reason) return acc;

        const bucket =
          d.outcome === "Passed"
            ? acc.passed
            : d.outcome === "Missed"
            ? acc.missed
            : null;

        if (!bucket) return acc;

        bucket[d.reason] = (bucket[d.reason] || 0) + 1;

        return acc;
      }, { passed: {}, missed: {} });
    }, [deals]);

const hitRate =
  dealStats.totalDeals > 0
    ? ((dealStats.bought / dealStats.totalDeals) * 100).toFixed(1)
    : "0.0";

const avgDealSize =
  dealStats.totalDeals > 0
    ? (dealStats.totalDealSize / dealStats.totalDeals).toFixed(1)
    : 0;

const avgPrice = useMemo(() => {
  const prices = deals
    .map((d, i) => {
      const val = parseFloat(d.priceOffered);
      return isNaN(val) ? null : val;
    })
    .filter((v) => v !== null && v > 0);

  if (prices.length === 0) return 0;

  const avg =
    prices.reduce((a, b) => a + b, 0) / prices.length;

  return Math.round(avg * 10) / 10;
}, [deals]);

  return (
    <div style={styles.page}>
      <h1 style={{ marginBottom: 20 }}>Dashboard</h1>

      {/* TOP CARDS */}
<div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
  <div style={styles.card}>
    <div style={{ fontSize: 12, color: "#64748b" }}>
      Total Companies
    </div>
    <div style={{ fontSize: 28, fontWeight: 600 }}>
      {totalCompanies}
    </div>
  </div>

  <div style={styles.card}>
    <div style={{ fontSize: 12, color: "#64748b" }}>
      Total Contacts
    </div>
    <div style={{ fontSize: 28, fontWeight: 600 }}>
      {totalContacts}
    </div>
  </div>

  <div style={styles.card}>
    <div style={{ fontSize: 12, color: "#64748b" }}>
      Open Tasks
    </div>
    <div style={{ fontSize: 28, fontWeight: 600 }}>
      {myTasks.length}
    </div>
    {overdue.length > 0 && (
      <div style={{ color: "#dc2626", fontSize: 12 }}>
        {overdue.length} overdue
      </div>
    )}
  </div>

  <div
  style={{ ...styles.card, cursor: "pointer" }}
  onClick={() => setPage("Deals")}
>
    <div style={{ fontSize: 12, color: "#64748b" }}>
      Deals
    </div>

    <div style={{ fontSize: 13, marginTop: 6 }}>
      <div>Total: {dealStats.totalDeals}</div>
      <div>Bought: {dealStats.bought}</div>
      <div>Passed: {dealStats.passed}</div>
      <div>Missed: {dealStats.missed}</div>

     <div style={{ marginTop: 6 }}>
        Seen: ${dealStats.totalDealSize}mm
      </div>

      <div>
        Deployed: ${dealStats.totalDeployed}mm
      </div>

      <div style={{ marginTop: 6 }}>
        Hit Rate: {hitRate}%
      </div>

      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 11, color: "#64748b" }}>
          Passed Reasons
        </div>
        {Object.entries(reasonBreakdown.passed)
          .sort((a, b) => b[1] - a[1])
          .map(([reason, count]) => (
            <div key={reason} style={{ fontSize: 11 }}>
              {reason}: {count}
            </div>
          ))}

        <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>
          Missed Reasons
        </div>
        {Object.entries(reasonBreakdown.missed)
          .sort((a, b) => b[1] - a[1])
          .map(([reason, count]) => (
            <div key={reason} style={{ fontSize: 11 }}>
              {reason}: {count}
            </div>
          ))}
      </div>

      <div style={{ fontSize: 11, color: "#64748b" }}>
        Avg Size: {avgDealSize}mm | Avg Price: {avgPrice}
      </div>

      <div style={{ fontSize: 11, color: "#64748b" }}>
        Fund: {dealStats.fundTotal} | Co: {dealStats.coinvestTotal} | SMA: {dealStats.smaTotal}
      </div>
    </div>
  </div>
</div>  

      <div style={{ display: "flex", gap: 20 }}>
        {/* TASK LIST */}
        <div style={{ ...styles.card, flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: 10 }}>
            My Tasks
          </div>

          {myTasks.length === 0 && <div>No tasks</div>}

          {myTasks.slice(0, 5).map((e, i) => {
            const company = crm.data.companies.find(
              (c) => c.id === e.companyId
            );

            return (
              <div
                key={e.id || `pipeline-entry-${i}`}
                onClick={() => {
                  setSelectedCompanyId(e.companyId);
                  setPage("Companies");
                }}
                style={{
                  padding: "8px 0",
                  borderBottom: "1px solid #f1f5f9",
                  cursor: "pointer",
                  transition: "0.15s",
                }}
                onMouseEnter={(evt) => {
                  evt.currentTarget.style.background = "#f8fafc";
                }}
                onMouseLeave={(evt) => {
                  evt.currentTarget.style.background = "white";
                }}
              >
                <div style={{ fontWeight: 500 }}>
                  {company?.name}
                </div>

                <div style={{ fontSize: 12, color: "#64748b" }}>
                  {e.nextStep || "No next step"}
                </div>

                {e.dueDate && (
                  <div
                    style={{
                      fontSize: 11,
                      color:
                        new Date(e.dueDate) < new Date()
                          ? "#dc2626"
                          : "#64748b",
                    }}
                  >
                    Due: {e.dueDate}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ACTIVITY */}
        <div style={{ ...styles.card, flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: 10 }}>
            Recent Activity
          </div>

          {activity.length === 0 && (
            <div style={{ color: "#94a3b8" }}>No activity yet</div>
          )}

          {activity.map((a, i) => (
            <div
              key={i}
              onClick={() => {
                if (!a.companyId) return;
                setSelectedCompanyId(a.companyId);
                setPage("Companies");
              }}
              style={{
                padding: "8px 0",
                borderBottom: "1px solid #f1f5f9",
                cursor: "pointer",
                transition: "0.15s",
              }}
              onMouseEnter={(evt) => {
                evt.currentTarget.style.background = "#f8fafc";
              }}
              onMouseLeave={(evt) => {
                evt.currentTarget.style.background = "white";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: "2px 6px",
                    borderRadius: 6,
                    background:
                      a.type === "Company"
                        ? "#dbeafe"
                        : a.type === "Contact"
                        ? "#dcfce7"
                        : a.type === "Deal"
                        ? "#ede9fe"
                        : "#fef3c7",
                    color:
                      a.type === "Company"
                        ? "#1d4ed8"
                        : a.type === "Contact"
                        ? "#15803d"
                        : a.type === "Deal"
                        ? "#6d28d9"
                        : "#b45309",
                  }}
                >
                  {a.type}
                </span>

                <div style={{ fontSize: 13 }}>
                  {a.text}
                </div>
              </div>

              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                <span style={{ fontWeight: 500 }}>{a.label}</span> ·{" "}
                {new Date(a.date).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- COMPANIES ---------------- */

function Companies({
  crm,
  selectedCompanyId,
  setSelectedCompanyId,
  setPage,
  setSelectedDealId,
  setSelectedPipelineId,
  }) {
  const [selectedContactId, setSelectedContactId] = useState(null);

  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [activityText, setActivityText] = useState("");
  const [sortType, setSortType] = useState("recent");
  const [search, setSearch] = useState("");
  const [importMessage, setImportMessage] = useState("");

  const selectedCompany =
    crm.data.companies.find((c) => String(c.id) === String(selectedCompanyId)) ||
    null;

  const companyContacts = selectedCompany
    ? crm.data.contacts.filter(
        (c) => String(c.companyId) === String(selectedCompany.id)
      )
    : [];

  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days <= 0) return "0d ago";
    return `${days}d ago`;
  }

    return (
    <div style={styles.page}>
      {!selectedCompany && (
        <>
          <div style={styles.header}>
            <div style={styles.title}>Companies</div>
          </div>

          <div style={styles.card}>
            <>
  <input
    style={styles.input}
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    placeholder="Search companies or contacts..."
  />

  <input
    style={styles.input}
    value={name}
    onChange={(e) => setName(e.target.value)}
    placeholder="Company name"
  />
</>

            <button
              style={styles.primaryBtn}
              onClick={() => {
                const trimmed = name.trim();
                if (!trimmed) return;

                crm.add("companies", {
                  name: trimmed,
                  activity: [],
                });

                setName("");
              }}
            >
              Add
            </button>

            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
                Upload Contacts (CSV: name,email,company)
              </div>

            {importMessage && (
              <div style={{ fontSize: 12, color: "#16a34a", marginBottom: 6 }}>
                {importMessage}
              </div>
            )}

              <input
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;

                  setImportMessage("");
                  const reader = new FileReader();

                  reader.onload = (event) => {
                    const text = String(event.target.result || "").replace(
                      /^\uFEFF/,
                      ""
                    );

                    const lines = text.split(/\r\n|\n|\r/);
                    const dataLines = lines.slice(1);

                    crm.setData((prev) => {
                      const companies = [...prev.companies];
                      const contacts = [...prev.contacts];

                      const existingEmails = new Set(
                        contacts
                          .map((c) => (c.email || "").trim().toLowerCase())
                          .filter(Boolean)
                      );

                      const existingCompanyNames = new Set(
                        companies
                          .map((c) => (c.name || "").trim().toLowerCase())
                          .filter(Boolean)
                      );

                      const seenEmails = new Set();

                      dataLines.forEach((raw) => {
                        const line = (raw || "").trim();
                        if (!line) return;

                        const [n, e, c] = line.split(",");

                        const rowName = (n || "").trim();
                        const rowEmail = (e || "").trim();
                        const rowCompany = (c || "").trim();

                        if (!rowEmail) return;

                        const emailKey = rowEmail.toLowerCase();
                        const companyKey = rowCompany.toLowerCase();

                        if (seenEmails.has(emailKey)) return;
                        seenEmails.add(emailKey);

                        if (existingEmails.has(emailKey)) return;

                        let company = companies.find(
                          (co) =>
                            (co.name || "").trim().toLowerCase() === companyKey
                        );

                        if (!company && companyKey) {
                          company = {
                            id: Date.now().toString() + Math.random(),
                            name: rowCompany,
                            activity: [],
                          };
                          companies.push(company);

                          if (!existingCompanyNames.has(companyKey)) {
                            existingCompanyNames.add(companyKey);
                          }
                        }

                        contacts.push({
                          id: Date.now().toString() + Math.random(),
                          name: rowName || rowEmail,
                          email: rowEmail,
                          companyId: company?.id || "",
                        });

                        existingEmails.add(emailKey);
                      });

                      setImportMessage("Import complete");

                      return {
                        ...prev,
                        companies,
                        contacts,
                      };
                    });

                    e.target.value = "";
                  };

                  reader.readAsText(file);
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 10 }}>
            <select
              value={sortType}
              onChange={(e) => setSortType(e.target.value)}
              style={styles.input}
            >
              <option value="recent">Most Recent Activity</option>
              <option value="oldest">Least Recent Activity</option>
              <option value="abc">A → Z</option>
            </select>
          </div>

          <div style={styles.card}>
            {[...crm.data.companies]
  .filter((c) => {
    if (!search.trim()) return true;

    const q = search.toLowerCase();

    const companyMatch = (c.name || "").toLowerCase().includes(q);

    const contactMatch = crm.data.contacts.some(
      (ct) =>
        String(ct.companyId) === String(c.id) &&
        (
          (ct.name || "").toLowerCase().includes(q) ||
          (ct.email || "").toLowerCase().includes(q)
        )
    );

    return companyMatch || contactMatch;
  })
  .sort((a, b) => {
    if (sortType === "abc") return a.name.localeCompare(b.name);

    const aTime = a.activity?.[0]?.date || 0;
    const bTime = b.activity?.[0]?.date || 0;

    if (sortType === "oldest")
      return new Date(aTime) - new Date(bTime);

    return new Date(bTime) - new Date(aTime);
  })
  .map((c) => (
                <div
                  key={c.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <div
                    onClick={() => setSelectedCompanyId(c.id)}
                    style={{ cursor: "pointer", flex: 1 }}
                  >
                    <div style={{ fontWeight: 500 }}>
  {search.trim() ? (
    (() => {
      const q = search.toLowerCase();
      const name = c.name || "";
      const idx = name.toLowerCase().indexOf(q);

      if (idx === -1) return name;

      return (
        <>
          {name.slice(0, idx)}
          <span style={{ background: "#fde68a" }}>
            {name.slice(idx, idx + q.length)}
          </span>
          {name.slice(idx + q.length)}
        </>
      );
    })()
  ) : (
    c.name
  )}
</div>
                    {search.trim() ? (
  (() => {
    const q = search.toLowerCase();

    const match = crm.data.contacts.find(
      (ct) =>
        String(ct.companyId) === String(c.id) &&
        (
          (ct.name || "").toLowerCase().includes(q) ||
          (ct.email || "").toLowerCase().includes(q)
        )
    );

    if (!match) {
      return c.activity?.[0] ? (
        <div style={{ fontSize: 12, color: "#64748b" }}>
          Last: {c.activity[0].text} · {timeAgo(c.activity[0].date)}
        </div>
      ) : null;
    }

    return (
      <div style={{ fontSize: 12, color: "#2563eb" }}>
  Matched:{" "}
  {(match.name && match.name !== match.email
    ? match.name + " (" + match.email + ")"
    : match.email)}
</div>
    );
  })()
) : (
  c.activity?.[0] && (
    <div style={{ fontSize: 12, color: "#64748b" }}>
      Last: {c.activity[0].text} · {timeAgo(c.activity[0].date)}
    </div>
  )
)}
                  </div>

                  <button
                    style={{
                      background: "#ef4444",
                      color: "white",
                      border: "none",
                      padding: "4px 8px",
                      borderRadius: 6,
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      crm.setData((prev) => ({
                        ...prev,
                        companies: prev.companies.filter(
                          (co) => String(co.id) !== String(c.id)
                        ),
                        contacts: prev.contacts.filter(
                          (ct) => String(ct.companyId) !== String(c.id)
                        ),
                        pipelineEntries: prev.pipelineEntries.filter(
                          (pe) => String(pe.companyId) !== String(c.id)
                        ),
                      }));
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))}
          </div>
        </>
      )}

      {selectedCompany && (
  <div>

    <button onClick={() => setSelectedCompanyId(null)}>
      ← Back
    </button>

    <h2 style={{ marginTop: 10 }}>{selectedCompany.name}</h2>
    <div style={{ ...styles.card, marginTop: 20 }}>
      <strong>Activity</strong>

      {/* ADD ACTIVITY */}
      <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
        <input
          style={styles.input}
          value={activityText}
          onChange={(e) => setActivityText(e.target.value)}
          placeholder="Log activity..."
        />

        <button
          style={styles.primaryBtn}
          onClick={() => {
            const trimmed = activityText.trim();
            if (!trimmed) return;

            crm.setData((prev) => ({
              ...prev,
              companies: prev.companies.map((c) =>
                String(c.id) === String(selectedCompany.id)
                  ? {
                      ...c,
                      activity: [
                        {
                          text: trimmed,
                          date: new Date().toISOString(),
                        },
                        ...(c.activity || []),
                      ],
                    }
                  : c
              ),
            }));

            setActivityText("");
          }}
        >
          Add
        </button>
      </div>

      {/* ACTIVITY LIST */}
      <div style={{ marginTop: 10, fontSize: 12 }}>
        {(selectedCompany.activity || []).length === 0 && (
          <div style={{ color: "#94a3b8" }}>No activity yet</div>
        )}

        {(selectedCompany.activity || []).slice(0, 5).map((a, i) => (
          <div key={i} style={{ marginBottom: 6 }}>
            <div>{a.text}</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>
              {new Date(a.date).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* CONTACTS */}
    <div style={styles.card}>
      <div style={{ fontWeight: 600, marginBottom: 10 }}>
        Contacts
      </div>

      {crm.data.contacts
        .filter((c) => String(c.companyId) === String(selectedCompany.id))
        .map((c) => (
          <div key={c.id} style={{ marginBottom: 6 }}>
            {c.name || "(No name)"} — {c.email || "No email"}
          </div>
        ))}
    </div>

        {/* DEALS */}
        <div style={styles.card}>
          <div style={{ fontWeight: 600, marginBottom: 10 }}>
            Deals
          </div>

          {deals
            .filter((d) =>
              crm.data.pipelineEntries.some(
                (e) =>
                  String(e.companyId) === String(selectedCompany.id) &&
                  String(e.dealId) === String(d.id)
              )
            )
            .map((d) => (
              <div
                key={`deal-${d.id || d.name}`}
                onClick={() => {
                  setSelectedDealId(d.id);
                  setPage("Deals");
                }}
                style={{
                  padding: "10px 12px",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  marginBottom: 8,
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: 500 }}>
                  {d.name}
                </div>

                <div style={{ fontSize: 12, color: "#64748b" }}>
                  {d.status}
                </div>
              </div>
            ))}

          {deals.filter((d) =>
            crm.data.pipelineEntries.some(
              (e) =>
                String(e.companyId) === String(selectedCompany.id) &&
                String(e.dealId) === String(d.id)
            )
          ).length === 0 && (
            <div style={{ color: "#94a3b8" }}>
              No deals
            </div>
          )}
        </div>

        {/* PIPELINES */}
        <div style={styles.card}>
          <div style={{ fontWeight: 600, marginBottom: 10 }}>
            Pipelines
          </div>

      {crm.data.pipelineEntries
        .filter((e) => String(e.companyId) === String(selectedCompany.id))
        .map((e, i) => {
          const pipeline = crm.data.pipelines.find(
            (p) => String(p.id) === String(e.pipelineId)
          );

          return (
            <div
              key={e.id || `pipeline-entry-${i}`}
              onClick={() => {
                setPage("Pipelines");
                setSelectedPipelineId(e.pipelineId);
                window.__highlightCompanyId = e.companyId;
                window.__highlightCompanyName = selectedCompany.name;
              }}
              style={{
                padding: "10px 12px",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                marginBottom: 8,
                cursor: "pointer",
              }}
            >
              <div style={{ fontWeight: 500 }}>
                {pipeline?.name || "Pipeline"}
              </div>

              <div style={{ fontSize: 12, color: "#64748b" }}>
                {e.stage}
              </div>

              {e.nextStep && (
                <div style={{ marginTop: 4 }}>
                  {e.nextStep}
                </div>
              )}
            </div>
          );
        })}

      {crm.data.pipelineEntries.filter(
        (e) => String(e.companyId) === String(selectedCompany.id)
      ).length === 0 && (
        <div style={{ color: "#94a3b8" }}>
          No pipeline entries
        </div>
      )}
    </div>

  </div>
)}
    </div>
  );
}

/* ---------------- CONTACTS ---------------- */

function Contacts({
  crm,
  selectedContactId,
  setSelectedContactId,
  setPage,
  setSelectedCompanyId,
  tagFilter,
  setTagFilter,
  sortField,
  setSortField,
  sortDir,
  setSortDir,
  }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyId, setCompanyId] = useState("");

  const [activityText, setActivityText] = useState("");

  const [search, setSearch] = useState("");
  const [filterCompanyId, setFilterCompanyId] = useState("");

  function normalizePhone(value) {
    return (value || "").replace(/\D/g, "").slice(0, 10);
  }

  function formatPhone(value) {
  const digits = normalizePhone(value);
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return value || "";
}

  function updateContact(contactId, field, value) {
    crm.setData((prev) => ({
      ...prev,
      contacts: prev.contacts.map((c) =>
        c.id === contactId
          ? {
              ...c,
              [field]:
                field === "phone"
                  ? normalizePhone(value)
                  : value,
            }
          : c
      ),
    }));
  }

  const selectedContact = crm.data.contacts.find(
    (c) => c.id === selectedContactId
  );

  const filteredContacts = crm.data.contacts.filter((c) => {
    const nameVal = (c.name || "").toLowerCase();
    const emailVal = (c.email || "").toLowerCase();

    const matchesSearch =
      nameVal.includes(search.toLowerCase()) ||
      emailVal.includes(search.toLowerCase());

    const matchesCompany =
      !filterCompanyId ||
      String(c.companyId) === String(filterCompanyId);

    const matchesTag =
      tagFilter.length === 0 ||
      tagFilter.every((t) => (c.tags || []).includes(t));

    return matchesSearch && matchesCompany && matchesTag;
  });

  const sortedContacts = [...filteredContacts].sort((a, b) => {
  let aVal = "";
  let bVal = "";

  if (sortField === "name") {
    aVal = a.name || "";
    bVal = b.name || "";
  } else if (sortField === "email") {
    aVal = a.email || "";
    bVal = b.email || "";
  } else if (sortField === "phone") {
    aVal = a.phone || "";
    bVal = b.phone || "";
  }

  if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
  if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
  return 0;
});

return (
  <div style={styles.page}>
    {!selectedContact && (
      <>
        <h2>Contacts</h2>

        <div
          style={{
            marginBottom: 16,
            padding: 12,
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            background: "white",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
            Filter by Tags
          </div>

          <div>
            {[...new Set(crm.data.contacts.flatMap(c => c.tags || []))].map((t) => {
              const active = tagFilter.includes(t);

              return (
                <span
                  key={t}
                  onClick={() => {
                    setTagFilter((prev) =>
                      prev.includes(t)
                        ? prev.filter((x) => x !== t)
                        : [...prev, t]
                    );
                  }}
                  style={{
                    display: "inline-block",
                    padding: "4px 10px",
                    borderRadius: 999,
                    marginRight: 6,
                    marginBottom: 6,
                    fontSize: 12,
                    cursor: "pointer",
                    background: active ? "#1d4ed8" : "#e2e8f0",
                    color: active ? "white" : "black",
                  }}
                >
                  {t}
                </span>
              );
            })}
          </div>
        </div>

        {/* ADD */}
        <div style={styles.card}>
          <input
            style={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
          />

          <input
            style={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
          />

          <input
            style={styles.input}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone"
          />

          <select
            style={styles.input}
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
          >
            <option value="">Select company</option>
            {crm.data.companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            style={styles.primaryBtn}
            onClick={() => {
              const trimmed = name.trim();
              if (!trimmed || !companyId) return;

              crm.add("contacts", {
                name: trimmed,
                email,
                phone,
                companyId: String(companyId),
              });

              setName("");
              setEmail("");
              setPhone("");
              setCompanyId("");
            }}
          >
            Add
          </button>
        </div>

        {/* TABLE */}
        <div style={styles.card}>
          {filteredContacts.length === 0 && <div>No contacts found</div>}

          {filteredContacts.length > 0 && (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th
                    style={{ ...styles.th, cursor: "pointer" }}
                    onClick={() => {
                      setSortField("name");
                      setSortDir(sortField === "name" && sortDir === "asc" ? "desc" : "asc");
                    }}
                  >
                    Name {sortField === "name" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                  </th>
                  <th
                    style={{ ...styles.th, cursor: "pointer" }}
                    onClick={() => {
                      setSortField("email");
                      setSortDir(sortField === "email" && sortDir === "asc" ? "desc" : "asc");
                    }}
                  >
                    Email {sortField === "email" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                  </th>
                  <th
                    style={{ ...styles.th, cursor: "pointer" }}
                    onClick={() => {
                      setSortField("phone");
                      setSortDir(sortField === "phone" && sortDir === "asc" ? "desc" : "asc");
                    }}
                  >
                    Phone {sortField === "phone" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                  </th>
                  <th style={styles.th}>Company</th>
                  <th style={styles.th}>Tags</th>
                  <th style={styles.th}>Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {sortedContacts.map((c) => {
                  const company = crm.data.companies.find(
                    (co) => String(co.id) === String(c.companyId)
                  );

                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedContactId(c.id)}
                      style={{
                        cursor: "pointer",
                        transition: "0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#f8fafc";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "white";
                      }}
                    >
                      <td style={styles.td}>{c.name}</td>
                      <td style={styles.td}>{c.email}</td>
                      <td style={styles.td}>{formatPhone(c.phone)}</td>
                      <td style={styles.td}>
          {company ? company.name : ""}
        </td>
        <td style={styles.td}>
          {(c.tags || []).map((t, i) => (
            <span
              key={i}
              style={{
                display: "inline-block",
                padding: "2px 6px",
                borderRadius: 999,
                background: "#e2e8f0",
                fontSize: 10,
                marginRight: 4,
              }}
            >
              {t}
            </span>
          ))}
        </td>

<td style={styles.td}>
  {c.activity && c.activity.length > 0 ? (
    <div style={{ fontSize: 12, color: "#64748b" }}>
      {c.activity[0].text}
      <div style={{ fontSize: 11 }}>
        {new Date(c.activity[0].date).toLocaleString()}
      </div>
    </div>
  ) : (
    <span style={{ color: "#94a3b8" }}>—</span>
  )}
</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </>
    )}

    {selectedContact && (
      <div style={styles.card}>
        
        <button
          style={{ marginBottom: 10 }}
          onClick={() => setSelectedContactId(null)}
        >
          ← Back
        </button>
        
        <h3>Edit Contact</h3>

        {selectedContact?.companyId && (
          <button
            style={{ marginBottom: 10 }}
            onClick={() => {
              setSelectedCompanyId(selectedContact.companyId);
              setSelectedContactId(null);
              setPage("Companies");
            }}
          >
            Open Company →
          </button>
        )}

        <input
          style={styles.input}
          value={selectedContact.name || ""}
          onChange={(e) =>
            updateContact(selectedContact.id, "name", e.target.value)
          }
        />

        <input
          style={styles.input}
          value={selectedContact.email || ""}
          onChange={(e) =>
            updateContact(selectedContact.id, "email", e.target.value)
          }
        />

        <input
          style={styles.input}
          value={selectedContact.phone || ""}
          onChange={(e) =>
            updateContact(selectedContact.id, "phone", e.target.value)
          }
        />

        <select
          style={styles.input}
          value={selectedContact.companyId || ""}
          onChange={(e) =>
            updateContact(selectedContact.id, "companyId", e.target.value)
          }
        >
          <option value="">No company</option>
          {crm.data.companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
            Tags
          </div>

          <input
            placeholder="Add tag and press Enter"
            style={styles.input}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const value = e.target.value.trim();
                if (!value) return;

                updateContact(selectedContact.id, "tags", [
                  ...(selectedContact.tags || []),
                  value,
                ]);

                e.target.value = "";
              }
            }}
          />

          <div style={{ marginTop: 6 }}>
            {(selectedContact.tags || []).map((tag, i) => (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  padding: "3px 8px",
                  borderRadius: 999,
                  background: "#e2e8f0",
                  fontSize: 11,
                  marginRight: 6,
                  cursor: "pointer",
                }}
                onClick={() => {
                  updateContact(
                    selectedContact.id,
                    "tags",
                    (selectedContact.tags || []).filter((t) => t !== tag)
                  );
                }}
              >
                {tag} ✕
              </span>
            ))}
          </div>
        </div>
<div style={{ marginTop: 16 }}>
  <strong>Activity</strong>

  <div style={{ marginTop: 8, display: "flex", gap: 12 }}>
    <input
      style={styles.input}
      value={activityText}
      onChange={(e) => setActivityText(e.target.value)}
      placeholder="Log activity..."
    />

    <button
      style={styles.primaryBtn}
      onClick={() => {
        const trimmed = activityText.trim();
        if (!trimmed) return;

        crm.setData((prev) => ({
          ...prev,
          contacts: prev.contacts.map((c) =>
            c.id === selectedContact.id
              ? {
                  ...c,
                  activity: [
                    {
                      text: trimmed,
                      date: new Date().toISOString(),
                    },
                    ...(c.activity || []),
                  ],
                }
              : c
          ),
        }));

        setActivityText("");
      }}
    >
      Add
    </button>
  </div>

  <div style={{ marginTop: 10 }}>
    {(selectedContact.activity || []).length === 0 && (
      <div style={{ color: "#94a3b8" }}>No activity yet</div>
    )}

    {(selectedContact.activity || []).slice(0, 5).map((a, i) => (
      <div
        key={i}
        style={{
          padding: "6px 0",
          borderBottom: "1px solid #f1f5f9",
          fontSize: 13,
        }}
      >
        <div>{a.text}</div>
        <div style={{ fontSize: 11, color: "#94a3b8" }}>
          {new Date(a.date).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button
              style={{
                marginBottom: 10,
                background: "#e5e7eb",
                color: "black",
                border: "1px solid black",
              }}
              onClick={() => setSelectedContactId(null)}
            >
              Close
            </button>

            <button
              style={{
                marginBottom: 10,
                background: "#ef4444",
                color: "white",
                border: "none",
              }}
              onClick={() => {
                if (!window.confirm("Delete this contact?")) return;

                crm.setData((prev) => ({
                  ...prev,
                  contacts: prev.contacts.filter(
                    (c) => c.id !== selectedContact.id
                  ),
                }));

                setSelectedContactId(null);
              }}
            >
              Delete Contact
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
}

/* ---------------- DEALS ---------------- */

function Deals({
  crm,
  deals,
  setDeals,
  selectedDealId,
  setSelectedDealId,
  setPage,
  setSelectedCompanyId,
  setSelectedPipelineId,
}) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState("New");
  const [companyId, setCompanyId] = useState("");
  const [activityText, setActivityText] = useState("");

  const [seller, setSeller] = useState("");
  const [dealSize, setDealSize] = useState("");
  const [priceOffered, setPriceOffered] = useState("");
  const [dateReceived, setDateReceived] = useState("");
  const [decisionDate, setDecisionDate] = useState("");

  const [outcome, setOutcome] = useState("");
  const [reason, setReason] = useState("");

  const [fundSize, setFundSize] = useState("");
  const [coinvestSize, setCoinvestSize] = useState("");
  const [smaSize, setSmaSize] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showAddDeal, setShowAddDeal] = useState(false);
  
  const [filterOutcome, setFilterOutcome] = useState("");
  const [filterSeller, setFilterSeller] = useState("");

    const selectedDeal =
      deals.find((d) => String(d.id) === String(selectedDealId)) || null;

    async function updateDealField(dealId, field, value) {
      // 1. update UI immediately (required for typing)
      setDeals((prev) =>
        prev.map((d) =>
          String(d.id) === String(dealId)
            ? { ...d, [field]: value }
            : d
        )
      );

      // 2. persist to DB
      const { error } = await supabase
        .from("deals")
        .update({ [field]: value })
        .eq("id", dealId);

      if (error) {
        console.error("UPDATE DEAL ERROR:", error);
      }
    }

    if (selectedDealId && selectedDeal) {
    return (
      <div style={styles.page}>
        <button onClick={() => setSelectedDealId(null)}>← Back</button>

        <h2 style={{ marginTop: 10 }}>{selectedDeal.name}</h2>

        <div style={{ marginTop: 10 }}>
          <button
            style={{
              background: "#ef4444",
              color: "white",
              border: "none",
              padding: "6px 10px",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 12,
            }}
            onClick={async () => {
              if (!window.confirm("Delete this deal?")) return;

              const { error } = await supabase
                .from("deals")
                .delete()
                .eq("id", selectedDeal.id);

              if (error) {
                console.error("DELETE ERROR:", error);
                return;
              }

              setDeals((prev) =>
                prev.filter((d) => String(d.id) !== String(selectedDeal.id))
              );

              crm.setData((prev) => ({
                ...prev,
                pipelines: prev.pipelines.filter(
                  (p) => String(p.dealId) !== String(selectedDeal.id)
                ),
                pipelineEntries: prev.pipelineEntries.filter(
                  (e) => String(e.dealId) !== String(selectedDeal.id)
                ),
              }));

              setSelectedDealId(null);
            }}
          >
            Delete Deal
          </button>
        </div>

        <div style={{ ...styles.card, marginTop: 20 }}>
          <strong>Deal Info</strong>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginTop: 10,
            }}
          >
            <input
              style={styles.input}
              value={selectedDeal.seller || ""}
              onChange={(e) =>
                updateDealField(selectedDeal.id, "seller", e.target.value)
              }
              placeholder="Seller"
            />

            <input
              style={styles.input}
              value={selectedDeal.dealSize || ""}
              onChange={(e) =>
                updateDealField(selectedDeal.id, "dealSize", e.target.value)
              }
              placeholder="Deal size ($mm)"
            />

            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ fontSize: 11, color: "#64748b" }}>
                Price Offered
              </div>

              <input
                style={styles.input}
                value={selectedDeal.priceOffered || ""}
                onChange={(e) =>
                  updateDealField(selectedDeal.id, "priceOffered", e.target.value)
                }
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ fontSize: 11, color: "#64748b" }}>
                Date Received
              </div>
              <input
                type="date"
                style={styles.input}
                value={selectedDeal.dateReceived || ""}
                onChange={(e) =>
                  updateDealField(selectedDeal.id, "dateReceived", e.target.value)
                }
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ fontSize: 11, color: "#64748b" }}>
                Decision Date
              </div>
              <input
                type="date"
                style={styles.input}
                value={selectedDeal.decisionDate || ""}
                onChange={(e) =>
                  updateDealField(selectedDeal.id, "decisionDate", e.target.value)
                }
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ fontSize: 11, color: "#64748b" }}>Outcome</div>
              <select
                style={styles.input}
                value={selectedDeal.outcome || ""}
                onChange={(e) =>
                  updateDealField(selectedDeal.id, "outcome", e.target.value)
                }
              >
                <option value="">Outcome</option>
                <option value="Passed">Passed</option>
                <option value="Missed">Missed</option>
                <option value="Bought">Bought</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ fontSize: 11, color: "#64748b" }}>Reason</div>
              <input
                style={styles.input}
                value={selectedDeal.reason || ""}
                onChange={(e) =>
                  updateDealField(selectedDeal.id, "reason", e.target.value)
                }
                placeholder="Reason / notes"
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ fontSize: 11, color: "#64748b" }}>Fund ($mm)</div>
              <input
                style={styles.input}
                value={selectedDeal.fundSize || ""}
                onChange={(e) =>
                  updateDealField(selectedDeal.id, "fundSize", e.target.value)
                }
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ fontSize: 11, color: "#64748b" }}>
                Co-invest ($mm)
              </div>
              <input
                style={styles.input}
                value={selectedDeal.coinvestSize || ""}
                onChange={(e) =>
                  updateDealField(selectedDeal.id, "coinvestSize", e.target.value)
                }
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ fontSize: 11, color: "#64748b" }}>SMA ($mm)</div>
              <input
                style={styles.input}
                value={selectedDeal.smaSize || ""}
                onChange={(e) =>
                  updateDealField(selectedDeal.id, "smaSize", e.target.value)
                }
              />
            </div>
          </div>
        </div>

        <div style={{ ...styles.card, marginTop: 20 }}>
          <strong>Activity</strong>

          <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
            <input
              style={styles.input}
              value={activityText}
              onChange={(e) => setActivityText(e.target.value)}
              placeholder="Log activity..."
            />

            <button
              style={styles.primaryBtn}
              onClick={async () => {
                const trimmed = activityText.trim();
                if (!trimmed) return;

                const newActivity = {
                  text: trimmed,
                  date: new Date().toISOString(),
                };

                const updatedActivity = [
                  newActivity,
                  ...(selectedDeal.activity || []),
                ];

                const { error } = await supabase
                  .from("deals")
                  .update({ activity: updatedActivity })
                  .eq("id", selectedDeal.id);

                if (error) {
                  console.error("ACTIVITY ERROR:", error);
                  return;
                }

                setDeals((prev) =>
                  prev.map((d) =>
                    String(d.id) === String(selectedDeal.id)
                      ? { ...d, activity: updatedActivity }
                      : d
                  )
                );

                setActivityText("");
              }}
            >
              Add
            </button>
          </div>

          <div style={{ marginTop: 10, fontSize: 12 }}>
            {(selectedDeal.activity || []).length === 0 && (
              <div style={{ color: "#94a3b8" }}>No activity yet</div>
            )}

            {(selectedDeal.activity || []).slice(0, 5).map((a, i) => (
              <div key={i} style={{ marginBottom: 6 }}>
                <div>{a.text}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>
                  {new Date(a.date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {(() => {
          const entries = crm.data.pipelineEntries.filter(
            (e) => String(e.dealId) === String(selectedDeal.id)
          );

          const companies = new Set(entries.map((e) => e.companyId));
          const stages = new Set(entries.map((e) => e.stage));
          const pipelines = new Set(entries.map((e) => e.pipelineId));

          return (
            <div
              style={{
                marginTop: 8,
                fontSize: 13,
                color: "#64748b",
              }}
            >
              {companies.size} Company{companies.size !== 1 ? "ies" : ""} •{" "}
              {stages.size} Stage{stages.size !== 1 ? "s" : ""} •{" "}
              {pipelines.size} Pipeline{pipelines.size !== 1 ? "s" : ""}
            </div>
          );
        })()}

        {(() => {
          const pipeline =
            crm.data.pipelines.find(
              (p) => String(p.dealId) === String(selectedDeal.id)
            ) ||
            crm.data.pipelines.find((p) =>
              (p.name || "")
                .toLowerCase()
                .includes((selectedDeal.name || "").toLowerCase())
            );

          return (
            <div style={{ marginTop: 10 }}>
              {pipeline && (
                <div
                  style={{
                    marginTop: 10,
                    padding: "10px 14px",
                    background: "#2563eb",
                    color: "white",
                    borderRadius: 8,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 12,
                    fontWeight: 600,
                  }}
                  onClick={() => {
                    setSelectedPipelineId(pipeline.id);
                    setPage("Pipelines");
                  }}
                >
                  OPEN PIPELINE →
                  <span style={{ fontWeight: 400 }}>{pipeline.name}</span>
                </div>
              )}
            </div>
          );
        })()}

        <div style={{ ...styles.card, marginTop: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 10 }}>
            Companies in this deal
          </div>

          {Array.from(
            new Set(
              crm.data.pipelineEntries
                .filter((e) => String(e.dealId) === String(selectedDeal.id))
                .map((e) => e.stage)
            )
          ).map((stage) => {
            const entries = crm.data.pipelineEntries.filter(
              (e) =>
                String(e.dealId) === String(selectedDeal.id) &&
                e.stage === stage
            );

            return (
              <div
                key={stage}
                style={{
                  marginBottom: 16,
                  padding: 12,
                  background: "#f8fafc",
                  borderRadius: 10,
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 11,
                    color: "#475569",
                    marginBottom: 8,
                    letterSpacing: "0.05em",
                  }}
                >
                  {stage.toUpperCase()}
                </div>

                {entries.map((e, i) => {
                  const company = crm.data.companies.find(
                    (c) => c.id === e.companyId
                  );

                  if (!company) return null;

                  return (
                    <div
                      key={e.id || `entry-${i}`}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 8,
                        background: "white",
                        border: "1px solid #e2e8f0",
                        marginBottom: 6,
                        cursor: "pointer",
                        transition: "0.15s",
                      }}
                      onClick={() => {
                        setSelectedCompanyId(company.id);
                        setPage("Companies");
                      }}
                      onMouseEnter={(el) => {
                        el.currentTarget.style.background = "#f1f5f9";
                      }}
                      onMouseLeave={(el) => {
                        el.currentTarget.style.background = "white";
                      }}
                    >
                      <div style={{ fontWeight: 500 }}>{company.name}</div>

                      <div
                        style={{
                          fontSize: 11,
                          color: "#64748b",
                          marginTop: 2,
                        }}
                      >
                        Open company →
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.title}>Deals</div>

        <button
          style={{
            marginTop: 10,
            padding: "6px 10px",
            borderRadius: 6,
            border: "1px solid #e2e8f0",
            background: "white",
            cursor: "pointer",
            fontSize: 12,
          }}
          onClick={() => {
            const rows = deals.map((d, i) => {
              const company = crm.data.companies.find(
                (c) => String(c.id) === String(d.companyId)
              );

              return {
                name: d.name || "",
                company: company?.name || "",
                seller: d.seller || "",
                dealSize: parseFloat(d.dealSize || 0) || "",
                priceOffered: priceOffered || "",
                outcome: d.outcome || "",
                reason: d.reason || "",
                fundSize: parseFloat(d.fundSize || 0) || "",
                coinvestSize: parseFloat(d.coinvestSize || 0) || "",
                smaSize: parseFloat(d.smaSize || 0) || "",
                dateReceived: d.dateReceived || "",
                decisionDate: d.decisionDate || "",
              };
            });

            const headers = Object.keys(rows[0] || {});

            const csv = [
              headers.join(","),
              ...rows.map((row) =>
                headers
                  .map((h) => `"${String(row[h]).replace(/"/g, '""')}"`)
                  .join(",")
              ),
            ].join("\n");

            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = "deals.csv";
            a.click();

            URL.revokeObjectURL(url);
          }}
        >
          Export Deals CSV
        </button>

      <div style={{ marginTop: 10 }}>
        <button
          style={styles.primaryBtn}
          onClick={() => setShowAddDeal((s) => !s)}
        >
          {showAddDeal ? "Close" : "+ New Deal"}
        </button>
      </div>
      
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <select
          style={styles.input}
          value={filterOutcome}
          onChange={(e) => setFilterOutcome(e.target.value)}
        >
          <option value="">All outcomes</option>
          <option value="Passed">Passed</option>
          <option value="Missed">Missed</option>
          <option value="Bought">Bought</option>
        </select>

        <input
          style={styles.input}
          value={filterSeller}
          onChange={(e) => setFilterSeller(e.target.value)}
          placeholder="Filter by seller"
        />

        <button
          style={{
            padding: "6px 10px",
            borderRadius: 6,
            border: "1px solid #e2e8f0",
            background: "white",
            cursor: "pointer",
            fontSize: 12,
          }}
          onClick={() => {
            setFilterOutcome("");
            setFilterSeller("");
          }}
        >
          Clear
        </button>
      </div>

      </div>

      {showAddDeal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowAddDeal(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: 10,
              padding: 20,
              width: "600px",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontWeight: 600 }}>New Deal</div>
              <button onClick={() => setShowAddDeal(false)}>✕</button>
            </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginTop: 10,
          }}
        >
          <input
            style={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Deal name"
          />

          <select
            style={styles.input}
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
          >
            <option value="">Select company</option>
            {crm.data.companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            style={styles.input}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option>New</option>
            <option>Underwriting</option>
            <option>Passed</option>
            <option>Investing</option>
            <option>Closed</option>
          </select>

          <input
            style={styles.input}
            value={seller}
            onChange={(e) => setSeller(e.target.value)}
            placeholder="Seller"
          />

          <input
            style={styles.input}
            value={dealSize}
            onChange={(e) => setDealSize(e.target.value)}
            placeholder="Deal size ($mm)"
          />

          <input
            style={styles.input}
            value={priceOffered}
            onChange={(e) => setPriceOffered(e.target.value)}
            placeholder="Price offered"
          />

          <select
            style={styles.input}
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
          >
            <option value="">Outcome</option>
            <option value="Passed">Passed</option>
            <option value="Missed">Missed</option>
            <option value="Bought">Bought</option>
          </select>

          <input
            style={styles.input}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason / notes"
          />

          <div style={{ gridColumn: "1 / -1", marginTop: 4 }}>
            <button
              style={{
                background: "none",
                border: "none",
                color: "#2563eb",
                cursor: "pointer",
                fontSize: 12,
                padding: 0,
              }}
              onClick={() => setShowAdvanced((s) => !s)}
            >
              {showAdvanced ? "Hide advanced" : "Add allocations"}
            </button>
          </div>

          {showAdvanced && (
            <div
              style={{
                gridColumn: "1 / -1",
                display: "flex",
                gap: 8,
              }}
            >
            <input
              style={styles.input}
              value={fundSize}
              onChange={(e) => setFundSize(e.target.value)}
              placeholder="Fund ($mm)"
            />

            <input
              style={styles.input}
              value={coinvestSize}
              onChange={(e) => setCoinvestSize(e.target.value)}
              placeholder="Co-invest ($mm)"
            />

            <input
              style={styles.input}
              value={smaSize}
              onChange={(e) => setSmaSize(e.target.value)}
              placeholder="SMA ($mm)"
            />
          </div>
          )}
          
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ fontSize: 11, color: "#64748b" }}>
              Date Received
            </div>
            <input
              type="date"
              style={styles.input}
              value={dateReceived}
              onChange={(e) => setDateReceived(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ fontSize: 11, color: "#64748b" }}>
              Decision Date
            </div>
            <input
              type="date"
              style={styles.input}
              value={decisionDate}
              onChange={(e) => setDecisionDate(e.target.value)}
            />
          </div>
        </div>

        <button
          style={{ ...styles.primaryBtn, marginTop: 12 }}
          onClick={async () => {
            const trimmedName = name.trim();
            if (!trimmedName) return;

            const { data: insertData, error } = await supabase
              .from("deals")
              .insert([
                {
                  name: trimmedName,
                  companyId: companyId || null,
                  status: status || null,
                  seller: seller || null,
                  dealSize: dealSize || null,
                  priceOffered: priceOffered || null,
                  outcome: outcome || null,
                  reason: reason || null,
                  fundSize: fundSize || null,
                  coinvestSize: coinvestSize || null,
                  smaSize: smaSize || null,
                  dateReceived: dateReceived || null,
                  decisionDate: decisionDate || null,
                }
              ])
              .select()
              .single();

            console.log("INSERT DATA:", insertData);
            console.log("INSERT ERROR:", error);

            if (error) {
              console.error("INSERT ERROR:", error);
              alert(error.message);
              return;
            }

            if (insertData) {
              setDeals((prev) => [
                ...prev,
                {
                  ...insertData,
                  id: String(insertData.id),
                },
              ]);
            }

            setName("");
            setStatus("New");
            setCompanyId("");
            setSeller("");
            setDealSize("");
            setPriceOffered("");
            setDateReceived("");
            setDecisionDate("");
            setOutcome("");
            setReason("");
            setFundSize("");
            setCoinvestSize("");
            setSmaSize("");
            setShowAddDeal(false);
          }}
        >
          Add
        </button>
      </div>
      </div>
    )}

      <div style={styles.card}>
          {deals
            .filter((d) => {
              if (filterOutcome && d.outcome !== filterOutcome) return false;

              if (
                filterSeller &&
                !(d.seller || "")
                  .toLowerCase()
                  .includes(filterSeller.toLowerCase())
              )
                return false;

              return true;
            })
            .map((d, i) => {
              const company = crm.data.companies.find(
                (c) => String(c.id) === String(d.companyId)
              );

              const companyCount = crm.data.pipelineEntries.filter((e) => {
                const pipeline = crm.data.pipelines.find(
                  (p) => p.id === e.pipelineId
                );
                return String(pipeline?.dealId) === String(d.id);
              }).length;

              const safeKey = d.id ? `deal-${d.id}` : `deal-fallback-${i}`;

              return (
            <div
              key={safeKey}
              onClick={() => {
                console.log("CLICK:", d.id, d.name);
                setSelectedDealId(d.id);
              }}
              style={{
                padding: 12,
                borderBottom: "1px solid #e2e8f0",
                cursor: "pointer",
              }}
            >
              <div style={{ fontWeight: 600 }}>{d.name}</div>

              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                <span
                  style={{
                    color:
                      d.outcome === "Bought"
                        ? "#16a34a"
                        : d.outcome === "Passed"
                        ? "#dc2626"
                        : d.outcome === "Missed"
                        ? "#f59e0b"
                        : "#64748b",
                    fontWeight: 500,
                  }}
                >
                  {d.outcome || "No outcome"}
                </span>

                <span style={{ color: "#64748b", marginLeft: 6 }}>
                  • {company ? company.name : "No company"}
                </span>
              </div>

              <div
                style={{
                  fontSize: 11,
                  color: "#2563eb",
                  marginTop: 2,
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
                onClick={(e) => {
                  e.stopPropagation();

                  const pipeline = crm.data.pipelines.find(
                    (p) => String(p.dealId) === String(d.id)
                  );

                  if (!pipeline) {
                    alert("No pipeline found for this deal");
                    return;
                  }

                  setSelectedPipelineId(pipeline.id);
                  setPage("Pipelines");
                }}
              >
                {companyCount} companies in pipeline
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
/* ---------------- PIPELINES ---------------- */
function Pipelines({ crm, setPage, setSelectedCompanyId, setSelectedDealId, selectedPipelineId, setSelectedPipelineId, currentUser , tagFilter,
  setTagFilter}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("coinvest");
  const [selected, setSelected] = useState(null);
  const [staleDays, setStaleDays] = useState(3);
  const [veryStaleDays, setVeryStaleDays] = useState(7);
  
    useEffect(() => {
      if (selectedPipelineId) {
        setSelected(selectedPipelineId);
      }
    }, [selectedPipelineId]);
  const [selectedEntryId, setSelectedEntryId] = useState(null);
  const [expandedEntryId, setExpandedEntryId] = useState(null);
  const [draggedId, setDraggedId] = useState(null);
  useEffect(() => {
  if (!window.__highlightCompanyId) return;

  const el = document.querySelector(
    `[data-company-id="${window.__highlightCompanyId}"]`
  );

  if (el) {
    setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
  }
}, [selectedPipelineId]);

  const [companyId, setCompanyId] = useState("");
  const [activityText, setActivityText] = useState("");
  const [stage, setStage] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [showMine, setShowMine] = useState(false);
  const [showOverdue, setShowOverdue] = useState(false);
    useEffect(() => {
      if (!selected) return;

      const pipeline = crm.data.pipelines.find((p) => p.id === selected);
      if (pipeline?.stages) {
        setStageDraft(pipeline.stages);
      }
    }, [selected]);

  const [editingStages, setEditingStages] = useState(false);
  const [stageDraft, setStageDraft] = useState([]);
  const [newStage, setNewStage] = useState("");
  const [draggedStageIndex, setDraggedStageIndex] = useState(null);

  if (selected) {
    const pipeline = crm.data.pipelines.find((p) => p.id === selected);
    const totalCompanies = crm.data.pipelineEntries.filter(
      (e) => e.pipelineId === pipeline.id
    ).length;

    const selectedEntry = crm.data.pipelineEntries.find(
      (e) => String(e.id) === String(selectedEntryId)
    );

    return (
    <div style={styles.page}>
      <div style={styles.header}>
    <div style={styles.title}>Pipelines</div>
  </div>

  <div
    style={{
      marginBottom: 16,
      padding: 12,
      border: "1px solid #e2e8f0",
      borderRadius: 8,
      background: "white",
    }}
  >
    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
      Filter by Tags
    </div>

    <div>
      {[...new Set(crm.data.contacts.flatMap(c => c.tags || []))].map((t) => {
        const active = tagFilter.includes(t);

        return (
          <span
            key={t}
            onClick={() => {
              setTagFilter((prev) =>
                prev.includes(t)
                  ? prev.filter((x) => x !== t)
                  : [...prev, t]
              );
            }}
            style={{
              display: "inline-block",
              padding: "4px 10px",
              borderRadius: 999,
              marginRight: 6,
              marginBottom: 6,
              fontSize: 12,
              cursor: "pointer",
              background: active ? "#1d4ed8" : "#e2e8f0",
              color: active ? "white" : "black",
            }}
          >
            {t}
          </span>
        );
      })}
    </div>
  </div>

    {window.__highlightCompanyName && (
    <div
      onClick={() => {
        setSelectedCompanyId(window.__highlightCompanyId);
        setPage("Companies");
      }}
      style={{
        background: "#eff6ff",
        border: "1px solid #bfdbfe",
        padding: "8px 12px",
        borderRadius: 6,
        marginBottom: 10,
        fontSize: 13,
        cursor: "pointer",
      }}
    >
      Viewing: <strong>{window.__highlightCompanyName}</strong>
      <span style={{ marginLeft: 8, fontSize: 12, color: "#2563eb" }}>
        (open)
      </span>
    </div>
  )}

    <button
      onClick={() => {
        setSelected(null);
        setSelectedPipelineId(null);
      }}
    >
      ← Back
    </button>

    <h1 style={{ marginTop: 10, marginBottom: 4 }}>
      {pipeline.name}
    </h1>

    <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>
      {totalCompanies} Companies
    </div>

    <div
      style={{
        display: "flex",
        gap: 12,
        alignItems: "center",
        marginBottom: 10,
      }}
    >
      <div style={{ fontSize: 12, color: "#64748b" }}>Stale:</div>
      <input
        type="number"
        value={pipeline.staleDays || 3}
        onChange={(e) => {
          const value = Number(e.target.value);

          crm.setData((prev) => ({
            ...prev,
            pipelines: prev.pipelines.map((p) =>
              p.id === pipeline.id
                ? { ...p, staleDays: value }
                : p
            ),
          }));
        }}
        style={{ width: 50 }}
      />

      <div style={{ fontSize: 12, color: "#64748b" }}>Very:</div>
      <input
        type="number"
        value={pipeline.veryStaleDays || 7}
        onChange={(e) => {
          const value = Number(e.target.value);

          crm.setData((prev) => ({
            ...prev,
            pipelines: prev.pipelines.map((p) =>
              p.id === pipeline.id
                ? { ...p, veryStaleDays: value }
                : p
            ),
          }));
        }}
        style={{ width: 50 }}
      />
    </div>

    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
      {getStagesForPipeline(pipeline).map((stageName, idx) => {
        const stageEntries = crm.data.pipelineEntries.filter((e) => {
          const matchesStage =
            e.pipelineId === pipeline.id &&
            e.stage === stageName;

          if (!matchesStage) return false;

          if (tagFilter.length === 0) return true;

          const companyContacts = crm.data.contacts.filter(
            (c) => String(c.companyId) === String(e.companyId)
          );

          const hasTag = companyContacts.some((c) =>
            (c.tags || []).some((t) => tagFilter.includes(t))
          );

          return hasTag;
        });

        const count = stageEntries.length;

        const staleCount = stageEntries.filter((e) => {
          const moveEvent = [...(e.activity || [])]
            .reverse()
            .find(
              (a) =>
                a.text?.startsWith("Moved to") ||
                a.text?.startsWith("Added to pipeline")
            );

          if (!moveEvent) return false;

          const diff = Date.now() - new Date(moveEvent.date).getTime();
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));

          return days > (pipeline.staleDays || 3);
        }).length;

        const criticalCount = stageEntries.filter((e) => {
          const moveEvent = [...(e.activity || [])]
            .reverse()
            .find(
              (a) =>
                a.text?.startsWith("Moved to") ||
                a.text?.startsWith("Added to pipeline")
            );

          if (!moveEvent) return false;

          const diff = Date.now() - new Date(moveEvent.date).getTime();
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));

          return days > (pipeline.veryStaleDays || 7);
        }).length;

        return (
          <div
            key={stageName}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              background: getStageColor(idx),
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            {stageName}: {count}

            {(staleCount > 0 || criticalCount > 0) && (
              <div style={{ marginTop: 4, fontSize: 11 }}>
                {criticalCount > 0 && (
                  <span style={{ color: "#dc2626", fontWeight: 600 }}>
                    {criticalCount} very stale
                  </span>
                )}
                {staleCount > 0 && criticalCount === 0 && (
                  <span style={{ color: "#f59e0b" }}>
                    {staleCount} stale
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>

    <div
      style={{
        fontSize: 12,
        color: "#64748b",
        fontWeight: 500,
        marginBottom: 10,
      }}
    >
    <button
      style={{
        marginTop: 6,
        marginBottom: 10,
        padding: "6px 10px",
        borderRadius: 6,
        border: "1px solid #e2e8f0",
        cursor: "pointer",
      }}
      onClick={() => setEditingStages((v) => !v)}
    >
      {editingStages ? "Close Stages" : "Edit Stages"}
    </button>

      {pipeline.type === "coinvest" && "Co-invest Pipeline"}
      {pipeline.type === "fund" && "Fund Pipeline"}
      {pipeline.type === "sma" && "SMA Pipeline"}
    </div>

    <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 10,
    marginBottom: 10,
  }}
>
  <div>
    {pipeline.type === "coinvest" && (
      <div style={{ marginBottom: 12 }}>
        <select
          style={{ ...styles.input, width: 250 }}
          value={pipeline.dealId || ""}
          onChange={(e) => {
            const value = String(e.target.value);

            crm.setData((prev) => ({
              ...prev,
              pipelines: prev.pipelines.map((p) =>
                String(p.id) === String(pipeline.id)
                  ? {
                      ...p,
                      dealId: value,
                    }
                  : p
              ),
            }));
          }}
        >
          <option value="">Select deal</option>
          {deals.map((d) => (
            <option key={`deal-${d.id || d.name}`} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        {pipeline.dealId && (
          <div
            style={{
              marginTop: 6,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: 6,
                background: "#e2e8f0",
                color: "#475569",
              }}
            >
              DEAL
            </span>

            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#2563eb",
                cursor: "pointer",
                textDecoration: "underline",
              }}
              onClick={() => {
                setSelectedDealId(pipeline.dealId);
                setPage("Deals");
              }}
            >
              {deals.find((d) => d.id === pipeline.dealId)?.name}
            </span>
          </div>
        )}
      </div>
    )}
  </div>

  <button
    style={{
      background: "#ef4444",
      color: "white",
      border: "none",
      padding: "8px 12px",
      borderRadius: 6,
      cursor: "pointer",
      fontSize: 13,
    }}
    onClick={() => {
      if (!window.confirm("Delete this pipeline?")) return;

      crm.setData((prev) => ({
        ...prev,
        pipelines: prev.pipelines.filter((p) => p.id !== pipeline.id),
        pipelineEntries: prev.pipelineEntries.filter(
          (e) => e.pipelineId !== pipeline.id
        ),
      }));

      setSelected(null);
    }}
  >
    Delete
  </button>
</div>

    <div style={{ marginBottom: 10, display: "flex", gap: 10 }}>
      <button
        style={{
          padding: "6px 10px",
          borderRadius: 6,
          border: "1px solid #e2e8f0",
          background: showMine ? "#2563eb" : "white",
          color: showMine ? "white" : "black",
          cursor: "pointer",
        }}
        onClick={() => setShowMine((v) => !v)}
      >
        My Items
      </button>

      <button
        style={{
          padding: "6px 10px",
          borderRadius: 6,
          border: "1px solid #e2e8f0",
          background: showOverdue ? "#dc2626" : "white",
          color: showOverdue ? "white" : "black",
          cursor: "pointer",
        }}
        onClick={() => setShowOverdue((v) => !v)}
      >
        Overdue
      </button>
    </div>

    {editingStages && (
      <div style={{ ...styles.card, marginBottom: 20 }}>
        <strong>Edit Stages</strong>

        {/* EXISTING STAGES */}
        {stageDraft.map((s, idx) => (
          <div
            key={idx}
            draggable
            onDragStart={() => setDraggedStageIndex(idx)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (draggedStageIndex === null || draggedStageIndex === idx) return;

              const copy = [...stageDraft];
              const [moved] = copy.splice(draggedStageIndex, 1);
              copy.splice(idx, 0, moved);

              setStageDraft(copy);
              setDraggedStageIndex(null);
            }}
            style={{
              display: "flex",
              gap: 6,
              marginTop: 6,
              cursor: "grab",
            }}
          >
            <input
              value={s}
              onChange={(e) => {
                const copy = [...stageDraft];
                copy[idx] = e.target.value;
                setStageDraft(copy);
              }}
              style={{ ...styles.input, flex: 1 }}
            />

            {/* MOVE UP */}
            <button
              onClick={() => {
                if (idx === 0) return;
                const copy = [...stageDraft];
                [copy[idx - 1], copy[idx]] = [copy[idx], copy[idx - 1]];
                setStageDraft(copy);
              }}
            >
              ↑
            </button>

            {/* MOVE DOWN */}
            <button
              onClick={() => {
                if (idx === stageDraft.length - 1) return;
                const copy = [...stageDraft];
                [copy[idx + 1], copy[idx]] = [copy[idx], copy[idx + 1]];
                setStageDraft(copy);
              }}
            >
              ↓
            </button>

            {/* DELETE */}
            <button
              onClick={() => {
                const hasEntries = crm.data.pipelineEntries.some(
                  (e) =>
                    e.pipelineId === pipeline.id &&
                    e.stage === s
                );

                if (hasEntries) {
                  alert("Cannot delete stage with active entries");
                  return;
                }

                const copy = stageDraft.filter((_, i) => i !== idx);
                setStageDraft(copy);
              }}
              style={{ color: "red" }}
            >
              ✕
            </button>
          </div>
        ))}

        {/* ADD NEW */}
        <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
          <input
            value={newStage}
            onChange={(e) => setNewStage(e.target.value)}
            placeholder="New stage..."
            style={styles.input}
          />

          <button
            style={styles.primaryBtn}
            onClick={() => {
              const trimmed = newStage.trim();
              if (!trimmed) return;

              setStageDraft([...stageDraft, trimmed]);
              setNewStage("");
            }}
          >
            Add
          </button>
        </div>

        {/* SAVE */}
        <button
          style={{ ...styles.primaryBtn, marginTop: 10 }}
          onClick={() => {
            const oldStages = pipeline.stages || [];

            crm.setData((prev) => ({
              ...prev,

              // ✅ update pipeline stages
              pipelines: prev.pipelines.map((p) =>
                p.id === pipeline.id
                  ? { ...p, stages: stageDraft }
                  : p
              ),

              // ✅ update entries if stages renamed
              pipelineEntries: prev.pipelineEntries.map((e) => {
                if (e.pipelineId !== pipeline.id) return e;

                const oldIndex = oldStages.indexOf(e.stage);
                if (oldIndex === -1) return e;

                const newStageName = stageDraft[oldIndex];

                return {
                  ...e,
                  stage: newStageName || e.stage,
                };
              }),
            }));

            setEditingStages(false);
          }}
        >
          Save Stages
        </button>
      </div>
    )}
        {/* ADD ENTRY */}
        <div style={styles.card}>
          <select
            style={styles.input}
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
          >
            <option value="">Select company</option>
            {crm.data.companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            style={styles.input}
            value={stage}
            onChange={(e) => setStage(e.target.value)}
          >
            {getStagesForPipeline(pipeline).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <input
            style={styles.input}
            value={nextStep}
            onChange={(e) => setNextStep(e.target.value)}
            placeholder="Next step"
          />

          <button
            style={styles.primaryBtn}
            onClick={() => {
              if (!companyId) return;

              const stages = getStagesForPipeline(pipeline);
              const validStage = stage || stages[0];

              crm.add("pipelineEntries", {
                pipelineId: pipeline.id,
                companyId,
                stage: validStage,
                nextStep,
                notes: "",
                owner: "",
                updatedAt: Date.now(),
                contactId: "",
                dueDate: "",
                dealId: pipeline.dealId || "",
                activity: [
                  { text: "Added to pipeline", date: new Date().toISOString() }
                ],
              });

              setCompanyId("");
              setNextStep("");
            }}
          >
            Add
          </button>
        </div>

        {/* ACTIVITY PANEL */}
        {selectedEntry && (
          <div style={{ ...styles.card, marginBottom: 20 }}>
            <strong>Activity</strong>

            {/* ADD ACTIVITY */}
            <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
              <input
                style={styles.input}
                value={activityText}
                onChange={(e) => setActivityText(e.target.value)}
                placeholder="Log activity..."
              />

              <button
                style={styles.primaryBtn}
                onClick={() => {
                  const trimmed = activityText.trim();
                  if (!trimmed) return;

                  crm.setData((prev) => ({
                    ...prev,
                    pipelineEntries: prev.pipelineEntries.map((pe) =>
                      pe.id === selectedEntry.id
                        ? {
                            ...pe,
                            activity: [
                              {
                                text: trimmed,
                                date: new Date().toISOString(),
                              },
                              ...(pe.activity || []),
                            ],
                          }
                        : pe
                    ),
                  }));

                  setActivityText("");
                }}
              >
                Add
              </button>
            </div>

            {/* ACTIVITY LIST */}
            <div style={{ marginTop: 10, fontSize: 12 }}>
              {(selectedEntry.activity || []).length === 0 && (
                <div style={{ color: "#94a3b8" }}>No activity yet</div>
              )}

              {(selectedEntry.activity || []).slice(0, 5).map((a, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <div>{a.text}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>
                    {new Date(a.date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>
              ))}
            </div>

            <button
              style={{ marginTop: 10 }}
              onClick={() => setSelectedEntryId(null)}
            >
              Close
            </button>
          </div>
        )}

        {(() => {
          const visibleEntries = crm.data.pipelineEntries.filter((e) => {
            if (e.pipelineId !== pipeline.id) return false;

            if (showMine && e.owner !== currentUser) return false;

            if (
              showOverdue &&
              (!e.dueDate || new Date(e.dueDate) >= new Date())
            )
              return false;

            return true;
          });

          if (visibleEntries.length > 0) return null;

          return (
            <div
              style={{
                marginBottom: 12,
                padding: 12,
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                fontSize: 13,
                color: "#64748b",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>No items match current filters</span>

              <button
                style={{
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "1px solid #e2e8f0",
                  background: "white",
                  cursor: "pointer",
                }}
                onClick={() => {
                  setShowMine(false);
                  setShowOverdue(false);
                }}
              >
                Clear filters
              </button>
            </div>
          );
        })()}

        {/* KANBAN */}
<div style={{ display: "flex", gap: 20, overflowX: "auto" }}>
  {getStagesForPipeline(pipeline).map((stageName, idx) => {
    const stageEntries = crm.data.pipelineEntries
      .filter((e) => {
        if (e.pipelineId !== pipeline.id) return false;
        if (e.stage !== stageName) return false;

        if (showMine && e.owner !== currentUser) return false;

        if (
          showOverdue &&
          (!e.dueDate || new Date(e.dueDate) >= new Date())
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const getScore = (e) => {
          // 1. Overdue
          if (e.dueDate && new Date(e.dueDate) < new Date()) return 3;

          // 2. Find last stage move
          const moveEvent = [...(e.activity || [])]
            .reverse()
            .find(
              (a) =>
                a.text?.startsWith("Moved to") ||
                a.text?.startsWith("Added to pipeline")
            );

          let days = 0;

          if (moveEvent) {
            const diff = Date.now() - new Date(moveEvent.date).getTime();
            days = Math.floor(diff / (1000 * 60 * 60 * 24));
          }

          const very = pipeline.veryStaleDays || 7;
          const stale = pipeline.staleDays || 3;

          if (days > very) return 2;
          if (days > stale) return 1;

          return 0;
        };

        return getScore(b) - getScore(a);
      });

    return (
      <div
        key={stageName}
        style={{
          ...styles.card,
          minWidth: 250,
          background: getStageColor(idx),
          border: "1px solid rgba(0,0,0,0.05)",
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(evt) => {
          const id = draggedId || evt.dataTransfer.getData("text/plain");
          if (!id) return;

          crm.setData((prev) => ({
            ...prev,
            pipelineEntries: prev.pipelineEntries.map((pe) =>
              pe.id === id
                ? pe.stage === stageName
                  ? pe
                  : {
                      ...pe,
                      stage: stageName,
                      updatedAt: Date.now(),
                      activity: [
                        {
                          text: "Moved to " + stageName,
                          date: new Date().toISOString(),
                        },
                        ...(pe.activity || []),
                      ],
                    }
                : pe
            ),
          }));

          setDraggedId(null);
        }}
      >
        <div
          style={{
            fontWeight: 600,
            marginBottom: 10,
            background: getStageColor(idx),
            padding: "6px 10px",
            borderRadius: 6,
            opacity: 1,
          }}
        >
          {stageName} ({stageEntries.length})
        </div>

        {stageEntries.map((e, i) => {
          const company = crm.data.companies.find(
            (c) => c.id === e.companyId
          );

          // ✅ STALE LOGIC
          const moveEvent = [...(e.activity || [])]
            .reverse()
            .find(
              (a) =>
                a.text?.startsWith("Moved to") ||
                a.text?.startsWith("Added to pipeline")
            );

          let days = 0;

          if (moveEvent) {
            const diff = Date.now() - new Date(moveEvent.date).getTime();
            days = Math.floor(diff / (1000 * 60 * 60 * 24));
          }

          const isVeryStale = days > (pipeline.veryStaleDays || 7);
          const isStale = !isVeryStale && days > (pipeline.staleDays || 3);

          return (
            <div
              key={e.id || `pipeline-entry-${i}`}
              data-company-id={e.companyId}
              style={{
                cursor: "pointer",
                border:
                  isVeryStale
                    ? "2px solid #dc2626"
                    : isStale
                    ? "2px solid #f59e0b"
                    : e.dueDate && new Date(e.dueDate) < new Date()
                    ? "2px solid red"
                    : "1px solid #cbd5e1",

                background:
                  String(e.companyId) === String(window.__highlightCompanyId)
                    ? "#dbeafe"
                    : isVeryStale
                    ? "#fef2f2"
                    : isStale
                    ? "#fffbeb"
                    : e.dueDate && new Date(e.dueDate) < new Date()
                    ? "#fef2f2"
                    : "#ffffff",

                borderRadius: 8,
                padding: 10,
                marginBottom: 10,

                boxShadow:
                  isVeryStale
                    ? "0 2px 6px rgba(220,38,38,0.2)"
                    : isStale
                    ? "0 2px 6px rgba(245,158,11,0.2)"
                    : e.dueDate && new Date(e.dueDate) < new Date()
                    ? "0 1px 3px rgba(220,38,38,0.12)"
                    : "0 4px 10px rgba(0,0,0,0.12)",
              }}
             onClick={() => {
              setSelectedEntryId(e.id);
              setExpandedEntryId((prev) => (prev === e.id ? null : e.id));
            }}
              draggable
              onDragStart={(evt) => {
                setDraggedId(e.id);
                evt.dataTransfer.setData("text/plain", e.id); // 🔧 ensures browser keeps drag active
              }}
            >
             <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 4,
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                {company?.name}
              </div>

              <div style={{ marginBottom: 6 }}>
                {(company?.tags || []).map((t, i) => (
                  <span
                    key={i}
                    style={{
                      display: "inline-block",
                      padding: "2px 6px",
                      borderRadius: 999,
                      background: "#e2e8f0",
                      fontSize: 10,
                      marginRight: 4,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>

              <button
                onClick={(evt) => {
                  evt.stopPropagation();

                  const ok = window.confirm("Remove this company from this pipeline?");
                  if (!ok) return;

                  crm.setData((prev) => ({
                    ...prev,
                    pipelineEntries: prev.pipelineEntries.filter(
                      (pe) => pe.id !== e.id
                    ),
                  }));
                }}
                title="Remove from pipeline"
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#94a3b8",
                  cursor: "pointer",
                  fontSize: 16,
                  padding: "2px 6px",
                  borderRadius: 6,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#dc2626")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
              >
                ✕
              </button>
            </div>

              {/* CONTACT + QUICK ASSIGN */}
              <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                <select
                  value={e.contactId || ""}
                  onClick={(evt) => evt.stopPropagation()}
                  onChange={(evt) => {
                    const value = evt.target.value;

                    crm.setData((prev) => ({
                      ...prev,
                      pipelineEntries: prev.pipelineEntries.map((pe) =>
                        pe.id === e.id
                          ? {
                              ...pe,
                              contactId: value,
                              updatedAt: Date.now(),
                              activity: [
                                {
                                  text: "Updated contact",
                                  date: new Date().toISOString(),
                                },
                                ...(pe.activity || []),
                              ],
                            }
                          : pe
                      ),
                    }));
                  }}
                  style={{ flex: 1 }}
                >
                  <option value="">Contact</option>
                  {crm.data.contacts
                    .filter(
                      (c) => String(c.companyId) === String(e.companyId)
                    )
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* OWNER */}
              <select
                value={e.owner || ""}
                onClick={(evt) => evt.stopPropagation()}
                onChange={(evt) => {
                  const value = evt.target.value;

                  crm.setData((prev) => ({
                    ...prev,
                    pipelineEntries: prev.pipelineEntries.map((pe) =>
                      pe.id === e.id
                        ? {
                            ...pe,
                            owner: value,
                            updatedAt: Date.now(),
                            activity: [
                              {
                                text: "Updated owner",
                                date: new Date().toISOString(),
                              },
                              ...(pe.activity || []),
                            ],
                          }
                        : pe
                    ),
                  }));
                }}
                style={{ marginTop: 8, width: "100%" }}
              >
                <option value="">Owner</option>
                <option value="Seth">Seth</option>
                <option value="David">David</option>
              </select>

              {/* NEXT STEP */}
              <input
                value={e.nextStep || ""}
                onClick={(evt) => evt.stopPropagation()}
                onChange={(evt) => {
                  const value = evt.target.value;

                  crm.setData((prev) => ({
                    ...prev,
                    pipelineEntries: prev.pipelineEntries.map((pe) =>
                      pe.id === e.id
                        ? {
                            ...pe,
                            nextStep: value,
                            completedAt: null, // ✅ FIX
                            updatedAt: Date.now(),
                            activity: [
                              {
                                text: "Updated next step",
                                date: new Date().toISOString(),
                              },
                              ...(pe.activity || []),
                            ],
                          }
                        : pe
                    ),
                  }));
                }}
                placeholder="Next step..."
                style={{
                  marginTop: 8,
                  width: "100%",
                  fontSize: 13,
                  fontWeight: 500,

                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",

                  textDecoration: e.completedAt ? "line-through" : "none",
                  opacity: e.completedAt ? 0.7 : 1,
                }}
              />

              {/* DATE */}
              <input
                type="date"
                value={e.dueDate || ""}
                onClick={(evt) => evt.stopPropagation()}
                onChange={(evt) => {
                  const value = evt.target.value;

                  crm.setData((prev) => ({
                    ...prev,
                    pipelineEntries: prev.pipelineEntries.map((pe) =>
                      pe.id === e.id
                        ? {
                            ...pe,
                            dueDate: value,
                            updatedAt: Date.now(),
                            activity: [
                              {
                                text: "Updated due date",
                                date: new Date().toISOString(),
                              },
                              ...(pe.activity || []),
                            ],
                          }
                        : pe
                    ),
                  }));
                }}
                style={{ marginTop: 8, width: "100%" }}
              />

              {e.dueDate && new Date(e.dueDate) < new Date() && (
                <div
                  style={{
                    color: "white",
                    background: "#dc2626",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: 999,
                    display: "inline-block",
                    marginTop: 8,
                    letterSpacing: "0.04em",
                  }}
                >
                  OVERDUE
                </div>
              )}

              {isVeryStale && (
                <div
                  style={{
                    color: "#dc2626",
                    fontSize: 11,
                    fontWeight: 700,
                    marginTop: 4,
                  }}
                >
                  VERY STALE
                </div>
              )}

              {isStale && !isVeryStale && (
                <div
                  style={{
                    color: "#f59e0b",
                    fontSize: 11,
                    fontWeight: 700,
                    marginTop: 4,
                  }}
                >
                  STALE
                </div>
              )}

              {e.nextStep && !e.completedAt && (
                <button
                  style={{
                    marginTop: 8,
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: "1px solid #e2e8f0",
                    background: "#16a34a",
                    color: "white",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                  onClick={(evt) => {
                    evt.stopPropagation();

                    crm.setData((prev) => ({
                      ...prev,
                      pipelineEntries: prev.pipelineEntries.map((pe) =>
                        pe.id === e.id
                          ? {
                              ...pe,
                              owner: "",
                              dueDate: "",
                              completedAt: new Date().toISOString(),
                              activity: [
                                {
                                  text:
                                    "Completed task: " +
                                    (pe.nextStep || "Task"),
                                  date: new Date().toISOString(),
                                },
                                ...(pe.activity || []),
                              ],
                            }
                          : pe
                      ),
                    }));
                  }}
                >
                  Done ✓
                </button>
              )}

              {e.completedAt && (
                <button
                  style={{
                    marginTop: 8,
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: "1px solid #e2e8f0",
                    background: "#64748b",
                    color: "white",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                  onClick={(evt) => {
                    evt.stopPropagation();

                    crm.setData((prev) => ({
                      ...prev,
                      pipelineEntries: prev.pipelineEntries.map((pe) =>
                        pe.id === e.id
                          ? {
                              ...pe,
                              completedAt: null,
                              owner: currentUser,
                            }
                          : pe
                      ),
                    }));
                  }}
                >
                  Undo
                </button>
              )}

              {expandedEntryId === e.id && e.activity && e.activity.length > 0 && (
                <div
                  style={{
                    marginTop: 8,
                    borderTop: "1px solid #e2e8f0",
                    paddingTop: 6,
                    fontSize: 12,
                    color: "#64748b",
                  }}
                >
                  {e.activity.slice(0, 5).map((a, i) => (
                    <div key={i} style={{ marginBottom: 4 }}>
                      {a.text}{" "}
                      <span style={{ color: "#94a3b8", marginLeft: 4 }}>
                        — {new Date(a.date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  })}
</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <input
          style={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Pipeline name"
        />

        <select
          style={styles.input}
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="coinvest">Co-invest</option>
          <option value="fund">Fund</option>
          <option value="sma">SMA</option>
        </select>

        <button
          style={styles.primaryBtn}
          onClick={() => {
            if (!name) return;

            crm.add("pipelines", {
              name,
              type,
              dealId: "",
              staleDays: 3,
              veryStaleDays: 7,
              stages: PIPELINE_STAGE_TEMPLATES[type] || DEFAULT_STAGES,
            });
            setName("");
          }}
        >
          Create
        </button>
      </div>

      {crm.data.pipelines.map((p, i) => (
        <div
  key={p.id || `pipeline-${i}`}
  style={{
    ...styles.card,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
  }}
>
  <div
    onClick={() => setSelected(p.id)}
    style={{ display: "flex", flexDirection: "column" }}
  >
    <div style={{ fontWeight: 500 }}>{p.name}</div>

    <div
      style={{
        fontSize: 11,
        color: "#64748b",
        marginTop: 2,
      }}
    >
      {p.type === "coinvest" ? "Co-invest" : "Fund"}
    </div>
  </div>

  <button
    style={{
      background: "#ef4444",
      color: "white",
      border: "none",
      padding: "6px 10px",
      borderRadius: 6,
      cursor: "pointer",
      fontSize: 12,
    }}
    onClick={(e) => {
      e.stopPropagation();

      if (!window.confirm("Delete this pipeline?")) return;

      crm.setData((prev) => ({
        ...prev,
        pipelines: prev.pipelines.filter((pl) => pl.id !== p.id),
        pipelineEntries: prev.pipelineEntries.filter(
          (e) => e.pipelineId !== p.id
        ),
      }));
    }}
  >
    Delete
  </button>
</div>
      ))}
    </div>
  );
}

function Tasks({ crm, setPage, currentUser, setSelectedCompanyId }) {
  const myName = currentUser;

  const allTasks = crm.data.pipelineEntries.filter(
    (e) => e.owner === myName && !e.completedAt
  );

  const overdue = allTasks
    .filter((e) => e.dueDate && new Date(e.dueDate) < new Date())
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  const upcoming = allTasks
    .filter((e) => !e.dueDate || new Date(e.dueDate) >= new Date())
    .sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });

  return (
    <div style={styles.page}>
      <h2>My Tasks</h2>

      {/* COMPLETED TODAY */}
      {crm.data.pipelineEntries
        .filter(
          (e) =>
            e.completedAt &&
            new Date(e.completedAt).toDateString() ===
              new Date().toDateString()
        )
        .length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ color: "#16a34a" }}>Completed Today</h3>

          {crm.data.pipelineEntries
            .filter(
              (e) =>
                e.completedAt &&
                new Date(e.completedAt).toDateString() ===
                  new Date().toDateString()
            )
            .map((e, i) => {
              const company = crm.data.companies.find(
                (c) => c.id === e.companyId
              );

              return (
                <div
                  key={e.id || `pipeline-entry-${i}`}
                  style={{
                    ...styles.card,
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    opacity: 0.85,
                  }}
                >
                  <strong>{company?.name}</strong>

                  <div style={{ textDecoration: "line-through" }}>
                    {e.nextStep}
                  </div>

                  <div style={{ fontSize: 12, color: "#16a34a" }}>
                    Completed
                  </div>

                  <button
                    style={{ marginTop: 6 }}
                    onClick={() => {
                      crm.setData((prev) => ({
                        ...prev,
                        pipelineEntries: prev.pipelineEntries.map((pe) =>
                          pe.id === e.id
                            ? {
                                ...pe,
                                completedAt: null,
                                owner: currentUser,
                              }
                            : pe
                        ),
                      }));
                    }}
                  >
                    Undo
                  </button>
                </div>
              );
            })}
        </div>
      )}

      {/* EMPTY STATE */}
      {overdue.length === 0 && upcoming.length === 0 && (
        <div>No tasks</div>
      )}

      {/* OVERDUE */}
      {overdue.length > 0 && (
        <>
          <h3 style={{ color: "red" }}>Overdue</h3>

          {overdue.map((e, i) => {
            const company = crm.data.companies.find(
              (c) => c.id === e.companyId
            );

            return (
              <div
                key={e.id || `pipeline-entry-${i}`}
                onClick={() => {
                  setSelectedCompanyId(e.companyId);
                  setPage("Companies");
                }}
                style={{
                  ...styles.card,
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  cursor: "pointer",
                }}
              >
                <strong>{company?.name}</strong>
                <div>{e.nextStep}</div>

                <div style={{ fontSize: 12 }}>
                  Due: {e.dueDate}
                </div>

                <button
                  style={{ marginTop: 8 }}
                  onClick={(evt) => {
                    evt.stopPropagation();

                    crm.setData((prev) => ({
                      ...prev,
                      pipelineEntries: prev.pipelineEntries.map((pe) =>
                        pe.id === e.id
                          ? {
                              ...pe,
                              owner: "",
                              dueDate: "",
                              completedAt: new Date().toISOString(),
                              activity: [
                                {
                                  text:
                                    "Completed task: " +
                                    (pe.nextStep || "Task"),
                                  date: new Date().toISOString(),
                                },
                                ...(pe.activity || []),
                              ],
                            }
                          : pe
                      ),
                    }));
                  }}
                >
                  Done ✓
                </button>
              </div>
            );
          })}
        </>
      )}

      {/* ALL TASKS */}
      <h3 style={{ marginTop: 20 }}>All Tasks</h3>

      {upcoming.map((e, i) => {
        const company = crm.data.companies.find(
          (c) => c.id === e.companyId
        );

        return (
          <div
            key={e.id || `pipeline-entry-${i}`}
            onClick={() => {
              setSelectedCompanyId(e.companyId);
              setPage("Companies");
            }}
            style={{ ...styles.card, cursor: "pointer" }}
          >
            <strong>{company?.name}</strong>
            <div>{e.nextStep}</div>

            <div style={{ fontSize: 12 }}>
              Due: {e.dueDate || "None"}
            </div>

            <button
              style={{ marginTop: 8 }}
              onClick={(evt) => {
                evt.stopPropagation();

                crm.setData((prev) => ({
                  ...prev,
                  pipelineEntries: prev.pipelineEntries.map((pe) =>
                    pe.id === e.id
                      ? {
                          ...pe,
                          owner: "",
                          dueDate: "",
                          completedAt: new Date().toISOString(),
                          activity: [
                            {
                              text:
                                "Completed task: " +
                                (pe.nextStep || "Task"),
                              date: new Date().toISOString(),
                            },
                            ...(pe.activity || []),
                          ],
                        }
                      : pe
                  ),
                }));
              }}
            >
              Done ✓
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- APP ---------------- */

export default function App() {
  const [deals, setDeals] = useState([]);

  useEffect(() => {
    const loadDeals = async () => {
      const { data, error } = await supabase
        .from("deals")
        .select("*");

      if (!error) {
        const fixed = (data || []).map((d) => ({
          ...d,
          id: String(d.id),
        }));

        console.log("LOADED DEALS:", fixed);
        setDeals(fixed);
      } else {
        console.error("LOAD DEALS ERROR:", error);
      }
    };

    loadDeals();

    const channel = supabase
      .channel("deals-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "deals" },
        (payload) => {
          console.log("REALTIME EVENT:", payload);
          loadDeals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const crm = useCRM();
  const [page, setPage] = useState("Dashboard");
  const [currentUser, setCurrentUser] = useState(null);
  const [authUser, setAuthUser] = useState("");
  const [authPass, setAuthPass] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [tagFilter, setTagFilter] = useState([]);
  const [sortField, setSortField] = useState("");
  const [sortDir, setSortDir] = useState("asc");
  const [selectedDealId, setSelectedDealId] = useState(null);
  const selectedDeal = deals.find((d) => d.id === selectedDealId);
  const [selectedPipelineId, setSelectedPipelineId] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchIndex, setSearchIndex] = useState(0);

  const q = search.trim().toLowerCase();

const searchResults = q
  ? [
      ...crm.data.companies
  .filter((c) => c.name.toLowerCase().includes(q))
  .map((c) => ({
    type: "Company",
    label: c.name,
    page: "Companies",
    id: c.id,
  })),

      ...crm.data.contacts
        .filter((c) =>
          (c.name || "").toLowerCase().includes(q) ||
          (c.email || "").toLowerCase().includes(q)
        )
        .map((c) => ({
  type: "Contact",
  label: c.name || c.email,
  page: "Contacts",
  id: c.id,
  companyId: c.companyId,
})),

      ...deals
        .filter((d) => (d.name || "").toLowerCase().includes(q))
        .map((d) => ({
          type: "Deal",
          label: d.name,
          page: "Deals",
          id: d.id, 
          companyId: d.companyId,
        })),
    ].slice(0, 10)
  : [];
    
    if (!isAuthed) {
    return (
      <div style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8fafc",
        fontFamily: "Inter, system-ui"
      }}>
        <div style={{
          background: "white",
          padding: 30,
          borderRadius: 10,
          width: 300,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
        }}>
          <div style={{ fontWeight: 600, marginBottom: 12 }}>Login</div>

          <select
            value={authUser}
            onChange={(e) => setAuthUser(e.target.value)}
            style={{ ...styles.input, marginBottom: 10 }}
          >
            <option value="">Select user</option>
            <option value="Seth">Seth</option>
            <option value="David">David</option>
          </select>

          <input
            type="password"
            placeholder="Password"
            value={authPass}
            onChange={(e) => setAuthPass(e.target.value)}
            style={{ ...styles.input, marginBottom: 10 }}
          />

          <button
            style={{ ...styles.primaryBtn, width: "100%" }}
            onClick={() => {
              const passwords = {
                Seth: "seth123",
                David: "david123",
              };

              if (passwords[authUser] === authPass) {
                setCurrentUser(authUser);
                setIsAuthed(true);
              } else {
                alert("Wrong password");
              }
            }}
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
      <div style={styles.layout}>
      <Sidebar
        page={page}
        setPage={setPage}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        setSelectedCompanyId={setSelectedCompanyId}
        setSelectedContactId={setSelectedContactId}
        setSelectedDealId={setSelectedDealId}
      />
    <div style={styles.main}>
      <div>

    <div style={{ padding: "20px 40px 0", marginBottom: 12 }}>
      <input
        style={styles.searchInput}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setSearchOpen(true);
          setSearchIndex(0);
        }}
        onFocus={() => setSearchOpen(true)}
        onKeyDown={(e) => {
          if (!searchResults.length) return;

          if (e.key === "ArrowDown") {
            e.preventDefault();
            setSearchIndex((prev) =>
              prev < searchResults.length - 1 ? prev + 1 : prev
            );
          }

          if (e.key === "ArrowUp") {
            e.preventDefault();
            setSearchIndex((prev) => (prev > 0 ? prev - 1 : 0));
          }

          if (e.key === "Enter") {
            const item = searchResults[searchIndex];

            if (item.type === "Contact") {
              setSelectedContactId(item.id);
            }

            if (item.type === "Company") {
              setSelectedCompanyId(item.id);
            }

            if (item.type === "Deal") {
              setSelectedDealId(item.id);
            }

            setPage(item.page);

            setSearch("");
            setSearchOpen(false);
          }
        }}
        placeholder="Search companies, contacts, deals..."
      />
    </div>

    {searchOpen && search.trim() && (
      <div style={styles.searchDropdown}>
  {searchResults.length === 0 ? (
    <div style={styles.searchEmpty}>No results</div>
  ) : (
    (() => {
  const grouped = {
    Company: [],
    Contact: [],
    Deal: [],
  };

  searchResults.forEach((item) => {
    if (grouped[item.type]) {
      grouped[item.type].push(item);
    }
  });

  const renderGroup = (label, items) => {
    if (!items.length) return null;

    return (
      <div key={label} style={{ marginBottom: 8 }}>
        <div
          style={{
            padding: "8px 12px",
            fontSize: 11,
            fontWeight: 700,
            color: "#475569",
            background: "#f1f5f9",
            borderTop: "1px solid #e2e8f0",
            letterSpacing: "0.05em",
          }}
        >
          {label}
        </div>

        {items.map((item, i) => (
          <div
            key={label + i}
            style={{
              padding: "10px 12px",
              borderBottom: "1px solid #f1f5f9",
              cursor: "pointer",
              background:
                searchResults[searchIndex] === item
                  ? "#e2e8f0"
                  : "white",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={() => {
              if (item.type === "Contact") {
                setSelectedContactId(item.id);
              }

              if (item.type === "Company") {
                setSelectedCompanyId(item.id);
              }

              if (item.type === "Deal") {
                setSelectedDealId(item.id);
              }

              setPage(item.page);

              setSearch("");
              setSearchOpen(false);
            }}
          >
            <>
  <div style={{ fontSize: 14, fontWeight: 500 }}>
    {item.label}
  </div>

  {item.type === "Contact" && item.companyId && (
    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
      {
        crm.data.companies.find(
          (c) => String(c.id) === String(item.companyId)
        )?.name
      }
    </div>
  )}

  {item.type === "Deal" && item.companyId && (
    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
      {
        crm.data.companies.find(
          (c) => String(c.id) === String(item.companyId)
        )?.name
      }
    </div>
  )}
</>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      {renderGroup("Companies", grouped.Company)}
      {renderGroup("Contacts", grouped.Contact)}
      {renderGroup("Deals", grouped.Deal)}
    </>
  );
})()
  )}
</div>
    )}
  </div>

 {page === "Dashboard" && (
    <Dashboard
      crm={crm}
      deals={deals}
      currentUser={currentUser}
      setPage={setPage}
      setSelectedCompanyId={setSelectedCompanyId}
    />
  )}
  {page === "Companies" && (
  <Companies
    crm={crm}
    selectedCompanyId={selectedCompanyId}
    setSelectedCompanyId={setSelectedCompanyId}
    setPage={setPage}
    setSelectedDealId={setSelectedDealId}
    setSelectedPipelineId={setSelectedPipelineId}
  />
)}
  {page === "Contacts" && (
  <Contacts
    crm={crm}
    selectedContactId={selectedContactId}
    setSelectedContactId={setSelectedContactId}
    setPage={setPage}
    setSelectedCompanyId={setSelectedCompanyId}
    tagFilter={tagFilter}
    setTagFilter={setTagFilter}
    sortField={sortField}
    setSortField={setSortField}
    sortDir={sortDir}
    setSortDir={setSortDir}
    />
)}
  {page === "Deals" && (
    <Deals
      crm={crm}
      deals={deals}
      setDeals={setDeals}
      selectedDealId={selectedDealId}
      setSelectedDealId={setSelectedDealId}
      setPage={setPage}
      setSelectedCompanyId={setSelectedCompanyId}
      setSelectedPipelineId={setSelectedPipelineId}
    />
  )}
  {page === "Pipelines" && (
  <Pipelines
    crm={crm}
    setPage={setPage}
    setSelectedCompanyId={setSelectedCompanyId}
    setSelectedDealId={setSelectedDealId}
    selectedPipelineId={selectedPipelineId}
    setSelectedPipelineId={setSelectedPipelineId}
    currentUser={currentUser}
    tagFilter={tagFilter}
    setTagFilter={setTagFilter}
  />
)}
  {page === "Tasks" && (
    <Tasks
  crm={crm}
  setPage={setPage}
  currentUser={currentUser}
  setSelectedCompanyId={setSelectedCompanyId}
/>
  )}
    </div> {/* padding wrapper */}
    </div>
  );
}

const supabase = createClient(
  "https://nddshaawggxubnlqqniy.supabase.co",
  "sb_publishable_6h3oWLcgYbeXsndsrsDHYg_zEaqiM2i"
);

const styles = {
  layout: { display: "flex", height: "100vh", fontFamily: "Inter, system-ui" },
  sidebar: { width: 240, background: "#0f172a", color: "white", padding: 24 },
  logo: { fontSize: 18, fontWeight: 600, marginBottom: 30 },
  navItem: { padding: "10px 12px", borderRadius: 8, cursor: "pointer", marginBottom: 6 },
  main: { flex: 1,  background: "#f8fafc",  overflowY: "auto",  },
  page: {
  maxWidth: 1100,
  margin: "0 auto",
  padding: "20px",
  width: "100%",
  boxSizing: "border-box",
},
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 600 },
  card: { background: "white", borderRadius: 12, padding: 20, marginBottom: 20 },
  input: {
    width: "100%",
    padding: "8px 10px",
    fontSize: 13,
    border: "1px solid #e2e8f0",
    borderRadius: 6,
    outline: "none",
    boxSizing: "border-box",
  },
  primaryBtn: { padding: "10px 16px", background: "#2563eb", color: "white", border: "none", borderRadius: 8 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "10px", fontSize: 12, color: "#64748b", borderBottom: "1px solid #e2e8f0" },
  td: { padding: "12px 10px", borderBottom: "1px solid #f1f5f9" },
  pipelineItem: { padding: "10px 0", borderBottom: "1px solid #f1f5f9" },
  pipelineSub: { fontSize: 12, color: "#64748b" },
  hoverCard: {  cursor: "pointer",  transition: "0.15s",},
  hoverRow: { cursor: "pointer",  transition: "0.15s",},
  inputFocus: { border: "1px solid #3b82f6",},
};