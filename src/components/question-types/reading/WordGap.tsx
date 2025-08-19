import { RichTextViewer } from '@/components/RichTextViewer'
import React from 'react'

interface WordGapProps {
  questionRange: string
  instructions: string
  title: string
  content?: string
  contentDoc?: unknown
  numberToId?: Record<number, string>
  onAnswerChange?: (gapId: string, value: string) => void
  answers?: { [key: string]: string }
  selectedAnswersById?: Record<string, string>
}

// Move GapInput component outside to prevent re-creation
const GapInput: React.FC<{
  id: string
  placeholder: string
  value: string
  onChange: (id: string, value: string) => void
}> = React.memo(({ id, placeholder, value, onChange }) => (
  <input
    type="text"
    value={value}
    onChange={e => onChange(id, e.target.value)}
    className="inline-block mx-1 px-2 py-0.5 border border-blue-300 rounded bg-blue-50 text-center text-sm min-w-[80px] focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
    placeholder={placeholder}
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

const WordGap: React.FC<WordGapProps> = ({
  title,
  content,
  contentDoc,
  numberToId,
  onAnswerChange,
  answers = {},
  selectedAnswersById = {},
}) => {
  const renderTipTapWithInlineGaps = (doc: TTPDoc) => {
    const renderText = (node: TTNode, key: string) => {
      const text = node.text || ''

      // Check if this entire text node is a gap pattern (for bold gaps like [24])
      const exactGapMatch = text.match(/^\[([0-9]+)\]$/)
      const isBold = Array.isArray(node.marks) && node.marks.some(m => m.type === 'bold')

      if (exactGapMatch) {
        const num = parseInt(exactGapMatch[1], 10)
        const qid = numberToId?.[num]
        if (qid) {
          return (
            <input
              key={`${key}-gap`}
              type="text"
              value={selectedAnswersById[qid] || ''}
              onChange={e => onAnswerChange && onAnswerChange(qid, e.target.value)}
              className="inline-block mx-1 px-2 py-0.5 border border-blue-300 rounded bg-blue-50 text-center text-sm min-w-[80px] focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              placeholder={`[${num}]`}
            />
          )
        }
      }

      // Split text by gap patterns like [24], [25], etc. and render each part
      const parts = text.split(/(\[[0-9]+\])/g)
      const children = parts.map((part, idx) => {
        const gapMatch = part.match(/^\[([0-9]+)\]$/)
        if (gapMatch) {
          const num = parseInt(gapMatch[1], 10)
          const qid = numberToId?.[num]
          if (qid) {
            return (
              <input
                key={`${key}-gap-${idx}`}
                type="text"
                value={selectedAnswersById[qid] || ''}
                onChange={e => onAnswerChange && onAnswerChange(qid, e.target.value)}
                className="inline-block mx-1 px-2 py-0.5 border border-blue-300 rounded bg-blue-50 text-center text-sm min-w-[80px] focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                placeholder={`[${num}]`}
              />
            )
          }
        }
        return <span key={`${key}-text-${idx}`}>{part}</span>
      })

      // Apply bold formatting if marks include bold (but only for non-gap text)
      return isBold && !exactGapMatch ? <strong key={key}>{children}</strong> : <span key={key}>{children}</span>
    }

    const renderNode = (node: TTNode, key: string): React.ReactNode => {
      if (node.type === 'text') return renderText(node, key)
      if (node.type === 'hardBreak') return <br key={key} />
      if (node.type === 'paragraph')
        return <p key={key}>{(node.content || []).map((c, i) => renderNode(c, `${key}-${i}`))}</p>
      if (node.type === 'heading') {
        const kids = (node.content || []).map((c, i) => renderNode(c, `${key}-${i}`))
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
      if (Array.isArray(node.content))
        return <div key={key}>{node.content.map((c, i) => renderNode(c, `${key}-${i}`))}</div>
      return null
    }

    return <div className="prose max-w-none">{(doc.content || []).map((n, i) => renderNode(n, `n-${i}`))}</div>
  }

  // Render content using mock data
  const renderContentWithGaps = () => {
    if (contentDoc) {
      return renderTipTapWithInlineGaps((contentDoc || {}) as TTPDoc)
    }

    let contentToRender = content

    if (!contentToRender) {
      // Fallback content if mock data content is empty
      contentToRender = `In fiction robots have a personality, but reality is disappointingly different. Although sophisticated [GAP_9] to assemble cars and assist during complex surgery, modern robots are dumb automatons, [GAP_10] of striking up relationships with their human operators.

However, change is [GAP_11] the horizon. Engineers argue that, as robots begin to make [GAP_12] a bigger part of society, they will need a way to interact with humans. To this end they will need artificial personalities. The big question is this: what does a synthetic companion need to have so that you want to engage [GAP_13] it over a long period of time? Phones and computers have already shown the [GAP_14] to which people can develop relationships with inanimate electronic objects.

Looking further [GAP_15] , engineers envisage robots helping around the house, integrating with the web to place supermarket orders using email. Programming the robot with a human-like persona and [GAP_16] it the ability to learn its users' preferences, will help the person feel at ease with it. Interaction with such a digital entity in this context is more natural than sitting with a mouse and keyboard.`
    }

    // Split content into paragraphs and then process gaps
    const paragraphs = contentToRender.split('\n\n')

    return paragraphs.map((paragraph, pIndex) => {
      // Handle both [GAP_X] and [X] patterns
      const parts = paragraph.split(/(\[(?:GAP_)?\d+\])/)
      const processedParts = parts.map((part, index) => {
        // Match both [GAP_X] and [X] patterns
        const gapMatch = part.match(/\[(?:GAP_)?(\d+)\]/)
        if (gapMatch) {
          const gapNumber = gapMatch[1]
          const num = parseInt(gapNumber, 10)

          // Try to find the question ID using numberToId mapping first
          let gapId = numberToId?.[num]

          // If not found, use the old GAP_ format as fallback
          if (!gapId) {
            gapId = `word_gap_${gapNumber}`
          }

          return (
            <GapInput
              key={gapId}
              id={gapId}
              placeholder={gapNumber}
              value={selectedAnswersById?.[gapId] || answers[gapId] || ''}
              onChange={(id, value) => {
                if (onAnswerChange) {
                  onAnswerChange(id, value.trim())
                }
              }}
            />
          )
        }
        return (
          <span key={`text-${pIndex}-${index}`} className="inline">
            {part}
          </span>
        )
      })

      return (
        <p key={pIndex} className="mb-4">
          {processedParts}
        </p>
      )
    })
  }

  return (
    <div className="space-y-6">
      {/* Question Content - No more split screen */}
      <div className="space-y-4">
        <div className="text-lg font-semibold text-gray-900">
          <RichTextViewer content={title} className="prose max-w-none" />
        </div>

        <div className="text-gray-800 leading-relaxed space-y-4">{renderContentWithGaps()}</div>
      </div>
    </div>
  )
}

export default WordGap
