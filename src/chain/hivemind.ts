export interface CommunityDetail {
    id: number
    name: string
    title: string
    about: string
    lang: string
    type_id: number
    is_nsfw: false
    subscribers: number
    sum_pending: number
    num_pending: number
    num_authors: number
    created_at: string
    avatar_url: string
    context: object
    description: string
    flag_text: string
    settings: {}
    team?: string[]
    admins?: string[]
}

export interface Notifications {
    id: number
    type: string
    score: number
    date: string
    msg: string
    url: string
}
