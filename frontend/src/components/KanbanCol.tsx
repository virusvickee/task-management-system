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
}

export default function KanbanCol({ title, tasks, onDrop, onAddTask, fields }: Props) {
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
    // Only clear the highlight if the pointer truly leaves this column
    // (not just moving over a child card inside the column)
    if (colRef.current && !colRef.current.contains(e.relatedTarget as Node)) {
      setDragOver(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const id = e.dataTransfer.getData('taskId');
    if (id) onDrop(id, title);
  }

  function startAdding() {
    setAdding(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

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
    <div className="flex flex-col w-[82vw] sm:w-72 shrink-0">
      {/* Outer container — header + cards share the same bordered box */}
      <div
        ref={colRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`rounded-xl flex flex-col min-h-[80px] transition-colors border ${
          dragOver
            ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 ring-2 ring-blue-200 dark:ring-blue-800'
            : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800'
        }`}
      >
        {/* Column header — w-full h-[39px] px-3 justify-between (Figma spec) */}
        <div className="flex items-center justify-between w-full h-[39px] px-3 shrink-0">
          <div className="flex items-center gap-1.5">
            <GripVertical size={13} className="text-gray-300 cursor-grab" />
            <span className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">{title}</span>
          </div>
          <div className="flex items-center text-gray-400">
            <button
              onClick={startAdding}
              className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1.5 rounded hover:bg-gray-200/60 dark:hover:bg-gray-700 min-w-[36px] min-h-[36px] flex items-center justify-center"
            >
              <Plus size={14} />
            </button>
            <button className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1.5 rounded hover:bg-gray-200/60 dark:hover:bg-gray-700 min-w-[36px] min-h-[36px] flex items-center justify-center">
              <MoreHorizontal size={14} />
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="flex flex-col gap-[6px] p-3">
          {tasks.map((task) => (
            <TaskCard key={task._id} task={task} fields={fields} />
          ))}

          {adding ? (
            <input
              ref={inputRef}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={commitAdd}
              placeholder="Task title…"
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-[13px] text-gray-800 dark:text-gray-200 placeholder-gray-400 outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-700"
            />
          ) : (
            <button
              onClick={startAdding}
              className="flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors px-1 py-1.5 w-full text-left"
            >
              <Plus size={13} />
              <span>Add Task</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
