'use client'
import { BookInfo } from './types'
import BookComponent from './BookComponent'

interface ShelfProps {
  category: string
  books: BookInfo[]
  shelfWidth: number
  shelfX: number
  cell: number
}

export default function Shelf({ category, books, shelfWidth, shelfX, cell }: ShelfProps): JSX.Element {
  // 棚内での本の配置を計算する関数
  function calculateShelfLayout() {
    const rows: Array<Array<BookInfo>> = []
    let currentRow: Array<BookInfo> = []
    let currentRowWidth = 0
    
    if (books.length === 0) {
      return rows // 空の配列を返す
    }
    
    books.forEach(book => {
      if (!book || typeof book.page_number !== 'number') {
        return // 無効な書籍データをスキップ
      }
      
      const baseWidth = 32
      const widthMultiplier = book.page_number / 100
      const bookWidth = Math.max(baseWidth, baseWidth * widthMultiplier)
      
      if (currentRowWidth + bookWidth > shelfWidth) {
        // 現在の行が満杯になったら新しい行を開始
        if (currentRow.length > 0) {
          rows.push(currentRow)
        }
        currentRow = [book]
        currentRowWidth = bookWidth
      } else {
        currentRow.push(book)
        currentRowWidth += bookWidth
      }
    })
    
    // 最後の行を追加
    if (currentRow.length > 0) {
      rows.push(currentRow)
    }
    
    return rows
  }

  const shelfLayout = calculateShelfLayout()

  return (
    <g className="shelf">
      {/* 棚のタイトル */}
      <text
        x={shelfX + shelfWidth / 2}
        y={30}
        textAnchor="middle"
        fontSize="16px"
        fontWeight="bold"
        fill="#333"
      >
        {category}
      </text>

      {/* 棚内の本を描画 */}
      {shelfLayout.map((row, rowIndex) => {
        let currentX = shelfX // 棚内での累積X位置
        
        return (
          <g key={rowIndex} className="shelf-row">
            {row.map((book, bookIndex) => {
              const baseWidth = 32
              const widthMultiplier = book.page_number / 100
              const bookWidth = Math.max(baseWidth, baseWidth * widthMultiplier)
              
              const rectX = currentX
              const rectY = 50 + rowIndex * cell // タイトル分のオフセット + 行の高さ
              const centerX = rectX + bookWidth / 2
              const centerY = rectY + cell / 2

              // 次の本の位置を更新
              currentX += bookWidth

              return (
                <BookComponent
                  key={bookIndex}
                  book={book}
                  x={rectX}
                  y={rectY}
                  width={bookWidth}
                  height={cell}
                />
              )
            })}
          </g>
        )
      })}
    </g>
  )
}
