import { ListeningWordGapQuestion } from '@/types/listening.type'
import React, { useEffect, useState } from 'react'
import { HighlightableText } from '../../HighlightableText'

interface ListeningWordGapProps {
  questionRange?: string
  instructions?: string
  questions: ListeningWordGapQuestion[]
  onAnswerChange: (questionId: string, answer: string) => void
  isReadOnly?: boolean
  // Optional rich content (TipTap JSON as unknown). If provided, we render it and show inputs for [1]..[n]
  content?: unknown
  selectedAnswers?: Record<string, string>
}

// Move GapInput component outside to prevent re-creation
const GapInput: React.FC<{
  id: string
  value: string
  onChange: (id: string, value: string) => void
  isReadOnly?: boolean
  displayNumber?: number
}> = React.memo(({ id, value, onChange, isReadOnly, displayNumber }) => (
  <input
    type="text"
    value={value}
    onChange={e => onChange(id, e.target.value)}
    disabled={isReadOnly}
    className="inline-block mx-1 px-1 py-0.5 border border-blue-300 rounded bg-blue-50 text-center text-xs min-w-[60px] focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
    placeholder={typeof displayNumber === 'number' ? `[${displayNumber}]` : 'Type here'}
  />
))

GapInput.displayName = 'GapInput'

type TTMark = { type?: string }
type TTNode = {
  type?: string
  text?: string
  attrs?: Record<string, unknown> | null
  content?: TTNode[]
  marks?: TTMark[]
}
type TTPDoc = { type?: string; content?: TTNode[] }

export const ListeningWordGap: React.FC<ListeningWordGapProps> = ({
  questionRange,
  instructions,
  questions,
  onAnswerChange,
  isReadOnly = false,
  content,
  selectedAnswers,
}) => {
  const [values, setValues] = useState<Record<string, string>>(selectedAnswers || {})

  // Keep local values synced with parent-provided selectedAnswers (e.g., when switching parts)
  useEffect(() => {
    if (selectedAnswers) {
      setValues(selectedAnswers)
    }
  }, [selectedAnswers])

  const handleInputChange = (questionId: string, value: string) => {
    setValues(prev => ({
      ...prev,
      [questionId]: value,
    }))
    onAnswerChange(questionId, value)
  }

  const handleHighlight = () => {}

  // Render TipTap JSON with inline GapInput replacing tokens like [31]
  const renderTipTapWithInlineGaps = (doc: TTPDoc) => {
    const numberToId: Record<number, string> = {}
    questions.forEach(q => {
      numberToId[q.questionNumber] = q.id
    })

    const renderText = (node: TTNode, key: string) => {
      const parts = (node.text || '').split(/(\[[0-9]+\])/g)
      const children = parts.map((p, idx) => {
        const m = p.match(/^\[([0-9]+)\]$/)
        if (m) {
          const num = parseInt(m[1], 10)
          const qid = numberToId[num]
          if (qid) {
            return (
              <GapInput
                key={`${key}-gap-${idx}`}
                id={qid}
                value={values[qid] || ''}
                onChange={handleInputChange}
                isReadOnly={isReadOnly}
                displayNumber={num}
              />
            )
          }
        }
        return <span key={`${key}-t-${idx}`}>{p}</span>
      })

      // Apply bold if marks include bold
      const hasBold = Array.isArray(node.marks) && node.marks.some(m => m.type === 'bold')
      return hasBold ? <strong key={key}>{children}</strong> : <React.Fragment key={key}>{children}</React.Fragment>
    }

    const renderNode = (node: TTNode, key: string): React.ReactNode => {
      if (node.type === 'text') return renderText(node, key)
      if (node.type === 'hardBreak') return <br key={key} />

      // TipTap table rendering
      if (node.type === 'table') {
        const rows = (node.content || []).map((child, i) => renderNode(child, `${key}-row-${i}`))
        return (
          <div key={key} className="overflow-x-auto my-4">
            <table className="table-auto border-collapse w-full text-sm">
              <tbody>{rows}</tbody>
            </table>
          </div>
        )
      }
      if (node.type === 'tableRow') {
        const cells = (node.content || []).map((child, i) => renderNode(child, `${key}-cell-${i}`))
        return (
          <tr key={key} className="border-b last:border-b-0">
            {cells}
          </tr>
        )
      }
      if (node.type === 'tableHeader') {
        const kids = (node.content || []).map((child, i) => renderNode(child, `${key}-${i}`))
        const colspan = (node.attrs as { colspan?: number } | undefined)?.colspan || 1
        const rowspan = (node.attrs as { rowspan?: number } | undefined)?.rowspan || 1
        return (
          <th
            key={key}
            colSpan={colspan}
            rowSpan={rowspan}
            className="px-3 py-2 border border-gray-300 bg-gray-100 font-semibold text-left align-top">
            {kids}
          </th>
        )
      }
      if (node.type === 'tableCell') {
        const kids = (node.content || []).map((child, i) => renderNode(child, `${key}-${i}`))
        const colspan = (node.attrs as { colspan?: number } | undefined)?.colspan || 1
        const rowspan = (node.attrs as { rowspan?: number } | undefined)?.rowspan || 1
        return (
          <td key={key} colSpan={colspan} rowSpan={rowspan} className="px-3 py-2 border border-gray-300 align-top">
            {kids}
          </td>
        )
      }
      if (Array.isArray(node.content)) {
        const kids = node.content.map((child, i) => renderNode(child, `${key}-${i}`))
        if (node.type === 'paragraph') return <p key={key}>{kids}</p>
        if (node.type === 'heading') {
          const lvl =
            typeof (node.attrs as { level?: number } | undefined)?.level === 'number'
              ? (node.attrs as { level?: number }).level || 3
              : 3
          if (lvl === 1) return <h1 key={key}>{kids}</h1>
          if (lvl === 2) return <h2 key={key}>{kids}</h2>
          if (lvl === 3) return <h3 key={key}>{kids}</h3>
          if (lvl === 4) return <h4 key={key}>{kids}</h4>
          if (lvl === 5) return <h5 key={key}>{kids}</h5>
          return <h6 key={key}>{kids}</h6>
        }
        return <div key={key}>{kids}</div>
      }
      return null
    }

    return <div className="prose max-w-none">{(doc.content || []).map((n, i) => renderNode(n, `n-${i}`))}</div>
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Question Header */}
      {(questionRange || instructions) && (
        <div className="bg-gray-50 border-b border-gray-200 p-3 rounded-t-lg">
          <div className="flex items-start justify-between">
            <div>
              {questionRange && <h3 className="text-md font-medium text-gray-900 mb-1">{questionRange}</h3>}
              {instructions && (
                <div className="text-gray-600 text-xs">
                  <HighlightableText text={instructions} enableInternalHighlight />
                </div>
              )}
            </div>
            {isReadOnly && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">Review Mode</span>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-4">
  <div className="container">
          {/* If rich content is provided, render with inline gaps */}
          {content ? (
            <div className="space-y-3">{renderTipTapWithInlineGaps((content || {}) as TTPDoc)}</div>
          ) : (
            <div className="text-gray-800 leading-snug space-y-4 text-sm">
              {questions.map(question => {
                const parts = question.text.split('_____')
                return (
                  <div key={question.id} className="flex items-start space-x-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-green-100 text-green-700 text-xs font-medium rounded-full flex-shrink-0">
                      {question.questionNumber}
                    </span>
                    <div className="flex-1">
                      <div className="prose max-w-none text-sm">
                        {parts.map((part, index, array) => (
                          <React.Fragment key={index}>
                            <HighlightableText text={part} className="inline" onHighlight={handleHighlight} />
                            {index < array.length - 1 && (
                              <GapInput
                                id={question.id}
                                value={values[question.id] || ''}
                                onChange={handleInputChange}
                                isReadOnly={isReadOnly}
                                displayNumber={question.questionNumber}
                              />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
