'use client';

import React, { useMemo, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import Showdown from 'showdown';
import TurndownService from 'turndown';
import { Wand2, Loader2, Play } from 'lucide-react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Textarea } from './ui/textarea';
import { useToast } from '@/hooks/use-toast';

// Dynamic import for ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onAiEdit?: (selectedText: string, prompt: string) => Promise<string>;
  className?: string;
  id?: string;
}

const CustomToolbar = ({ id, onAiClick }: { id: string, onAiClick: () => void }) => (
  <div id={id} className="flex flex-wrap items-center gap-1 border-b p-2">
    <select className="ql-header" defaultValue="" onChange={e => e.persist()}>
      <option value="1" />
      <option value="2" />
      <option value="3" />
      <option value="" />
    </select>
    <button className="ql-bold" />
    <button className="ql-italic" />
    <button className="ql-underline" />
    <button className="ql-strike" />
    <button className="ql-blockquote" />
    <button className="ql-code-block" />
    <button className="ql-list" value="ordered" />
    <button className="ql-list" value="bullet" />
    <button className="ql-script" value="sub" />
    <button className="ql-script" value="super" />
    <button className="ql-indent" value="-1" />
    <button className="ql-indent" value="+1" />
    <button className="ql-direction" value="rtl" />
    <select className="ql-align" defaultValue="" onChange={e => e.persist()} />
    <select className="ql-color" defaultValue="" onChange={e => e.persist()} />
    <select className="ql-background" defaultValue="" onChange={e => e.persist()} />
    <button className="ql-clean" />
    <Button 
        variant="ghost" 
        size="icon" 
        className="h-6 w-6 ml-2 text-primary hover:text-primary hover:bg-primary/10" 
        onClick={(e) => { e.preventDefault(); onAiClick(); }}
        title="AI Edit Selection"
    >
        <Wand2 className="h-4 w-4" />
    </Button>
  </div>
);

export default function MarkdownEditor({ value, onChange, onAiEdit, className, id = "toolbar" }: MarkdownEditorProps) {
  const { toast } = useToast();
  const quillRef = useRef<any>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
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

  const htmlValue = useMemo(() => {
      return converter.makeHtml(value);
  }, [value, converter]);

  const handleChange = (content: string, delta: any, source: string, editor: any) => {
    if (source === 'user') {
        const markdown = turndownService.turndown(content);
        onChange(markdown);
    }
  };

  const handleAiClick = () => {
      const quill = quillRef.current?.getEditor();
      if (!quill) return;
      
      const range = quill.getSelection();
      if (!range || range.length === 0) {
          toast({ description: "Please select some text to edit with AI.", duration: 2000 });
          return;
      }
      setIsAiOpen(true);
  };

  const handleAiSubmit = async () => {
      if (!onAiEdit || !aiPrompt.trim()) return;
      
      const quill = quillRef.current?.getEditor();
      if (!quill) return;

      const range = quill.getSelection();
      if (!range) return;

      const selectedText = quill.getText(range.index, range.length);
      setIsAiLoading(true);

      try {
          const newText = await onAiEdit(selectedText, aiPrompt);
          // Insert text at selection (replaces selection)
          quill.deleteText(range.index, range.length);
          quill.insertText(range.index, newText);
          
          // Trigger change manually to update markdown state
          const content = quill.root.innerHTML;
          const markdown = turndownService.turndown(content);
          onChange(markdown);
          
          setAiPrompt('');
          setIsAiOpen(false);
      } catch (error) {
          console.error("AI Edit failed:", error);
          toast({ variant: "destructive", title: "AI Edit Failed", description: "Could not process the text." });
      } finally {
          setIsAiLoading(false);
      }
  };

  const modules = useMemo(() => ({
    toolbar: {
      container: `#${id}`,
    }
  }), [id]);

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
            border-bottom: 1px solid #e2e8f0 !important;
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
          min-height: 200px;
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
      
      <CustomToolbar id={id} onAiClick={handleAiClick} />
      
      <div className="relative">
        <ReactQuill 
            ref={quillRef}
            theme="snow"
            value={htmlValue}
            onChange={handleChange}
            modules={modules}
            className="h-full"
        />
        
        {/* Floating AI Input Popover - positioned centrally for simplicity or controlled via state */}
        <Popover open={isAiOpen} onOpenChange={setIsAiOpen}>
            <PopoverTrigger asChild>
                <div className="absolute top-2 right-2 w-1 h-1 pointer-events-none" />
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end" sideOffset={-40}>
                <div className="p-3 space-y-3 bg-background border rounded-lg shadow-lg">
                    <div className="flex items-center gap-2 text-sm font-medium text-primary">
                        <Wand2 className="h-4 w-4" />
                        <span>AI Edit Selection</span>
                    </div>
                    <Textarea 
                        placeholder="How should I change this text?" 
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        className="min-h-[80px] text-sm resize-none"
                        autoFocus
                    />
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setIsAiOpen(false)}>Cancel</Button>
                        <Button size="sm" onClick={handleAiSubmit} disabled={isAiLoading || !aiPrompt.trim()}>
                            {isAiLoading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Play className="mr-2 h-3 w-3" />}
                            Apply
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
