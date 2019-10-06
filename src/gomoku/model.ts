import * as tf from '@tensorflow/tfjs';
import { Game, Player } from './game';


export const createModel = (boardSize: number): tf.LayersModel => {
    const model = tf.sequential();
    model.add(tf.layers.conv2d({
        name: 'lalala',
        filters: 32,
        kernelSize: 3,
        strides: 1,
        padding: 'same',
        activation: 'relu',
        inputShape: [boardSize, boardSize, 3]
    }));
    //model.add(tf.layers.batchNormalization());
    model.add(tf.layers.conv2d({
        name: 'lololo',
        filters: 64,
        kernelSize: 3,
        strides: 1,
        padding: 'same',
        activation: 'relu'
    }));
    //model.add(tf.layers.batchNormalization());
    model.add(tf.layers.conv2d({
        filters: 128,
        kernelSize: 3,
        strides: 1,
        padding: 'same',
        activation: 'relu'
    }));
    model.add(tf.layers.flatten());
    model.add(tf.layers.dense({ units: 100, activation: 'relu' }));
    //model.add(tf.layers.dropout({ rate: 0.25 }));
    model.add(tf.layers.dense({ units: boardSize * boardSize, activation: 'tanh' }));

    /*model.compile({
        loss: "meanSquaredError",
        optimizer: "adam",
    });*/

    return model;
}


async function sandbox() {

    /*
    const board = tf.tensor([1,2,3,4,5,6,7,8,9]);
    board.as2D(3,3).print()
    */


    const model = createModel(3);
    model.summary();

    

    for (let r = 0; r < 100; r++) {
        const dataX: any = [];
        const dataY: any = [];
    for (let index = 0; index < 1; index++) {
        dataX.push([[1, 0, 0], [1, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1], [0, 1, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0]]);
        dataY.push([1, 2, 3, 4, 5, 6, 7, 8, 9]);

    }
    let xs = tf.tidy(() => {
        
        return tf.tensor(dataX).as4D(1,3, 3, 3);
    });
    let ys = tf.tidy(() => {
        
        return tf.tensor(dataY).as2D(1,9);
    });
    try {
        await model.fit(xs, ys);
    } catch (err) {
        console.log("merde", err);
    }
}
    console.log('------------ Hello!');
    const board = tf.tensor([[1, 0, 0], [1, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1], [0, 1, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0]]);

    let xs = board.as3D(3, 3, 3).expandDims();
    //ys = tf.tensor([1, 2, 3, 4, 5, 6, 7, 8, 9]).expandDims();
    //model.fit(xs, ys);

    const result = model.predict(xs);
    console.log((result as tf.Tensor).arraySync());
    (result as tf.Tensor).flatten().argMax().print();
    console.log((await (result as tf.Tensor).flatten().argMax().data())[0])

}

//sandbox();

/*
(async () => await model.save('file:////Users/avictoor/work/ml/gomoku-rl/model'))();
*/