export function renderThroughAmpPlaceholder(inputFile) {
  return {
    status: "not_wired",
    inputFile,
    outputFile: null,
    message:
      "Command-line plugin rendering is intentionally not connected yet. Founder approval is required before wiring this to the amp/plugin render path."
  };
}

