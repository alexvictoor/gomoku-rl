/**
 * @jest-environment node
 */

import * as tf from '@tensorflow/tfjs-node';
import { createModel } from './model';
import { Game } from './game';
import { ExperienceReplayBuffer } from './experience-replay';

jest.setTimeout(100000);
describe('experience replay buffer', () => {
    it('should help model learn from experiences', async () => {
        // given
        const buffer = new ExperienceReplayBuffer();
        const model = createModel(3);
        const game1 = Game.fromString('.ox ... ...');
        const nextGame1 = Game.fromString('.ox .ox ...');
        const game2 = Game.fromString('... .ox ...');
        const nextGame2 = Game.fromString('... .ox .ox');
        const game3 = Game.fromString('ox. ox. ...');
        const game4 = Game.fromString('.ox .ox ...');
        // when
        for (let index = 0; index < 100; index++) {
            buffer.recordRegularExperience({ game: game1, action: 7, nextGame: nextGame1 });
            buffer.recordRegularExperience({ game: game2, action: 8, nextGame: nextGame2 });
            buffer.recordRewardExperience({ game: game3, action: 7, reward: 100 });
            buffer.recordRewardExperience({ game: game4, action: 8, reward: 100 });

        }

        // then
        await buffer.learnFromExperiences(model);
        //await buffer.learnFromExperiences(model);
        // no crash
    })

});