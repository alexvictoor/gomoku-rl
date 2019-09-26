import { QAgent } from "./agent";
import { Game } from "./game";

export const train = (firstAgent: QAgent, secondAgent: QAgent) => {
    let agents = [firstAgent.play, secondAgent.play];
    const initialGame = new Game();
    const gamesToReplay: Game[] = [ initialGame ];
    const nbGameWithoutReplay = 10000;
    const start = new Date();

    const chooseExplorationFactor = (i: number) => {
      if (i < nbGameWithoutReplay/5) {
        return 0.6;
      }
      if (i < nbGameWithoutReplay/3) {
        return 0.4;
      }
      if (i < nbGameWithoutReplay/2) {
        return 0.2;
      }
      return 0;
    }

    const chooseInitialGame = (i: number) => (
      ((i > nbGameWithoutReplay-1 ) && gamesToReplay.pop()) || initialGame
    );

    let i = 0;
    while (i < nbGameWithoutReplay || gamesToReplay.length > 0) {
      i++;
      firstAgent.startNewGame();
      secondAgent.startNewGame();
      
      // explore a lot at the beginning
      // less after
      const explorationFactor = chooseExplorationFactor(i);
      firstAgent.explorationFactor = explorationFactor;
      secondAgent.explorationFactor = 0;

      // initial game can be an empty board
      // or a replayed experience
      let game = chooseInitialGame(i);
      
      let turnIndex = 0;
      while (!game.isOver()) {
          const agent = agents[turnIndex % 2];

          // save random games for experience replay
          if (turnIndex > 0 && Math.random() > 0.66 && i < nbGameWithoutReplay) {
            gamesToReplay.push(game);
          }

          game = agent(game);
          turnIndex++;
      }      
      
      // learn to loose
      const agent = agents[turnIndex % 2];
      game = agent(game);

      //console.log("The winner is", game.getWinner(), i, gamesToReplay.length); 
    }

    firstAgent.explorationFactor = 0;
    secondAgent.explorationFactor = 0;
    //console.log({ firstAgent, secondAgent });
    console.log(`Training took ${new Date().getTime() - start.getTime()}ms`);
    console.log('Games played', i);
}