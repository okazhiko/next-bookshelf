'use client'
import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import BOOKS from './BOOKS'

function wrap10(n: number): number { 
  const r = ((n-1)%10+10)%10; 
  return r+1 
}

interface BookInfo {
  id: number
  title: string
  author: string
}

interface TileProps {
  x: number
  y: number
  cell: number
  bookInfo: BookInfo | null
  scaleX: d3.ScaleLinear<number, number>
  scaleY: d3.ScaleLinear<number, number>
}

function TitleComponent({ text, x, y, cell }: { text: string, x: number, y: number, cell: number }) {
  const maxCharsPerLine = Math.floor(cell / 8) // 文字サイズを考慮した最大文字数
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
          fill="#333"
          writingMode="vertical-rl"
          textOrientation="upright"
        >
          {line}
        </text>
      ))}
    </g>
  )
}

function AuthorComponent({ text, x, y, cell }: { text: string, x: number, y: number, cell: number }) {
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
          textOrientation="upright"
        >
          {line}
        </text>
      ))}
    </g>
  )
}

function TileComponent({ x, y, cell, bookInfo, scaleX, scaleY }: TileProps) {
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

export default function Bookshelf(): JSX.Element {
  const ref = useRef<HTMLDivElement>(null)
  
  useEffect(()=>{
    const container = ref.current
    if(!container) return

    function computeLayout(){
      // vw: 90, vh: h1要素を除いた残りのスペース
      const w = Math.floor(window.innerWidth * 0.9) || 800
      const h = Math.floor((window.innerHeight - 80) * 0.9) || 600 // h1要素の高さを80pxとして計算
      const cell = Math.max(10, Math.floor(Math.min(w, h) / 2))
      return { width: w, height: h, cell }
    }

    const { width, height, cell } = computeLayout()

    const svg = d3.create('svg')
      .attr('viewBox', [0,0,width,height])
      .attr('width', width)
      .attr('height', height)

    const g = svg.append('g')

    const scaleX = d3.scaleLinear().domain([0, width/cell]).range([0,width])
    const scaleY = d3.scaleLinear().domain([0, height/cell]).range([0,height])

    const mapData = new Map<string, BookInfo | null>()
    let aryData: Array<{x: number, y: number, bookInfo: BookInfo | null}> = []

    const bookIdMap = new Map(BOOKS.map(b=>[b.id,b]))

    function getKey(x: number,y: number): string { return `${x},${y}` }
    function calcBookInfo(x: number,y: number): BookInfo | null {
      const wx = wrap10(x), wy = wrap10(y)
      const id = (wy-1)*10 + wx
      const info = bookIdMap.get(id)
      if(info && info.title && info.author) return { id, title: info.title, author: info.author }
      return null
    }
    function setValue(x: number,y: number,bookInfo: BookInfo | null): void { mapData.set(getKey(x,y), bookInfo) }
    function getValue(x: number,y: number): BookInfo | null { 
      const k=getKey(x,y); 
      let v=mapData.get(k); 
      if(v === undefined){ v=calcBookInfo(x,y); setValue(x,y,v) } 
      return v 
    }

    function loadData(x0: number,x1: number,y0: number,y1: number): void {
      const xs=Math.floor(x0), xe=Math.floor(x1)+1, ys=Math.floor(y0), ye=Math.floor(y1)+1
      const added: Array<{x: number, y: number, bookInfo: BookInfo | null}> = []
      for(let x=xs; x<=xe; x++){
        for(let y=ys; y<=ye; y++){
          const wx=wrap10(x), wy=wrap10(y)
          const key=getKey(wx,wy)
          if(!mapData.has(key)){
            added.push({ x: wx, y: wy, bookInfo: getValue(wx,wy) })
          }
        }
      }
      if(added.length){ aryData = aryData.concat(added); drawGrid(aryData) }
    }

    function drawGrid(data: Array<{x: number, y: number, bookInfo: BookInfo | null}>): void {
      const offsets=[-1,0,1]
      const render: Array<{bookInfo: BookInfo | null, rx: number, ry: number}> = []
      for(const d of data){ 
        for(const ox of offsets){ 
          for(const oy of offsets){ 
            render.push({ bookInfo: d.bookInfo, rx:(d.x-1)+ox*10, ry:(d.y-1)+oy*10 }) 
          } 
        } 
      }
      g.selectAll('*').remove()
      
      // タイルを描画
      const tiles = g.selectAll('g.tile').data(render)
      tiles.enter().append('g').attr('class', 'tile')
        .each(function(d: any) {
          const tileGroup = d3.select(this)
          const rectX = scaleX(d.rx)
          const rectY = scaleY(d.ry)
          const centerX = rectX + cell / 2
          const centerY = rectY + cell / 2
          
          // タイルの背景
          tileGroup.append('rect')
            .attr('x', rectX)
            .attr('y', rectY)
            .attr('width', cell)
            .attr('height', cell)
            .attr('fill', '#e99')
            .attr('stroke', '#fff')
            .attr('stroke-width', '2')
          
          if (d.bookInfo) {
            // 3:1の比率でタイトルと著者を配置
            const titleHeight = cell * 0.75  // 75% (3/4)
            const authorHeight = cell * 0.25  // 25% (1/4)
            const titleY = rectY + titleHeight / 2
            const authorY = rectY + titleHeight + authorHeight / 2
            
            // タイトルを縦書きで描画
            const titleLines = []
            const maxCharsPerLine = Math.floor(cell / 8)
            for (let i = 0; i < d.bookInfo.title.length; i += maxCharsPerLine) {
              titleLines.push(d.bookInfo.title.slice(i, i + maxCharsPerLine))
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
            for (let i = 0; i < d.bookInfo.author.length; i += maxCharsPerLine) {
              authorLines.push(d.bookInfo.author.slice(i, i + maxCharsPerLine))
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
              .text(((d.ry-1)*10 + d.rx))
          }
        })
    }

    loadData(0, width/cell, 0, height/cell)
    drawGrid(aryData)

    const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.1,10]).on('zoom', (event: any)=>{
      const updatedScaleX = event.transform.rescaleX(scaleX)
      const updatedScaleY = event.transform.rescaleY(scaleY)
      const dx = updatedScaleX.domain(), dy = updatedScaleY.domain()
      loadData(dx[0], dx[1], dy[0], dy[1])
      g.attr('transform', event.transform)
      const totalX = 10*cell, totalY = 10*cell
      let tx=event.transform.x, ty=event.transform.y
      if(tx <= -totalX) tx = tx % totalX; if(tx > 0) tx = ((tx % totalX) - totalX)
      if(ty <= -totalY) ty = ty % totalY; if(ty > 0) ty = ((ty % totalY) - totalY)
      if(tx!==event.transform.x || ty!==event.transform.y){ 
        const t=event.transform; 
        const w=d3.zoomIdentity.translate(tx,ty).scale(t.k); 
        const svgNode = svg.node()
        if (svgNode) {
          d3.select(svgNode).call(zoom.transform as any, w)
        }
      }
    })

    svg.call(zoom as any).on('wheel', (e: any)=>e.preventDefault())

    container.innerHTML = ''
    const svgNode = svg.node()
    if (svgNode) {
      container.append(svgNode)
    }

    const onResize = (): void => { window.location.reload() }
    window.addEventListener('resize', onResize)
    return (): void => window.removeEventListener('resize', onResize)
  },[])
  
  return <div ref={ref} style={{width:'90vw',height:'calc(90vh - 80px)',display:'flex',justifyContent:'center',alignItems:'center'}} />
}
