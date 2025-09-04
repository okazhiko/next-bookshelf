import { BookInfo } from './types'
import TitleComponent from './TitleComponent'
import AuthorComponent from './AuthorComponent'

interface BookProps {
  book: BookInfo
  x: number
  y: number
  width: number
  height: number
}

export default function BookComponent({ book, x, y, width, height }: BookProps) {
  const centerX = x + width / 2
  const centerY = y + height / 2

  const titleHeight = height * 0.75
  const authorHeight = height * 0.25
  const titleY = y + titleHeight / 2
  const authorY = y + titleHeight + authorHeight / 2

  return (
    <g className="book">
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={book.color}
        stroke="#fff"
        strokeWidth="2"
      />

      <TitleComponent
        text={book.title}
        x={centerX}
        y={titleY}
        cell={height}
      />
      <AuthorComponent
        text={book.author}
        x={centerX}
        y={authorY}
        cell={height}
      />
    </g>
  )
}
