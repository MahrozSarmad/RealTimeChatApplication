import React, { useState, useCallback } from 'react';
import JoinScreen from './components/JoinScreen/JoinScreen';
import ChatScreen from './components/ChatScreen/ChatScreen';
import ToastContainer from './components/ToastContainer/ToastContainer';
import { useChat } from './hooks/useChat';
import { useToast } from './hooks/useToast';
import { ReplyReference } from './types/chat.types';

/**
 * Root application component.
 * Manages the top-level screen (join vs chat), theme toggle, and chat context.
 */
const App: React.FC = () => {
  const [lightMode, setLightMode] = useState(false);
  const { toasts, showToast } = useToast();

  const chat = useChat();

  const toggleTheme = useCallback(() => {
    setLightMode((prev) => {
      document.body.classList.toggle('light-mode', !prev);
      return !prev;
    });
  }, []);

  const handleSendText = useCallback((text: string, replyTo?: ReplyReference) => {
    chat.sendText(text, replyTo);
  }, [chat]);

  const handleSendMedia = useCallback((
    mediaType: 'image' | 'file',
    dataUrl: string,
    fileName: string,
    fileSize: number,
    replyTo?: ReplyReference
  ) => {
    chat.sendMedia(mediaType, dataUrl, fileName, fileSize, replyTo);
  }, [chat]);

  return (
    <>
      {!chat.isJoined ? (
        <JoinScreen
          onJoin={chat.join}
          error={chat.joinError}
          onClearError={chat.clearJoinError}
        />
      ) : (
        <ChatScreen
          myId={chat.myId}
          myRoom={chat.myRoom ?? ''}
          isPrivate={false}
          connected={chat.connected}
          users={chat.users}
          messages={chat.messages}
          reactions={chat.reactions}
          typingUsers={chat.typingUsers}
          lightMode={lightMode}
          onToggleTheme={toggleTheme}
          onSendText={handleSendText}
          onSendMedia={handleSendMedia}
          onReact={chat.sendReaction}
          onSendTyping={chat.sendTyping}
          onShowToast={showToast}
        />
      )}

      <ToastContainer toasts={toasts} />
    </>
  );
};

export default App;
