import { useEffect, useState } from 'react'

import AdrenaClient, { PoolWithPubkey } from '@tools/sdk/adrena/Adrena'

export default function useAdrenaPools(adrenaClient: AdrenaClient | null) {
  const [pools, setPools] = useState<PoolWithPubkey[] | null>(null)

  useEffect(() => {
    ;(async () => {
      if (!adrenaClient) return setPools(null)

      setPools(await adrenaClient.getPools())
    })()
  }, [adrenaClient])

  return pools
}
