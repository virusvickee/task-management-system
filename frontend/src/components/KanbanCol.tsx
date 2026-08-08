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

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
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
    <div className="flex flex-col w-72 shrink-0">
      <div className="flex items-center justify-between mb-2 px-0.5">
        <div className="flex items-center gap-1.5">
          <GripVertical size={14} className="text-gray-300 cursor-grab" />
          <span className="text-[13px] font-semibold text-gray-700">{title}</span>
          <span className="text-[11px] text-gray-500 font-medium bg-gray-100 rounded-full px-1.5 py-0.5 leading-none">
            {tasks.length}
          </span>
        </div>
        <div className="flex items-center gap-0.5 text-gray-400">
          <button onClick={startAdding} className="hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100">
            <Plus size={14} />
          </button>
          <button className="hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100">
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`bg-gray-50 rounded-xl p-2 flex flex-col gap-2 transition-colors ${
          dragOver ? 'bg-blue-50 ring-2 ring-blue-200' : ''
        }`}
      >
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
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-200"
          />
        ) : (
          <button
            onClick={startAdding}
            className="flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-gray-600 transition-colors px-1 py-1.5"
          >
            <Plus size={13} />
            <span>Add Task</span>
          </button>
        )}
      </div>
    </div>
  );
}
