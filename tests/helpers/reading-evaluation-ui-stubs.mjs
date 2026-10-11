// Test-only stand-ins so the admin evaluation panel can render without a router or server.
export const useServerFn = (fn) => fn;
export const runReadingEvaluationCase = async () => {
  throw new Error("A static render never starts an evaluation");
};
export const startReadingEvaluationRun = async () => {
  throw new Error("A static render never starts an evaluation");
};
export const fetchReadingEvaluationRun = async () => ({ run: null, results: [] });
export const stopReadingEvaluationRun = async () => {
  throw new Error("A static render never stops an evaluation");
};
