'use client'
import { useBookshelfD3 } from './hooks/useBookshelfD3'

export default function Bookshelf(): JSX.Element {
  const ref = useBookshelfD3()
  
  return <div ref={ref} style={{width:'90vw',height:'calc(90vh - 80px)',display:'flex',justifyContent:'center',alignItems:'center'}} />
}
