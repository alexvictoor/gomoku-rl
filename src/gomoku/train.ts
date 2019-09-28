import * as tf from '@tensorflow/tfjs-node';
import { createModel } from './model';
import { Game } from './game';
import { DeepAgent, NaiveAgent } from './agent';
import { ExperienceReplayBuffer } from './experience-replay';
const train = async (size: number, episodes: number) => {
    let model;
    try {
        model = await tf.loadLayersModel('file:////Users/avictoor/work/ml/gomoku-rl/model/model.json');
    } catch (error) {
        console.warn("Creating model from scratch");
        model = createModel(size);
    }

    model.compile({
        loss: "meanSquaredError",
        optimizer: "adam",
    });
    
    const emptyBoard = Array(size * size).fill('.');
    const initialGame = new Game(emptyBoard);

    const replayBuffer = new ExperienceReplayBuffer();
    //const firstAgent = new DeepAgent(model, 0.5, replayBuffer);
    const firstAgent = new NaiveAgent('Player1', replayBuffer);
    const secondAgent = new NaiveAgent('Player2', replayBuffer);
    //const secondAgent = new DeepAgent(model, 0.3, replayBuffer);
    const agents = [firstAgent, secondAgent];
    let i = 0;
    const gameOutcomes = {
        'In Progress': 0,
        'Draw': 0,
        'Player1 Wins': 0,
        'Player2 Wins': 0,
    };
    while (i < episodes) {
        let game = initialGame;
        let turn = 0;
        firstAgent.startNewGame();
        secondAgent.startNewGame();
        while(!game.isOver()) {
            game = await agents[turn%2].play(game);
            turn++
        }
        gameOutcomes[game.status] = gameOutcomes[game.status] + 1;

        // learn to win or loose
        await firstAgent.play(game);
        await secondAgent.play(game);
        if (i % 5 === 0) {
            await replayBuffer.learnFromExperiences(model);
            console.log(gameOutcomes);
            //if (i % 1000 === 0) {
                await model.save('file:////Users/avictoor/work/ml/gomoku-rl/model');
            //}
            //firstAgent.explorationFactor = 0.5 * (episodes - i) / episodes;
            //secondAgent.explorationFactor = 0.3 * (episodes -i) / episodes;
        }
        i++;
    }
    await model.save('file:////Users/avictoor/work/ml/gomoku-rl/model');
}

train(19, 10000);
