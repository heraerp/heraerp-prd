interface FAQItem {
  q: string
  a: string
}

interface FAQProps {
  items: FAQItem[]
  className?: string
}

export default function FAQ({ items, className = '' }: FAQProps) {
  if (!items || items.length === 0) return null

  return (
    <section className={`mt-12 ${className}`}>
      <h2 className="mb-6 text-2xl font-bold ink dark:text-gray-100">Frequently Asked Questions</h2>
      <div className="space-y-6">
        {items.map((item, index) => (
          <div
            key={index}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-6 transition-shadow hover:shadow-md"
          >
            <h3 className="mb-3 font-semibold ink dark:text-gray-100">{item.q}</h3>
            <p className="ink-muted dark:text-gray-300 leading-relaxed">{item.a}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
