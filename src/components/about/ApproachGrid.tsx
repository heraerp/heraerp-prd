import { APPROACH } from '@/data/about';

export default function ApproachGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {APPROACH.map((item, index) => (
        <div key={index} className="card-glass p-5 rounded-2xl">
          <h3 className="ink font-semibold text-lg mb-3">{item.title}</h3>
          <p className="ink-muted text-sm leading-relaxed">{item.desc}</p>
        </div>
      ))}
    </div>
  );
}