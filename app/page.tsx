import Lane from '@/components/Lane'

export default function Page(): JSX.Element {
  return (
    <main style={{display:'flex',flexDirection:'column',alignItems:'center',gap:16,padding:16}}>
      <h1>📚 書籍棚 - 無限スクロール</h1>
      <Lane/>
    </main>
  )
}
