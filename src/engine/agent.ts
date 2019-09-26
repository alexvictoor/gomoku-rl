import { Game, Player } from './game';

export type Agent = {
    play: (game: Game) => Game ,
    startNewGame: () => void,
};

type Policy = (game: Game) => number;

export const DummyAgent = (game: Game) => {
    const indices = game.whereToPlay();
    if (indices.length === 0) {
        //Game is already over
        return game;
    }
    return game.play(indices[0]); 
} 

type GameAndAction = [Game, number];

export class QAgent implements Agent {
    formerState?: GameAndAction;
    qualities: {[gameAndAction: string]: number};

    constructor(private player: Player, private alpha: number, public explorationFactor: number) {
        this.getQuality = this.getQuality.bind(this);
        this.play = this.play.bind(this);
        this.qualities = {};
    }

    startNewGame() {
        this.formerState = undefined;
        //console.log("start new", Object.entries(this.qualities).filter(([key, value]) => (key.startsWith('.........'))));
    }

    play(game: Game): Game {
        if (game.isOver()) {
            if (!this.formerState) {
                // should not happen except during experience replay
            } else {
                this.learn(this.formerState, game, -1);
            }
            return game;
        }
        const action = this.chooseAction(game);
        if (this.formerState) {
            this.learn(this.formerState, game, action);
        }
        this.formerState = [game, action];
        return game.play(action);
    }

    learn([formerGame, formerAction]: GameAndAction, currentGame: Game, action: number) {
        const qualityOfFormerGame = this.getQuality(formerGame.toString() + formerAction);
        const qualityOfCurrentGame = this.getQuality(currentGame.toString() + action);
        const reward = this.computeReward(currentGame); 

        const updatedQualityOfFormerGame = 
            qualityOfFormerGame + this.alpha * (reward + qualityOfCurrentGame - qualityOfFormerGame);

       // Q =  Q + ( R + Q' - Q ) / 2
       // 2Q = 2Q + R + Q' - Q
       // Q = Q' + R
       // Q' = Q - R

       // avec 0.3
       // Q =  Q + ( R + Q' - Q ) / 3
       // 3Q = 3Q  


        this.qualities[formerGame.toString() + formerAction] = updatedQualityOfFormerGame;
    }

    private computeReward(currentGame: Game) {
        const winner = currentGame.getWinner();
        if (winner) {
            if (winner === this.player) {
                return 100;
            } 
            return -100;
        }
        if (currentGame.drawnGame()) {
            return 10;
        }
        return 0;
    }

    private getQuality(gameAndAction: string) {
        return this.qualities[gameAndAction] || 0;
    }

    chooseAction(game: Game): number {
        const outcomes = game.getPossibleOutcomes();
        const winningPlay = outcomes.find(([_, game]) => game.getWinner() === this.player);
        if (winningPlay) {
            const [actionIndex, _] = winningPlay;
            return actionIndex;
        }
        const gamePrefix = game.toString();
        const bestActions: number[] = (
            outcomes
                .map(([actionIndex, _]) => ([actionIndex, gamePrefix + String(actionIndex)]))
                .map(([actionIndex, gameAndAction]) => ([actionIndex, this.getQuality(gameAndAction as string)]))
                .sort((t1, t2) => ((t2[1] as number) - (t1[1] as number)))
                .map(([actionIndex, _]) => actionIndex as number)
        );
        const explore = Math.random() < this.explorationFactor;
        if (explore) {
            const randomIndex = Math.floor(Math.random() * bestActions.length);
            return bestActions[randomIndex]; 
        }
        return bestActions[0];
    }
}
