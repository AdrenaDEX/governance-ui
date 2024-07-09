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
import { CustodyWithPubkey, PoolWithPubkey } from '@tools/sdk/adrena/Adrena'
import useAdrenaClient from '@hooks/useAdrenaClient'
import { PublicKey } from '@solana/web3.js'
import useAdrenaPools from '@hooks/useAdrenaPools'
import useAdrenaCustodies from '@hooks/useAdrenaCustodies'

export interface SetCustodyAllowSwapForm {
  governedAccount: AssetAccount | null
  allow: boolean
  pool: PoolWithPubkey | null
  custody: CustodyWithPubkey | null
}

export default function SetCustodyAllowSwap({
  index,
  governance,
}: {
  index: number
  governance: ProgramAccount<Governance> | null
}) {
  const { assetAccounts } = useGovernanceAssets()
  const shouldBeGoverned = !!(index !== 0 && governance)

  const [form, setForm] = useState<SetCustodyAllowSwapForm>({
    governedAccount: null,
    allow: false,
    pool: null,
    custody: null,
  })
  const [formErrors, setFormErrors] = useState({})

  const { handleSetInstructions } = useContext(NewProposalContext)

  // TODO: load the program owned by the selected governance: form.governedAccount?.governance
  const adrenaClient = useAdrenaClient(
    new PublicKey('2ZHEtEKT7S1dSPodH2Sdu6cErDyFWad6Yc35cbbqtAaV')
  )

  const pools = useAdrenaPools(adrenaClient)
  const custodies = useAdrenaCustodies(adrenaClient, form.pool)

  const validateInstruction = async (): Promise<boolean> => {
    const { isValid, validationErrors } = await isFormValid(schema, form)

    setFormErrors(validationErrors)

    return isValid
  }

  async function getInstruction(): Promise<UiInstruction> {
    const isValid = await validateInstruction()
    const governance = form.governedAccount?.governance

    if (
      !isValid ||
      !governance ||
      !adrenaClient ||
      !form.pool ||
      !form.custody
    ) {
      return {
        serializedInstruction: '',
        isValid,
        governance,
        chunkBy: 1,
      }
    }

    const instruction = await adrenaClient.program.methods
      .setCustodyAllowSwap({
        allowSwap: form.allow,
      })
      .accountsStrict({
        admin: governance.nativeTreasuryAddress,
        cortex: adrenaClient.cortexPda,
        pool: form.pool.pubkey,
        custody: form.custody.pubkey,
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
      label: 'Pool',
      initialValue: form.pool,
      type: InstructionInputType.SELECT,
      name: 'pool',
      options:
        pools?.map((p) => ({
          name: String.fromCharCode(...p.name.value),
          value: p,
        })) ?? [],
    },
    {
      label: 'Custody',
      initialValue: form.custody,
      type: InstructionInputType.SELECT,
      name: 'custody',
      options:
        custodies?.map((c) => ({
          name: c.pubkey.toBase58(),
          value: c,
        })) ?? [],
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
