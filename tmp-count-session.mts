import { SESSION_QUESTION_COUNTS, SESSION_TOTAL_STEPS } from "./src/components/exercise/session-questions.ts";
import { getAllSessionStepIds } from "./src/components/exercise/session-results.ts";
console.log(JSON.stringify(SESSION_QUESTION_COUNTS, null, 2));
console.log("TOTAL", SESSION_TOTAL_STEPS);
console.log("IDS", getAllSessionStepIds().length);
console.log(getAllSessionStepIds().join("\n"));
