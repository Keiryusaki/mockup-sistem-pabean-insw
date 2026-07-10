import { useState } from "react";
import { pdfExamples, usageGuides } from "./dashboardData";
import { DashboardGuides, DashboardPdfExamples } from "./DashboardPanels";

export function DashboardResourcesSection() {
  const [query, setQuery] = useState("");
  const filteredPdfExamples = pdfExamples.filter((item) => {
    const haystack = `${item.title} ${item.file} ${item.note}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  return (
    <>
      <DashboardGuides items={usageGuides} />
      <DashboardPdfExamples items={filteredPdfExamples} query={query} onQueryChange={setQuery} />
    </>
  );
}
