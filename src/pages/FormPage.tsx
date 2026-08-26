import { Suspense, lazy, useState } from "react";
import type { FormDomain } from "../form-config/shared/types";

const ImportFormWorkspace = lazy(() =>
  import("./form/import/ImportFormWorkspace").then((module) => ({ default: module.ImportFormWorkspace })),
);
const ExportFormWorkspace = lazy(() =>
  import("./form/export/ExportFormWorkspace").then((module) => ({ default: module.ExportFormWorkspace })),
);

const FORM_DOMAIN_STORAGE_KEY = "insw-form-domain";

export function FormPage() {
  const [domain, setDomain] = useState<FormDomain>(() => {
    const stored = window.sessionStorage.getItem(FORM_DOMAIN_STORAGE_KEY);
    return stored === "EXPORT" ? "EXPORT" : "IMPORT";
  });

  const handleDomainChange = (nextDomain: FormDomain) => {
    window.sessionStorage.setItem(FORM_DOMAIN_STORAGE_KEY, nextDomain);
    setDomain(nextDomain);
  };

  const Workspace = domain === "EXPORT" ? ExportFormWorkspace : ImportFormWorkspace;
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-[1480px] px-4 py-8">
          <div className="rounded-2xl border border-border-primary bg-white p-6 text-[13px] text-neutral-600 shadow-sm">
            Menyiapkan form {domain === "EXPORT" ? "ekspor" : "impor"}...
          </div>
        </div>
      }
    >
      <Workspace onDomainChange={handleDomainChange} />
    </Suspense>
  );
}
