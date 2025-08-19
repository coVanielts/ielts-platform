"use client"

import { queryClient } from '@/libs/react-query'
import { ReactNode } from 'react'
import { QueryClientProvider } from 'react-query'

type Props = { children: ReactNode }

export default function ReactQueryProvider({ children }: Props) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
