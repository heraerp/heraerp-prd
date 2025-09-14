'use client'

interface ISPInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  icon?: React.ReactNode
}

interface ISPSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  options: { value: string; label: string }[]
}

interface ISPTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
}

export function ISPInput({ label, error, icon, className = '', ...props }: ISPInputProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-white/80">{label}</label>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <input
          className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-3 bg-white/5 border border-white/10 
                     rounded-xl text-white placeholder-white/40 
                     focus:outline-none focus:ring-2 focus:ring-[#00DDFF]/50 focus:border-[#00DDFF]/50 
                     transition-all duration-300 ${error ? 'border-[#ff1d58]/50' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-sm text-[#ff1d58]">{error}</p>}
    </div>
  )
}

export function ISPSelect({ label, error, options, className = '', ...props }: ISPSelectProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-white/80">{label}</label>
      <select
        className={`w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl 
                   text-white appearance-none cursor-pointer
                   focus:outline-none focus:ring-2 focus:ring-[#00DDFF]/50 focus:border-[#00DDFF]/50 
                   transition-all duration-300 ${error ? 'border-[#ff1d58]/50' : ''} ${className}`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgba(255,255,255,0.4)'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 1rem center',
          backgroundSize: '1.5rem'
        }}
        {...props}
      >
        <option value="" className="bg-slate-900">Select {label}</option>
        {options.map(option => (
          <option key={option.value} value={option.value} className="bg-slate-900">
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-[#ff1d58]">{error}</p>}
    </div>
  )
}

export function ISPTextarea({ label, error, className = '', ...props }: ISPTextareaProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-white/80">{label}</label>
      <textarea
        className={`w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl 
                   text-white placeholder-white/40 resize-none
                   focus:outline-none focus:ring-2 focus:ring-[#00DDFF]/50 focus:border-[#00DDFF]/50 
                   transition-all duration-300 ${error ? 'border-[#ff1d58]/50' : ''} ${className}`}
        rows={4}
        {...props}
      />
      {error && <p className="text-sm text-[#ff1d58]">{error}</p>}
    </div>
  )
}

export function ISPButton({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { 
  variant?: 'primary' | 'secondary' | 'danger' 
}) {
  const variants = {
    primary: 'bg-gradient-to-r from-[#00DDFF] to-[#0049B7] text-white hover:shadow-[#00DDFF]/50',
    secondary: 'bg-white/10 text-white hover:bg-white/20',
    danger: 'bg-gradient-to-r from-[#ff1d58] to-[#f75990] text-white hover:shadow-[#ff1d58]/50'
  }

  return (
    <button
      className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 
                 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
                 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}