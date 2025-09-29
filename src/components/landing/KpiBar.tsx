interface KpiItem {
  label: string
  value: string
}

interface KpiBarProps {
  items: KpiItem[]
}

export default function KpiBar({ items }: KpiBarProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {items.map((item, index) => (
        <div key={index} className="card-glass p-4 rounded-2xl text-center">
          <div className="ink text-2xl md:text-3xl font-bold">{item.value}</div>
          <div className="ink-muted text-sm mt-1">{item.label}</div>
        </div>
      ))}
    </div>
  )
}