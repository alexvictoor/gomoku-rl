import { stat } from "fs";

export type Player = 'Player1' | 'Player2';
export type GameStatus = 'In Progress' | 'Draw' | 'Player1 Wins'| 'Player2 Wins';
type Cell = '.' | 'x' | 'o';
type Board = Cell[];

export type ChangeCallback = (update: Game) => void

const emptyBoard = Array(19 * 19).fill('.');

export class Game {

    currentPlayer: Player = 'Player1';

    lastPlay: number = -1;
    history: number[] = [];
    size: number = -1;
    status: GameStatus = 'In Progress';
    lines: number[][];
    private allowedActions?: number[];

    constructor(private board: Board = emptyBoard) {
        this.size = Math.sqrt(board.length);
        if (!Number.isInteger(this.size)) {
            throw new Error("Cannot create a square board with provided input");
        }
        this.history = (
            board.map((value, index) => ({ value, index }))
                .filter(({ value }) => value !== '.')
                .map(({ index }) => index)
        );
        this.currentPlayer = this.getCurrentPlayer();
        this.lines = Game.buildLines(this.size);

    }

    static fromString(raw: String) {
        const board: Board = raw.split(' ').join('').split('') as any;
        const game = new Game(board);

        // need to compute status
        const status: GameStatus = game.history.reduce(
            (status: GameStatus, boardIndex: number) => {
                if (status !== 'In Progress') {
                    return status;
                }
                const mark = game.board[boardIndex];
                const player: Player = mark === 'x' ? 'Player1' : 'Player2';
                return game.computeStatusAfterPlay(player, boardIndex);
            }, 
            'In Progress'
        );
        game.status = status;
        return game;
    }

    private clone() {
        const clone = new Game([...this.board]);
        clone.currentPlayer = this.currentPlayer;
        
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

    asNumberArray() {
        const mark = this.getPlayerMark(this.currentPlayer);
        const cellToNumber = (c: Cell) => {
            if (c === mark) {
                return [0, 0, 1];
            }
            if (c === '.') {
                return [1, 0, 0];
            }
            return [0, 1, 0];
        }
        return this.board.map(cellToNumber);
    }

    play(boardIndex: number) {
        const mark: Cell = this.getPlayerMark(this.currentPlayer);
        if (!this.whereToPlay().includes(boardIndex)) {
            throw new Error(`Not a valid play: ${boardIndex} ${this.toString()}`);
        }
        const gameAfterPlay = this.clone();
        gameAfterPlay.board[boardIndex] = mark;
        gameAfterPlay.history.push(boardIndex);
        gameAfterPlay.status = gameAfterPlay.computeStatusAfterPlay(this.currentPlayer, boardIndex);
        gameAfterPlay.currentPlayer = gameAfterPlay.getCurrentPlayer();
        gameAfterPlay.lastPlay = boardIndex;
        return gameAfterPlay;
    }

    private computeStatusAfterPlay(player: Player, boardIndex: number): GameStatus {
        const mark: Cell = this.getPlayerMark(player);
        const winSequence = mark.repeat(5);

        const indexesToString = (indexes: number[]) => indexes.map(i => this.board[boardIndex + i]).join('');

        const win = this.lines.map(indexesToString).some(sequence => sequence.includes(winSequence));
        if (win) {
            return (player === 'Player1') ? 'Player1 Wins' : 'Player2 Wins';
        } 
        if (this.history.length === this.board.length) {
            return 'Draw';
        }
        return this.status; 
    }

    getPossibleOutcomes(): [number, Game][] {
        return this.whereToPlay()
            .map(boardIndex => [boardIndex, this.play(boardIndex)]);
    }

    whereToPlay(): number[] {

        if (this.allowedActions) {
            return this.allowedActions; 
        }
        this.allowedActions = this.findWhereToPlay(); 
        return this.allowedActions;
    }

    private findWhereToPlay(): number[] {
        if (this.history.length === 0) {
            // first play must be at the center of the board
            return [Math.floor(this.board.length / 2)];
        }

        if (this.isOver()) {
            return [];
        }

        const adjacent = (pos: number) => {

            if (pos % this.size === 0) {
                return [
                    (pos - this.size), (pos + 1 - this.size),
                                       (pos + 1),
                    (pos + this.size), (pos + 1 + this.size)
                ]
            }
            if ((pos+1) % this.size === 0) {
                return [
                    (pos - 1 - this.size), (pos - this.size),
                    (pos - 1), 
                    (pos - 1 + this.size), (pos + this.size),
                ]
            }
            return [
                (pos - this.size), (pos - 1 - this.size), (pos + 1 - this.size),
                (pos - 1), (pos + 1),
                (pos + this.size), (pos - 1 + this.size), (pos + 1 + this.size)
            ]
        }

        return [...new Set(
            this.history
                .flatMap(adjacent)
                .filter(p => p >= 0)
                .filter(p => p < this.board.length)
                .filter(p => !this.history.includes(p))
        )];
    }

    isOver(): boolean {
        return this.status !== 'In Progress';
    }

    private static buildLines(size: number) {
        return [
           [-4, -3, -2, -1, 0, 1, 2, 3, 4],
           [-4 * size, -3 * size, -2 * size, -1 * size, 0, size, 2 * size, 3 * size, 4 * size],
           [-4 * (size+1), -3 * (size+1), -2 * (size+1), -1 * (size+1), 0, (size+1), 2 * (size+1), 3 * (size+1), 4 * (size+1)],
           [-4 * (size-1), -3 * (size-1), -2 * (size-1), -1 * (size-1), 0, (size-1), 2 * (size-1), 3 * (size+1), 4 * (size+1)],
        ]
    }

    toString() {
        return this.board.join('');
    }
}
