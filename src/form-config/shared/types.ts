export type FormDomain = "IMPORT" | "EXPORT";

export type DocumentTypeId = "ALL" | "BC20" | "BC23" | "BC27" | "BC16" | "OTHER" | (string & {});

export type FormFieldCatalogItem = {
  id: string;
  label: string;
  required?: boolean;
  inputType?: "text" | "number" | "date" | "select" | "radio" | "checkbox" | "alert" | "textarea";
  documentTypes?: string[];
  groupId?: string;
  defaultValue?: string;
  readOnly?: boolean;
  condition?: string;
  options?: Array<{ label: string; value: string }>;
  documentOverrides?: Record<string, {
    label?: string;
    inputType?: FormFieldCatalogItem["inputType"];
    readOnly?: boolean;
    required?: boolean;
  }>;
};

export type FormGroupCatalogItem = {
  id: string;
  label: string;
  description?: string;
};

export type FormSectionCatalogItem = {
  id: string;
  label: string;
  description?: string;
  documentTypes?: string[];
  fields: FormFieldCatalogItem[];
  groups?: FormGroupCatalogItem[];
  presentation?: "inline" | "modal";
  parentSectionId?: string;
};

export type FormStepCatalogItem = {
  id: string;
  label: string;
  description: string;
  sections: FormSectionCatalogItem[];
};

export type FieldOverride = {
  enabled?: boolean;
  required?: boolean;
  label?: string;
  order?: number;
  helperText?: string;
};

export type SectionOverride = {
  enabled?: boolean;
  label?: string;
  description?: string;
  order?: number;
  fields?: Record<string, FieldOverride>;
};

export type StepOverride = {
  enabled?: boolean;
  label?: string;
  order?: number;
  sections?: Record<string, SectionOverride>;
};

export type DocumentFormConfig = {
  id: DocumentTypeId;
  label: string;
  description?: string;
  archived?: boolean;
  defaultRequiresQuarantine: boolean;
  steps?: Record<string, StepOverride>;
};

export type DocumentConfigFile = {
  version: number;
  documents: DocumentFormConfig[];
};

export type ResolvedFieldConfig = FormFieldCatalogItem & {
  enabled: boolean;
  required: boolean;
  order: number;
  helperText?: string;
};

export type ResolvedSectionConfig = Omit<FormSectionCatalogItem, "fields"> & {
  enabled: boolean;
  order: number;
  fields: ResolvedFieldConfig[];
};

export type ResolvedStepConfig = Omit<FormStepCatalogItem, "sections"> & {
  enabled: boolean;
  order: number;
  sections: ResolvedSectionConfig[];
};
