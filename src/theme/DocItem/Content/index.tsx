import React from 'react';
import Content from '@theme-original/DocItem/Content';
import ChapterTranslation from '@site/src/components/ChapterTranslation';

export default function ContentWrapper(props) {
  return (
    <>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px' }}>
        <ChapterTranslation />
      </div>
      <Content {...props} />
    </>
  );
}
