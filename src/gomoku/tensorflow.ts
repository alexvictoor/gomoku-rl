import * as tf from '@tensorflow/tfjs';
import { Game } from './game';
import { RewardExperience, RegularExperience, Experience, isRewardExperience, isRegularExperience } from './experience';
import { Tensor } from '@tensorflow/tfjs';

export const game2Tensor = (game: Game): tf.Tensor => {
    return tf.tidy(() => {
        const boardArray = game.asNumberArray();
        return tf.tensor(boardArray).as3D(game.size, game.size, 3).expandDims();
    });
}

export const predictQualitiesForActions = (model: tf.LayersModel, game: Game): tf.Tensor => {
    return tf.tidy(() => {
        const xs = game2Tensor(game);
        return (model.predict(xs) as tf.Tensor).flatten();
    });
}

export const predictBestAction = (model: tf.LayersModel, game: Game): Promise<number> => {
   return extractBestActionFromTensor(
       predictQualitiesForActions(model, game), 
       game.whereToPlay()
    );
}

export const predictGameQuality = (model: tf.LayersModel, game: Game): Promise<number> => {
    return extractQualityFromTensor(
        predictQualitiesForActions(model, game), 
        game.whereToPlay()
     );
 }

export const extractBestActionFromTensor = async (actions: tf.Tensor, allowedActions: number[]): Promise<number> => {
    //actions.print();
    //console.log('coucou', allowedActions);
    if (allowedActions.length === 0) {
        return -1;
    }
    const qualities = (await actions.array()) as number[]
    const bestAction = allowedActions
        .map(action => ({ action, quality: qualities[action]}))
        .sort((first, second) => (second.quality - first.quality))[0].action; 
    return bestAction; 
}

export const extractQualityFromTensor = async (actions: tf.Tensor, allowedActions: number[]): Promise<number> => {
    if (allowedActions.length === 0) {
        return -1;
    }
    /*const mask = await tf.zerosLike(actions).buffer();
    allowedActions.forEach(actionIndex => mask.set(1, actionIndex));
    const quality = await actions.mul(mask.toTensor()).max().array();*/

    const qualitiesForActions = (await actions.array()) as number[];
    const qualities = allowedActions.map(action => qualitiesForActions[action]);
    return Math.max(...qualities);
}

export const learnQualityFromReward = async (model: tf.LayersModel, game: Game, action: number, reward: number) => {
    const qualitiesForActions = await predictQualitiesForActions(model, game).buffer();
    qualitiesForActions.set(reward, action);
    const ys = tf.tidy(() => qualitiesForActions.toTensor().expandDims());
    const xs = game2Tensor(game);
    await model.fit(xs, ys);
}

export const learnQualitiesFromRewards = async (model: tf.LayersModel, experiences: RewardExperience[]) => {
    const xsStack: Tensor[] = [];
    const ysStack: Tensor[] = [];
    for (const { game, action, reward } of experiences) {
        xsStack.push(game2Tensor(game).squeeze());
        const qualitiesForActions = await predictQualitiesForActions(model, game).buffer();
        qualitiesForActions.set(reward, action);
        ysStack.push( tf.tidy(() => qualitiesForActions.toTensor()));
    }
    const xs = tf.stack(xsStack);
    const ys = tf.stack(ysStack);
    const history = await model.fit(xs, ys);
    console.log({ history })
}

const ALPHA = 0.5;

export const learnQualityFromNextGame = async (model: tf.LayersModel, game: Game, action: number, nextGame: Game) => {
    const qualitiesForActions = await predictQualitiesForActions(model, game).buffer();
    const nextGameQuality = await predictGameQuality(model, nextGame);
    qualitiesForActions.set(ALPHA * nextGameQuality, action);
    const ys = tf.tidy(() => qualitiesForActions.toTensor().expandDims());
    const xs = game2Tensor(game);
    await model.fit(xs, ys);
}
export const learnQualitiesFromNextGames = async (model: tf.LayersModel, experiences: RegularExperience[]) => {
    const xsStack: Tensor[] = [];
    const ysStack: Tensor[] = [];
    
    for (const { game, action, nextGame } of experiences) {
        xsStack.push(game2Tensor(game).squeeze());
        const qualitiesForActions = await predictQualitiesForActions(model, game).buffer();
        const nextGameQuality = await predictGameQuality(model, nextGame);
        qualitiesForActions.set(ALPHA * nextGameQuality, action);
        ysStack.push( tf.tidy(() => qualitiesForActions.toTensor()));
    }

    const xs = tf.stack(xsStack);
    const ys = tf.stack(ysStack);
    await model.fit(xs, ys);
}

export const learnQualitiesFromExperiences = async (model: tf.LayersModel, rewardExperiences: RewardExperience[], regularExperiences: RegularExperience[]) => {
    
    const xs = tf.tidy(() => {
        const xsStack: Tensor[] = [];
        for (const { game } of rewardExperiences) {
            xsStack.push(game2Tensor(game).squeeze());
        }
        for (const { game } of regularExperiences) {
            xsStack.push(game2Tensor(game).squeeze());
        }
        return tf.stack(xsStack);
    });
   

    const nextGameQualityTensor = tf.tidy(() => {
        const xsStack: Tensor[] = [];
        for (const xp of regularExperiences) {
            xsStack.push(game2Tensor(xp.nextGame).squeeze());
        }
        const xs = tf.stack(xsStack);
        return model.predict(xs) as Tensor; 
    });

    const nextGameQualityArray = await nextGameQualityTensor.array() as number[][];
    const nextGameQualities = nextGameQualityArray.map((qualitiesForActions, index) => {
        const qualities = 
            regularExperiences[index].nextGame.whereToPlay().map(action => qualitiesForActions[action]);
        return Math.max(...qualities);
    });

    const targetQualitiesBuffer = await (model.predict(xs) as Tensor).buffer();
    rewardExperiences.forEach(({action, reward}, index) => {
        targetQualitiesBuffer.set(reward, index, action);
    });
    regularExperiences.forEach(({action}, index) => {
        const quality = ALPHA * nextGameQualities[index];
        targetQualitiesBuffer.set(quality, index + rewardExperiences.length, action);
    });

    const ys = targetQualitiesBuffer.toTensor();

    await model.fit(xs, ys);
}