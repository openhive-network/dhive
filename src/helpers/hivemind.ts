/**
 * Hivemind database query wrapper
*/

import { Client } from './../client'
import { Discussion } from '../chain/comment'
import { Account } from '../chain/account'
import { communityDetail, Notifications } from '../chain/hivemind'

interface PostsQuery {
    limit?: number, // Return how many posts from api
    sort: "trending" | "hot" | "created" | "promoted" | "payout" | "payout_comments" | "muted",
    tag?: string[] | string,
    observer?: string,
    start_author?: string,
    start_permlink?: string
}

/**
 * Omitting sort extended from BridgeParam
 * */
interface AccountPostsQuery extends Omit<PostsQuery, 'sort'> {
    account: string,
    sort: "posts"
}

interface CommunityQuery {
    name: string,
    observer: string
}

interface CommunityRolesQuery {
    community: string
}

interface AccountNotifsQuery {
    account: Account['name'],
    limit: number,
    type?: "new_community" | "pin_post"
}

interface ListCommunitiesQuery {
    last?: string,
    limit: number,
    query?: string | any, //To be developed, not ready yet
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

    public getCommunity(options: CommunityQuery): Promise<communityDetail[]> {
        return this.call('get_community', options)
    }

    public listAllSubscriptions(account: Account['name'] | object): Promise<Discussion[]> {
        return this.call('list_all_subscriptions', account)
    }

    public getAccountNotifications(options?: AccountNotifsQuery): Promise<Notifications[]> {
        return this.call('account_notifications', options)
    }

    public listCommunities(options: ListCommunitiesQuery): Promise<communityDetail[]> {
        return this.call('list_communities', options)
    }

}