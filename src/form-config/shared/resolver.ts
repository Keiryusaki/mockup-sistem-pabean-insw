import type {
  DocumentConfigFile,
  DocumentFormConfig,
  FieldOverride,
  FormStepCatalogItem,
  ResolvedSectionConfig,
  ResolvedStepConfig,
  SectionOverride,
  StepOverride,
} from "./types";

export function cloneConfigFile(config: DocumentConfigFile): DocumentConfigFile {
  return JSON.parse(JSON.stringify(config)) as DocumentConfigFile;
}

export function getDocumentConfig(configFile: DocumentConfigFile, id: string): DocumentFormConfig {
  return configFile.documents.find((document) => document.id === id && !document.archived)
    ?? configFile.documents[0];
}

export function resolveDocumentSteps(document: DocumentFormConfig, catalog: FormStepCatalogItem[]): ResolvedStepConfig[] {
  return catalog
    .map((step, stepIndex) => {
      const stepOverride: StepOverride = document.steps?.[step.id] ?? {};
      const sections: ResolvedSectionConfig[] = step.sections
        .map((section, sectionIndex) => {
          const sectionOverride: SectionOverride = stepOverride.sections?.[section.id] ?? {};
          const sectionApplicable = document.id === "ALL" || !section.documentTypes?.length || section.documentTypes.includes(document.id);
          const resolvedFields = section.fields
            .map((field, fieldIndex) => {
              const fieldOverride: FieldOverride = sectionOverride.fields?.[field.id] ?? {};
              const documentBaseOverride = field.documentOverrides?.[document.id] ?? {};
              const applicable = document.id === "ALL" || !field.documentTypes?.length || field.documentTypes.includes(document.id);
              return {
                ...field,
                ...documentBaseOverride,
                label: fieldOverride.label?.trim() || documentBaseOverride.label?.trim() || field.label,
                enabled: fieldOverride.enabled ?? applicable,
                required: fieldOverride.required ?? documentBaseOverride.required ?? Boolean(field.required),
                order: fieldOverride.order ?? fieldIndex,
                helperText: fieldOverride.helperText?.trim() || undefined,
              };
            })
            .sort((left, right) => left.order - right.order);
          const applicableSection = sectionApplicable && (section.fields.length === 0 || resolvedFields.some((field) => field.enabled));
          return {
            ...section,
            label: sectionOverride.label?.trim() || section.label,
            description: sectionOverride.description?.trim() || section.description,
            enabled: applicableSection && sectionOverride.enabled !== false,
            order: sectionOverride.order ?? sectionIndex,
            fields: resolvedFields,
          };
        })
        .sort((left, right) => left.order - right.order);

      return {
        ...step,
        label: stepOverride.label?.trim() || step.label,
        enabled: sections.some((section) => section.enabled) && stepOverride.enabled !== false,
        order: stepOverride.order ?? stepIndex,
        sections,
      };
    })
    .sort((left, right) => left.order - right.order);
}
