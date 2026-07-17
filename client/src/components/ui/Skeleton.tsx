import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div
      className={`relative overflow-hidden bg-slate-200 dark:bg-slate-800 rounded shimmer ${className}`}
    />
  );
};

export const SidebarSkeleton: React.FC = () => {
  return (
    <div className="space-y-5 p-4 overflow-hidden">
      {[1, 2, 3, 4, 5, 6, 7].map((val) => (
        <div key={val} className="flex items-center space-x-3">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between items-center">
              <Skeleton className="w-28 h-4" />
              <Skeleton className="w-10 h-3" />
            </div>
            <Skeleton className="w-3/4 h-3" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const MessagesSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 p-4">
      {[1, 2, 3, 4].map((val) => {
        const isSelf = val % 2 === 0;
        return (
          <div
            key={val}
            className={`flex items-end space-x-2 ${isSelf ? 'justify-end' : 'justify-start'}`}
          >
            {!isSelf && <Skeleton className="w-8 h-8 rounded-full" />}
            <div className="space-y-1 max-w-[70%]">
              <Skeleton
                className={`h-12 w-64 rounded-2xl ${
                  isSelf ? 'rounded-br-none' : 'rounded-bl-none'
                }`}
              />
              <div className={isSelf ? 'text-right' : 'text-left'}>
                <Skeleton className="h-3 w-12 inline-block" />
              </div>
            </div>
            {isSelf && <Skeleton className="w-8 h-8 rounded-full" />}
          </div>
        );
      })}
    </div>
  );
};
