/**
 * Hivemind database query wrapper
 */

import { Account } from '../chain/account'
import { Discussion } from '../chain/comment'
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
 */
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
     * Convenience of calling hivemind api
     * @param method
     * @param params
     */
    public call(method: string, params?: any) {
        return this.client.call('bridge', method, params)
    }

    /**
     * Get trending, hot, recent community posts from Hivemind
     * @param options
     */
    public getRankedPosts(options: PostsQuery): Promise<Discussion[]> {
        return this.call('get_ranked_posts', options)
    }

    /**
     * Get posts by particular account from Hivemind
     * @param options
     */
    public getAccountPosts(options: AccountPostsQuery): Promise<Discussion[]> {
        return this.call('get_account_posts', options)
    }

    /**
     * Get community details such as who are the admin,
     * moderators, how many subscribers, etc..
     * @param options
     */
    public getCommunity(options: CommunityQuery): Promise<CommunityDetail[]> {
        return this.call('get_community', options)
    }

    /**
     * List all subscriptions by particular account
     * @param account the account you want to query
     * @returns {Array} return role, what community the account joined
     */
    public listAllSubscriptions(account: Account['name'] | object): Promise<Discussion[]> {
        return this.call('list_all_subscriptions', account)
    }

    /**
     * Get particular account notifications feed
     * @param options
     */
    public getAccountNotifications(options?: AccountNotifsQuery): Promise<Notifications[]> {
        return this.call('account_notifications', options)
    }

    /**
     * List all available communities on hivemind
     * @param options
     */
    public listCommunities(options: ListCommunitiesQuery): Promise<CommunityDetail[]> {
        return this.call('list_communities', options)
    }
}
