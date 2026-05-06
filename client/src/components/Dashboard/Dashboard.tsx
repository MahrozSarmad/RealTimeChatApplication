import React, { useState } from 'react';
import { JoinedGroup } from '../../types/chat.types';
import { UserProfile } from '../../hooks/useChat';
import { avatarColor } from '../../utils/helpers';
import styles from './Dashboard.module.css';

interface DashboardProps {
  userProfile: UserProfile | null;
  username: string | null;
  joinedGroups: JoinedGroup[];
  onRejoin: (group: JoinedGroup) => void;
  onNewGroup: () => void;
  lightMode: boolean;
  onToggleTheme: () => void;
}

const timeAgo = (ts: number): string => {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const Dashboard: React.FC<DashboardProps> = ({
  userProfile,
  username,
  joinedGroups,
  onRejoin,
  onNewGroup,
  lightMode,
  onToggleTheme,
}) => {
  const [search, setSearch] = useState('');

  const filtered = joinedGroups.filter(g =>
    g.room.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.screen}>
      {/* Top bar */}
      <header className={styles.topBar}>
        <div className={styles.topLeft}>
          <div className={styles.logo}>Pulse</div>
        </div>
        <div className={styles.topRight}>
          <button className={styles.iconBtn} onClick={onToggleTheme} title="Toggle theme">
            {lightMode ? '☀️' : '🌙'}
          </button>
          <button className={styles.newGroupBtn} onClick={onNewGroup}>
            <span>＋</span> New Group
          </button>
        </div>
      </header>

      <div className={styles.content}>
        {/* Profile card */}
        {userProfile && (
          <div className={styles.profileCard}>
            <div className={styles.profileAvatar}>{userProfile.avatar}</div>
            <div className={styles.profileInfo}>
              <div className={styles.profileName}>{userProfile.name}</div>
              {userProfile.bio && <div className={styles.profileBio}>{userProfile.bio}</div>}
              <div className={styles.profileMeta}>
                Member since {new Date(userProfile.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        )}

        {/* Search bar */}
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search groups..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Groups list */}
        <div className={styles.groupsSection}>
          <div className={styles.sectionLabel}>
            Your Groups
            <span className={styles.badge}>{joinedGroups.length}</span>
          </div>

          {filtered.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>{joinedGroups.length === 0 ? '💬' : '🔍'}</div>
              <div>{joinedGroups.length === 0 ? 'No groups yet. Create or join one!' : 'No groups found'}</div>
            </div>
          ) : (
            <div className={styles.groupList}>
              {filtered.map((group) => (
                <button
                  key={group.room}
                  className={styles.groupCard}
                  onClick={() => onRejoin(group)}
                >
                  <div
                    className={styles.groupAvatar}
                    style={{ background: `linear-gradient(135deg, ${avatarColor(group.room)}, ${avatarColor(group.room + '1')})` }}
                  >
                    {group.room[0].toUpperCase()}
                  </div>
                  <div className={styles.groupInfo}>
                    <div className={styles.groupName}>#{group.room}</div>
                    <div className={styles.groupMeta}>
                      <span className={`${styles.typeBadge} ${group.roomType === 'private' ? styles.private : styles.public}`}>
                        {group.roomType === 'private' ? '🔒 Private' : '🌐 Public'}
                      </span>
                      {group.isAdmin && <span className={styles.adminBadge}>👑 Admin</span>}
                      <span className={styles.lastSeen}>{timeAgo(group.lastJoined)}</span>
                    </div>
                  </div>
                  <div className={styles.groupArrow}>→</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Join new prompt */}
        <div className={styles.joinPrompt}>
          <p>Want to join a different group?</p>
          <button className={styles.joinLink} onClick={onNewGroup}>
            Enter a room name →
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
