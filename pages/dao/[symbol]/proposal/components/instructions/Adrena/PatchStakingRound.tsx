import { useContext, useEffect, useState } from 'react'
import * as yup from 'yup'
import { isFormValid } from '@utils/formValidation'
import { UiInstruction } from '@utils/uiTypes/proposalCreationTypes'
import useGovernanceAssets from '@hooks/useGovernanceAssets'
import { Governance, SYSTEM_PROGRAM_ID } from '@solana/spl-governance'
import { ProgramAccount } from '@solana/spl-governance'
import { serializeInstructionToBase64 } from '@solana/spl-governance'
import InstructionForm, { InstructionInput } from '../FormCreator'
import { InstructionInputType } from '../inputInstructionType'
import { NewProposalContext } from '../../../new'
import { AccountType, AssetAccount } from '@utils/uiTypes/assets'
import useAdrenaClient from '@hooks/useAdrenaClient'
import useWalletOnePointOh from '@hooks/useWalletOnePointOh'
import { PublicKey } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'

export interface PatchStakingRoundForm {
  governedAccount: AssetAccount | null
}

export default function PatchStakingRound({
  index,
  governance,
}: {
  index: number
  governance: ProgramAccount<Governance> | null
}) {
  const { assetAccounts } = useGovernanceAssets()
  const shouldBeGoverned = !!(index !== 0 && governance)

  const programGovernances = assetAccounts.filter(
    (x) => x.type === AccountType.PROGRAM
  )

  const [form, setForm] = useState<PatchStakingRoundForm>({
    governedAccount: null,
  })
  const [formErrors, setFormErrors] = useState({})

  const wallet = useWalletOnePointOh()

  const { handleSetInstructions } = useContext(NewProposalContext)

  const adrenaClient = useAdrenaClient(
    new PublicKey('13gDzEXCdocbj8iAiqrScGo47NiSuYENGsRqi3SEAwet')
  )

  const validateInstruction = async (): Promise<boolean> => {
    const { isValid, validationErrors } = await isFormValid(schema, form)

    setFormErrors(validationErrors)

    return isValid
  }

  async function getInstruction(): Promise<UiInstruction> {
    const isValid = await validateInstruction()
    const governance = form.governedAccount?.governance

    console.log('governance', governance)
    console.log('isValid', isValid)
    console.log('adrenaClient', adrenaClient)
    console.log('!wallet?.publicKey', wallet?.publicKey)

    if (!isValid || !governance || !adrenaClient || !wallet?.publicKey) {
      return {
        serializedInstruction: '',
        isValid,
        governance,
        chunkBy: 1,
      }
    }

    const instruction = await adrenaClient.program.methods
      .patchStakingRound()
      .accountsStrict({
        admin: governance.nativeTreasuryAddress,
        cortex: adrenaClient.cortexPda,
        staking: new PublicKey('5Feq2MKbimA44dqgFHLWr7h77xAqY9cet5zn9eMCj78p'),
        payer: wallet.publicKey,
        fundingAccount: new PublicKey(
          'GCptbcyAzAYTa6ZaAqtZ3XvLXBHRVQjo1ZnBoX9Jbp4g'
        ),
        stakingRewardTokenVault: new PublicKey(
          'A3UJxhPtieUr1mjgJhJaTPqDReDaB2H9q7hzs2icrUeS'
        ),
        stakingLmRewardTokenVault: new PublicKey(
          'BoFFg5oAbbgWmLfQ7rQB4hXPQH9QmuFwDBEDeAkbq8Ws'
        ),
        transferAuthority: new PublicKey(
          '4o3qAErcapJ6gRLh1m1x4saoLLieWDu7Rx3wpwLc7Zk9'
        ),
        lmTokenMint: new PublicKey(
          'AuQaustGiaqxRvj2gtCdrd22PBzTn8kM3kEPEkZCtuDw'
        ),
        feeRedistributionMint: new PublicKey(
          'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
        ),
        adrenaProgram: new PublicKey(
          '13gDzEXCdocbj8iAiqrScGo47NiSuYENGsRqi3SEAwet'
        ),
        systemProgram: SYSTEM_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
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
  }, [form, !!adrenaClient, wallet?.publicKey])

  const schema = yup.object().shape({
    governedAccount: yup
      .object()
      .nullable()
      .required('Program governed account is required'),
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
