import { useEffect, useState } from 'react'
import { PublicKey } from '@solana/web3.js'

import { Adrena, IDL as ADRENA_IDL } from '../idls/adrena'
import AdrenaJson from '../idls/adrena.json'

import { useConnection } from '@solana/wallet-adapter-react'
import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor'
import useWalletOnePointOh from './useWalletOnePointOh'

export default function useAdrenaProgram(): Program<Adrena> | null {
  const { connection } = useConnection()
  const wallet = useWalletOnePointOh()
  const [adrenaProgram, setAdrenaProgram] = useState<Program<Adrena> | null>(
    null
  )

  useEffect(() => {
    setAdrenaProgram(
      new Program(
        ADRENA_IDL,
        new PublicKey(AdrenaJson.metadata.address),
        // The wallet type is compatible with the anchor provider, force typing
        new AnchorProvider(connection, (wallet as unknown) as Wallet, {
          commitment: 'processed',
          skipPreflight: true,
        })
      )
    )
  }, [connection, wallet])

  return adrenaProgram
}
