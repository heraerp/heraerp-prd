"use client";

import { useState } from 'react';
import { type Leader } from '@/data/about';

interface LeaderCardProps {
  leader: Leader;
}

export default function LeaderCard({ leader }: LeaderCardProps) {
  const [showActions, setShowActions] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && leader.linkedin) {
      window.open(leader.linkedin, '_blank', 'noreferrer');
    }
  };

  return (
    <div
      className="g-shell g-inner card-glass p-5 rounded-2xl h-card group"
      tabIndex={0}
      aria-labelledby={`leader-${leader.id}-name`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onFocus={() => setShowActions(true)}
      onBlur={() => setShowActions(false)}
      onKeyDown={handleKeyDown}
    >
      <div className="flex flex-col items-center text-center space-y-4">
        {/* Avatar */}
        <div className="avatar w-16 h-16">
          {leader.photo ? (
            <img
              src={leader.photo}
              alt={leader.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="avatar-initial">
              {leader.name.charAt(0)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="space-y-2">
          <div>
            <h3 id={`leader-${leader.id}-name`} className="ink font-semibold text-lg">
              {leader.name}
            </h3>
            <p className="ink text-sm opacity-75">{leader.title}</p>
          </div>
          <p className="ink-muted text-sm leading-relaxed">{leader.bio}</p>
        </div>

        {/* Actions bar */}
        {leader.linkedin && (
          <div className={`pop transition-opacity duration-200 ${showActions ? 'opacity-100' : 'opacity-0'}`}>
            <a
              href={leader.linkedin}
              target="_blank"
              rel="noreferrer"
              className="btn-quiet text-sm"
              onClick={(e) => e.stopPropagation()}
            >
              LinkedIn
            </a>
          </div>
        )}
      </div>
    </div>
  );
}