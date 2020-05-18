/**
 * Hivemind database query wrapper
*/

import { Discussion } from '../chain/comment'
import { Account } from '../chain/account'
import { CommunityDetail, Notifications } from '../chain/hivemind'
import { Client } from './../client'

interface PostsQuery {
    /**
     * Number of posts to fetch
     */
    limit?: number
    /**
     * Sorting posts
     */
    sort: 'trending' | 'hot' | 'created' | 'promoted' | 'payout' | 'payout_comments' | 'muted'
    /**
     * Filtering with tags
     */
    tag?: string[] | string
    /**
     * Observer account
     */
    observer?: string
    /**
     * Paginating last post author
     */
    start_author?: string
    /**
     * Paginating last post permlink
     */
    start_permlink?: string
}

/**
 * Omitting sort extended from BridgeParam
 * */
interface AccountPostsQuery extends Omit<PostsQuery, 'sort'> {
    account: string
    sort: 'posts'
}

interface CommunityQuery {
    name: string
    observer: string
}

interface CommunityRolesQuery {
    community: string
}

interface AccountNotifsQuery {
    account: Account['name']
    limit: number
    type?: 'new_community' | 'pin_post'
}

interface ListCommunitiesQuery {
    /**
     * Paginating last
     */
    last?: string
    /**
     * Number of communities to fetch
     */
    limit: number
    /**
     * To be developed, not ready yet
     */
    query?: string | any
    /**
     * Observer account
     */
    observer?: Account['name']
}

export class HivemindAPI {
    constructor(readonly client: Client) { }

    /**
   * Convenience for calling `hivemindAPI`.
   */
    public call(method: string, params?: any) {
        return this.client.call('bridge', method, params)
    }

    public getRankedPosts(options: PostsQuery): Promise<Discussion[]> {
        return this.call('get_ranked_posts', options)
    }

    public getAccountPosts(options: AccountPostsQuery): Promise<Discussion[]> {
        return this.call('get_account_posts', options)
    }

    public getCommunity(options: CommunityQuery): Promise<CommunityDetail[]> {
        return this.call('get_community', options)
    }

    public listAllSubscriptions(account: Account['name'] | object): Promise<Discussion[]> {
        return this.call('list_all_subscriptions', account)
    }

    public getAccountNotifications(options?: AccountNotifsQuery): Promise<Notifications[]> {
        return this.call('account_notifications', options)
    }

    public listCommunities(options: ListCommunitiesQuery): Promise<CommunityDetail[]> {
        return this.call('list_communities', options)
    }
}
