import { GuitarWorkflowTemplate, validateTemplate } from "./template";

export type SessionCheckStatus = "pass" | "warning" | "fail";

export interface SessionCheck {
  id: string;
  label: string;
  status: SessionCheckStatus;
  detail: string;
}

interface RequiredRoute {
  fromTrackId: string;
  fromName: string;
  toTrackId: string;
  toName: string;
}

interface SessionCheckSpec {
  trackOrder: string[];
  requiredRoutes: RequiredRoute[];
  requiredBusNames: Array<{ id: string; name: string }>;
}

const guitarRoutingSpec: SessionCheckSpec = {
  trackOrder: [
  "guitar-bus",
  "guitar-amp-l",
  "guitar-amp-r",
  "lead-guitar",
  "clean-ambient-guitar",
  "backing-bus",
  "backing-track"
  ],
  requiredBusNames: [
    { id: "guitar-bus", name: "GUITAR BUS" },
    { id: "backing-bus", name: "BACKING BUS" }
  ],
  requiredRoutes: [
  { fromTrackId: "guitar-amp-l", fromName: "GUITAR AMP L", toTrackId: "guitar-bus", toName: "GUITAR BUS" },
  { fromTrackId: "guitar-amp-r", fromName: "GUITAR AMP R", toTrackId: "guitar-bus", toName: "GUITAR BUS" },
  { fromTrackId: "lead-guitar", fromName: "LEAD GUITAR", toTrackId: "guitar-bus", toName: "GUITAR BUS" },
  {
    fromTrackId: "clean-ambient-guitar",
    fromName: "CLEAN / AMBIENT GUITAR",
    toTrackId: "guitar-bus",
    toName: "GUITAR BUS"
  },
  { fromTrackId: "backing-track", fromName: "BACKING TRACK", toTrackId: "backing-bus", toName: "BACKING BUS" }
  ]
};

const oneTakeVideoSpec: SessionCheckSpec = {
  trackOrder: [
    "video-reference",
    "camera-audio-sync",
    "stereo-output-songsterr-print",
    "guitar-live-print",
    "extra-guitar-layer",
    "fx-impacts",
    "final-master-print",
    "shorts-export-print",
    "full-video-export-print"
  ],
  requiredBusNames: [{ id: "final-master-print", name: "FINAL MASTER PRINT" }],
  requiredRoutes: [
    {
      fromTrackId: "stereo-output-songsterr-print",
      fromName: "STEREO OUTPUT / SONGSTERR PRINT",
      toTrackId: "final-master-print",
      toName: "FINAL MASTER PRINT"
    },
    {
      fromTrackId: "guitar-live-print",
      fromName: "GUITAR LIVE PRINT",
      toTrackId: "final-master-print",
      toName: "FINAL MASTER PRINT"
    },
    {
      fromTrackId: "extra-guitar-layer",
      fromName: "EXTRA GUITAR LAYER",
      toTrackId: "final-master-print",
      toName: "FINAL MASTER PRINT"
    },
    {
      fromTrackId: "fx-impacts",
      fromName: "FX / IMPACTS",
      toTrackId: "final-master-print",
      toName: "FINAL MASTER PRINT"
    }
  ]
};

const backingTrackCreatorSpec: SessionCheckSpec = {
  trackOrder: [
    "original-reference",
    "camera-phone-sync-audio",
    "backing-track-main",
    "backing-track-no-guitar",
    "drums-percussion-stem",
    "bass-stem",
    "vocals-lead-stem",
    "synths-extra-stems",
    "click-count-in",
    "backing-bus",
    "guitar-practice-bus",
    "final-backing-print"
  ],
  requiredBusNames: [
    { id: "backing-bus", name: "BACKING BUS" },
    { id: "guitar-practice-bus", name: "GUITAR PRACTICE BUS" },
    { id: "final-backing-print", name: "FINAL BACKING PRINT" }
  ],
  requiredRoutes: [
    {
      fromTrackId: "backing-track-main",
      fromName: "BACKING TRACK MAIN",
      toTrackId: "backing-bus",
      toName: "BACKING BUS"
    },
    {
      fromTrackId: "backing-track-no-guitar",
      fromName: "BACKING TRACK NO GUITAR",
      toTrackId: "backing-bus",
      toName: "BACKING BUS"
    },
    {
      fromTrackId: "drums-percussion-stem",
      fromName: "DRUMS / PERCUSSION STEM",
      toTrackId: "backing-bus",
      toName: "BACKING BUS"
    },
    {
      fromTrackId: "bass-stem",
      fromName: "BASS STEM",
      toTrackId: "backing-bus",
      toName: "BACKING BUS"
    },
    {
      fromTrackId: "vocals-lead-stem",
      fromName: "VOCALS / LEAD STEM",
      toTrackId: "backing-bus",
      toName: "BACKING BUS"
    },
    {
      fromTrackId: "synths-extra-stems",
      fromName: "SYNTHS / EXTRA STEMS",
      toTrackId: "backing-bus",
      toName: "BACKING BUS"
    },
    {
      fromTrackId: "click-count-in",
      fromName: "CLICK / COUNT-IN",
      toTrackId: "guitar-practice-bus",
      toName: "GUITAR PRACTICE BUS"
    },
    {
      fromTrackId: "backing-bus",
      fromName: "BACKING BUS",
      toTrackId: "final-backing-print",
      toName: "FINAL BACKING PRINT"
    }
  ]
};

export function getSessionChecks(template: GuitarWorkflowTemplate): SessionCheck[] {
  const spec =
    template.presetId === "one-take-video-cover"
      ? oneTakeVideoSpec
      : template.presetId === "backing-track-creator"
        ? backingTrackCreatorSpec
        : guitarRoutingSpec;
  const validationErrors = validateTemplate(template);
  const routeReferenceErrors = validationErrors.filter((error) => error.startsWith("Route ") && error.includes("points to an unknown"));
  const requiredRouteProblem = findMissingRequiredRoute(template, spec);

  return [
    checkTrackOrder(template, spec),
    checkBusNames(template, spec),
    checkSourceImports(template),
    {
      id: "route-references",
      label: "Route references",
      status: routeReferenceErrors.length > 0 ? "fail" : "pass",
      detail: routeReferenceErrors[0] ?? "Every route points to an existing source and destination track."
    },
    {
      id: "required-routes",
      label: "Required bus sends",
      status: requiredRouteProblem ? "fail" : "pass",
      detail: requiredRouteProblem ?? "All required preset sends exist."
    },
    {
      id: "master-send",
      label: "Child master sends",
      status: requiredRouteProblem || routeReferenceErrors.length > 0 ? "fail" : "pass",
      detail:
        requiredRouteProblem || routeReferenceErrors.length > 0
          ? "Master send cannot be disabled until every required bus route exists."
          : "Generated Lua disables master send for every required routed child track."
    },
    {
      id: "lua-export",
      label: "Lua export readiness",
      status: validationErrors.length > 0 || requiredRouteProblem ? "fail" : "pass",
      detail:
        validationErrors.length > 0 || requiredRouteProblem
          ? "Fix validation warnings before exporting Lua."
          : "Generated Lua is ready to save for REAPER review."
    },
    {
      id: "export-package",
      label: "Export package",
      status: validationErrors.length > 0 || requiredRouteProblem ? "fail" : "pass",
      detail:
        validationErrors.length > 0 || requiredRouteProblem
          ? "Fix validation warnings before creating files."
          : "Create Files will write run-workflow.lua, JSON, source manifest, REAPER steps, sources.json, and plugin-manifest.json."
    }
  ];
}

function checkSourceImports(template: GuitarWorkflowTemplate): SessionCheck {
  if (template.sourceAssets.length === 0) {
    return {
      id: "source-imports",
      label: "Source imports",
      status: "pass",
      detail: "No source slots are required for this preset."
    };
  }

  const readySourceCount = template.sourceAssets.filter(
    (source) => source.filePath.trim() || source.sourceUrl.trim()
  ).length;

  if (readySourceCount === 0) {
    return {
      id: "source-imports",
      label: "Source imports",
      status: "warning",
      detail: "No sources have local file paths or reference links yet."
    };
  }

  return {
    id: "source-imports",
    label: "Source imports",
    status: "pass",
    detail: `${readySourceCount} source${readySourceCount === 1 ? " has" : "s have"} a local file path or reference link.`
  };
}

function checkTrackOrder(template: GuitarWorkflowTemplate, spec: SessionCheckSpec): SessionCheck {
  const indexes = spec.trackOrder.map((trackId) => template.tracks.findIndex((track) => track.id === trackId));
  const missingTrackIndex = indexes.findIndex((index) => index === -1);
  const isInOrder = indexes.every((index, currentIndex) => currentIndex === 0 || index > indexes[currentIndex - 1]);

  if (missingTrackIndex !== -1) {
    return {
      id: "track-order",
      label: "Track order",
      status: "fail",
      detail: `Missing required track: ${spec.trackOrder[missingTrackIndex]}.`
    };
  }

  return {
    id: "track-order",
    label: "Track order",
    status: isInOrder ? "pass" : "fail",
    detail: isInOrder
      ? "Required REAPER tracks are in the expected creation order."
      : "Required REAPER tracks are out of order."
  };
}

function checkBusNames(template: GuitarWorkflowTemplate, spec: SessionCheckSpec): SessionCheck {
  const hasClearNames = spec.requiredBusNames.every(
    (requiredBus) => template.tracks.find((track) => track.id === requiredBus.id)?.name === requiredBus.name
  );
  const expectedNames = spec.requiredBusNames.map((requiredBus) => requiredBus.name).join(" and ");

  return {
    id: "bus-names",
    label: "Bus names",
    status: hasClearNames ? "pass" : "warning",
    detail: hasClearNames ? "Bus tracks are clearly named." : `Expected bus names: ${expectedNames}.`
  };
}

function findMissingRequiredRoute(template: GuitarWorkflowTemplate, spec: SessionCheckSpec): string | undefined {
  const missingRoute = spec.requiredRoutes.find(
    (requiredRoute) =>
      !template.routes.some(
        (route) => route.fromTrackId === requiredRoute.fromTrackId && route.toTrackId === requiredRoute.toTrackId
      )
  );

  if (!missingRoute) {
    return undefined;
  }

  return `Missing route: ${missingRoute.fromName} -> ${missingRoute.toName}.`;
}
