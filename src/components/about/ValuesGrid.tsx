import { VALUES } from '@/data/about'

export default function ValuesGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {VALUES.map((value, index) => (
        <div key={index} className="card-glass p-5 rounded-2xl">
          <h3 className="ink font-semibold text-lg mb-3">{value.title}</h3>
          <p className="ink-muted text-sm leading-relaxed">{value.desc}</p>
        </div>
      ))}
    </div>
  )
}
