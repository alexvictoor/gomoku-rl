import { Game, findWinningAction, getAdviceAction, findNonDangerousActionCombos } from './game';

describe('Gomoku', () => {

    it('should be created from a board as a string', () => {
        // given
        const board = '.x.. .xo. .... ....';
        // when
        const game = Game.fromString(board);
        // then
        expect(game.toString()).toBe('.x...xo.........');
        expect(game.currentPlayer).toBe('Player2');
    })

    it('should crash trying to create a board from a string of non square length', () => {
        // given
        const board = '.x.. .xo. ....';
        // when & then
        expect(() => Game.fromString(board)).toThrow();
    })

    it('should update board when playing', () => {
        // given
        const board = '.x...xo.........';
        const game = Game.fromString(board);
        // when
        const gameAfterPlay = game.play(0);
        // then
        expect(gameAfterPlay.toString()).toBe('ox...xo.........');
    })

    it.skip('should forbid to play outside the board', () => {
        // given
        const board = '.x...xo.........';
        const game = Game.fromString(board);
        // when & then
        expect(() => game.play(16)).toThrow();
    })

    it('should allow to play around existing cells', () => {
        // given
        const board = '..... ..... ..xo. ..... .....';
        const game = Game.fromString(board);
        // when
        const positions = game.whereToPlay();
        // when & then
        expect(positions).toHaveLength(10);
    })

    it('should not allow to play outside the board', () => {
        // given
        const board = 'xoxox ....o ....x ....o ....x';
        const game = Game.fromString(board);
        // when
        const positions = game.whereToPlay();
        // when & then
        expect(positions.filter(p => p < 0)).toHaveLength(0);
        expect(positions.filter(p => p >= board.length)).toHaveLength(0);
    })

    it('should forbid to play on an isolated cell', () => {
        // given
        const board = 'x.. ... ...';
        const game = Game.fromString(board);
        // when & then
        expect(() => game.play(8)).toThrow();
    })


    it('should update current player after play', () => {
        // given
        const game = new Game();
        // when
        const gameAfterPlay = game.play(180);
        // then
        expect(gameAfterPlay.currentPlayer).toBe('Player2');
    })

    it('should crash when playing on a non empty cell', () => {
        // given
        const board = '.x..xo...';
        const game = Game.fromString(board);
        // when & then
        expect(() => game.play(1)).toThrow();
    })

    it('should be won', () => {
        // given
        const board = 'xoooo .x... ..x.. ...x. .....';;
        const game = Game.fromString(board);
        // when
        const gameAfterPlay = game.play(24)
        // then
        expect(gameAfterPlay.status).toBe('Player1 Wins');
    })
    it('should be won again', () => {
        // given
        const board = 'oooo. ...x. ..x.. .x... x....';;
        const game = Game.fromString(board);
        // when
        const gameAfterPlay = game.play(4)
        // then
        expect(gameAfterPlay.status).toBe('Player1 Wins');
    })

    xit('should be draw', () => {
        // given
        const board = 'xxxxo oooox xxxxo oooox xoxo.';;
        const game = Game.fromString(board);
        // when
        const gameAfterPlay = game.play(24)
        // then
        expect(gameAfterPlay.status).toBe('Draw');
    })

    it('should rehydrate status when the game is created from a string', () => {
        // given
        const board = 'xoooo .x... ..x.. ...x. ....x';;
        // when
        const game = Game.fromString(board);
        // then
        expect(game.status).toBe('Player1 Wins');
    })

    it('should be possible to play on any empty cell', () => {
        // given
        const board = '.ox .ox ...';
        const game = Game.fromString(board);
        // when
        const indices = game.whereToPlay();
        // then
        expect(indices.sort()).toEqual([0, 3, 6, 7, 8]);
    })

    it('should be possible to play on any empty cell on the board edges', () => {
        // given
        const board = '... ..x ...';
        const game = Game.fromString(board);
        // when
        const indices = game.whereToPlay();
        // then
        expect(indices.sort()).toEqual([1, 2, 4, 7, 8]);
    })

    it('should be impossible to play when game is over', () => {
        // given
        const board = ' ....x ....x ....x ..oox ....x';
        const game = Game.fromString(board);
        // when
        const indices = game.whereToPlay();
        // then
        expect(indices).toEqual([]);
    })

    it('should convert the board to a 2D number array', () => {
        // given
        const board = '... xox ...';
        const game = Game.fromString(board);
        // when
        const data = game.asNumberArray();
        // then
        expect(data).toEqual([[1, 0, 0], [1, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1], [0, 1, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0]]);
    })

    it('should find action that gives victory right away', () => {
        // given
        const board = 'oooo. ...x. ..x.. .x... x....';;
        const game = Game.fromString(board);
        // when
        const action = findWinningAction(game);
        // then
        expect(action).toEqual(4);
    })

    it('should advice not to loose next turn', () => {
        // given
        const board = 'ooo.. ...x. ..x.. .x... x....';;
        const game = Game.fromString(board);
        // when
        const advice = getAdviceAction(game);
        // then
        expect(advice).toEqual(4);
    })

    it('should advice not to loose next next turn', () => {
        // given
        const board = '.oo... ...x.. ...x.. ..xx.. .x.o.. ......';;
        const game = Game.fromString(board);
        // when
        const advice = getAdviceAction(game);
        // then
        expect(advice === 10 || advice === 30).toBeTruthy();
    })



    it.skip('should find action that will give victory in 2 turns', () => {
        // given
        const board = 'ooo... ...... ...x.. ..x... .x.... ......';;
        const game = Game.fromString(board);
        // when
        const action = getAdviceAction(game);
        // then
        expect(action).toEqual(10);
    })

    it.skip('should counter action that will give victory in 2 turns', () => {
        // given
        const board = '........ ........ ...oo... ....xo.. ..ox.x.. ..x..... ........ ........';;
        const game = Game.fromString(board);
        // when
        const action = getAdviceAction(game);
        // then
        expect(action).toEqual(10);
    })


});