'use client';

import { useEffect, useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { apiFetch } from '@/lib/api';

const ALL_MEMBERS = ['Alex Kim', 'Sam Lee', 'Morgan Chen', 'Jordan Park'];

const AVATAR_COLORS = [
  'bg-violet-500', 'bg-emerald-500', 'bg-orange-500', 'bg-pink-500', 'bg-blue-500',
];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function Avatar({ name, size = 6 }: { name: string; size?: number }) {
  const initials = name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  return (
    <span className={`w-${size} h-${size} rounded-full ${avatarColor(name)} flex items-center justify-center text-white text-[10px] font-semibold shrink-0`}>
      {initials}
    </span>
  );
}

interface Props {
  taskId: string;
  currentMembers?: string[];
  onMembersChange?: (members: string[]) => void;
  onUpdate?: (members: string[]) => Promise<unknown>;
  disabled?: boolean;
  trigger?: React.ReactNode;
}

export default function AssignMemberPopover({ taskId, currentMembers = [], onMembersChange, onUpdate, disabled = false, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<string[]>(currentMembers);

  useEffect(() => {
    setMembers(currentMembers);
  }, [currentMembers]);

  async function toggleMember(member: string) {
    const newMembers = members.includes(member)
      ? members.filter((m) => m !== member)
      : [...members, member];
    
    setMembers(newMembers);
    if (onMembersChange) onMembersChange(newMembers);

    try {
      if (onUpdate) {
        await onUpdate(newMembers);
      } else {
        await apiFetch(`/tasks/${taskId}`, {
          method: 'PATCH',
          body: JSON.stringify({ members: newMembers, assignee: newMembers.length > 0 ? newMembers[0] : '' }),
        });
      }
    } catch (e) {
      console.error(e);
      // Revert on failure
      setMembers(members);
      if (onMembersChange) onMembersChange(members);
    }
  }

  const defaultTrigger = (
    <button className="w-7 h-7 rounded-full border border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:border-gray-400 hover:bg-gray-50 hover:text-gray-700 dark:hover:border-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)]">
      <Plus size={13} />
    </button>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <span className={disabled ? 'pointer-events-none opacity-45' : undefined}>{trigger || defaultTrigger}</span>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="start">
        <div className="flex flex-col">
          {ALL_MEMBERS.map((member) => (
            <button
              key={member}
              onClick={(e) => {
                e.stopPropagation();
                toggleMember(member);
              }}
              className="flex items-center justify-between px-2 py-1.5 text-sm rounded-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)]"
            >
              <div className="flex items-center gap-2">
                <Avatar name={member} size={5} />
                <span className="text-gray-700 dark:text-gray-300">{member}</span>
              </div>
              {members.includes(member) && <Check size={14} className="text-[var(--accent-color)]" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
