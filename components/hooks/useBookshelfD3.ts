import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import BOOKS from '../BOOKS'
import { BookInfo } from '../types'
// wrap10関数を削除し、直接的な座標システムを使用

export function useBookshelfD3() {
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
    let aryData: Array<{ x: number, y: number, bookInfo: BookInfo | null }> = []

    // 書籍数を動的に取得
    const totalBooks = BOOKS.length
    const booksPerRow = Math.ceil(Math.sqrt(totalBooks)) // 正方形に近い配置
    const totalRows = Math.ceil(totalBooks / booksPerRow)

    function getKey(x: number, y: number): string { return `${x},${y}` }
    function calcBookInfo(x: number, y: number): BookInfo | null {
      // 直接的な座標から書籍インデックスを計算
      const bookIndex = y * booksPerRow + x
      if (bookIndex >= 0 && bookIndex < totalBooks) {
        const book = BOOKS[bookIndex]
        return { 
          id: book.id, 
          title: book.title, 
          author: book.author,
          page_number: book.page_number,
          color: book.color
        }
      }
      return null
    }
    function setValue(x: number, y: number, bookInfo: BookInfo | null): void { mapData.set(getKey(x, y), bookInfo) }
    function getValue(x: number, y: number): BookInfo | null {
      const k = getKey(x, y);
      let v = mapData.get(k);
      if (v === undefined) { v = calcBookInfo(x, y); setValue(x, y, v) }
      return v
    }

    function loadData(x0: number, x1: number, y0: number, y1: number): void {
      const xs = Math.floor(x0), xe = Math.floor(x1) + 1, ys = Math.floor(y0), ye = Math.floor(y1) + 1
      const added: Array<{ x: number, y: number, bookInfo: BookInfo | null }> = []
      for (let x = xs; x <= xe; x++) {
        for (let y = ys; y <= ye; y++) {
          const key = getKey(x, y)
          if (!mapData.has(key)) {
            added.push({ x, y, bookInfo: getValue(x, y) })
          }
        }
      }
      if (added.length) { aryData = aryData.concat(added); drawGrid(aryData) }
    }

    function drawGrid(data: Array<{ x: number, y: number, bookInfo: BookInfo | null }>): void {
      const offsets = [-1, 0, 1]
      const render: Array<{ bookInfo: BookInfo | null, rx: number, ry: number }> = []
      for (const d of data) {
        for (const ox of offsets) {
          for (const oy of offsets) {
            render.push({ bookInfo: d.bookInfo, rx: d.x + ox * booksPerRow, ry: d.y + oy * totalRows })
          }
        }
      }
      g.selectAll('*').remove()

      // 行ごとにタイルをグループ化して連続配置
      const rowGroups = new Map<number, Array<{ bookInfo: BookInfo | null, rx: number, ry: number }>>()
      render.forEach(item => {
        if (!rowGroups.has(item.ry)) {
          rowGroups.set(item.ry, [])
        }
        rowGroups.get(item.ry)!.push(item)
      })

      // 各行を処理
      rowGroups.forEach((rowItems, rowY) => {
        // 行内のアイテムをx座標でソート
        rowItems.sort((a, b) => a.rx - b.rx)
        
        let currentX = 0 // 累積X位置
        
        rowItems.forEach((item, index) => {
          const tileGroup = g.append('g').attr('class', 'tile')
          const rectY = scaleY(rowY)
          
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
            const titleLines = []
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
            const authorLines = []
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
              .text((rowY * booksPerRow + item.rx))
          }
          
          // 次のタイルの位置を更新
          currentX += tileWidth
        })
      })
    }

    loadData(0, width / cell, 0, height / cell)
    drawGrid(aryData)

    const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.1, 10]).on('zoom', (event: any) => {
      const updatedScaleX = event.transform.rescaleX(scaleX)
      const updatedScaleY = event.transform.rescaleY(scaleY)
      const dx = updatedScaleX.domain(), dy = updatedScaleY.domain()
      loadData(dx[0], dx[1], dy[0], dy[1])
      g.attr('transform', event.transform)
      const totalX = booksPerRow * cell, totalY = totalRows * cell
      let tx = event.transform.x, ty = event.transform.y
      if (tx <= -totalX) tx = tx % totalX; if (tx > 0) tx = ((tx % totalX) - totalX)
      if (ty <= -totalY) ty = ty % totalY; if (ty > 0) ty = ((ty % totalY) - totalY)
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
