import { redirect } from 'next/navigation'

export default function POSIndexRedirect({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const params = new URLSearchParams(searchParams as any)
  const suffix = params.toString()
  redirect('/pos/sale' + (suffix ? `?${suffix}` : ''))
}
