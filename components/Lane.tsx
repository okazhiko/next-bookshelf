'use client'
import { useLaneD3 } from './hooks/useLaneD3'

export default function Lane(): JSX.Element {
  const ref = useLaneD3()
  
  return <div ref={ref} style={{width:'90vw',height:'calc(90vh - 80px)',display:'flex',justifyContent:'center',alignItems:'center'}} />
}
