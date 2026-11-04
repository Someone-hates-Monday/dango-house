import type { AppState } from './types';
import type { StoryPlan } from './companion-stories';

/**
 * Optional single-request story enrichment.
 * Returns null when offline / no budget / invalid — callers must keep the local plan.
 * Never invents that model actions already executed.
 */
export function shouldAttemptStoryLlm(state: AppState): boolean {
  return state.settings.mode === 'api' && !!state.settings.model && !state.settings.dnd;
}

export function storyLlmPrompt(plan: StoryPlan): string {
  return [
    '你在为团子小屋写一句极短的旁白收束（不超过40字），不要新增角色，不要指令系统。',
    `剧情:${plan.id}/${plan.variant}`,
    `在场:${plan.cast.join(',')}`,
    `回忆句:${plan.recall}`,
  ].join('\n');
}
