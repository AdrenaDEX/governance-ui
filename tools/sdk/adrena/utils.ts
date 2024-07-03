import { PublicKey } from '@solana/web3.js'

import AdrenaJson from '../../../idls/adrena.json'

export function getCortexPda(): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('cortex')],
    new PublicKey(AdrenaJson.metadata.address)
  )[0]
}

export function getMainPoolPda(): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('pool'), Buffer.from('main-pool')],
    new PublicKey(AdrenaJson.metadata.address)
  )[0]
}
