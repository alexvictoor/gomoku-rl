import * as tf from '@tensorflow/tfjs';
import { Game, Player, getAdviceAction } from './game';
import { RewardExperience, RegularExperience, Experience, isRewardExperience, isRegularExperience } from './experience';
import { Tensor, losses } from '@tensorflow/tfjs';

export const game2Tensor = (game: Game, player: Player): tf.Tensor => {
    return tf.tidy(() => {
        const boardArray = game.asNumberArray(player);
        return tf.tensor(boardArray).as3D(game.size, game.size, 3).expandDims();
    });
}

export const predictQualitiesForActions = (model: tf.LayersModel, game: Game, player: Player): tf.Tensor => {
    return tf.tidy(() => {
        const xs = game2Tensor(game, player);
        return (model.predict(xs) as tf.Tensor).flatten();
    });
}

export const predictBestAction = (model: tf.LayersModel, game: Game, player: Player): Promise<number> => {
   return extractBestActionFromTensor(
       predictQualitiesForActions(model, game, player), 
       game.whereToPlay()
    );
}

export const predictGameQuality = (model: tf.LayersModel, game: Game, player: Player): Promise<number> => {
    return extractQualityFromTensor(
        predictQualitiesForActions(model, game, player), 
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

export const learnQualitiesFromRewards = async (model: tf.LayersModel, experiences: RewardExperience[]) => {
    const xsStack: Tensor[] = [];
    const ysStack: Tensor[] = [];
    for (const { game, action, reward, player } of experiences) {
        xsStack.push(game2Tensor(game, player).squeeze());
        const qualitiesForActions = await predictQualitiesForActions(model, game, player).buffer();
        qualitiesForActions.set(reward, action);
        ysStack.push( tf.tidy(() => qualitiesForActions.toTensor()));
    }
    const xs = tf.stack(xsStack);
    const ys = tf.stack(ysStack);
    const history = await model.fit(xs, ys);
    console.log({ history })
}

const ALPHA = 0.99;
/*
export const learnQualityFromNextGame = async (model: tf.LayersModel, game: Game, action: number, nextGame: Game) => {
    const qualitiesForActions = await predictQualitiesForActions(model, game).buffer();
    const nextGameQuality = await predictGameQuality(model, nextGame);
    qualitiesForActions.set(ALPHA * nextGameQuality, action);
    const ys = tf.tidy(() => qualitiesForActions.toTensor().expandDims());
    const xs = game2Tensor(game);
    await model.fit(xs, ys);
}*/
/*export const learnQualitiesFromNextGames = async (model: tf.LayersModel, experiences: RegularExperience[]) => {
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
*/
export const learnQualitiesFromExperiences = async (model: tf.LayersModel, rewardExperiences: RewardExperience[], regularExperiences: RegularExperience[]) => {
    
    const xs = tf.tidy(() => {
        const xsStack: Tensor[] = [];
        for (const { game, player } of rewardExperiences) {
            xsStack.push(game2Tensor(game, player).squeeze());
        }
        for (const { game, player } of regularExperiences) {
            xsStack.push(game2Tensor(game, player).squeeze());
        }
        return tf.stack(xsStack);
    });
   

    const nextGameQualityTensor = tf.tidy(() => {
        const xsStack: Tensor[] = [];
        for (const xp of regularExperiences) {
            xsStack.push(game2Tensor(xp.nextGame, xp.player).squeeze());
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
        console.log('reward correction: ', targetQualitiesBuffer.get(index, action), reward)
        targetQualitiesBuffer.set(reward, index, action);
    });
    regularExperiences.forEach(({action}, index) => {
        const quality = ALPHA * nextGameQualities[index];
        //console.log('regular correction: ', targetQualitiesBuffer.get(index + rewardExperiences.length, action), quality)
        targetQualitiesBuffer.set(quality, index + rewardExperiences.length, action);
    });

    const ys = targetQualitiesBuffer.toTensor();

    await model.fit(xs, ys, { epochs: 1 });
}

export const buildMask = (boardSize: number, allowedActions: number[]) => (
    Array(boardSize * boardSize).fill(0).map((_, index) => (allowedActions.includes(index) ? 0 : -1000))
);

export const getCurrentQualities = (model: tf.LayersModel, rewardExperiences: RewardExperience[], regularExperiences: RegularExperience[]) => {
    const xs = tf.tidy(() => {
        const xsStack: Tensor[] = [];
        for (const { game, player } of rewardExperiences) {
            xsStack.push(game2Tensor(game, player).squeeze());
        }
        for (const { game, player } of regularExperiences) {
            xsStack.push(game2Tensor(game, player).squeeze());
        }
        return tf.stack(xsStack);
    });

    const mask = tf.tidy(() => {
        const maskStack: Tensor[] = [];
        for (const { game, action } of rewardExperiences) {
            maskStack.push(tf.tensor(buildMask(game.size, [action])));
        }
        for (const { game, action } of regularExperiences) {
            maskStack.push(tf.tensor(buildMask(game.size, [action])));
        }
        return tf.stack(maskStack);
    });

    const predictions = model.predict(xs) as Tensor;

    return predictions.add(mask).max(1);
}

export const getCurrentActionQualities = (model: tf.LayersModel, experiences: Experience[]) => {
    const xs = tf.tidy(() => {
        const xsStack: Tensor[] = [];
        for (const { game, player } of experiences) {
            xsStack.push(game2Tensor(game, player).squeeze());
        }
        return tf.stack(xsStack);
    });

    const mask = tf.tidy(() => {
        const maskStack: Tensor[] = [];
        for (const { game, action } of experiences) {
            maskStack.push(tf.tensor(buildMask(game.size, [action])));
        }
        return tf.stack(maskStack);
    });

    const predictions = model.predict(xs) as Tensor;

    return predictions.add(mask).max(1);
}


export const getNextGameQualities = (model: tf.LayersModel, regularExperiences: RegularExperience[]) => {
    const xs = tf.tidy(() => {
        const xsStack: Tensor[] = [];

        for (const { nextGame, player } of regularExperiences) {
            xsStack.push(game2Tensor(nextGame, player).squeeze());
        }
        return tf.stack(xsStack);
    });

    const mask = tf.tidy(() => {
        const maskStack: Tensor[] = [];
        for (const { nextGame } of regularExperiences) {
            maskStack.push(tf.tensor(buildMask(nextGame.size, nextGame.whereToPlay())));
        }
        return tf.stack(maskStack);
    });

    const predictions = model.predict(xs) as Tensor;

    return predictions.add(mask).max(1);
}

export const computeRewardTargets = (rewardExperiences: RewardExperience[]) => {
    return tf.tensor(
        rewardExperiences.map(xp => xp.reward)
    );
}

export const computeRegularTargets = (model: tf.LayersModel, regularExperiences: RegularExperience[]) => {
    const nextGameQualities = getNextGameQualities(model, regularExperiences);
    return nextGameQualities.mul(ALPHA);
}


const buildLossFunction = (model: tf.LayersModel, targetModel: tf.LayersModel, rewardExperiences: RewardExperience[], regularExperiences: RegularExperience[]) => {

    return () => tf.tidy(() => {

        const currentRewardQualities = getCurrentActionQualities(model, rewardExperiences);
        const currentRegularQualities = getCurrentActionQualities(model, regularExperiences);
        //currentRegularQualities.print();

        const targetRewardQualities = computeRewardTargets(rewardExperiences);
        const targetRegularQualities = computeRegularTargets(targetModel, regularExperiences);

        const loss = tf.losses.meanSquaredError(
            targetRewardQualities.concat(targetRegularQualities), 
            currentRewardQualities.concat(currentRegularQualities)
        ) as tf.Tensor<tf.Rank.R0>;
        //targetRewardQualities.concat(targetRegularQualities).print();
        //currentRewardQualities.concat(currentRegularQualities).print();
        loss.print();
        return loss;
    });
}

const optimizer = tf.train.adam(); //sgd(0.01);

export const trainUsingExperiences = (model: tf.LayersModel, targetModel: tf.LayersModel, rewardExperiences: RewardExperience[], regularExperiences: RegularExperience[]) => {

    if (rewardExperiences.length === 0 || regularExperiences.length === 0){
        return;
    }
    
    const lossFunction = buildLossFunction(model, targetModel, rewardExperiences, regularExperiences);
    const grads =
        tf.variableGrads(lossFunction, model.getWeights() as any);
    optimizer.applyGradients(grads.grads as any);
    tf.dispose(grads); 
    //optimizer.dispose();
}

export const copyWeights = (src: tf.LayersModel, dst: tf.LayersModel) => {
    dst.setWeights(src.getWeights());
}

