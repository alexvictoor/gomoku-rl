import React from 'react';
import './App.css';
import { Game } from './gomoku/game';
import { DummyAgent } from './gomoku/agent';
//mport { train } from './engine/engine';

const App: React.FC = () => {
  return (
    <div className="App">
      
      <GameComponent/>
    </div>
  );
}

function Square(props: any) {
  return (
    <button className={props.possiblePlay ? "square-possible" : "square"} onClick={props.onClick}>
      {props.value}
    </button>
  );
}

class Board extends React.Component<any> {
  renderSquare(i: number) {
    return (
      <Square
        value={this.props.squares[i]}
        possiblePlay={this.props.whereToPlay.includes(i)}
        onClick={() => this.props.onClick(i)}
      />
    );
  }

  render() {
    return (
      <div>
        {Array(19).fill(undefined).map((_, i) => (
          <div key={`board-row-${i}`} className="board-row">
            {Array(19).fill(undefined).map((_, j) => (
              this.renderSquare(i * 19 + j)
            ))}
          </div>
        ))}
      </div>
    );
  }
}

class GameComponent extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    //const firstAgent = new QAgent('Player1', 0.3, 0.2);
    //const secondAgent = new QAgent('Player2', 0.3, 0.2);
    const initialGame = new Game();
    this.state = {
      history: [
        {
          squares: Array(9).fill(null),
          game: initialGame,
        }
      ],
      stepNumber: 0,
      player2Agent: new DummyAgent(),
    };
    this.triggerPlayer2Agent = this.triggerPlayer2Agent.bind(this);
  }

  handleClick(i: number) {
    const history = this.state.history.slice(0, this.state.stepNumber + 1);
    const current = history[history.length - 1];
    const game: Game = current.game;
    const player1Turn = game.currentPlayer === "Player1";
    if (game.isOver() || !game.whereToPlay().includes(i)) { //|| !player1Turn) {
      return;
    }
    const newGame = game.play(i);
    this.updateGameState(player1Turn, i, newGame, this.triggerPlayer2Agent);
  }

  triggerPlayer2Agent(currentGame: Game) {
    const newGame: Game = this.state.player2Agent.play(currentGame);
    if (!currentGame.isOver()) {
      this.updateGameState(false, newGame.lastPlay, newGame);
    }
  }

  updateGameState(player1Turn: boolean, i: number, newGame: Game, cb?: (newGame: Game) => void) {
    const history = this.state.history.slice(0, this.state.stepNumber + 1);
    const current = history[history.length - 1];
    const squares = current.squares.slice();
    squares[i] = player1Turn ? "X" : "O";
    this.setState({
      history: history.concat([
        {
          game: newGame,
          squares,
        }
      ]),
      stepNumber: history.length,
    }, cb && (() => { cb(newGame); }));
  }

  jumpTo(step: number) {
    this.setState({
      stepNumber: step,
    });
  }

  render() {

    const history = this.state.history;
    const current = history[this.state.stepNumber];
    const game: Game = current.game;

    const moves = history.map((step: any, move: any) => {
      const desc = move ?
        'Go to move #' + move :
        'Go to game start';
      return (
        <li key={move}>
          <button onClick={() => this.jumpTo(move)}>{desc}</button>
        </li>
      );
    });
    

    return (
      <div className="game">
        <div className="game-board">
          <Board
            squares={current.squares}
            whereToPlay={game.whereToPlay()}
            onClick={(i: any) => this.handleClick(i)}
          />
        </div>
        <div className="game-info">
          <div>{game.status}</div>
          <ol>{moves}</ol>
        </div>
      </div>
    );
  }
}


export default App;
