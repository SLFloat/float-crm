import { useRef, useState } from "react";
import { useApp, CsvContactRow } from "@/lib/data-context";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, FileText, CheckCircle2, AlertCircle, X } from "lucide-react";

type ParseResult = { rows: CsvContactRow[]; skippedEmpty: number };

function parseCSV(text: string): ParseResult {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length < 2) return { rows: [], skippedEmpty: 0 };

  const header = splitCsvLine(lines[0]).map((h) => h.toLowerCase().trim().replace(/[^a-z]/g, ""));

  const colIndex = (candidates: string[]) =>
    candidates.reduce<number>((found, c) => (found !== -1 ? found : header.indexOf(c)), -1);

  const nameIdx    = colIndex(["name", "fullname", "contactname"]);
  const emailIdx   = colIndex(["email", "emailaddress"]);
  const phoneIdx   = colIndex(["phone", "phonenumber", "mobile", "tel"]);
  const companyIdx = colIndex(["company", "companyname", "organisation", "organization", "employer"]);
  const titleIdx   = colIndex(["title", "jobtitle", "position"]);

  const rows: CsvContactRow[] = [];
  let skippedEmpty = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    const name = nameIdx !== -1 ? cols[nameIdx]?.trim() : cols[0]?.trim();
    if (!name) { skippedEmpty++; continue; }
    rows.push({
      name,
      email:   emailIdx   !== -1 ? cols[emailIdx]?.trim()   ?? "" : "",
      phone:   phoneIdx   !== -1 ? cols[phoneIdx]?.trim()   ?? "" : "",
      company: companyIdx !== -1 ? cols[companyIdx]?.trim() ?? "" : "",
      title:   titleIdx   !== -1 ? cols[titleIdx]?.trim()   ?? "" : "",
    });
  }

  return { rows, skippedEmpty };
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

type Status = "idle" | "parsed" | "done" | "error";

export function CsvImport() {
  const { importContacts } = useApp();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [fileName, setFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStatus("idle");
    setParsed(null);
    setResult(null);
    setFileName("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFile = (file: File) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parseResult = parseCSV(text);
        if (parseResult.rows.length === 0) {
          setStatus("error");
        } else {
          setParsed(parseResult);
          setStatus("parsed");
        }
      } catch (err) {
        console.error("CSV parse error:", err);
        setStatus("error");
      }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!parsed) return;
    const res = importContacts(parsed.rows);
    setResult(res);
    setStatus("done");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); setOpen(v); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2" data-testid="button-import-csv">
          <Upload className="w-4 h-4" />
          Import CSV
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Contacts from CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {status === "idle" && (
            <>
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-muted/30 transition-colors"
                onClick={() => inputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                data-testid="csv-drop-zone"
              >
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium">Drop a CSV file here, or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">Accepts .csv files</p>
              </div>

              <div className="bg-muted/40 rounded-lg p-4 space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Supported columns</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-muted-foreground mt-1">
                  <span><span className="font-mono bg-muted px-1 rounded">Name</span> (required)</span>
                  <span><span className="font-mono bg-muted px-1 rounded">Email</span></span>
                  <span><span className="font-mono bg-muted px-1 rounded">Phone</span></span>
                  <span><span className="font-mono bg-muted px-1 rounded">Company</span></span>
                  <span><span className="font-mono bg-muted px-1 rounded">Title</span></span>
                </div>
              </div>

              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                data-testid="input-csv-file"
              />
            </>
          )}

          {status === "parsed" && parsed && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/20">
                <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{fileName}</p>
                  <p className="text-xs text-muted-foreground">{parsed.rows.length} contacts ready to import</p>
                </div>
                <button onClick={reset} className="text-muted-foreground hover:text-foreground flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="border rounded-lg overflow-hidden max-h-52 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Name</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Email</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Company</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {parsed.rows.map((row, i) => (
                      <tr key={i} className="bg-card">
                        <td className="px-3 py-1.5 font-medium">{row.name}</td>
                        <td className="px-3 py-1.5 text-muted-foreground truncate max-w-[120px]">{row.email || "—"}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{row.company || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {parsed.skippedEmpty > 0 && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {parsed.skippedEmpty} empty rows will be skipped
                </p>
              )}

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={reset}>Choose different file</Button>
                <Button className="flex-1 gap-2" onClick={handleImport} data-testid="button-confirm-import">
                  <Upload className="w-4 h-4" />
                  Import {parsed.rows.length} contacts
                </Button>
              </div>
            </div>
          )}

          {status === "done" && result && (
            <div className="text-center py-6 space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <div>
                <p className="text-lg font-semibold">Import complete</p>
                <p className="text-muted-foreground text-sm mt-1">
                  {result.imported} {result.imported === 1 ? "contact" : "contacts"} imported successfully
                  {result.skipped > 0 && ` · ${result.skipped} skipped`}
                </p>
              </div>
              <Button
                className="w-full"
                onClick={() => { reset(); setOpen(false); }}
                data-testid="button-close-import"
              >
                Done
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="text-center py-6 space-y-4">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
              <div>
                <p className="text-lg font-semibold">Could not parse file</p>
                <p className="text-muted-foreground text-sm mt-1">
                  Make sure the file is a valid CSV with a header row and at least a Name column.
                </p>
              </div>
              <Button variant="outline" className="w-full" onClick={reset}>Try again</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
