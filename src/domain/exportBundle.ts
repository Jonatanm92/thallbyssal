import { GuitarWorkflowTemplate, SourceAssetTemplate, TemplateOutputMode, TrackTemplate } from "./template";
import { createExportFileName } from "./exportFile";

export interface ExportBundleFile {
  fileName: string;
  text?: string;
  base64?: string;
  encoding?: "utf8" | "base64";
}

export interface ExportBundle {
  directoryName: string;
  files: ExportBundleFile[];
}

export interface PluginManifestInput {
  workflow: string;
  presetId: string;
  name: string;
  songName: string;
  artist: string;
  tempo: number;
  tuning: string;
  entryScript: string;
  files: string[];
  notes: string[];
}

const outputModeLabels: Record<TemplateOutputMode, string> = {
  "reaper-import": "REAPER import session",
  "audio-file": "Final audio file via REAPER render",
  both: "REAPER import session + final audio file"
};

export function createExportBundle(template: GuitarWorkflowTemplate, lua: string, json: string): ExportBundle {
  const luaFileName = createExportFileName(template.name, "lua");
  const jsonFileName = createExportFileName(template.name, "json");
  const entryScriptFileName = "run-workflow.lua";
  const files: ExportBundleFile[] = [
    { fileName: entryScriptFileName, text: lua },
    { fileName: luaFileName, text: lua },
    { fileName: jsonFileName, text: json },
    { fileName: "source-manifest.md", text: createSourceManifest(template) },
    { fileName: "README-REAPER-STEPS.md", text: createReaperSteps(template, entryScriptFileName, luaFileName, jsonFileName) },
    { fileName: "sources.json", text: createSourcesJson(template) }
  ];

  return {
    directoryName: luaFileName.replace(/\.lua$/, ""),
    files: [
      ...files,
      {
        fileName: "plugin-manifest.json",
        text: createPluginManifestJson({
          workflow: template.presetId === "backing-track-creator" ? "backing-track-creator" : "reaper-session-template",
          presetId: template.presetId,
          name: template.name,
          songName: template.songName,
          artist: template.artist,
          tempo: template.tempo,
          tuning: template.tuning,
          entryScript: entryScriptFileName,
          files: [...files.map((file) => file.fileName), "plugin-manifest.json"],
          notes: [
            `Output mode: ${outputModeLabels[template.outputMode]}`,
            `Source workflow: ${template.sourceWorkflow}`,
            "Load the Lua script into REAPER as a ReaScript action."
          ]
        })
      }
    ]
  };
}

export function createPluginManifestJson(input: PluginManifestInput): string {
  return JSON.stringify(
    {
      app: "guitar-workflow-toolkit",
      manifestVersion: 1,
      packageKind: "local-reaper-workflow-plugin-pack",
      workflow: input.workflow,
      presetId: input.presetId,
      name: input.name,
      songName: input.songName || "Untitled",
      artist: input.artist || "Unknown artist",
      tempo: input.tempo,
      tuning: input.tuning || "E Standard",
      entryScript: input.entryScript,
      files: input.files,
      reaperInstall: {
        actionListPath: "Actions > Show action list > New action > Load ReaScript",
        runAfterInstall: input.entryScript
      },
      notes: input.notes
    },
    null,
    2
  );
}

function createSourceManifest(template: GuitarWorkflowTemplate): string {
  const trackById = new Map(template.tracks.map((track) => [track.id, track]));
  const lines = [
    `# ${template.name} Source Manifest`,
    "",
    `Song: ${template.songName || "Untitled"}`,
    `Artist: ${template.artist || "Unknown artist"}`,
    `BPM: ${template.tempo}`,
    `Tuning: ${template.tuning}`,
    `Source workflow: ${template.sourceWorkflow}`,
    `Source format: ${template.sourceFormat || "not specified"}`,
    `Output mode: ${outputModeLabels[template.outputMode]}`,
    ...(template.sourceNotes.trim() ? [`Source notes: ${template.sourceNotes}`] : []),
    "",
    "## Sources",
    ""
  ];

  if (template.sourceAssets.length === 0) {
    lines.push("No source assets configured.");
    return lines.join("\n");
  }

  for (const source of template.sourceAssets) {
    lines.push(...sourceManifestLines(source, trackById));
  }

  return lines.join("\n");
}

function sourceManifestLines(source: SourceAssetTemplate, trackById: Map<string, TrackTemplate>): string[] {
  const targetTrack = trackById.get(source.targetTrackId);
  const targetName = targetTrack?.name ?? (source.targetTrackId || "No target track");
  const lines = [
    `- ${source.label} -> ${targetName}`,
    `  Kind: ${source.kind}`,
    `  Local file: ${source.filePath || "not imported yet"}`,
    `  Reference link: ${source.sourceUrl || "none"}`
  ];

  if (source.notes.trim()) {
    lines.push(`  Notes: ${source.notes}`);
  }

  return [...lines, ""];
}

function createReaperSteps(template: GuitarWorkflowTemplate, entryScriptFileName: string, luaFileName: string, jsonFileName: string): string {
  return [
    "# REAPER Setup Steps",
    "",
    `Template: ${template.name}`,
    `Song: ${template.songName || "Untitled"}`,
    `Artist: ${template.artist || "Unknown artist"}`,
    `Tuning: ${template.tuning}`,
    `Source workflow: ${template.sourceWorkflow}`,
    `Output mode: ${outputModeLabels[template.outputMode]}`,
    "",
    "## Files in this export",
    "",
    `- \`${entryScriptFileName}\` - stable REAPER entrypoint to load as the ReaScript action.`,
    `- \`${luaFileName}\` - named copy of the generated REAPER Lua setup script.`,
    `- \`${jsonFileName}\` - editable Guitar Workflow Toolkit template backup.`,
    "- `source-manifest.md` - source files, reference links, and target tracks.",
    "- `sources.json` - structured source metadata for future tooling.",
    "- `plugin-manifest.json` - package metadata for this local workflow pack.",
    "",
    "## REAPER steps",
    "",
    `1. Load \`${entryScriptFileName}\` in REAPER from Actions > Show action list > New action > Load ReaScript.`,
    `2. Name the action after this workflow, then run \`${entryScriptFileName}\`.`,
    "3. Imported media should land on the target tracks listed in `source-manifest.md`.",
    "4. Check that reference/sync tracks are muted or have master send disabled before mixing.",
    ...outputStepLines(template),
    "",
    "## Notes",
    "",
    "The app does not download copyrighted songs or separate stems automatically.",
    "Use only audio files you own or have permission to process."
  ].join("\n");
}

function createSourcesJson(template: GuitarWorkflowTemplate): string {
  const trackById = new Map(template.tracks.map((track) => [track.id, track]));

  return JSON.stringify(
    {
      app: "guitar-workflow-toolkit",
      templateName: template.name,
      presetId: template.presetId,
      songName: template.songName,
      artist: template.artist,
      tempo: template.tempo,
      tuning: template.tuning,
      sourceWorkflow: template.sourceWorkflow,
      sourceFormat: template.sourceFormat,
      outputMode: template.outputMode,
      outputModeLabel: outputModeLabels[template.outputMode],
      sources: template.sourceAssets.map((source) => {
        const targetTrack = trackById.get(source.targetTrackId);

        return {
          id: source.id,
          label: source.label,
          kind: source.kind,
          targetTrackId: source.targetTrackId,
          targetTrackName: targetTrack?.name ?? "",
          fileName: source.fileName,
          filePath: source.filePath,
          sourceUrl: source.sourceUrl,
          notes: source.notes
        };
      })
    },
    null,
    2
  );
}

function outputStepLines(template: GuitarWorkflowTemplate): string[] {
  if (template.outputMode === "audio-file") {
    return [
      "5. Adjust levels on `BACKING BUS` and `FINAL BACKING PRINT`.",
      "6. Open File > Render in REAPER. The Lua script sets the render directory and file name for a final backing-track WAV.",
      "7. Render the master mix to create the finished audio file."
    ];
  }

  if (template.outputMode === "both") {
    return [
      "5. Adjust levels on `BACKING BUS`, `GUITAR PRACTICE BUS`, and print tracks.",
      "6. Use the imported REAPER session for editing, or open File > Render to create the final backing-track WAV.",
      "7. The Lua script sets the render directory and file name for the audio-file path."
    ];
  }

  return [
    "5. Adjust levels on `BACKING BUS`, `GUITAR PRACTICE BUS`, and print tracks.",
    "6. Keep working in REAPER, or manually render/record the final print track when ready."
  ];
}
