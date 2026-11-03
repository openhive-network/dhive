/**
 * @file block_api helper.
 *
 * Blocks come in the `block_api` format: `{type, value}` operations and NAI
 * assets. On HAF API nodes these calls are served by HAfAH rather than hived.
 */

import { BlockApiBlockHeader, BlockApiSignedBlock } from '../chain/block-api'
import { Client } from './../client'

export class BlockAPI {
    public constructor(public readonly client: Client) {}

    /**
     * Convenience for calling `block_api`.
     */
    public call(method: string, params?: any): Promise<any> {
        return this.client.call('block_api', method, params)
    }

    /**
     * Return block *blockNum*, or `null` if the node has no such block.
     */
    public async getBlock(blockNum: number): Promise<BlockApiSignedBlock | null> {
        return (await this.call('get_block', { block_num: blockNum })).block || null
    }

    /**
     * Return the header of block *blockNum*, or `null` if the node has no such block.
     */
    public async getBlockHeader(blockNum: number): Promise<BlockApiBlockHeader | null> {
        return (await this.call('get_block_header', { block_num: blockNum })).header || null
    }

    /**
     * Return up to *count* consecutive blocks starting at *startingBlockNum*.
     * Nodes reject a *count* above 1000, and return no blocks past their head block.
     */
    public async getBlockRange(startingBlockNum: number, count: number): Promise<BlockApiSignedBlock[]> {
        return (await this.call('get_block_range', { count, starting_block_num: startingBlockNum })).blocks
    }
}
