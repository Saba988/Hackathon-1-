import React, { useState, FormEvent, useEffect } from 'react';
import styles from './styles.module.css';
import { authClient } from '../../lib/auth-client';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  sources?: { source: string; filename: string }[];
}

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
    const { data: session } = authClient.useSession();
  
    // Function to clear backend conversation history
    const clearBackendHistory = async () => {
      try {
        const response = await fetch('http://localhost:8000/history', {
          method: 'DELETE',
        });
        if (!response.ok) {
          console.error('Failed to clear backend chat history:', response.statusText);
        } else {
          console.log('Backend chat history cleared.');
        }
      } catch (err) {
        console.error('Error clearing backend chat history:', err);
      }
    };
  
    useEffect(() => {
      // Scroll to bottom on new message
      const chatContainer = document.getElementById('chat-messages');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
  
      // Cleanup function: Called when component unmounts
      return () => {
        clearBackendHistory();
      };
    }, [messages]);
  return (
    <div className={styles.chatbotContainer}>
      <h2 className={styles.chatbotHeader}>Ask me about Physical AI & Robotics!</h2>
      {error && <div className={styles.error}>{error}</div>}
      <div id="chat-messages" className={styles.messagesContainer}>
        {messages.map((msg) => (
          <div key={msg.id} className={`${styles.message} ${styles[msg.sender]}`}>
            <p>{msg.text}</p>
            {msg.sources && msg.sources.length > 0 && (
              <div className={styles.sources}>
                <strong>Sources:</strong>
                <ul>
                  {msg.sources.map((src, index) => (
                    <li key={index}>
                      <a href={src.source} target="_blank" rel="noopener noreferrer">
                        {src.filename}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className={`${styles.message} ${styles.bot}`}>
            <p>Thinking...</p>
          </div>
        )}
      </div>
      <form onSubmit={sendMessage} className={styles.inputForm}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question here..."
          disabled={isLoading}
          className={styles.inputField}
        />
        <button type="submit" disabled={isLoading} className={styles.sendButton}>
          Send
        </button>
      </form>
    </div>
  );
};

export default Chatbot;
