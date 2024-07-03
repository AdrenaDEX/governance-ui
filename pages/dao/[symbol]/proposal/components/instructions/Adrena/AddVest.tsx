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
import { AssetAccount } from '@utils/uiTypes/assets'
import useAdrenaProgram from '@hooks/useAdrenaProgram'
import * as AdrenaPdaUtils from '@tools/sdk/adrena/utils'
import { BN } from '@coral-xyz/anchor'
import { SYSVAR_RENT_PUBKEY, SystemProgram } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { DEFAULT_GOVERNANCE_PROGRAM_ID } from '@components/instructions/tools'
import useWalletOnePointOh from '@hooks/useWalletOnePointOh'

export interface AddVestForm {
  governedAccount: AssetAccount | null
  owner: string
}

export default function AddVest({
  index,
  governance,
}: {
  index: number
  governance: ProgramAccount<Governance> | null
}) {
  const adrenaProgram = useAdrenaProgram()
  const wallet = useWalletOnePointOh()
  const { assetAccounts } = useGovernanceAssets()
  const shouldBeGoverned = !!(index !== 0 && governance)

  const [form, setForm] = useState<AddVestForm>({
    governedAccount: null,
    allow: false,
  })
  const [formErrors, setFormErrors] = useState({})

  const { handleSetInstructions } = useContext(NewProposalContext)

  const validateInstruction = async (): Promise<boolean> => {
    const { isValid, validationErrors } = await isFormValid(schema, form)

    setFormErrors(validationErrors)

    return isValid
  }

  async function getInstruction(): Promise<UiInstruction> {
    const isValid = await validateInstruction()
    const governance = form.governedAccount?.governance

    if (!isValid || !governance || !adrenaProgram || !wallet?.publicKey) {
      return {
        serializedInstruction: '',
        isValid,
        governance,
        chunkBy: 1,
      }
    }

    const instruction = await adrenaProgram.methods
      .addVest({
        amount: new BN(0),
        originBucket: 0,
        unlockStartTimestamp: new BN(0),
        unlockEndTimestamp: new BN(0),
      })
      .accountsStrict({
        admin: governance.nativeTreasuryAddress,
        cortex: AdrenaPdaUtils.getCortexPda(),
        owner: '',
        payer: wallet.publicKey,
        transferAuthority: '',
        vestRegistry: '',
        vest: '',
        lmTokenMint: '',
        governanceTokenMint: '',
        governanceRealm: '',
        governanceRealmConfig: '',
        governanceGoverningTokenHolding: '',
        governanceGoverningTokenOwnerRecord: '',
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
    allow: yup.boolean().required('Allow is required'),
  })

  const inputs: InstructionInput[] = [
    {
      label: 'Governance',
      initialValue: form.governedAccount,
      name: 'governedAccount',
      type: InstructionInputType.GOVERNED_ACCOUNT,
      shouldBeGoverned: shouldBeGoverned as any,
      governance,
      options: assetAccounts,
    },
    {
      label: 'Allow Swap',
      initialValue: form.allow,
      type: InstructionInputType.SWITCH,
      name: 'allow',
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
