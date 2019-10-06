import * as tf from '@tensorflow/tfjs';
import { RewardExperience, RegularExperience } from "./experience";
import { trainUsingExperiences, copyWeights } from './tensorflow';


export class ExperienceReplayBuffer {

    private rewardBuffer: RewardExperience[] = [];
    private largeRewardBuffer: RewardExperience[] = [];
    private regularBuffer: RegularExperience[] = [];
    private largeRegularBuffer: RegularExperience[] = [];
   

    constructor(
        private targetModel: tf.LayersModel,
        private rewardBufferCapacity: number = 500,
        private regularBufferCapacity: number = 10000
    ) {

    }

    recordRewardExperience(xp: RewardExperience) {
        this.rewardBuffer.push(xp);
    }

    recordRegularExperience(xp: RegularExperience) {
        this.regularBuffer.push(xp);
    }


    learnFromExperiences(model: tf.LayersModel) {
        if (this.largeRegularBuffer.length > this.regularBufferCapacity) {
            this.largeRegularBuffer = this.largeRegularBuffer.slice(this.largeRegularBuffer.length - this.regularBufferCapacity);
        }
        if (this.largeRewardBuffer.length > this.rewardBufferCapacity) {
            this.largeRewardBuffer = this.largeRewardBuffer.slice(this.largeRewardBuffer.length - this.rewardBufferCapacity);
        }

        trainUsingExperiences(model, this.targetModel, this.rewardBuffer, this.regularBuffer);


        for (let epoch = 0; epoch < 3; epoch++) {
            for (let index = 0; index < 160; index = index + 16) {
                const regularExperiences = this.largeRegularBuffer.slice(index, index + 16);
                const rewardExperiences = this.largeRewardBuffer.slice(index, index + 32);
                if (rewardExperiences.length === 0 || regularExperiences.length === 0) {
                    break;
                }
                trainUsingExperiences(model, this.targetModel, rewardExperiences, regularExperiences);
            }
        }
        copyWeights(model, this.targetModel);

        this.largeRewardBuffer.push(...this.rewardBuffer);
        this.largeRegularBuffer.push(...this.regularBuffer);

        this.rewardBuffer = [];
        this.regularBuffer = [];

        tf.util.shuffle(this.largeRewardBuffer);
        tf.util.shuffle(this.largeRegularBuffer);


        //await learnQualitiesFromExperiences(model, rewardExperiences, regularExperiences);
        //await learnQualitiesFromExperiences(model, rewardExperiences, regularExperiences);
    }


}