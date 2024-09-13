import { Connection } from '@solana/web3.js'

const INSTRUCTIONS = {
  100: {
    name: 'Add Vest',
    accounts: [],
    getDataUI: async (_connection: Connection, data: Uint8Array) => {
      return (
        <>
          <div>{JSON.stringify(data)}</div>
        </>
      )
    },
  },
  101: {
    name: 'Mint Lm Tokens From Bucket',
    accounts: [],
    getDataUI: async (_connection: Connection, data: Uint8Array) => {
      return (
        <>
          <div>{JSON.stringify(data)}</div>
        </>
      )
    },
  },
  102: {
    name: 'Set Custody Allow Swap',
    accounts: [],
    getDataUI: async (_connection: Connection, data: Uint8Array) => {
      return (
        <>
          <div>{JSON.stringify(data)}</div>
        </>
      )
    },
  },
  103: {
    name: 'Set Custody Allow Trade',
    accounts: [],
    getDataUI: async (_connection: Connection, data: Uint8Array) => {
      return (
        <>
          <div>{JSON.stringify(data)}</div>
        </>
      )
    },
  },
  104: {
    name: 'Set Custody Max Cumulative Short Size USD',
    accounts: [],
    getDataUI: async (_connection: Connection, data: Uint8Array) => {
      return (
        <>
          <div>{JSON.stringify(data)}</div>
        </>
      )
    },
  },
  105: {
    name: 'Set Pool Allow Swap',
    accounts: [],
    getDataUI: async (_connection: Connection, data: Uint8Array) => {
      return (
        <>
          <div>{JSON.stringify(data)}</div>
        </>
      )
    },
  },
  106: {
    name: 'Set Pool Allow Trade',
    accounts: [],
    getDataUI: async (_connection: Connection, data: Uint8Array) => {
      return (
        <>
          <div>{JSON.stringify(data)}</div>
        </>
      )
    },
  },
  107: {
    name: 'Set Pool Aum Soft Cap USD',
    accounts: [],
    getDataUI: async (_connection: Connection, data: Uint8Array) => {
      return (
        <>
          <div>{JSON.stringify(data)}</div>
        </>
      )
    },
  },
  108: {
    name: 'Set Pool Liquidity State',
    accounts: [],
    getDataUI: async (_connection: Connection, data: Uint8Array) => {
      return (
        <>
          <div>{JSON.stringify(data)}</div>
        </>
      )
    },
  },
  109: {
    name: 'Set Staking Lm Emission Potentiometers',
    accounts: [],
    getDataUI: async (_connection: Connection, data: Uint8Array) => {
      return (
        <>
          <div>{JSON.stringify(data)}</div>
        </>
      )
    },
  },
}

export const ADRENA_INSTRUCTIONS = {
  // TODO: Replace with the correct program id
  SW1TCH7qEPTdLsDHRgPuMQjbQxKdH2aBStViMFnt64f: INSTRUCTIONS,
}
