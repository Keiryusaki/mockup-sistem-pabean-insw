export type ExportDocumentId =
  | "EXP_BC30"
  | "EXP_KEK_TLDDP"
  | "EXP_KEK_LDP"
  | "EXP_KEK_FASILITAS"
  | "EXP_PKBE"
  | "EXP_SURVEYOR";

export type ExportStepId =
  | "pengajuan"
  | "entitas"
  | "dokumen"
  | "kemasan"
  | "barang"
  | "karantina"
  | "surveyor";

export type NormalizedExportInputType =
  | "text"
  | "number"
  | "date"
  | "select"
  | "checkbox";

export type ExportFieldDocumentOverride = {
  label?: string;
  inputType?: NormalizedExportInputType;
  readOnly?: boolean;
  required?: boolean;
};

export type ExportSourceField = {
  id: string;
  dataKey: string;
  label: string;
  inputType: NormalizedExportInputType;
  readOnly: boolean;
  required: boolean;
  documents: ExportDocumentId[];
  documentOverrides: Partial<Record<ExportDocumentId, ExportFieldDocumentOverride>>;
  labelNote?: string;
  options?: Array<{ label: string; value: string }>;
  sourceRule?: string;
  sourceSheet: string;
  sourceRow: number;
};

export type ExportSourceSection = {
  id: string;
  label: string;
  description: string;
  sourceTable?: string;
  repeatable: boolean;
  relation?: {
    parentSectionId: string;
    foreignKey: string;
    label: string;
  };
  fields: ExportSourceField[];
};

export type ExportSourceStep = {
  id: ExportStepId;
  label: string;
  condition?: "requiresQuarantine";
  sections: ExportSourceSection[];
};

export type ExportSourceMappingFile = {
  version: number;
  domain: "EXPORT";
  source: {
    workbook: string;
    sourceModifiedAt: string;
    totalFields: number;
    totalSections: number;
  };
  documents: Array<{
    id: ExportDocumentId;
    sourceCode: string;
    label: string;
    description?: string;
  }>;
  steps: ExportSourceStep[];
};
