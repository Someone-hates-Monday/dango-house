import type { ToolReceipt, ToolOutcome } from '../../src/shared/agent';

export interface ToolContext {
  taskId: string;
  signal: AbortSignal;
  grants: ReadonlySet<string>;
  step: () => void;
  remainingSteps: () => number;
}

export type ToolHandler = (args: Record<string, unknown>, ctx: ToolContext) => Promise<{
  summary: string;
  evidenceIds?: string[];
  details?: Record<string, unknown>;
  outcome?: ToolOutcome;
}>;

export class ToolRegistry {
  private handlers = new Map<string, { grant: string; handler: ToolHandler; description: string }>();

  register(name: string, grant: string, description: string, handler: ToolHandler) {
    this.handlers.set(name, { grant, handler, description });
  }

  has(name: string) {
    return this.handlers.has(name);
  }

  list() {
    return [...this.handlers.entries()].map(([name, value]) => ({ name, grant: value.grant, description: value.description }));
  }

  async invoke(name: string, args: Record<string, unknown>, ctx: ToolContext): Promise<ToolReceipt> {
    const at = Date.now();
    const id = crypto.randomUUID();
    if (ctx.signal.aborted) {
      return { id, tool: name, outcome: 'cancelled', summary: '任务已取消，工具未执行。', at };
    }
    const entry = this.handlers.get(name);
    if (!entry) {
      return { id, tool: name, outcome: 'unknown_tool', summary: `未知工具「${name}」未执行。`, at };
    }
    if (!ctx.grants.has(entry.grant) && !ctx.grants.has('*')) {
      return { id, tool: name, outcome: 'blocked', summary: `缺少权限「${entry.grant}」，工具未执行。`, at, details: { grant: entry.grant } };
    }
    if (ctx.remainingSteps() <= 0) {
      return { id, tool: name, outcome: 'blocked', summary: '本任务步骤预算已用尽。', at };
    }
    ctx.step();
    try {
      const result = await entry.handler(args, ctx);
      if (ctx.signal.aborted) {
        return { id, tool: name, outcome: 'cancelled', summary: '任务在工具执行期间被取消。', at: Date.now() };
      }
      return {
        id,
        tool: name,
        outcome: result.outcome ?? 'success',
        summary: result.summary,
        evidenceIds: result.evidenceIds,
        details: result.details,
        at: Date.now(),
      };
    } catch (error) {
      if (ctx.signal.aborted) {
        return { id, tool: name, outcome: 'cancelled', summary: '任务已取消。', at: Date.now() };
      }
      return {
        id,
        tool: name,
        outcome: 'failed',
        summary: error instanceof Error ? error.message : '工具执行失败',
        at: Date.now(),
      };
    }
  }
}
