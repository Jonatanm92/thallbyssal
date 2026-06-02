import { createBaseline } from "./baseline.mjs";

createBaseline()
  .then((result) => {
    console.log(`AMP_SIM_LAB baseline created: ${result.baselinePath}`);
    console.log(`AMP_SIM_LAB baseline create report written: ${result.paths.json}`);
    console.log(`AMP_SIM_LAB baseline create HTML written: ${result.paths.html}`);
    console.log(`Jobs stored: ${result.jobs}`);
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
