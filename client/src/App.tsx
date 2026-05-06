import React, { useState, useCallback } from 'react';
import ProfileScreen from './components/ProfileScreen/ProfileScreen';
import JoinScreen from './components/JoinScreen/JoinScreen';
import ChatScreen from './components/ChatScreen/ChatScreen';
import Dashboard from './components/Dashboard/Dashboard';
import ToastContainer from './components/ToastContainer/ToastContainer';
import { useChat } from './hooks/useChat';
import { useToast } from './hooks/useToast';
import { ReplyReference } from './types/chat.types';

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
      {chat.screen === 'profile' && (
        <ProfileScreen onSave={chat.saveProfile} />
      )}

      {chat.screen === 'join' && (
        <JoinScreen
          onJoin={chat.join}
          error={chat.joinError}
          onClearError={chat.clearJoinError}
          username={chat.userProfile?.name ?? chat.savedUsername}
          userAvatar={chat.userProfile?.avatar}
          onBack={chat.joinedGroups.length > 0 ? chat.exitChat : undefined}
        />
      )}

      {chat.screen === 'dashboard' && (
        <Dashboard
          userProfile={chat.userProfile}
          username={chat.myName ?? chat.savedUsername}
          joinedGroups={chat.joinedGroups}
          onRejoin={chat.rejoinGroup}
          onNewGroup={chat.goToJoin}
          lightMode={lightMode}
          onToggleTheme={toggleTheme}
        />
      )}

      {chat.screen === 'chat' && (
        <ChatScreen
          myId={chat.myId}
          myRoom={chat.myRoom ?? ''}
          isPrivate={false}
          isAdmin={chat.isAdmin}
          roomPassword={chat.joinedGroups.find(g => g.room === chat.myRoom)?.password}
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
          onExitChat={chat.exitChat}
          onLeaveGroup={chat.leaveGroup}
          systemNotification={chat.systemNotification}
        />
      )}

      <ToastContainer toasts={toasts} />
    </>
  );
};

export default App;
