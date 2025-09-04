export interface BookInfo {
  id: number
  title: string
  author: string
  page_number: number
  color: string
  category: string
}

export interface TileProps {
  x: number
  y: number
  cell: number
  bookInfo: BookInfo | null
  scaleX: any
  scaleY: any
}

export interface TextComponentProps {
  text: string
  x: number
  y: number
  cell: number
}
