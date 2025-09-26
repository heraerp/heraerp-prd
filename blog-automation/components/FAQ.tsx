interface FAQItem {
  q: string;
  a: string;
}

interface FAQProps {
  items: FAQItem[];
  className?: string;
}

export default function FAQ({ items, className = "" }: FAQProps) {
  if (!items || items.length === 0) return null;
  
  return (
    <section className={`mt-12 ${className}`}>
      <h2 className="mb-6 text-2xl font-bold text-gray-900">
        Frequently Asked Questions
      </h2>
      <div className="space-y-6">
        {items.map((item, index) => (
          <div 
            key={index}
            className="rounded-xl border border-gray-200 p-6 transition-shadow hover:shadow-md"
          >
            <h3 className="mb-3 font-semibold text-gray-900">
              {item.q}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {item.a}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}