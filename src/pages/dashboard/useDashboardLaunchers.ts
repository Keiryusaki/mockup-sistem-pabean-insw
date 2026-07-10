import { useEffect, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { copyDataLeafKeys } from "./submissionLauncherData";
import { buildDraftFromUpload } from "./dashboardUploadFlow";
import { buildUploadNotice, type CopyProposalRow, type StartChoice, type UploadFlowContext } from "./submissionLauncherData";
import { storeFormSnapshot } from "./formSnapshotData";
import type { AiSubmissionDraft } from "./formSnapshotData";

export function useDashboardLaunchers() {
  const navigate = useNavigate();
  const { location } = useRouterState();
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [manualMethodOpen, setManualMethodOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [copySelectionOpen, setCopySelectionOpen] = useState(false);
  const [copySelectionRow, setCopySelectionRow] = useState<CopyProposalRow | null>(null);
  const [copySelectionDraft, setCopySelectionDraft] = useState<string[]>(copyDataLeafKeys);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadContext, setUploadContext] = useState<UploadFlowContext | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("launcher") === "1") {
      setLauncherOpen(true);
      navigate({ to: location.pathname, search: {} as never, replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  const handleAiSubmit = (draft: AiSubmissionDraft) => {
    storeFormSnapshot("assistant", draft);
    navigate({ to: "/form" });
  };

  const handleStartChoice = (choice: StartChoice) => {
    setLauncherOpen(false);

    if (choice === "assistant") {
      setAssistantOpen(true);
      return;
    }

    if (choice === "manual") {
      setManualMethodOpen(true);
    }
  };

  const handleManualMethodChoice = (choice: Exclude<StartChoice, "assistant">) => {
    setManualMethodOpen(false);

    if (choice === "manual") {
      setManualOpen(true);
      return;
    }

    if (choice === "copy") {
      setCopyOpen(true);
      return;
    }

    setUploadContext({ source: "upload" });
    setUploadOpen(true);
  };

  const openCopySelection = (row: CopyProposalRow) => {
    setCopyOpen(false);
    setCopySelectionRow(row);
    setCopySelectionDraft(copyDataLeafKeys);
    setCopySelectionOpen(true);
  };

  const closeCopySelection = () => {
    setCopySelectionOpen(false);
    setCopySelectionRow(null);
    setCopySelectionDraft(copyDataLeafKeys);
  };

  const continueCopySelection = () => {
    if (!copySelectionRow) return;
    setCopySelectionOpen(false);
    setUploadContext({ source: "copy", copyRow: copySelectionRow, copyGroups: copySelectionDraft });
    setUploadOpen(true);
  };

  const handleUploadComplete = ({ excelFiles, ocrFiles }: { excelFiles: string[]; ocrFiles: string[] }) => {
    const { draft, formState } = buildDraftFromUpload(uploadContext, excelFiles, ocrFiles);
    storeFormSnapshot(uploadContext?.source ?? "manual", draft, formState, buildUploadNotice(excelFiles, ocrFiles));
    navigate({ to: "/form" });
  };

  return {
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
  };
}
