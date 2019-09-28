/**
 * @jest-environment node
 */

import * as tf from '@tensorflow/tfjs-node';
import { extractBestActionFromTensor, learnQualitiesFromRewards, learnQualitiesFromExperiences, extractQualityFromTensor } from "./tensorflow";
import { createModel } from './model';
import { Game } from './game';

describe('best action', () => {

    it('should return -1 when no possible action', async () => {
        // given
        const actionsTensor = tf.tensor([1,2,3,4,5,6,7,8,9]);
        const allowedActions: number[] = [];
        // when
        const bestAction = await extractBestActionFromTensor(actionsTensor, allowedActions);
        // then
        expect(bestAction).toBe(-1);
    })
    
    it('should filter out impossible actions', async () => {
        // given
        const actionsTensor = tf.tensor([1,-2,3,-1,-5,6,7,8,9]);
        const allowedActions: number[] = [1,3];
        // when
        const bestAction = await extractBestActionFromTensor(actionsTensor, allowedActions);
        // then
        expect(bestAction).toBe(3);
    })
});

describe('quality', () => {

    it('should compute quality ', async () => {
        // given
        const actionsTensor = tf.tensor([1,-2,-3,-1,-5,6,7,8,9]);
        const allowedActions: number[] = [1,2];
        // when
        const quality = await extractQualityFromTensor(actionsTensor, allowedActions);
        // then
        expect(quality).toBe(-2);
    })
});

describe('model', () => {

    it('should learn from rewards', async () => {
        // given
        const model = createModel(3);
        const game1 = Game.fromString('ox. ox. ...');
        const game2 = Game.fromString('.ox .ox ...');
        // when
        await learnQualitiesFromRewards(
            model,
            [
                { game: game1, action: 7, reward: 100, player: 'Player1'},
                { game: game2, action: 8, reward: 100, player: 'Player1'},
            ]
        );
        // then
        // no crash
    })


    

    it('should learn from experiences', async () => {
        // given
        const model = createModel(3);
        const game1 = Game.fromString('.ox ... ...');
        const nextGame1 = Game.fromString('.ox .ox ...');
        const game2 = Game.fromString('... .ox ...');
        const nextGame2 = Game.fromString('... .ox .ox');

        const game3 = Game.fromString('ox. ox. ...');
        const game4 = Game.fromString('.ox .ox ...');

        // when
        await learnQualitiesFromExperiences(
            model,
            [
                { game: game1, action: 7, reward: 100, player: 'Player1'},
                { game: game2, action: 8, reward: 100, player: 'Player1'},
            ],
            [
                { game: game1, action: 7, nextGame: nextGame1, player: 'Player1'},
                { game: game2, action: 8, nextGame: nextGame2, player: 'Player1'},
            ]);
        // then
        // no crash
    })
});