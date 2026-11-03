/**
 * @file Block, transaction and operation types in the `block_api` format.
 *
 * The condenser types in `block.ts`, `transaction.ts` and `operation.ts`
 * describe the legacy `condenser_api` format and are unaffected by these.
 */

import { PublicKey } from '../crypto'
import { Asset, NaiAsset, NaiPrice, Price } from './asset'
import { BeneficiaryRoute } from './comment'
import { HexBuffer } from './misc'
import {
    AccountCreateOperation,
    AccountCreateWithDelegationOperation,
    AccountUpdate2Operation,
    AccountUpdateOperation,
    AccountWitnessProxyOperation,
    AccountWitnessVoteOperation,
    CancelTransferFromSavingsOperation,
    ChangeRecoveryAccountOperation,
    ClaimAccountOperation,
    ClaimRewardBalanceOperation,
    CollateralizedConvertOperation,
    CommentOperation,
    CommentOptionsOperation,
    ConvertOperation,
    CreateClaimedAccountOperation,
    CreateProposalOperation,
    CustomBinaryOperation,
    CustomJsonOperation,
    CustomOperation,
    DeclineVotingRightsOperation,
    DelegateVestingSharesOperation,
    DeleteCommentOperation,
    EscrowApproveOperation,
    EscrowDisputeOperation,
    EscrowReleaseOperation,
    EscrowTransferOperation,
    FeedPublishOperation,
    LimitOrderCancelOperation,
    LimitOrderCreate2Operation,
    LimitOrderCreateOperation,
    Operation,
    Pow2Operation,
    PowOperation,
    RecoverAccountOperation,
    RecurrentTransferOperation,
    RemoveProposalOperation,
    ReportOverProductionOperation,
    RequestAccountRecoveryOperation,
    ResetAccountOperation,
    SetResetAccountOperation,
    SetWithdrawVestingRouteOperation,
    TransferFromSavingsOperation,
    TransferOperation,
    TransferToSavingsOperation,
    TransferToVestingOperation,
    UpdateProposalOperation,
    UpdateProposalVotesOperation,
    VoteOperation,
    WithdrawVestingOperation,
    WitnessSetPropertiesOperation,
    WitnessUpdateOperation
} from './operation'

/**
 * Maps a condenser operation value shape to its `block_api` JSON shape:
 * assets become {@link NaiAsset}, prices {@link NaiPrice}, and public keys
 * and binary data the strings the node sends. Fields typed `any` stay `any`.
 */
export type BlockApiValue<T> =
    0 extends (1 & T) ? T :
    Asset extends T ? NaiAsset :
    Price extends T ? NaiPrice :
    PublicKey extends T ? string :
    HexBuffer extends T ? string :
    T extends object ? { [K in keyof T]: BlockApiValue<T[K]> } :
    T

/**
 * The `block_api` form `{type: '<name>_operation', value}` of a condenser
 * operation `[name, value]`, with the value mapped by {@link BlockApiValue}.
 */
export interface BlockApiOperationOf<O extends Operation> {
    type: `${O[0]}_operation`
    value: BlockApiValue<O[1]>
}

/**
 * `comment_options` in the `block_api` format. Its extensions are static
 * variants, sent as `{type, value}` objects rather than condenser's
 * `[0, value]` pairs, so this one value shape cannot reuse
 * {@link CommentOptionsOperation} as is.
 */
export interface BlockApiCommentOptionsOperation {
    type: 'comment_options_operation'
    value: Omit<BlockApiValue<CommentOptionsOperation[1]>, 'extensions'> & {
        extensions: {
            type: 'comment_payout_beneficiaries'
            value: { beneficiaries: BeneficiaryRoute[] }
        }[]
    }
}

/**
 * Operation in the `block_api` format, e.g.
 * `{type: 'vote_operation', value: {voter, author, permlink, weight}}`.
 * Narrow on `type` to get the value shape of a specific operation.
 *
 * Value shapes reuse the condenser operation interfaces, with NAI assets in
 * place of asset strings. Where those interfaces are loose they stay loose
 * here: the `pow` and `pow2` work and props, and `extensions` fields other
 * than comment_options', are `any`. `custom` and `custom_binary` data is a
 * hex string. An operation added to the chain after this list was written
 * arrives with a `type` not listed here.
 */
export type BlockApiOperation =
    | BlockApiOperationOf<AccountCreateOperation>
    | BlockApiOperationOf<AccountCreateWithDelegationOperation>
    | BlockApiOperationOf<AccountUpdateOperation>
    | BlockApiOperationOf<AccountUpdate2Operation>
    | BlockApiOperationOf<AccountWitnessProxyOperation>
    | BlockApiOperationOf<AccountWitnessVoteOperation>
    | BlockApiOperationOf<CancelTransferFromSavingsOperation>
    | BlockApiOperationOf<ChangeRecoveryAccountOperation>
    | BlockApiOperationOf<ClaimAccountOperation>
    | BlockApiOperationOf<ClaimRewardBalanceOperation>
    | BlockApiOperationOf<CollateralizedConvertOperation>
    | BlockApiOperationOf<CommentOperation>
    | BlockApiCommentOptionsOperation
    | BlockApiOperationOf<ConvertOperation>
    | BlockApiOperationOf<CreateClaimedAccountOperation>
    | BlockApiOperationOf<CreateProposalOperation>
    | BlockApiOperationOf<CustomOperation>
    | BlockApiOperationOf<CustomBinaryOperation>
    | BlockApiOperationOf<CustomJsonOperation>
    | BlockApiOperationOf<DeclineVotingRightsOperation>
    | BlockApiOperationOf<DelegateVestingSharesOperation>
    | BlockApiOperationOf<DeleteCommentOperation>
    | BlockApiOperationOf<EscrowApproveOperation>
    | BlockApiOperationOf<EscrowDisputeOperation>
    | BlockApiOperationOf<EscrowReleaseOperation>
    | BlockApiOperationOf<EscrowTransferOperation>
    | BlockApiOperationOf<FeedPublishOperation>
    | BlockApiOperationOf<LimitOrderCancelOperation>
    | BlockApiOperationOf<LimitOrderCreateOperation>
    | BlockApiOperationOf<LimitOrderCreate2Operation>
    | BlockApiOperationOf<PowOperation>
    | BlockApiOperationOf<Pow2Operation>
    | BlockApiOperationOf<RecoverAccountOperation>
    | BlockApiOperationOf<RecurrentTransferOperation>
    | BlockApiOperationOf<RemoveProposalOperation>
    | BlockApiOperationOf<ReportOverProductionOperation>
    | BlockApiOperationOf<RequestAccountRecoveryOperation>
    | BlockApiOperationOf<ResetAccountOperation>
    | BlockApiOperationOf<SetResetAccountOperation>
    | BlockApiOperationOf<SetWithdrawVestingRouteOperation>
    | BlockApiOperationOf<TransferOperation>
    | BlockApiOperationOf<TransferFromSavingsOperation>
    | BlockApiOperationOf<TransferToSavingsOperation>
    | BlockApiOperationOf<TransferToVestingOperation>
    | BlockApiOperationOf<UpdateProposalOperation>
    | BlockApiOperationOf<UpdateProposalVotesOperation>
    | BlockApiOperationOf<VoteOperation>
    | BlockApiOperationOf<WithdrawVestingOperation>
    | BlockApiOperationOf<WitnessSetPropertiesOperation>
    | BlockApiOperationOf<WitnessUpdateOperation>

/**
 * Signed transaction in the `block_api` format. Unlike condenser's, it
 * carries no `transaction_id`, `block_num` or `transaction_num`; the ids
 * are in the block's `transaction_ids`, in the same order.
 */
export interface BlockApiTransaction {
    ref_block_num: number
    ref_block_prefix: number
    expiration: string // time_point_sec
    operations: BlockApiOperation[]
    extensions: any[]
    signatures: string[]
}

/**
 * Unsigned block header in the `block_api` format.
 */
export interface BlockApiBlockHeader {
    previous: string // block_id_type
    timestamp: string // time_point_sec
    witness: string
    transaction_merkle_root: string // checksum_type
    extensions: { type: string; value: any }[] // block_header_extensions_type
}

/**
 * Full signed block in the `block_api` format.
 */
export interface BlockApiSignedBlock extends BlockApiBlockHeader {
    witness_signature: string // signature_type
    block_id: string
    signing_key: string
    transaction_ids: string[]
    transactions: BlockApiTransaction[]
}
