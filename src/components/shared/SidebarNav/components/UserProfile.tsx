import React from 'react';

interface UserInfo {
  name: string;
  email: string;
  avatar: string;
}

interface UserProfileProps {
  userInfo: UserInfo;
}

export const UserProfile: React.FC<UserProfileProps> = ({ userInfo }) => {
  return (
    <footer className="flex items-center gap-3 p-4 mt-auto border-t border-[color:var(--border-subtle)] bg-[var(--surface-sidebar)] transition-colors duration-300">
      <img
        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
        alt="User profile picture"
        src={userInfo.avatar}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <div className="text-sm font-medium text-[var(--form-section-title-color)] text-right truncate">
          {userInfo.name}
        </div>
        <div className="text-xs text-[var(--form-readonly-label-color)] text-right truncate">
          {userInfo.email}
        </div>
      </div>
    </footer>
  );
};
