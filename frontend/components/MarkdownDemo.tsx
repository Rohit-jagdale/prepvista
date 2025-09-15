'use client';

import React from 'react';
import MarkdownRenderer from './MarkdownRenderer';

const MarkdownDemo: React.FC = () => {
  const sampleMarkdown = `# Module 5: Mining Data Streams

Based on the provided syllabus excerpts, **Module 5** is titled "Mining Data Streams". The module covers topics such as:

## Key Topics Covered

### 1. The Stream Data Model
- Data-Stream-Management Systems
- Stream sources and queries
- Processing issues

### 2. Sampling Data Techniques in a Stream
- Various sampling methods
- Stream processing algorithms

### 3. Filtering Streams
- **Bloom Filters** and their analysis
- Efficient filtering techniques

### 4. Counting Distinct Elements in a Stream
- The Count-Distinct Problem
- The Flajolet-Martin Algorithm
- Combining estimates
- Space requirements

### 5. Counting Frequent Items in a Stream
- Sampling methods for streams
- Frequent itemsets in decaying windows

### 6. Counting Ones in a Window
- Cost of exact counts
- The Datar-Gionis-Indyk-Motwani algorithm (DGIM)
- Query answering within the DGIM algorithm
- Decaying windows

## Additional Information

> **Note**: Source 1 also lists sections related to stream processing, but it doesn't explicitly state that this content belongs to "Module 5." However, the content in Source 1 aligns perfectly with the topics outlined in the Module 5 description from Sources 2 and 4.

### Code Example

\`\`\`python
def count_distinct_elements(stream):
    """
    Count distinct elements in a data stream
    using the Flajolet-Martin algorithm
    """
    hash_values = set()
    for element in stream:
        hash_val = hash(element)
        hash_values.add(hash_val)
    return len(hash_values)
\`\`\`

### Table of Contents

| Topic | Description | Complexity |
|-------|-------------|------------|
| Stream Data Model | Basic concepts | Low |
| Bloom Filters | Probabilistic data structures | Medium |
| Flajolet-Martin | Counting distinct elements | High |
| DGIM Algorithm | Counting ones in windows | High |

---

This comprehensive coverage makes Module 5 essential for understanding **stream processing** and **real-time data analysis** in modern systems.`;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Markdown Renderer Demo
      </h1>
      
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Sample RAG Response (Markdown Formatted)
        </h2>
        
        <MarkdownRenderer content={sampleMarkdown} />
      </div>
      
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-800 mb-3">
          Features Supported:
        </h3>
        <ul className="list-disc list-inside text-gray-700 space-y-1">
          <li>Headers (H1-H6)</li>
          <li>Bold and italic text</li>
          <li>Bullet points and numbered lists</li>
          <li>Code blocks with syntax highlighting</li>
          <li>Inline code</li>
          <li>Blockquotes</li>
          <li>Tables</li>
          <li>Horizontal rules</li>
          <li>Links</li>
        </ul>
      </div>
    </div>
  );
};

export default MarkdownDemo;
