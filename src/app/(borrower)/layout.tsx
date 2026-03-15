import OfflineBanner from '@/components/shared/OfflineBanner'
import BorrowerNav from '@/components/shared/BorrowerNav'

export default function BorrowerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <OfflineBanner />
      <div className="pb-24">{children}</div>
      <BorrowerNav />
    </>
  )
}