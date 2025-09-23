export default function ISPLoading() {
  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-slate-700 border-t-[#0099CC] rounded-full animate-spin" />
        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-[#E91E63] rounded-full animate-spin animate-reverse animate-delay-150" />
        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-[#FFD700] rounded-full animate-spin animate-delay-300" />
      </div>
    </div>
  )
}