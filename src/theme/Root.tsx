import React, { ReactNode } from 'react';
import ChatbotWidget from '@site/src/components/ChatbotWidget/ChatbotWidget';

// Default implementation, that you can customize
export default function Root({children}: {children: ReactNode}) {
  return (
    <>
      {children}
      <ChatbotWidget />
    </>
  );
}
