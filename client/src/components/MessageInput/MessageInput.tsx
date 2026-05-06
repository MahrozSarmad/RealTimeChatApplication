import React, { useCallback, useRef, useEffect } from 'react';
import { ReplyReference } from '../../types/chat.types';
import { readFileAsDataUrl } from '../../utils/helpers';
import styles from './MessageInput.module.css';

interface MessageInputProps {
  connected: boolean;
  replyingTo: ReplyReference | null;
  onSendText: (text: string) => void;
  onSendMedia: (mediaType: 'image' | 'file', dataUrl: string, fileName: string, fileSize: number) => void;
  onTyping: () => void;
  onStopTyping: () => void;
  onCancelReply: () => void;
  onShowToast: (text: string) => void;
}

/**
 * The message composition area including textarea, attach buttons, reply bar, and typing indicator.
 */
const MessageInput: React.FC<MessageInputProps> = ({
  connected,
  replyingTo,
  onSendText,
  onSendMedia,
  onTyping,
  onStopTyping,
  onCancelReply,
  onShowToast,
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  const autoResize = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, []);

  const handleSend = useCallback(() => {
    const text = inputRef.current?.value.trim() ?? '';
    if (!text) return;
    if (!connected) { onShowToast('Not connected'); return; }
    onSendText(text);
    if (inputRef.current) {
      inputRef.current.value = '';
      autoResize();
    }
    onStopTyping();
  }, [connected, onSendText, onStopTyping, autoResize, onShowToast]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { onShowToast('Image too large (max 5MB)'); return; }
    const dataUrl = await readFileAsDataUrl(file);
    onSendMedia('image', dataUrl, file.name, file.size);
    e.target.value = '';
  }, [onSendMedia, onShowToast]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { onShowToast('File too large (max 10MB)'); return; }
    const dataUrl = await readFileAsDataUrl(file);
    onSendMedia('file', dataUrl, file.name, file.size);
    e.target.value = '';
  }, [onSendMedia, onShowToast]);

  // Focus input when reply starts
  useEffect(() => {
    if (replyingTo) inputRef.current?.focus();
  }, [replyingTo]);

  return (
    <div className={styles.inputArea}>
      {/* Reply bar */}
      {replyingTo && (
        <div className={styles.replyBar} role="status">
          <div className={styles.replyIcon}>↩</div>
          <div className={styles.replyContent}>
            <div className={styles.replySender}>{replyingTo.senderName}</div>
            <div className={styles.replyText}>{replyingTo.text || '[media]'}</div>
          </div>
          <button
            className={styles.replyCancel}
            onClick={onCancelReply}
            aria-label="Cancel reply"
          >
            ×
          </button>
        </div>
      )}

      <div className={styles.inputRow}>
        <div className={styles.inputWrap}>
          <textarea
            id="msg-input"
            ref={inputRef}
            className={styles.textarea}
            placeholder="Type a message..."
            rows={1}
            maxLength={2000}
            onInput={autoResize}
            onKeyDown={handleKeyDown}
            onChange={onTyping}
          />
          <div className={styles.inputActions}>
            <button
              className={styles.attachBtn}
              onClick={() => imageInputRef.current?.click()}
              title="Send image"
              aria-label="Attach image"
            >
              🖼️
            </button>
            <button
              className={styles.attachBtn}
              onClick={() => fileInputRef.current?.click()}
              title="Attach file"
              aria-label="Attach file"
            >
              📎
            </button>
          </div>
        </div>

        <button
          id="send-btn"
          className={styles.sendBtn}
          onClick={handleSend}
          disabled={!connected}
          title="Send (Enter)"
          aria-label="Send message"
        >
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageUpload}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="*/*"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />
    </div>
  );
};

export default MessageInput;
