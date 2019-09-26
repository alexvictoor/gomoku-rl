import * as tf from '@tensorflow/tfjs';
import { RewardExperience, RegularExperience } from "./experience";
import { learnQualitiesFromRewards, learnQualitiesFromNextGames, learnQualitiesFromExperiences } from './tensorflow';


export class ExperienceReplayBuffer {

    private rewardBuffer: RewardExperience[] = [];
    private largeRewardBuffer: RewardExperience[] = [];
    private regularBuffer: RegularExperience[] = [];
    private largeRegularBuffer: RegularExperience[] = [];
   
    constructor(
        private rewardBufferCapacity: number = 500, 
        private regularBufferCapacity: number = 1000
    ) {

    }

    recordRewardExperience(xp: RewardExperience) {
        this.rewardBuffer.push(xp);
    }

    recordRegularExperience(xp: RegularExperience) {
        this.regularBuffer.push(xp);
    }

    async learnFromExperiences(model: tf.LayersModel) {
        if (this.largeRegularBuffer.length > this.regularBufferCapacity) {
            this.largeRegularBuffer = this.largeRegularBuffer.slice(this.largeRegularBuffer.length - this.regularBufferCapacity);
        }
        if (this.largeRewardBuffer.length > this.rewardBufferCapacity) {
            this.largeRewardBuffer = this.largeRewardBuffer.slice(this.largeRewardBuffer.length - this.rewardBufferCapacity);
        }
      
        const rewardExperiences = [ ...this.rewardBuffer, ...this.largeRewardBuffer];
        const regularExperiences = [ ...this.regularBuffer, ...this.largeRegularBuffer.slice(0, 100)];
        this.largeRewardBuffer.push(...this.rewardBuffer);
        this.largeRegularBuffer.push(...this.regularBuffer);
        tf.util.shuffle(this.largeRewardBuffer);
        tf.util.shuffle(this.largeRegularBuffer);
        this.rewardBuffer = [];
        this.regularBuffer = [];
        await learnQualitiesFromExperiences(model, rewardExperiences, regularExperiences);
    }


}