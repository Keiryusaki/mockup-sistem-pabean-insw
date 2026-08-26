import type { DocumentConfigFile, FormStepCatalogItem } from "./types";

function duplicateValues(values: number[]) {
  const seen = new Set<number>();
  return values.filter((value) => seen.size === seen.add(value).size);
}

export function validateFormOverrides(config: DocumentConfigFile, catalog: FormStepCatalogItem[]) {
  const errors: string[] = [];
  const documentIds = config.documents.map((document) => document.id);
  const duplicateDocumentIds = documentIds.filter((id, index) => documentIds.indexOf(id) !== index);
  if (duplicateDocumentIds.length) errors.push(`ID dokumen duplikat: ${[...new Set(duplicateDocumentIds)].join(", ")}.`);

  const stepById = new Map(catalog.map((step) => [step.id, step]));
  config.documents.forEach((document) => {
    Object.entries(document.steps ?? {}).forEach(([stepId, stepOverride]) => {
      const step = stepById.get(stepId);
      if (!step) {
        errors.push(`${document.id}: step ${stepId} tidak ditemukan pada base mapping.`);
        return;
      }
      Object.entries(stepOverride.sections ?? {}).forEach(([sectionId, sectionOverride]) => {
        const section = step.sections.find((item) => item.id === sectionId);
        if (!section) {
          errors.push(`${document.id}: section ${stepId}/${sectionId} tidak ditemukan pada base mapping.`);
          return;
        }
        Object.keys(sectionOverride.fields ?? {}).forEach((fieldId) => {
          if (!section.fields.some((field) => field.id === fieldId)) errors.push(`${document.id}: field ${stepId}/${sectionId}/${fieldId} tidak ditemukan pada base mapping.`);
        });
        const duplicateFieldOrders = duplicateValues(Object.values(sectionOverride.fields ?? {}).flatMap((field) => Number.isFinite(field.order) ? [field.order as number] : []));
        if (duplicateFieldOrders.length) errors.push(`${document.id}: urutan field duplikat pada ${sectionId}: ${[...new Set(duplicateFieldOrders)].join(", ")}.`);
      });
      const duplicateSectionOrders = duplicateValues(Object.values(stepOverride.sections ?? {}).flatMap((section) => Number.isFinite(section.order) ? [section.order as number] : []));
      if (duplicateSectionOrders.length) errors.push(`${document.id}: urutan section duplikat pada ${stepId}: ${[...new Set(duplicateSectionOrders)].join(", ")}.`);
    });
    const duplicateStepOrders = duplicateValues(Object.values(document.steps ?? {}).flatMap((step) => Number.isFinite(step.order) ? [step.order as number] : []));
    if (duplicateStepOrders.length) errors.push(`${document.id}: urutan step duplikat: ${[...new Set(duplicateStepOrders)].join(", ")}.`);
  });

  return errors;
}

export function assertValidFormOverrides(config: DocumentConfigFile, catalog: FormStepCatalogItem[]) {
  const errors = validateFormOverrides(config, catalog);
  if (errors.length) throw new Error(`Override tidak valid. ${errors.slice(0, 4).join(" ")}`);
}
