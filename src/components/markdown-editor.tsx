'use client';

import React, { useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import Showdown from 'showdown';
import TurndownService from 'turndown';

// Dynamic import for ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function MarkdownEditor({ value, onChange, className }: MarkdownEditorProps) {
  // Converters
  const converter = useMemo(() => new Showdown.Converter({
    simplifiedAutoLink: true,
    strikethrough: true,
    tables: true,
    tasklists: true,
    openLinksInNewWindow: true,
    emoji: true
  }), []);

  const turndownService = useMemo(() => {
    const service = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced'
    });
    return service;
  }, []);

  // Convert Markdown to HTML for the editor
  // Memoize this to prevent cursor jumping on every render if possible, 
  // though 2-way binding with conversion is tricky.
  // We only update the HTML from props if the markdown value has changed significantly 
  // or if it's the initial load. 
  // A common issue with MD<->HTML editors is the loop.
  // We'll rely on ReactQuill's internal management and only push updates if needed.
  
  // For simplicity in this iteration, we accept that re-rendering might be slightly heavy.
  const htmlValue = useMemo(() => {
      return converter.makeHtml(value);
  }, [value, converter]);

  const handleChange = (content: string, delta: any, source: string, editor: any) => {
    // Only trigger change if the user typed (source === 'user')
    // This helps avoid loops.
    if (source === 'user') {
        const markdown = turndownService.turndown(content);
        onChange(markdown);
    }
  };

  // Custom Toolbar options to look like Google Docs / Word
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
      ['blockquote', 'code-block'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
      [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
      [{ 'direction': 'rtl' }],                         // text direction
      [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
      [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
      [{ 'font': [] }],
      [{ 'align': [] }],
      ['clean']                                         // remove formatting button
    ]
  };

  return (
    <div className={`bg-white text-black rounded-md max-w-full ${className}`}>
      <style jsx global>{`
        .ql-toolbar {
            display: flex !important;
            flex-wrap: wrap !important;
            height: auto !important;
            width: 100%;
            box-sizing: border-box;
            padding: 8px !important;
        }
        .ql-formats {
            margin-right: 10px !important;
            margin-bottom: 5px !important;
        }
        .ql-editor {
          white-space: pre-wrap !important;
          overflow-wrap: break-word !important;
          word-break: break-word !important;
          max-width: 100%;
          box-sizing: border-box;
        }
        .ql-editor p {
            overflow-wrap: break-word;
            word-break: break-word;
        }
        .ql-container {
            font-family: inherit;
            font-size: inherit;
            max-width: 100%;
            box-sizing: border-box;
        }
      `}</style>
      <ReactQuill 
        theme="snow"
        value={htmlValue}
        onChange={handleChange}
        modules={modules}
        className="h-full min-h-[300px]"
      />
    </div>
  );
}
