export function wrap10(n: number): number { 
  const r = ((n-1)%10+10)%10; 
  return r+1 
}
