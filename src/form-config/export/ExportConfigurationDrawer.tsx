import { FormConfigurationDrawer } from "../shared/FormConfigurationDrawer";
import {
  publishExportConfig,
  clearExportConfigDraft,
  cloneExportConfig,
  createExportFormCatalog,
  initialExportConfigFile,
  writeExportConfigDraft,
} from "./export-config";
import type { ExportDocumentId, ExportSourceMappingFile } from "./export-mapping-types";
import type { DocumentConfigFile } from "../shared/types";
import { assertValidFormOverrides } from "../shared/validation";
import { loadPublishedFormConfig } from "../shared/config-provider";

type Props = {
  open: boolean;
  configFile: DocumentConfigFile;
  sourceMapping: ExportSourceMappingFile;
  documentId: ExportDocumentId;
  onDocumentChange: (documentId: ExportDocumentId) => void;
  onChange: (config: DocumentConfigFile) => void;
  onClose: () => void;
  onMessage: (message: string) => void;
  allowLocalDraft: boolean;
};

export function ExportConfigurationDrawer({ open, configFile, sourceMapping, documentId, onDocumentChange, onChange, onClose, onMessage, allowLocalDraft }: Props) {
  const catalog = createExportFormCatalog(sourceMapping);
  const resetToPublished = async () => {
    clearExportConfigDraft();
    const result = await loadPublishedFormConfig("EXPORT", initialExportConfigFile);
    assertValidFormOverrides(result.config, catalog);
    onChange(cloneExportConfig(result.config));
    onMessage(result.source === "remote" ? `Draft dibatalkan. Konfigurasi Ekspor revision ${result.revision} dimuat ulang.` : "Draft dibatalkan. Konfigurasi fallback digunakan karena endpoint tidak tersedia.");
  };

  return (
    <FormConfigurationDrawer
      open={open}
      configFile={configFile}
      documentId={documentId}
      onChange={onChange}
      onDocumentChange={(id) => onDocumentChange(id as ExportDocumentId)}
      onClose={onClose}
      onMessage={onMessage}
      allowLocalDraft={allowLocalDraft}
      catalog={catalog}
      title="Kelola Konfigurasi Form Ekspor"
      contextLabel="Development tool · override ekspor"
      allowDocumentManagement={false}
      onSaveDraft={writeExportConfigDraft}
      onReset={resetToPublished}
      onApply={async (config) => {
        assertValidFormOverrides(config, catalog);
        return publishExportConfig(config);
      }}
    />
  );
}
