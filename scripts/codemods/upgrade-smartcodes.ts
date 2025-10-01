import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(process.cwd(), 'src')
const exts = ['.ts','.tsx','.json','.md']
const rx = /(HERA(?:\.[A-Z0-9]+){3,})\.v(\d+)\b/g

function walk(d:string){ for (const f of fs.readdirSync(d)) {
  const p = path.join(d,f); const st = fs.statSync(p)
  if (st.isDirectory()) walk(p)
  else if (exts.includes(path.extname(p))) {
    const s = fs.readFileSync(p,'utf8')
    const t = s.replace(rx, (_m, pre, n)=> `${pre}.V${n}`)
    if (t !== s) { fs.writeFileSync(p, t, 'utf8'); console.log('fixed', p) }
  }
}}
walk(root)