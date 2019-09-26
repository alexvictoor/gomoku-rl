
export type Player = 'Player1' | 'Player2';
type Cell = '.' | 'x' | 'o';
type Board = [ 
    Cell, Cell, Cell,
    Cell, Cell, Cell,
    Cell, Cell, Cell
];

export type ChangeCallback = (update: Game) => void 

export class Game {

    currentPlayer: Player = 'Player1';
    board: Board = ['.','.','.','.','.','.','.','.','.'];

    lastPlay: number = -1;

    constructor() {
        this.hasWon = this.hasWon.bind(this);
    }

    static fromString(raw: String) {
        const game = new Game();
        game.board = raw.split(' ').join('').split('') as any;
        game.currentPlayer = game.getCurrentPlayer();
        return game;
    }
    
    private clone() {
        const clone = new Game();
        clone.currentPlayer = this.currentPlayer;
        clone.board = [...this.board] as Board;
        return clone;
    }

    private getCurrentPlayer() {
        const nbX = this.board.filter(c => c === 'x').length;
        const nbO = this.board.filter(c => c === 'o').length;
        return nbX > nbO ? 'Player2' : 'Player1';
    }

    private getPlayerMark(player: Player) {
       return player === 'Player1' ? 'x' : 'o'; 
    }

    play(boardIndex: number) {
        const mark: Cell = this.getPlayerMark(this.currentPlayer);
        if (!this.whereToPlay().includes(boardIndex)) {
            throw new Error('Not a valid play');
        }
        const gameAfterPlay = this.clone();
        gameAfterPlay.board[boardIndex] = mark;
        gameAfterPlay.currentPlayer = gameAfterPlay.getCurrentPlayer();
        gameAfterPlay.lastPlay = boardIndex;
        return gameAfterPlay;
    }

    getPossibleOutcomes(): [number, Game][]  {
        return this.whereToPlay()
                    .map(boardIndex => [boardIndex, this.play(boardIndex)]);
    }

    whereToPlay(): number[] {
        return this.board
                .map((cell, index) => [cell, index])
                .filter(([cell, _]) => cell === '.')
                .map(([_, index]) => index) as number[]; // wtf typescript
    }

    drawnGame(): boolean {
        return this.whereToPlay().length === 0; 
    }

    isOver(): boolean {
        return !!this.getWinner() || this.drawnGame();
    }

    private static lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];

    private hasWon(player: Player) {
        const mark = this.getPlayerMark(player);
        return Game.lines.some(line => (
            line.every(cell => (
                this.board[cell] === mark
            )
        )));
    }

    getWinner() {
        return ['Player1', 'Player2'].find(p => this.hasWon(p as Player));
    }

    toString() {
        return this.board.join('');
    }
}
