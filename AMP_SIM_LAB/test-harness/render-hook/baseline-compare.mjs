import { compareBaseline } from "./baseline.mjs";

compareBaseline()
  .then(({ report, paths }) => {
    console.log(`AMP_SIM_LAB baseline compare written: ${paths.json}`);
    console.log(`AMP_SIM_LAB baseline compare HTML written: ${paths.html}`);
    console.log(`Compared jobs: ${report.summary.comparedJobs}`);
    console.log(`Render success changes: ${report.summary.renderSuccessChanges}`);
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
