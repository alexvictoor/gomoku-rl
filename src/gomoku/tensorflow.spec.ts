/**
 * @jest-environment node
 */

import * as tf from '@tensorflow/tfjs-node';
import { extractBestActionFromTensor, learnQualitiesFromRewards, learnQualitiesFromExperiences, extractQualityFromTensor, buildMask, trainUsingExperiences } from "./tensorflow";
import { createModel } from './model';
import { Game } from './game';

describe('best action', () => {

    it('should return -1 when no possible action', async () => {
        // given
        const actionsTensor = tf.tensor([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        const allowedActions: number[] = [];
        // when
        const numTensors0 = tf.memory().numTensors;
        const bestAction = await extractBestActionFromTensor(actionsTensor, allowedActions);
        // then
        expect(bestAction).toBe(-1);
        expect(tf.memory().numTensors).toEqual(numTensors0);
    })

    it('should filter out impossible actions', async () => {
        // given
        const actionsTensor = tf.tensor([1, -2, 3, -1, -5, 6, 7, 8, 9]);
        const allowedActions: number[] = [1, 3];
        // when
        const bestAction = await extractBestActionFromTensor(actionsTensor, allowedActions);
        // then
        expect(bestAction).toBe(3);
    })
});

describe('quality', () => {

    it('should compute quality ', async () => {
        // given
        const actionsTensor = tf.tensor([1, -2, -3, -1, -5, 6, 7, 8, 9]);
        const allowedActions: number[] = [1, 2];
        // when
        const quality = await extractQualityFromTensor(actionsTensor, allowedActions);
        // then
        expect(quality).toBe(-2);
    })
});

describe('mask', () => {
    it('should fit allowed actions', async () => {
        // given
        const boardSize = 3;
        const allowedActions: number[] = [1, 2, 6];
        // when
        const mask = buildMask(boardSize, allowedActions);
        // then
        expect(mask).toStrictEqual([-1000, 0, 0, -1000, -1000, -1000, 0, -1000, -1000,]);
    })
})

describe('model', () => {



    it.only('should learn from experiences', async () => {
        // given
        const model = createModel(3);
        const targetModel = createModel(3);
        const game1 = Game.fromString('.ox ... ...');
        const nextGame1 = Game.fromString('.ox .ox ...');
        const game2 = Game.fromString('... .ox ...');
        const nextGame2 = Game.fromString('... .ox .ox');

        const game3 = Game.fromString('ox. ox. ...');
        const game4 = Game.fromString('.ox .ox ...');

        // when
        for (let index = 0; index < 5; index++) {
            const numTensors0 = tf.memory().numTensors;
            trainUsingExperiences(
                model,
                targetModel,
                [
                    { game: game3, action: 7, reward: 1, player: 'Player1' },
                    { game: game4, action: 8, reward: 1, player: 'Player1' },
                ],
                [
                    { game: game1, action: 7, nextGame: nextGame1, player: 'Player1' },
                    { game: game2, action: 8, nextGame: nextGame2, player: 'Player1' },
                ]);
            if (index > 0) {
                expect(tf.memory().numTensors).toEqual(numTensors0);
            }
        }
        // then
        // no crash
    })
});