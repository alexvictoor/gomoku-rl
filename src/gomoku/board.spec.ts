import { Board } from "./board";

describe('Board', () => {

    it('should be empty at initialisation on each cell', () => {
        // given 
        const board = new Board(15);
        // when
        const randomIndex = Math.floor(Math.random() * 15 * 15);
        const cell = board.getAt(randomIndex);
        // then
        expect(cell).toBe('.');
    });

    it('should be able to retrieve any cell value', () => {
        // given 
        const board = new Board(15);
        const randomIndex = Math.floor(Math.random() * 15 * 15);
        const randomIndex2 = (randomIndex + 42) % (15 *15);
        board.setAt(randomIndex, 'o');
        board.setAt(randomIndex2, 'x');
        board.setAt(randomIndex, '.');
        board.setAt(randomIndex, '.');
        // when
        const cell = board.getAt(randomIndex);
        const cell2 = board.getAt(randomIndex2);
        // then
        expect(cell).toBe('.');
        expect(cell2).toBe('x');
    });

    it('should be converted to a string', () => {
        // given 
        const board = new Board(3);
        board.setAt(4, 'x');
        // when
        const s = board.toString();
        // then
        expect(s).toBe('....x....');
    });

    it('should be created from a string', () => {
        // given 
        const board = Board.parse('... .x. ...');
        // when
        const dotCell = board.getAt(0);
        const xCell = board.getAt(4);
        // then
        expect(dotCell).toBe('.');
        expect(xCell).toBe('x');
    });

    it('should be converted then parsed', () => {
        // given 
        const input = '....x....';
        const board = Board.parse(input);
        // when
        const marshalled = board.toString();
        // then
        expect(board.getAt(0)).toBe('.');
        expect(marshalled).toEqual(input);
    });

    it('should be converted to a base64 string', () => {
        // given 
        const board = new Board(3);
        board.setAt(4, 'x');
        // when
        const s = board.toBase64();
        // then
        expect(s).toBe('AAMA');
    });

    it('should be cloned', () => {
        // given 
        const board = new Board(3);
        board.setAt(4, 'x');
        const clone = board.clone();
        // when
        board.setAt(4, 'o');
        // then
        expect(clone.getAt(4)).toBe('x');
    });

});