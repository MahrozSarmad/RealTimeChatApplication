import React from 'react';
import { ChatMessage, ReactionMap, ReplyReference } from '../../types/chat.types';
import { formatTime, buildDateLabel, getFileIcon, formatSize } from '../../utils/helpers';
import styles from './MessageBubble.module.css';

const REACTION_EMOJIS = ['❤️', '😂', '👍', '😮', '😢', '🔥'];

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  myId: string | null;
  reactions: ReactionMap;
  prevTimestamp?: number;
  onReact: (messageId: string, emoji: string, action: 'add' | 'remove') => void;
  onReply: (ref: ReplyReference) => void;
  onScrollToReply: (msgId: string) => void;
  onOpenLightbox: (src: string) => void;
  msgRef?: (el: HTMLDivElement | null) => void;
}

/**
 * Renders a single chat message bubble with reactions, replies, and hover actions.
 */
const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  myId,
  reactions,
  prevTimestamp,
  onReact,
  onReply,
  onScrollToReply,
  onOpenLightbox,
  msgRef,
}) => {
  const [pickerOpen, setPickerOpen] = React.useState(false);

  const time = formatTime(message.timestamp);

  // Date separator
  const dateLabel = buildDateLabel(message.timestamp);
  const prevDateLabel = prevTimestamp ? buildDateLabel(prevTimestamp) : null;
  const showDate = dateLabel !== prevDateLabel;

  const handleToggleReaction = (emoji: string) => {
    const users = reactions[emoji] ?? [];
    const action: 'add' | 'remove' = myId && users.includes(myId) ? 'remove' : 'add';
    onReact(message.id, emoji, action);
  };

  if (message.type === 'system') {
    return (
      <div className={styles.system} ref={msgRef}>
        {message.text}
      </div>
    );
  }

  return (
    <>
      {showDate && (
        <div className={styles.dateSeparator} role="separator">
          {dateLabel}
        </div>
      )}

      <div
        className={`${styles.row} ${isOwn ? styles.sent : styles.recv}`}
        data-msg-id={message.id}
        ref={msgRef}
      >
        {/* Hover actions */}
        <div className={styles.actions}>
          <button
            className={styles.actionBtn}
            title="React"
            aria-label="Add reaction"
            onClick={(e) => { e.stopPropagation(); setPickerOpen((o) => !o); }}
          >
            😊
          </button>
          <button
            className={styles.actionBtn}
            title="Reply"
            aria-label="Reply to message"
            onClick={() => onReply({ id: message.id, senderName: message.senderName, text: message.text })}
          >
            ↩
          </button>
        </div>

        {/* Reaction picker */}
        {pickerOpen && (
          <div className={styles.reactionPicker}>
            {REACTION_EMOJIS.map((emoji) => (
              <span
                key={emoji}
                className={styles.reactionOption}
                onClick={(e) => { e.stopPropagation(); handleToggleReaction(emoji); setPickerOpen(false); }}
              >
                {emoji}
              </span>
            ))}
          </div>
        )}

        {/* Reply preview */}
        {message.replyTo && (
          <div
            className={styles.replyPreview}
            role="button"
            tabIndex={0}
            onClick={() => onScrollToReply(message.replyTo!.id)}
          >
            <div className={styles.replySender}>{message.replyTo.senderName}</div>
            <div className={styles.replyText}>{message.replyTo.text || '[media]'}</div>
          </div>
        )}

        {/* Meta */}
        <div className={styles.meta}>
          {!isOwn && <span className={styles.sender}>{message.senderName}</span>}
          <span className={styles.time}>{time}</span>
          {isOwn && <span className={styles.tick}>✓</span>}
        </div>

        {/* Bubble */}
        <div className={`${styles.bubble} ${message.mediaType === 'image' ? styles.hasImage : ''}`}>
          {message.mediaType === 'image' && message.mediaData ? (
            <>
              <img
                className={styles.bubbleImage}
                src={message.mediaData}
                alt={message.fileName ?? 'image'}
                onClick={() => onOpenLightbox(message.mediaData!)}
              />
              {message.text && <div className={styles.imageCaption}>{message.text}</div>}
            </>
          ) : message.mediaType === 'file' && message.mediaData ? (
            <a
              className={styles.fileAttachment}
              href={message.mediaData}
              download={message.fileName ?? 'file'}
            >
              <span className={styles.fileIcon}>{getFileIcon(message.fileName)}</span>
              <div className={styles.fileInfo}>
                <div className={styles.fileName}>{message.fileName ?? 'file'}</div>
                <div className={styles.fileSize}>{formatSize(message.fileSize ?? 0)}</div>
              </div>
            </a>
          ) : (
            <span>{message.text}</span>
          )}
        </div>

        {/* Reactions bar */}
        {Object.keys(reactions).length > 0 && (
          <div className={styles.reactionsBar}>
            {Object.entries(reactions).map(([emoji, users]) =>
              users.length > 0 ? (
                <button
                  key={emoji}
                  className={`${styles.reactionChip} ${myId && users.includes(myId) ? styles.mine : ''}`}
                  onClick={() => handleToggleReaction(emoji)}
                >
                  {emoji}
                  <span className={styles.reactionCount}>{users.length}</span>
                </button>
              ) : null
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default React.memo(MessageBubble);
