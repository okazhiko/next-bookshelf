import { TextComponentProps } from './types'

export default function AuthorComponent({ text, x, y, cell }: TextComponentProps) {
  const maxCharsPerLine = Math.floor(cell / 8)
  const lines = []
  for (let i = 0; i < text.length; i += maxCharsPerLine) {
    lines.push(text.slice(i, i + maxCharsPerLine))
  }
  
  return (
    <g>
      {lines.map((line, i) => (
        <text
          key={i}
          x={x}
          y={y + i * 12}
          textAnchor="middle"
          fontSize="8px"
          fill="#666"
          writingMode="vertical-rl"
          orientation="upright"
        >
          {line}
        </text>
      ))}
    </g>
  )
}
