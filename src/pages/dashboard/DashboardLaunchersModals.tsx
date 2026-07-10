import { copyDataLeafKeys } from "./submissionLauncherData";
import { AiStepModal } from "./AiStepModal";
import { ManualMethodModal as SubmissionManualMethodModal, StartSubmissionModal as SubmissionStartSubmissionModal } from "./SubmissionLauncherModals";
import {
  CopyDataModal as SubmissionCopyDataModal,
  CopyDataSelectionModal as SubmissionCopyDataSelectionModal,
  ManualDocumentModal as SubmissionManualDocumentModal,
} from "./SubmissionCopyModals";
import { UploadBarangModal } from "./SubmissionUploadModal";
import { useDashboardLaunchers } from "./useDashboardLaunchers";

type DashboardLaunchers = ReturnType<typeof useDashboardLaunchers>;

type DashboardLaunchersModalsProps = {
  launchers: DashboardLaunchers;
};

export function DashboardLaunchersModals({ launchers }: DashboardLaunchersModalsProps) {
  const {
    launcherOpen,
    setLauncherOpen,
    manualMethodOpen,
    setManualMethodOpen,
    assistantOpen,
    setAssistantOpen,
    manualOpen,
    setManualOpen,
    copyOpen,
    setCopyOpen,
    copySelectionOpen,
    setCopySelectionOpen,
    copySelectionRow,
    copySelectionDraft,
    setCopySelectionDraft,
    uploadOpen,
    setUploadOpen,
    uploadContext,
    setUploadContext,
    handleAiSubmit,
    handleStartChoice,
    handleManualMethodChoice,
    openCopySelection,
    closeCopySelection,
    continueCopySelection,
    handleUploadComplete,
  } = launchers;

  return (
    <>
      <SubmissionStartSubmissionModal
        open={launcherOpen}
        onClose={() => setLauncherOpen(false)}
        onSelect={handleStartChoice}
      />
      <SubmissionManualMethodModal
        open={manualMethodOpen}
        onClose={() => setManualMethodOpen(false)}
        onBack={() => {
          setManualMethodOpen(false);
          setLauncherOpen(true);
        }}
        onSelect={handleManualMethodChoice}
      />
      <AiStepModal open={assistantOpen} onClose={() => setAssistantOpen(false)} onSubmit={handleAiSubmit} />
      <SubmissionManualDocumentModal
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        onBack={() => {
          setManualOpen(false);
          setManualMethodOpen(true);
        }}
        onSelect={(documentType) => {
          setManualOpen(false);
          setUploadContext({ source: "manual", documentType });
          setUploadOpen(true);
        }}
      />
      <SubmissionCopyDataModal
        open={copyOpen}
        onClose={() => setCopyOpen(false)}
        onBack={() => {
          setCopyOpen(false);
          setManualMethodOpen(true);
        }}
        onUse={openCopySelection}
      />
      <SubmissionCopyDataSelectionModal
        open={copySelectionOpen}
        row={copySelectionRow}
        value={copySelectionDraft}
        onClose={closeCopySelection}
        onBack={() => {
          closeCopySelection();
          setCopyOpen(true);
        }}
        onChange={setCopySelectionDraft}
        onSelectAll={(checked) => {
          setCopySelectionDraft(checked ? copyDataLeafKeys : []);
        }}
        onContinue={continueCopySelection}
      />
      <UploadBarangModal
        open={uploadOpen}
        onClose={() => {
          setUploadOpen(false);
          setUploadContext(null);
        }}
        onBack={() => {
          setUploadOpen(false);
          if (uploadContext?.source === "copy") {
            if (copySelectionRow) {
              setCopySelectionOpen(true);
              return;
            }
            setCopyOpen(true);
            return;
          }
          if (uploadContext?.source === "manual") {
            setManualOpen(true);
            return;
          }
          setManualMethodOpen(true);
        }}
        context={uploadContext}
        onComplete={handleUploadComplete}
      />
    </>
  );
}
