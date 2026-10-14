export type PolicyProfile = 'READ_ONLY';

export const policyProfile: PolicyProfile = 'READ_ONLY';

export type Risk = 'low' | 'medium' | 'high';

export interface ToolPolicy {
  risk: Risk;
  mutatesState: boolean;
  requiresConfirmation: boolean;
}

export const toolPolicies: Record<string, ToolPolicy> = {
  get_health: { risk: 'low', mutatesState: false, requiresConfirmation: false },
  list_allowed_roots: { risk: 'low', mutatesState: false, requiresConfirmation: false },
  list_directory: { risk: 'low', mutatesState: false, requiresConfirmation: false },
  read_file: { risk: 'low', mutatesState: false, requiresConfirmation: false },
  get_file_metadata: { risk: 'low', mutatesState: false, requiresConfirmation: false },
  search_files: { risk: 'low', mutatesState: false, requiresConfirmation: false },
  run_command: { risk: 'medium', mutatesState: false, requiresConfirmation: false },
  start_process: { risk: 'medium', mutatesState: false, requiresConfirmation: false },
  list_processes: { risk: 'low', mutatesState: false, requiresConfirmation: false },
  read_process_output: { risk: 'low', mutatesState: false, requiresConfirmation: false },
  terminate_process: { risk: 'medium', mutatesState: true, requiresConfirmation: true },
};

export function assertReadOnly(name: string): void {
  const policy = toolPolicies[name];
  if (!policy) throw new Error(`Unknown tool policy: ${name}`);
  if (policy.mutatesState || policy.requiresConfirmation) {
    throw new Error(`Tool ${name} is disabled by the ${policyProfile} profile.`);
  }
}
