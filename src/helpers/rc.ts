import { Account } from '../chain/account'
import { getVests } from '../chain/misc'
import {
  FindRCAccountsResult,
  GetResourceParamsResult,
  GetResourcePoolResult,
  Manabar,
  RCAccount,
  RCParams,
  RCPool,
  TimeCodedManabar
} from '../chain/rc'
import { Client } from './../client'

export class RCAPI {
  constructor(private readonly client: Client) {}

  /**
   * Convenience for calling `rc_api`.
   */
  call<T>(method: string, params?: any): Promise<T> {
    return this.client.call<T>('rc_api', method, params)
  }

  /**
   * Returns RC data for array of usernames
   */
  async findRCAccounts(usernames: string[]): Promise<RCAccount[]> {
    const { rc_accounts } = await this.call<FindRCAccountsResult>('find_rc_accounts', { accounts: usernames })
    return rc_accounts
  }

  /**
   * Returns the global resource params
   */
  async getResourceParams(): Promise<RCParams> {
    const { resource_params } = await this.call<GetResourceParamsResult>('get_resource_params', {})
    return resource_params
  }

  /**
   * Returns the global resource pool
   */
  async getResourcePool(): Promise<RCPool> {
    return (await this.call<GetResourcePoolResult>('get_resource_pool', {})).resource_pool
  }

  /**
   * Makes a API call and returns the RC mana-data for a specified username
   */
  async getRCMana(username: string): Promise<Manabar> {
    const rc_account: RCAccount = (await this.findRCAccounts([username]))[0]
    return this.calculateRCMana(rc_account)
  }

  /**
   * Makes a API call and returns the VP mana-data for a specified username
   */
  async getVPMana(username: string): Promise<Manabar> {
    const [account] = await this.client.call<Account[]>('condenser_api', 'get_accounts', [[username]])
    return this.calculateVPMana(account)
  }

  /**
   * Calculates the RC mana-data based on an RCAccount - findRCAccounts()
   */
  calculateRCMana(rc_account: RCAccount): Manabar {
    return this.calculateManabar(Number(rc_account.max_rc), rc_account.rc_manabar)
  }

  /**
   * Calculates the RC mana-data based on an Account - getAccounts()
   */
  calculateVPMana(account: Account): Manabar {
    const max_mana: number = getVests(account) * Math.pow(10, 6)
    return this.calculateManabar(max_mana, account.voting_manabar)
  }

  /**
   * Internal convenience method to reduce redundant code
   */
  private calculateManabar(max_mana: number, { current_mana, last_update_time }: TimeCodedManabar): Manabar {
    const delta: number = Date.now() / 1000 - last_update_time
    const currentMana = Number(current_mana) + (delta * max_mana) / 432000
    let percentage: number = Math.round((currentMana / max_mana) * 10000)

    if (!isFinite(percentage) || percentage < 0) {
      percentage = 0
    } else if (percentage > 10000) {
      percentage = 10000
    }

    return { current_mana: currentMana, max_mana, percentage }
  }
}
