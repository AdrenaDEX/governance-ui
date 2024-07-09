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
import { PoolWithPubkey } from '@tools/sdk/adrena/Adrena'
import useAdrenaClient from '@hooks/useAdrenaClient'
import { PublicKey } from '@solana/web3.js'
import useAdrenaPools from '@hooks/useAdrenaPools'
import { BN } from '@coral-xyz/anchor'

export interface SetPoolAumSoftCapUsdForm {
  governedAccount: AssetAccount | null
  aumSoftCapUsd: number
  pool: PoolWithPubkey | null
}

export default function SetPoolAllowSwap({
  index,
  governance,
}: {
  index: number
  governance: ProgramAccount<Governance> | null
}) {
  const { assetAccounts } = useGovernanceAssets()
  const shouldBeGoverned = !!(index !== 0 && governance)

  const [form, setForm] = useState<SetPoolAumSoftCapUsdForm>({
    governedAccount: null,
    aumSoftCapUsd: 0,
    pool: null,
  })
  const [formErrors, setFormErrors] = useState({})

  const { handleSetInstructions } = useContext(NewProposalContext)

  // TODO: load the program owned by the selected governance: form.governedAccount?.governance
  const adrenaClient = useAdrenaClient(
    new PublicKey('2ZHEtEKT7S1dSPodH2Sdu6cErDyFWad6Yc35cbbqtAaV')
  )

  const pools = useAdrenaPools(adrenaClient)

  const validateInstruction = async (): Promise<boolean> => {
    const { isValid, validationErrors } = await isFormValid(schema, form)

    setFormErrors(validationErrors)

    return isValid
  }

  async function getInstruction(): Promise<UiInstruction> {
    const isValid = await validateInstruction()
    const governance = form.governedAccount?.governance

    if (!isValid || !governance || !adrenaClient || !form.pool) {
      return {
        serializedInstruction: '',
        isValid,
        governance,
        chunkBy: 1,
      }
    }

    const instruction = await adrenaClient.program.methods
      .setPoolAumSoftCapUsd({
        aumSoftCapUsd: new BN(form.aumSoftCapUsd * 10 ** 6),
      })
      .accountsStrict({
        admin: governance.nativeTreasuryAddress,
        cortex: adrenaClient.cortexPda,
        pool: form.pool.pubkey,
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
    aumSoftCapUsd: yup.number().required('Aum soft cap usd is required'),
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
          name: p.name.value.toString(),
          value: p,
        })) ?? [],
    },
    {
      label: 'Aum Soft Cap Usd',
      initialValue: form.aumSoftCapUsd,
      type: InstructionInputType.INPUT,
      name: 'aumSoftCapUsd',
      inputType: 'number',
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
