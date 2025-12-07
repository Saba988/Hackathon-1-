import React from 'react';
// Import the original mapper
import MDXComponents from '@theme-original/MDXComponents';
import PersonalizedInsight from '@site/src/components/PersonalizedInsight';

export default {
  // Re-use the default mapping
  ...MDXComponents,
  // Map the "<PersonalizedInsight />" tag to our component
  PersonalizedInsight,
};
