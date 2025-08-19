"use client"
import { getMarkRange } from '@tiptap/core'
import HardBreak from '@tiptap/extension-hard-break'
import Highlight from '@tiptap/extension-highlight'
import { Table } from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import TextAlign from '@tiptap/extension-text-align'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import React from 'react'

type RichTextViewerProps = {
  content: unknown
  className?: string
  containerRef?: React.RefObject<HTMLDivElement | null>
  enableSelectionHighlight?: boolean
}

export const RichTextViewer: React.FC<RichTextViewerProps> = ({ content, className, containerRef, enableSelectionHighlight = false }) => {
  const editor = useEditor({
    editable: enableSelectionHighlight,
    // Avoid SSR hydration mismatches per Tiptap recommendation
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: true },
        orderedList: { keepMarks: true, keepAttributes: true },
        hardBreak: false, // we add HardBreak separately
      }),
      HardBreak,
  Highlight,
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    editorProps: {
      attributes: { class: 'outline-none' },
      handleKeyDown: () => true, // block typing
      handlePaste: () => true, // block paste
      handleDrop: () => true, // block drop
    },
    content: (content as unknown) || undefined,
  })

  if (!content) return null
  return (
    <div className={className} ref={containerRef}>
      {editor && (
        <div
          onMouseUp={() => {
            if (!enableSelectionHighlight || !editor) return
            const { from, to } = editor.state.selection
            if (from !== to) {
              type HighlightChain = {
                focus: () => HighlightChain
                toggleHighlight: () => HighlightChain
                run: () => boolean
              }
              const chain = editor.chain() as unknown as HighlightChain
              chain.focus().toggleHighlight().run()
            }
          }}
          onClick={() => {
            if (!enableSelectionHighlight || !editor) return
            const { from, to } = editor.state.selection
            // Only handle simple click (no selection)
            if (from !== to) return

            const $pos = editor.state.doc.resolve(from)
            const markType = editor.state.schema.marks.highlight
            const range = getMarkRange($pos, markType)
            if (range) {
              type HighlightChain = {
                focus: () => HighlightChain
                setTextSelection: (range: { from: number; to: number }) => HighlightChain
                unsetHighlight: () => HighlightChain
                run: () => boolean
              }
              const chain = editor.chain() as unknown as HighlightChain
              chain.focus().setTextSelection(range).unsetHighlight().run()
            }
          }}
        >
          <EditorContent editor={editor} />
        </div>
      )}
    </div>
  )
}

export default RichTextViewer
