"use client";

import { useState } from "react";
import { PanelContainer } from "./panel-container";
import { InputPanel } from "./input-panel";
import { ArchivePanel } from "./archive-panel";
import { DiscoverPanel } from "./discover-panel";
import { EntryDetailSheet } from "./entry-detail-sheet";
import { SettingsSheet } from "./settings-sheet";

export function PanelShell() {
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <PanelContainer
        inputPanel={
          <InputPanel
            onOpenEntry={setSelectedEntryId}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        }
        archivePanel={<ArchivePanel onOpenEntry={setSelectedEntryId} />}
        discoverPanel={<DiscoverPanel onOpenEntry={setSelectedEntryId} />}
      />

      <EntryDetailSheet
        entryId={selectedEntryId}
        open={!!selectedEntryId}
        onClose={() => setSelectedEntryId(null)}
      />

      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}
