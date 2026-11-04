import { Pause, Play, Square, ListTodo } from 'lucide-react';
import type { AppState } from './shared/types';
import { coverageLabel } from './shared/agent';
import { useI18n } from './useI18n';

const send = (action: Parameters<typeof window.garden.dispatch>[0]) => void window.garden.dispatch(action);

export function TaskTray({ state }: { state: AppState }) {
  const { t, locale } = useI18n(state);
  const tasks = state.agent?.tasks ?? [];
  if (!tasks.length) return null;
  return (
    <aside className="task-tray" aria-label={t('task.title')}>
      <header>
        <ListTodo size={15} />
        <strong>{t('task.title')}</strong>
        <small>{t('task.hint')}</small>
      </header>
      <ul>
        {tasks.slice(0, 4).map(task => (
          <li key={task.id} data-status={task.status}>
            <div>
              <b>{task.goal}</b>
              <span>
                {task.status}
                {task.coverage ? ` · ${coverageLabel(task.coverage, locale)}` : ''}
                {` · ${Math.round(task.progress * 100)}%`}
              </span>
              <p>{task.lastMessage}</p>
            </div>
            <div className="task-tray-actions">
              {(task.status === 'running' || task.status === 'paused') && (
                <button
                  aria-label={task.status === 'paused' ? t('task.resume') : t('task.pause')}
                  onClick={() => send({ type: 'agent-control', id: task.id, command: task.status === 'paused' ? 'resume' : 'pause' })}
                >
                  {task.status === 'paused' ? <Play size={13} /> : <Pause size={13} />}
                </button>
              )}
              {(task.status === 'running' || task.status === 'paused' || task.status === 'queued') && (
                <button aria-label={t('task.cancel')} onClick={() => send({ type: 'agent-control', id: task.id, command: 'cancel' })}>
                  <Square size={13} />
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
