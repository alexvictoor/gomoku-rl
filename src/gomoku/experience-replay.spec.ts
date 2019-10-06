/**
 * @jest-environment node
 */

import * as tf from '@tensorflow/tfjs-node';
import { createModel } from './model';
import { Game } from './game';
import { ExperienceReplayBuffer } from './experience-replay';

//jest.setTimeout(100000);
describe('experience replay buffer', () => {
    it('should help model learn from experiences', () => {
        // given
        const model = createModel(3);
        const game1 = Game.fromString('.ox ... ...');
        const nextGame1 = Game.fromString('.ox .ox ...');
        const game2 = Game.fromString('... .ox ...');
        const nextGame2 = Game.fromString('... .ox .ox');
        const game3 = Game.fromString('ox. ox. ...');
        const game4 = Game.fromString('.ox .ox ...');
        const buffer = new ExperienceReplayBuffer(model);
        // when
        for (let index = 0; index < 1; index++) {
            buffer.recordRegularExperience({ player: 'Player1', game: game1, action: 7, nextGame: nextGame1 });
            buffer.recordRegularExperience({ player: 'Player1', game: game2, action: 8, nextGame: nextGame2 });
            buffer.recordRewardExperience({ player: 'Player1', game: game3, action: 7, reward: 1 });
            buffer.recordRewardExperience({ player: 'Player1', game: game4, action: 8, reward: 1 });

        }

        // then no leak, no crash
        //const numTensors0 = tf.memory().numTensors;
        buffer.learnFromExperiences(model);
        //expect(tf.memory().numTensors).toEqual(numTensors0);
        //await buffer.learnFromExperiences(model);
        // no crash
    })

});