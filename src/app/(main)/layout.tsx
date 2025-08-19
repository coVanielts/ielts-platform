import { PrivateRouteProvider } from '@/providers/private-route'

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <PrivateRouteProvider>{children}</PrivateRouteProvider>
}
