import { Game, Player } from './game';

export type RewardExperience = {
    game: Game,
    action: number, 
    reward: number,
    player: Player,
}

export type RegularExperience = {
    game: Game,
    action: number, 
    nextGame: Game,
    player: Player,
}

export type Experience = RewardExperience | RegularExperience;

export const isRewardExperience = (xp: Experience): xp is RewardExperience => {
    return !!(xp as any).reward
}

export const isRegularExperience = (xp: Experience): xp is RegularExperience => {
    return !!(xp as any).nextGame
} 