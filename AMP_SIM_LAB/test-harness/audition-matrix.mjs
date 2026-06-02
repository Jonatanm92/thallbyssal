import path from "node:path";

const categorySlotMap = {
  rhythm: ["low_tuned_chugs", "dynamic_pick_attack"],
  lead: ["dynamic_pick_attack"],
  clean: ["dynamic_pick_attack"],
  ambient: ["dynamic_pick_attack"],
  fx: ["dynamic_pick_attack"],
  utility: ["noise_floor_test"]
};

function slug(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "unnamed";
}

function slotReady(slot) {
  return slot?.status === "pass" && typeof slot.matchedFileName === "string" && slot.matchedFileName.length > 0;
}

function createJob({ preset, slotId, slot, outputRoot }) {
  const presetId = preset.preset_id;
  const status = slotReady(slot) ? "planned" : "blocked";
  const messages = [];

  if (status === "blocked") {
    messages.push(`DI slot ${slotId} is not ready.`);
    messages.push(...(Array.isArray(slot?.errors) ? slot.errors : []));
  } else {
    messages.push("Render hook is not wired yet. This is a planned audition job only.");
  }

  return {
    job_id: `${slug(presetId)}__${slug(slotId)}`,
    preset_id: presetId,
    preset_name: preset.name,
    preset_category: preset.category,
    gain_level: preset.gain_level,
    di_slot: slotId,
    di_file_name: slot?.matchedFileName ?? null,
    status,
    render_status: "not_wired",
    plannedOutputFile: path.join(outputRoot, slug(presetId), `${slug(slotId)}.wav`),
    loudness_target: preset.loudness_target ?? null,
    source_metrics: slot?.metrics ?? null,
    messages
  };
}

export function createAuditionMatrix({ generatedAt = new Date().toISOString(), outputRoot, diValidationReport, presets }) {
  const jobs = [];
  const skippedPresets = [];
  const requiredSlots = diValidationReport?.requiredSlots ?? {};
  const presetList = Array.isArray(presets) ? presets : [];

  for (const preset of presetList) {
    const recommendedSlots = categorySlotMap[preset.category] ?? [];

    if (recommendedSlots.length === 0) {
      skippedPresets.push({
        preset_id: preset.preset_id,
        name: preset.name,
        category: preset.category,
        reason: `No ready starter DI mapping for category: ${preset.category}`
      });
      continue;
    }

    for (const slotId of recommendedSlots) {
      jobs.push(createJob({
        preset,
        slotId,
        slot: requiredSlots[slotId],
        outputRoot
      }));
    }
  }

  const plannedJobs = jobs.filter((job) => job.status === "planned").length;
  const blockedJobs = jobs.filter((job) => job.status === "blocked").length;

  return {
    schemaVersion: 1,
    generatedAt,
    outputRoot,
    renderHook: "placeholder_only",
    jobs,
    skippedPresets,
    summary: {
      presets: presetList.length,
      jobs: plannedJobs,
      blockedJobs,
      skippedPresets: skippedPresets.length,
      totalMatrixEntries: jobs.length,
      renderHook: "placeholder_only"
    }
  };
}
