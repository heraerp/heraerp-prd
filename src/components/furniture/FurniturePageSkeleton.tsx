export function FurniturePageSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--color-body)] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-accent-indigo)]"></div>
    </div>
  )
}