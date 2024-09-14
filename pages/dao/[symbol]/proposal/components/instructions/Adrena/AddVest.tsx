import { useContext, useEffect, useState } from 'react'
import * as yup from 'yup'
import { isFormValid } from '@utils/formValidation'
import { UiInstruction } from '@utils/uiTypes/proposalCreationTypes'
import useGovernanceAssets from '@hooks/useGovernanceAssets'
import { Governance } from '@solana/spl-governance'
import { ProgramAccount } from '@solana/spl-governance'
import { serializeInstructionToBase64 } from '@solana/spl-governance'
import InstructionForm, { InstructionInput } from '../FormCreator'
import { InstructionInputType } from '../inputInstructionType'
import { NewProposalContext } from '../../../new'
import { AccountType, AssetAccount } from '@utils/uiTypes/assets'
import { BN } from '@coral-xyz/anchor'
import { PublicKey, SYSVAR_RENT_PUBKEY, SystemProgram } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { DEFAULT_GOVERNANCE_PROGRAM_ID } from '@components/instructions/tools'
import useWalletOnePointOh from '@hooks/useWalletOnePointOh'
import { getMintNaturalAmountFromDecimalAsBN } from '@tools/sdk/units'
import AdrenaClient, { OriginBucket } from '@tools/sdk/adrena/Adrena'
import useAdrenaClient from '@hooks/useAdrenaClient'

export const ORIGIN_BUCKET_VALUES = [
  { name: 'Core Contributor', value: OriginBucket.CoreContributor },
  { name: 'Foundation', value: OriginBucket.Foundation },
  { name: 'Ecosystem', value: OriginBucket.Ecosystem },
]

export interface AddVestForm {
  governedAccount: AssetAccount | null
  owner: string
  amount: number
  originBucket: { name: string; value: OriginBucket }
  unlockStartTimestamp: number
  unlockEndTimestamp: number
  voteMultiplier: number
}

export default function AddVest({
  index,
  governance,
}: {
  index: number
  governance: ProgramAccount<Governance> | null
}) {
  const wallet = useWalletOnePointOh()
  const { assetAccounts } = useGovernanceAssets()
  const shouldBeGoverned = !!(index !== 0 && governance)

  const programGovernances = assetAccounts.filter(
    (x) => x.type === AccountType.PROGRAM
  )

  const [form, setForm] = useState<AddVestForm>({
    governedAccount: null,
    owner: '',
    amount: 0,
    originBucket: ORIGIN_BUCKET_VALUES[2], // Ecosystem as default
    unlockStartTimestamp: 0,
    unlockEndTimestamp: 0,
    voteMultiplier: 0,
  })

  const [formErrors, setFormErrors] = useState({})

  const { handleSetInstructions } = useContext(NewProposalContext)

  // TODO: load the program owned by the selected governance: form.governedAccount?.governance
  const adrenaClient = useAdrenaClient(form.governedAccount?.pubkey ?? null)

  const validateInstruction = async (): Promise<boolean> => {
    const { isValid, validationErrors } = await isFormValid(schema, form)

    setFormErrors(validationErrors)

    return isValid
  }

  async function getInstruction(): Promise<UiInstruction> {
    const isValid = await validateInstruction()
    const governance = form.governedAccount?.governance
    const adrenaProgramId = form.governedAccount?.pubkey

    if (
      !isValid ||
      !governance ||
      !adrenaClient ||
      !wallet?.publicKey ||
      !adrenaProgramId
    ) {
      return {
        serializedInstruction: '',
        isValid,
        governance,
        chunkBy: 1,
      }
    }

    const owner = new PublicKey(form.owner)
    const cortex = await adrenaClient.getCortex()

    const instruction = await adrenaClient.program.methods
      .addVest({
        amount: getMintNaturalAmountFromDecimalAsBN(form.amount, 9),
        originBucket: form.originBucket.value,
        unlockStartTimestamp: new BN(form.unlockStartTimestamp),
        unlockEndTimestamp: new BN(form.unlockEndTimestamp),
        voteMultiplier: Math.floor(form.voteMultiplier * 10000),
      })
      .accountsStrict({
        admin: governance.nativeTreasuryAddress,
        cortex: adrenaClient.cortexPda,
        owner,
        payer: wallet.publicKey,
        transferAuthority: adrenaClient.transferAuthorityPda,
        vestRegistry: adrenaClient.vestRegistryPda,
        vest: adrenaClient.getUserVestPda(owner),
        lmTokenMint: adrenaClient.lmTokenMint,
        governanceTokenMint: adrenaClient.governanceTokenMint,
        governanceRealm: cortex.governanceRealm,
        governanceRealmConfig: AdrenaClient.getGovernanceRealmConfigPda(
          cortex.governanceRealm
        ),
        governanceGoverningTokenHolding: adrenaClient.getGovernanceGoverningTokenHoldingPda(
          cortex.governanceRealm
        ),
        governanceGoverningTokenOwnerRecord: adrenaClient.getGovernanceGoverningTokenOwnerRecordPda(
          owner,
          cortex.governanceRealm
        ),
        governanceProgram: DEFAULT_GOVERNANCE_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .instruction()

    return {
      serializedInstruction: serializeInstructionToBase64(instruction),
      isValid,
      governance,
      chunkBy: 1,
    }
  }

  useEffect(() => {
    handleSetInstructions(
      { governedAccount: form.governedAccount?.governance, getInstruction },
      index
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO please fix, it can cause difficult bugs. You might wanna check out https://bobbyhadz.com/blog/react-hooks-exhaustive-deps for info. -@asktree
  }, [form])

  const schema = yup.object().shape({
    governedAccount: yup
      .object()
      .nullable()
      .required('Program governed account is required'),
    owner: yup.string().required('Owner is required'),
    amount: yup.number().required('Token amount is required'),
    unlockStartTimestamp: yup
      .number()
      .required('Unlock start timestamp is required'),
    unlockEndTimestamp: yup
      .number()
      .required('Unlock end timestamp is required'),
    voteMultiplier: yup.number().required('Vote multiplier is required'),
  })

  const inputs: InstructionInput[] = [
    {
      label: 'Governance',
      initialValue: form.governedAccount,
      name: 'governedAccount',
      type: InstructionInputType.GOVERNED_ACCOUNT,
      shouldBeGoverned: shouldBeGoverned as any,
      governance,
      options: programGovernances,
    },
    {
      label: 'Owner',
      initialValue: form.owner,
      type: InstructionInputType.INPUT,
      inputType: 'text',
      name: 'owner',
    },
    {
      label: 'Origin Bucket',
      initialValue: form.originBucket,
      type: InstructionInputType.SELECT,
      name: 'originBucket',
      options: ORIGIN_BUCKET_VALUES,
    },
    {
      label: 'Token Amount',
      initialValue: form.amount,
      type: InstructionInputType.INPUT,
      inputType: 'number',
      name: 'amount',
    },
    {
      label: 'Unlock Start Timestamp',
      initialValue: form.unlockStartTimestamp,
      type: InstructionInputType.INPUT,
      inputType: 'number',
      name: 'unlockStartTimestamp',
    },
    {
      label: 'Unlock End Timestamp',
      initialValue: form.unlockEndTimestamp,
      type: InstructionInputType.INPUT,
      inputType: 'number',
      name: 'unlockEndTimestamp',
    },
    {
      label: 'Vote Multiplier',
      initialValue: form.voteMultiplier,
      type: InstructionInputType.INPUT,
      inputType: 'number',
      name: 'voteMultiplier',
    },
  ]

  if (!form) return <></>

  return (
    <InstructionForm
      outerForm={form}
      setForm={setForm}
      inputs={inputs}
      setFormErrors={setFormErrors}
      formErrors={formErrors}
    />
  )
}
