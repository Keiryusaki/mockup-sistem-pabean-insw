import { FormConfigurationDrawer } from "../shared/FormConfigurationDrawer";
import { cloneConfigFile } from "../shared/resolver";
import type { DocumentConfigFile } from "../shared/types";
import { importFormCatalog } from "./import-catalog";
import {
  publishImportConfig,
  clearImportConfigDraft,
  initialImportConfigFile,
  writeImportConfigDraft,
} from "./import-config";
import { loadPublishedFormConfig } from "../shared/config-provider";
import { assertValidFormOverrides } from "../shared/validation";

type Props = {
  open: boolean;
  configFile: DocumentConfigFile;
  documentId: string;
  onChange: (config: DocumentConfigFile) => void;
  onDocumentChange: (id: string) => void;
  onClose: () => void;
  onMessage: (message: string) => void;
  allowLocalDraft: boolean;
};

export function ImportConfigurationDrawer({ open, configFile, documentId, onChange, onDocumentChange, onClose, onMessage, allowLocalDraft }: Props) {
  const resetToPublished = async () => {
    clearImportConfigDraft();
    const result = await loadPublishedFormConfig("IMPORT", initialImportConfigFile);
    assertValidFormOverrides(result.config, importFormCatalog);
    onChange(cloneConfigFile(result.config));
    if (!result.config.documents.some((document) => document.id === documentId && !document.archived)) onDocumentChange("BC20");
    onMessage(result.source === "remote" ? `Draft dibatalkan. Konfigurasi Impor revision ${result.revision} dimuat ulang.` : "Draft dibatalkan. Konfigurasi fallback digunakan karena endpoint tidak tersedia.");
  };

  return (
    <FormConfigurationDrawer
      open={open}
      configFile={configFile}
      documentId={documentId}
      onChange={onChange}
      onDocumentChange={onDocumentChange}
      onClose={onClose}
      onMessage={onMessage}
      allowLocalDraft={allowLocalDraft}
      catalog={importFormCatalog}
      title="Kelola Konfigurasi Form Impor"
      allowDocumentManagement
      onSaveDraft={writeImportConfigDraft}
      onReset={resetToPublished}
      onApply={publishImportConfig}
    />
  );
}
