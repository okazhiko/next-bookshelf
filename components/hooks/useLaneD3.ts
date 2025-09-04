import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import BOOKS from '../BOOKS'
import { BookInfo } from '../types'
import Shelf from '../Shelf'

export function useLaneD3() {
  const ref = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const container = ref.current
    if (!container) return

    function computeLayout() {
      // vw: 90, vh: h1要素を除いた残りのスペース
      const w = Math.floor(window.innerWidth * 0.9) || 800
      const h = Math.floor((window.innerHeight - 80) * 0.9) || 600 // h1要素の高さを80pxとして計算
      const cell = Math.max(10, Math.floor(Math.min(w, h) / 2))
      return { width: w, height: h, cell }
    }

    const { width, height, cell } = computeLayout()

    const svg = d3.create('svg')
      .attr('viewBox', [0, 0, width, height])
      .attr('width', width)
      .attr('height', height)

    const g = svg.append('g')

    const scaleX = d3.scaleLinear().domain([0, width / cell]).range([0, width])
    const scaleY = d3.scaleLinear().domain([0, height / cell]).range([0, height])

    const mapData = new Map<string, BookInfo | null>()
    let aryData: Array<{ shelfIndex: number, rowIndex: number, bookIndex: number, bookInfo: BookInfo | null }> = []

    // 書籍をカテゴリごとにグループ化
    const booksByCategory = new Map<string, Array<any>>()
    BOOKS.forEach(book => {
      if (!booksByCategory.has(book.category)) {
        booksByCategory.set(book.category, [])
      }
      booksByCategory.get(book.category)!.push(book)
    })

    // 棚の設定
    const shelfWidth = Math.floor(window.innerWidth * 0.6)
    const shelfGap = 20 // 棚間の隙間
    const categories = Array.from(booksByCategory.keys())
    const totalShelves = categories.length

    // 棚内での本の配置を計算する関数
    function calculateShelfLayout(category: string) {
      const books = booksByCategory.get(category) || []
      const rows: Array<Array<any>> = []
      let currentRow: Array<any> = []
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

    function getKey(shelfIndex: number, rowIndex: number, bookIndex: number): string { 
      return `${shelfIndex},${rowIndex},${bookIndex}` 
    }
    
    function calcBookInfo(shelfIndex: number, rowIndex: number, bookIndex: number): BookInfo | null {
      if (categories.length === 0) {
        return null
      }
      
      const category = categories[shelfIndex % categories.length]
      const shelfLayout = calculateShelfLayout(category)
      
      if (rowIndex >= 0 && rowIndex < shelfLayout.length) {
        const row = shelfLayout[rowIndex]
        if (bookIndex >= 0 && bookIndex < row.length) {
          const book = row[bookIndex]
          if (book && book.id && book.title && book.author) {
            return { 
              id: book.id, 
              title: book.title, 
              author: book.author,
              page_number: book.page_number || 100,
              color: book.color || '#e99',
              category: book.category || '未分類'
            }
          }
        }
      }
      return null
    }
    function setValue(shelfIndex: number, rowIndex: number, bookIndex: number, bookInfo: BookInfo | null): void { 
      mapData.set(getKey(shelfIndex, rowIndex, bookIndex), bookInfo) 
    }
    function getValue(shelfIndex: number, rowIndex: number, bookIndex: number): BookInfo | null {
      const k = getKey(shelfIndex, rowIndex, bookIndex);
      let v = mapData.get(k);
      if (v === undefined) { v = calcBookInfo(shelfIndex, rowIndex, bookIndex); setValue(shelfIndex, rowIndex, bookIndex, v) }
      return v
    }

    function loadData(shelfX0: number, shelfX1: number, rowY0: number, rowY1: number): void {
      if (categories.length === 0) {
        return
      }
      
      const shelfXs = Math.floor(shelfX0), shelfXe = Math.floor(shelfX1) + 1
      const rowYs = Math.floor(rowY0), rowYe = Math.floor(rowY1) + 1
      const added: Array<{ shelfIndex: number, rowIndex: number, bookIndex: number, bookInfo: BookInfo | null }> = []
      
      for (let shelfX = shelfXs; shelfX <= shelfXe; shelfX++) {
        const category = categories[shelfX % categories.length]
        const shelfLayout = calculateShelfLayout(category)
        
        for (let rowY = rowYs; rowY <= rowYe; rowY++) {
          if (rowY < shelfLayout.length) {
            const row = shelfLayout[rowY]
            if (row && Array.isArray(row)) {
              for (let bookIndex = 0; bookIndex < row.length; bookIndex++) {
                const key = getKey(shelfX, rowY, bookIndex)
                if (!mapData.has(key)) {
                  added.push({ shelfIndex: shelfX, rowIndex: rowY, bookIndex, bookInfo: getValue(shelfX, rowY, bookIndex) })
                }
              }
            }
          }
        }
      }
      if (added.length) { aryData = aryData.concat(added); drawGrid(aryData) }
    }

    function drawGrid(data: Array<{ shelfIndex: number, rowIndex: number, bookIndex: number, bookInfo: BookInfo | null }>): void {
      g.selectAll('*').remove()

      // 棚ごとにグループ化
      const shelfGroups = new Map<number, Array<{ shelfIndex: number, rowIndex: number, bookIndex: number, bookInfo: BookInfo | null }>>()
      data.forEach(item => {
        if (!shelfGroups.has(item.shelfIndex)) {
          shelfGroups.set(item.shelfIndex, [])
        }
        shelfGroups.get(item.shelfIndex)!.push(item)
      })

      // 各棚を描画
      shelfGroups.forEach((shelfItems, shelfIndex) => {
        const category = categories[shelfIndex % categories.length]
        const shelfX = shelfIndex * (shelfWidth + shelfGap)
        
        // 棚のタイトルを描画
        g.append('text')
          .attr('x', shelfX + shelfWidth / 2)
          .attr('y', 30)
          .attr('text-anchor', 'middle')
          .attr('font-size', '16px')
          .attr('font-weight', 'bold')
          .attr('fill', '#333')
          .text(category)

        // 棚内の行ごとにグループ化
        const rowGroups = new Map<number, Array<{ shelfIndex: number, rowIndex: number, bookIndex: number, bookInfo: BookInfo | null }>>()
        shelfItems.forEach(item => {
          if (!rowGroups.has(item.rowIndex)) {
            rowGroups.set(item.rowIndex, [])
          }
          rowGroups.get(item.rowIndex)!.push(item)
        })

        // 各行を処理
        rowGroups.forEach((rowItems, rowIndex) => {
          // 行内のアイテムをbookIndexでソート
          rowItems.sort((a, b) => a.bookIndex - b.bookIndex)
          
          let currentX = shelfX // 棚内での累積X位置
          
          rowItems.forEach((item) => {
            const tileGroup = g.append('g').attr('class', 'tile')
            const rectY = 50 + rowIndex * cell // タイトル分のオフセット + 行の高さ
            
            // page_numberに基づいてタイルの横幅を調整
            const baseWidth = 32
            const widthMultiplier = item.bookInfo ? item.bookInfo.page_number / 100 : 1
            const tileWidth = Math.max(baseWidth, baseWidth * widthMultiplier)
            
            // 連続配置のためのX位置計算
            const rectX = currentX
            const centerX = rectX + tileWidth / 2
            const centerY = rectY + cell / 2

            // タイルの背景
            tileGroup.append('rect')
              .attr('x', rectX)
              .attr('y', rectY)
              .attr('width', tileWidth)
              .attr('height', cell)
              .attr('fill', item.bookInfo ? item.bookInfo.color : '#e99')
              .attr('stroke', '#fff')
              .attr('stroke-width', '2')

            if (item.bookInfo) {
              // 3:1の比率でタイトルと著者を配置
              const titleHeight = cell * 0.75  // 75% (3/4)
              const authorHeight = cell * 0.25  // 25% (1/4)
              const titleY = rectY + titleHeight / 2
              const authorY = rectY + titleHeight + authorHeight / 2

              // タイトルを縦書きで描画
              const titleLines: string[] = []
              const maxCharsPerLine = Math.floor(tileWidth / 8)
              for (let i = 0; i < item.bookInfo.title.length; i += maxCharsPerLine) {
                titleLines.push(item.bookInfo.title.slice(i, i + maxCharsPerLine))
              }

              titleLines.forEach((line, i) => {
                tileGroup.append('text')
                  .attr('x', centerX)
                  .attr('y', titleY + i * 12)
                  .attr('text-anchor', 'middle')
                  .attr('font-size', '8px')
                  .attr('fill', '#333')
                  .attr('writing-mode', 'vertical-rl')
                  .attr('text-orientation', 'upright')
                  .text(line)
              })

              // 著者を縦書きで描画
              const authorLines: string[] = []
              for (let i = 0; i < item.bookInfo.author.length; i += maxCharsPerLine) {
                authorLines.push(item.bookInfo.author.slice(i, i + maxCharsPerLine))
              }

              authorLines.forEach((line, i) => {
                tileGroup.append('text')
                  .attr('x', centerX)
                  .attr('y', authorY + i * 12)
                  .attr('text-anchor', 'middle')
                  .attr('font-size', '8px')
                  .attr('fill', '#666')
                  .attr('writing-mode', 'vertical-rl')
                  .attr('text-orientation', 'upright')
                  .text(line)
              })
            } else {
              // IDを表示
              tileGroup.append('text')
                .attr('x', centerX)
                .attr('y', centerY)
                .attr('text-anchor', 'middle')
                .attr('font-size', '10px')
                .attr('fill', '#999')
                .attr('dy', '0.35em')
                .text(item.bookIndex)
            }
            
            // 次のタイルの位置を更新
            currentX += tileWidth
          })
        })
      })
    }

    // 初期データの読み込み（表示される棚の範囲を計算）
    if (categories.length > 0) {
      const visibleShelves = Math.ceil(width / (shelfWidth + shelfGap)) + 2 // 余裕を持って+2
      const visibleRows = Math.ceil(height / cell) + 2
      loadData(0, visibleShelves, 0, visibleRows)
      drawGrid(aryData)
    }

    const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.1, 10]).on('zoom', (event: any) => {
      const updatedScaleX = event.transform.rescaleX(scaleX)
      const updatedScaleY = event.transform.rescaleY(scaleY)
      const dx = updatedScaleX.domain(), dy = updatedScaleY.domain()
      loadData(dx[0], dx[1], dy[0], dy[1])
      g.attr('transform', event.transform)
      
      // 棚単位での横の無限スクロール
      const totalShelfWidth = totalShelves * (shelfWidth + shelfGap)
      let tx = event.transform.x, ty = event.transform.y
      if (tx <= -totalShelfWidth) tx = tx % totalShelfWidth
      if (tx > 0) tx = ((tx % totalShelfWidth) - totalShelfWidth)
      
      // 縦の無限スクロールは無効（通常の縦スクロール）
      // ty はそのまま使用（無限スクロール処理なし）
      
      if (tx !== event.transform.x || ty !== event.transform.y) {
        const t = event.transform;
        const w = d3.zoomIdentity.translate(tx, ty).scale(t.k);
        const svgNode = svg.node()
        if (svgNode) {
          d3.select(svgNode).call(zoom.transform as any, w)
        }
      }
    })

    svg.call(zoom as any).on('wheel', (e: any) => e.preventDefault())

    container.innerHTML = ''
    const svgNode = svg.node()
    if (svgNode) {
      container.append(svgNode)
    }

    const onResize = (): void => { window.location.reload() }
    window.addEventListener('resize', onResize)
    return (): void => window.removeEventListener('resize', onResize)
  }, [])

  return ref
}
