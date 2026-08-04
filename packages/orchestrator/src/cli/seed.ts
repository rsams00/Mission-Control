import { seedRoster } from "../roster";

seedRoster()
  .then(() => {
    console.log("[seed] roster seeded (or already present)");
    process.exit(0);
  })
  .catch((err) => {
    console.error("[seed] failed:", err);
    process.exit(1);
  });
