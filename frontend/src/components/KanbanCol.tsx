'use client';

import { useRef, useState } from 'react';
import { GripVertical, MoreHorizontal, Plus } from 'lucide-react';
import TaskCard from './TaskCard';
import type { Task, Status } from '@/hooks/useTasks';

interface Props {
  title: Status;
  tasks: Task[];
  onDrop: (taskId: string, status: Status) => void;
  onAddTask: (title: string, status: Status) => void;
  fields: Record<string, boolean>;
  onDeleteTask?: (taskId: string) => Promise<void>;
  onDuplicateTask?: (task: Task) => Promise<void>;
}

export default function KanbanCol({ title, tasks, onDrop, onAddTask, fields, onDeleteTask, onDuplicateTask }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [adding, setAdding] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const colRef = useRef<HTMLDivElement>(null);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    if (colRef.current && !colRef.current.contains(e.relatedTarget as Node)) setDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const id = e.dataTransfer.getData('taskId');
    if (id) onDrop(id, title);
  }

  function startAdding() { setAdding(true); setTimeout(() => inputRef.current?.focus(), 0); }

  function commitAdd() {
    const trimmed = inputVal.trim();
    if (trimmed) onAddTask(trimmed, title);
    setInputVal('');
    setAdding(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commitAdd();
    if (e.key === 'Escape') { setInputVal(''); setAdding(false); }
  }

  return (
    <div className="flex flex-col w-[289px] shrink-0">
      <div
        ref={colRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`kanban-column rounded-[8px] flex flex-col transition-colors ${dragOver ? 'ring-2 ring-blue-400' : ''}`}
        style={{ width: '289px', minHeight: 'auto' }}
      >
        <div className="flex items-center justify-between w-[289px] h-[39px] px-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <GripVertical size={13} className="cursor-grab shrink-0 opacity-70" strokeWidth={2.5} />
            <span className="text-xs font-semibold leading-none tracking-normal whitespace-nowrap">{title}</span>
          </div>
          <div className="flex items-center gap-2 opacity-80">
            <button type="button" onClick={startAdding} className="w-[14px] h-[14px] flex items-center justify-center rounded transition-colors">
              <Plus size={14} strokeWidth={2.5} />
            </button>
            <button type="button" className="w-[14px] h-[14px] flex items-center justify-center rounded transition-colors">
              <MoreHorizontal size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 p-3">
          {tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              fields={fields}
              onDeleteTask={onDeleteTask}
              onDuplicateTask={onDuplicateTask}
            />
          ))}

          {adding ? (
            <input
              ref={inputRef}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={commitAdd}
              placeholder="Task title…"
              className="kanban-column-input w-full rounded-lg px-3 py-2 text-[13px] outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={startAdding}
              className="flex items-center gap-1.5 text-[12px] font-semibold transition-colors px-1 py-1.5 w-full text-left opacity-90 hover:opacity-100"
            >
              <Plus size={13} strokeWidth={2.5} />
              <span>Add Task</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
