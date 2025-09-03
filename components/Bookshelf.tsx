'use client'
import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import BOOKS from './BOOKS'

function wrap10(n: number): number { 
  const r = ((n-1)%10+10)%10; 
  return r+1 
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
      return { width: cell*2, height: cell*2, cell }
    }

    const { width, height, cell } = computeLayout()

    const svg = d3.create('svg')
      .attr('viewBox', [0,0,width,height])
      .attr('width', width)
      .attr('height', height)

    const g = svg.append('g')
    const g1 = g.append('g')
    const g2 = g.append('g')

    const scaleX = d3.scaleLinear().domain([0, width/cell]).range([0,width])
    const scaleY = d3.scaleLinear().domain([0, height/cell]).range([0,height])

    const mapData = new Map<string, string>()
    let aryData: Array<{x: number, y: number, value: string}> = []

    const bookIdMap = new Map(BOOKS.map(b=>[b.id,b]))

    function getKey(x: number,y: number): string { return `${x},${y}` }
    function calcValue(x: number,y: number): string {
      const wx = wrap10(x), wy = wrap10(y)
      const id = (wy-1)*10 + wx
      const info = bookIdMap.get(id)
      if(info && info.title && info.author) return `(${info.title},${info.author})`
      return `${id}`
    }
    function setValue(x: number,y: number,value: string): void { mapData.set(getKey(x,y), value) }
    function getValue(x: number,y: number): string { 
      const k=getKey(x,y); 
      let v=mapData.get(k); 
      if(!v){ v=calcValue(x,y); setValue(x,y,v) } 
      return v 
    }

    function loadData(x0: number,x1: number,y0: number,y1: number): void {
      const xs=Math.floor(x0), xe=Math.floor(x1)+1, ys=Math.floor(y0), ye=Math.floor(y1)+1
      const added: Array<{x: number, y: number, value: string}> = []
      for(let x=xs; x<=xe; x++){
        for(let y=ys; y<=ye; y++){
          const wx=wrap10(x), wy=wrap10(y)
          const key=getKey(wx,wy)
          if(!mapData.has(key)){
            added.push({ x: wx, y: wy, value: getValue(wx,wy) })
          }
        }
      }
      if(added.length){ aryData = aryData.concat(added); drawGrid(aryData) }
    }

    function drawGrid(data: Array<{x: number, y: number, value: string}>): void {
      const offsets=[-1,0,1]
      const render: Array<{value: string, rx: number, ry: number}> = []
      for(const d of data){ 
        for(const ox of offsets){ 
          for(const oy of offsets){ 
            render.push({ value:d.value, rx:(d.x-1)+ox*10, ry:(d.y-1)+oy*10 }) 
          } 
        } 
      }
      g1.selectAll('*').remove(); g2.selectAll('*').remove()
      g1.selectAll('rect').data(render).enter().append('rect')
        .attr('x', (d: any)=>scaleX(d.rx)).attr('y', (d: any)=>scaleY(d.ry))
        .attr('width', cell).attr('height', cell)
        .attr('fill', '#e99').attr('stroke', '#fff').attr('stroke-width', '2')
      g2.selectAll('text').data(render).enter().append('text')
        .attr('x', (d: any)=>scaleX(d.rx)+cell/2).attr('y', (d: any)=>scaleY(d.ry)+cell/2)
        .attr('text-anchor','middle').attr('font-size','14px').attr('fill','#555').attr('dy','.35em')
        .text((d: any)=>d.value)
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
