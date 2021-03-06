import * as tf from '@tensorflow/tfjs-node';
import { Game, Player, getAdviceAction } from './game';
import { predictBestAction } from './tensorflow';
import { ExperienceReplayBuffer } from './experience-replay';

export type Agent = {
    play: (game: Game) => Promise<Game>,
    startNewGame: () => void,
};

export class DummyAgent implements Agent {
    async play(game: Game) {
        const indices = game.whereToPlay();
        if (indices.length === 0) {
            //Game is already over
            return game;
        }
        return game.play(indices[0]);
    }

    startNewGame() {}
}

export class NaiveAgent implements Agent {

    private previousAction?: number;
    private previousGame?: Game;

    constructor(
        private player: Player,
        private experienceBuffer?: ExperienceReplayBuffer
    ) {

    }

    async play(game: Game) {
        
        const indices = game.whereToPlay();

        if (indices.length === 0) {
            //Game is already over
            this.learnFrom(game);
            return game;
        }
        this.previousGame = game;
        const advice = getAdviceAction(game);
        if (advice) {
            this.learnFrom(game);
            this.previousAction = advice;
            return game.play(advice);
        }

        const random = Math.floor(Math.random() * indices.length);
        this.previousAction = indices[random];

        return game.play(indices[random]);
    }


    private computeReward(player: Player, game: Game) {
        if (game.status === `${player} Wins`) {
            return 1;
        }
        if (game.status === 'Draw') {
            return 0.5;
        }
        if (game.status === 'In Progress') {
            return 0;
        }
        // player lost
        return -1;
    }

    private learnFrom(game: Game) {
        if (!this.experienceBuffer || !this.previousGame || !this.previousAction) {
            return;
        }

        const reward = this.computeReward(this.player, game);
        if (reward === 0) {
            // learn Q(previous game, action) = alpha * Q(current game, action)
            this.experienceBuffer.recordRegularExperience({
                game: this.previousGame,
                action: this.previousAction, 
                nextGame: game,
                player: this.player,
            });
        } else {
            // learn Q(previous game, action) = reward
            this.experienceBuffer.recordRewardExperience({
                game: this.previousGame,
                action: this.previousAction, 
                reward,
                player: this.player,
            });
        }
        // target = np.array(v_s + self.alpha * (R + v_s_tag - v_s))
    }


    startNewGame() {
        this.previousAction = undefined;
        this.previousGame = undefined;
    }
}


export class DeepAgent implements Agent {

    private previousAction?: number;
    private previousGame?: Game;
    
    constructor(
        private player: Player,
        private model: tf.LayersModel, 
        public explorationFactor: number,
        private experienceBuffer?: ExperienceReplayBuffer
    ) {

    }

    async play(game: Game) {
        this.learnFrom(game);
        const allowedActions = game.whereToPlay();
        if (allowedActions.length === 0) {
            // Game is already over
            return game;
        }

        if (Math.random() < this.explorationFactor) {
            this.previousGame = undefined;
            this.previousAction = undefined;
            const randomActionIndex = Math.floor(Math.random() * allowedActions.length);
            const randomAction = allowedActions[randomActionIndex];
            return game.play(randomAction);    
        }

        const action = await this.chooseBestAction(game);
        this.previousGame = game;
        this.previousAction = action;
        return game.play(action);
    }

    
    private chooseBestAction(game: Game): Promise<number> {
        return predictBestAction(this.model, game, this.player);
    }

    private learnFrom(game: Game) {
        if (!this.experienceBuffer || !this.previousGame || !this.previousAction) {
            return;
        }

        const reward = this.computeReward(this.player, game);
        if (reward === 0) {
            // learn Q(previous game, action) = alpha * Q(current game, action)
            this.experienceBuffer.recordRegularExperience({
                game: this.previousGame,
                action: this.previousAction, 
                nextGame: game,
                player: this.player
            });
        } else {
            // learn Q(previous game, action) = reward
            this.experienceBuffer.recordRewardExperience({
                game: this.previousGame,
                action: this.previousAction, 
                reward,
                player: this.player
            });
        }
        // target = np.array(v_s + self.alpha * (R + v_s_tag - v_s))
    }
    
    private computeReward(player: Player, game: Game) {
        if (game.status === `${player} Wins`) {
            return 1;
        }
        if (game.status === 'Draw') {
            return 0.5;
        }
        if (game.status === 'In Progress') {
            return 0;
        }
        // player lost
        return -1;
    }

    startNewGame() {
        this.previousAction = undefined;
        this.previousGame = undefined;
    }


}

