import { TileProps } from './types'
import TitleComponent from './TitleComponent'
import AuthorComponent from './AuthorComponent'

export default function TileComponent({ x, y, cell, bookInfo, scaleX, scaleY }: TileProps) {
  const rectX = scaleX(x)
  const rectY = scaleY(y)
  const centerX = rectX + cell / 2
  const centerY = rectY + cell / 2
  
  // 3:1の比率でタイトルと著者を配置
  const titleHeight = cell * 0.75  // 75% (3/4)
  const authorHeight = cell * 0.25  // 25% (1/4)
  const titleY = rectY + titleHeight / 2
  const authorY = rectY + titleHeight + authorHeight / 2
  
  return (
    <g>
      <rect
        x={rectX}
        y={rectY}
        width={cell}
        height={cell}
        fill="#e99"
        stroke="#fff"
        strokeWidth="2"
      />
      {bookInfo ? (
        <>
          <TitleComponent
            text={bookInfo.title}
            x={centerX}
            y={titleY}
            cell={cell}
          />
          <AuthorComponent
            text={bookInfo.author}
            x={centerX}
            y={authorY}
            cell={cell}
          />
        </>
      ) : (
        <text
          x={centerX}
          y={centerY}
          textAnchor="middle"
          fontSize="10px"
          fill="#999"
          dy="0.35em"
        >
          {((y-1)*10 + x)}
        </text>
      )}
    </g>
  )
}
