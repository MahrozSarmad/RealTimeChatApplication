import React, { useCallback, useRef, useState } from 'react';
import { ChatMessage, ReplyReference } from '../../types/chat.types';
import { ReactionMap } from '../../types/chat.types';
import { UserInfo } from '../../types/chat.types';
import ChatHeader from '../ChatHeader/ChatHeader';
import MessageBubble from '../MessageBubble/MessageBubble';
import MessageInput from '../MessageInput/MessageInput';
import UsersPanel from '../UsersPanel/UsersPanel';
import TypingIndicator from '../TypingIndicator/TypingIndicator';
import DropOverlay from '../DropOverlay/DropOverlay';
import Lightbox from '../Lightbox/Lightbox';
import { readFileAsDataUrl } from '../../utils/helpers';
import { useScrollManager } from '../../hooks/useScrollManager';
import { useTyping } from '../../hooks/useTyping';
import styles from './ChatScreen.module.css';

interface ChatScreenProps {
  myId: string | null;
  myRoom: string;
  isPrivate: boolean;
  isAdmin: boolean;
  roomPassword?: string;
  connected: boolean;
  users: UserInfo[];
  messages: ChatMessage[];
  reactions: Record<string, ReactionMap>;
  typingUsers: Record<string, string>;
  lightMode: boolean;
  onToggleTheme: () => void;
  onSendText: (text: string, replyTo?: ReplyReference) => void;
  onSendMedia: (mediaType: 'image' | 'file', dataUrl: string, fileName: string, fileSize: number, replyTo?: ReplyReference) => void;
  onReact: (messageId: string, emoji: string, action: 'add' | 'remove') => void;
  onSendTyping: (isTyping: boolean) => void;
  onShowToast: (text: string) => void;
  onExitChat: () => void;
  onLeaveGroup: () => void;
  systemNotification?: string | null;
}

/**
 * The main chat screen composed from modular sub-components.
 */
const ChatScreen: React.FC<ChatScreenProps> = ({
  myId,
  myRoom,
  isPrivate,
  isAdmin,
  roomPassword,
  connected,
  users,
  messages,
  reactions,
  typingUsers,
  lightMode,
  onToggleTheme,
  onSendText,
  onSendMedia,
  onReact,
  onSendTyping,
  onShowToast,
  onExitChat,
  onLeaveGroup,
  systemNotification,
}) => {
  const [panelOpen, setPanelOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ReplyReference | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const msgRefMap = useRef<Record<string, HTMLDivElement | null>>({});

  const { containerRef, unreadCount, scrollToBottom, handleScroll, atBottom } =
    useScrollManager(messages.length);

  const { startTyping, stopTyping } = useTyping(onSendTyping);

  const handleSendText = useCallback((text: string) => {
    onSendText(text, replyingTo ?? undefined);
    setReplyingTo(null);
    stopTyping();
  }, [onSendText, replyingTo, stopTyping]);

  const handleSendMedia = useCallback((
    mediaType: 'image' | 'file',
    dataUrl: string,
    fileName: string,
    fileSize: number
  ) => {
    onSendMedia(mediaType, dataUrl, fileName, fileSize, replyingTo ?? undefined);
    setReplyingTo(null);
  }, [onSendMedia, replyingTo]);

  const handleScrollToReply = useCallback((msgId: string) => {
    const el = msgRefMap.current[msgId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.outline = '2px solid var(--accent)';
      el.style.borderRadius = '12px';
      setTimeout(() => { el.style.outline = ''; el.style.borderRadius = ''; }, 1500);
    }
  }, []);

  const handleDropFiles = useCallback(async (files: File[]) => {
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        if (file.size > 5 * 1024 * 1024) { onShowToast('Image too large (max 5MB)'); continue; }
        const dataUrl = await readFileAsDataUrl(file);
        onSendMedia('image', dataUrl, file.name, file.size);
      } else {
        if (file.size > 10 * 1024 * 1024) { onShowToast('File too large (max 10MB)'); continue; }
        const dataUrl = await readFileAsDataUrl(file);
        onSendMedia('file', dataUrl, file.name, file.size);
      }
    }
  }, [onSendMedia, onShowToast]);

  return (
    <div className={styles.screen}>
      {/* Connection banner */}
      {!connected && (
        <div id="conn-banner" className={styles.connBanner} role="alert">
          ⚠ Disconnected — reconnecting...
        </div>
      )}

      <ChatHeader
        room={myRoom}
        isPrivate={isPrivate}
        isAdmin={isAdmin}
        roomPassword={roomPassword}
        connected={connected}
        users={users}
        lightMode={lightMode}
        onToggleTheme={onToggleTheme}
        onOpenUsers={() => setPanelOpen(true)}
        unreadCount={unreadCount}
        onExitChat={onExitChat}
        onLeaveGroup={onLeaveGroup}
      />

      {/* System notification (transient pill) */}
      {systemNotification && (
        <div className={styles.sysNotif} role="status" aria-live="polite">
          {systemNotification}
        </div>
      )}

      {/* Messages area */}
      <div className={styles.messagesOuter}>
        <div
          id="messages-area"
          className={styles.messagesArea}
          ref={containerRef}
          onScroll={handleScroll}
        >
          {messages.length === 0 && (
            <div id="empty-state" className={styles.emptyState}>
              <div className={styles.emptyIcon}>🔮</div>
              <div>No messages yet.<br />Say something!</div>
            </div>
          )}

          {/* System messages are interspersed via ChatMessage type checking */}
          {messages.map((msg, idx) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={!!msg.own || msg.senderId === myId}
              myId={myId}
              reactions={reactions[msg.id] ?? {}}
              prevTimestamp={messages[idx - 1]?.timestamp}
              onReact={onReact}
              onReply={setReplyingTo}
              onScrollToReply={handleScrollToReply}
              onOpenLightbox={setLightboxSrc}
              msgRef={(el) => { msgRefMap.current[msg.id] = el; }}
            />
          ))}
        </div>

        {/* Scroll to bottom button */}
        {!atBottom && (
          <button
            id="scroll-btn"
            className={styles.scrollBtn}
            onClick={() => scrollToBottom(true)}
            aria-label="Scroll to latest messages"
          >
            ↓
            {unreadCount > 0 && (
              <span className={styles.scrollBadge}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Typing + Input */}
      <div className={styles.inputSection}>
        <TypingIndicator typingUsers={typingUsers} />
        <MessageInput
          connected={connected}
          replyingTo={replyingTo}
          onSendText={handleSendText}
          onSendMedia={handleSendMedia}
          onTyping={startTyping}
          onStopTyping={stopTyping}
          onCancelReply={() => setReplyingTo(null)}
          onShowToast={onShowToast}
        />
      </div>

      {/* Side panel */}
      <UsersPanel
        users={users}
        myId={myId}
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
      />

      {/* Global overlays */}
      <DropOverlay enabled={true} onDropFiles={handleDropFiles} />
      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  );
};

export default ChatScreen;
