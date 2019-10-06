import * as tf from '@tensorflow/tfjs-node';
import { createModel } from './model';
import { Game } from './game';
import { DeepAgent, NaiveAgent, DummyAgent } from './agent';
import { ExperienceReplayBuffer } from './experience-replay';
import { copyWeights } from './tensorflow';
const train = async (size: number, episodes: number) => {
    let model;
    try {
        model = await tf.loadLayersModel('file:////Users/avictoor/work/ml/gomoku-rl/model2/model.json');
    } catch (error) {
        console.warn("Creating model from scratch");
        model = createModel(size);
    }

    const targetModel = createModel(size);
    
    copyWeights(model, targetModel);
    
    /*model.compile({
        loss: "meanSquaredError",
        optimizer: "adam",
    });*/
    
    const emptyBoard = Array(size * size).fill('.');
    const initialGame = new Game(emptyBoard);

    const replayBuffer = new ExperienceReplayBuffer(targetModel);
    //const firstAgent = new DeepAgent(model, 0.5, replayBuffer);
    const firstAgent = new DummyAgent();
    //const secondAgent = new NaiveAgent('Player2', replayBuffer);
    const secondAgent = new DeepAgent('Player2', model, 0, replayBuffer);
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
        console.log({ turn });
        
        gameOutcomes[game.status] = gameOutcomes[game.status] + 1;

        // learn to win or loose
        await firstAgent.play(game);
        await secondAgent.play(game);

        
        if (i % 1 === 0) {
            replayBuffer.learnFromExperiences(model);
            console.log(gameOutcomes);
            if (i % 10 === 0) {
                await model.save('file:////Users/avictoor/work/ml/gomoku-rl/model2');
            }
            //firstAgent.explorationFactor = 0.5 * (episodes - i) / episodes;
            //secondAgent.explorationFactor = 0.3 * (episodes -i) / episodes;
        }
        i++;
    }
    await model.save('file:////Users/avictoor/work/ml/gomoku-rl/model2');
}

train(19, 100);
