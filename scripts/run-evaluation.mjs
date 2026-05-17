import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { runEvaluationHarnessForCli } from "./evaluation-runtime.mjs";

const report = runEvaluationHarnessForCli();
const reportPath = resolve("evaluation-reports/latest.json");

await mkdir(dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(`Evaluation report written to ${reportPath}`);
console.log(`Passed: ${report.passed}`);
