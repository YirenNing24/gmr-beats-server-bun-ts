import { Time } from "rethinkdb";


export interface CardOwned {
    name: string;
}

export interface AnimalMatch {
    name: string;
}


export interface RewardData {
    username?: string;
    type?: 'song';

    songName?: string;
    songRewardType?: 'first';

    reward?: string;
    rewardName?: string;
    
    claimed?: boolean;
    claimedAt?: Time
    eligible?: boolean;


}