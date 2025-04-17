import { ExplainerRequest, ExplanationRunStatus } from "./service_communication";

export interface ExplainRun {
  request: ExplainerRequest,
  status: ExplanationRunStatus,
  experiment_path: string,
  cost_bound?: string,
  explainer: string,
  args: string[]
}