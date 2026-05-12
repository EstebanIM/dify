import type { ReactNode } from 'react'

export default function HomeLayout({ children }: { children: ReactNode }) {
  return <div className="flex h-full w-full flex-col">{children}</div>
}
