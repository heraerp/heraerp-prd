'use client'

export function JewelryGradientBG() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Animated gradient base */}
      <div className="jewelry-animated-gradient absolute inset-0 opacity-40" />
      
      {/* Luxury overlays */}
      <div 
        className="absolute inset-0" 
        style={{ 
          background: `
            radial-gradient(circle at 20% 50%, rgba(212, 175, 0, 0.08), transparent 50%), 
            radial-gradient(circle at 80% 80%, rgba(43, 58, 103, 0.12), transparent 50%), 
            radial-gradient(circle at 40% 20%, rgba(212, 175, 0, 0.06), transparent 50%),
            linear-gradient(135deg, rgba(26, 31, 61, 0.95) 0%, rgba(43, 58, 103, 0.9) 50%, rgba(26, 31, 61, 0.95) 100%)
          `
        }} 
      />
      
      {/* Subtle texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF00' fill-opacity='1'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />
    </div>
  )
}