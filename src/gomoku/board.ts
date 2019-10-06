
export type Cell = '.' | 'x' | 'o';
export class Board {

    data: Uint8ClampedArray;
    length: number;

    constructor(public size: number) {
        const arraySize = Math.ceil(size * size / 4);
        this.data = new Uint8ClampedArray(arraySize);
        this.length = size * size;
    }

    static parse(raw: String) {
        const cells = raw.split(' ').join('').split('') as Cell[];
        const board = new Board(Math.sqrt(cells.length));
        cells.forEach((cell, index) => board.setAt(index, cell));
        return board;
    }

    private computeArrayIndexes(index: number): [number, number] {
        const firstIndex = Math.floor(index / 4);
        const secondIndex = (index % 4) * 2;
        return [firstIndex, secondIndex];
    }

    private bucketToString(bucket: number, secondIndex: number) {
        const isNotEmpty = (bucket >> secondIndex) & 1;
        if (isNotEmpty) {
            const isCross = (bucket >> (secondIndex + 1)) & 1
            if (isCross) {
                return 'x';
            }
            return 'o';
        }
        return '.';
    }

    getAt(index: number): Cell {
        const [firstIndex, secondIndex] = this.computeArrayIndexes(index);
        const bucket = this.data[firstIndex];
        return this.bucketToString(bucket, secondIndex);
    }

    setAt(index: number, value: Cell) {
        const [firstIndex, secondIndex] = this.computeArrayIndexes(index);
        const bucket = this.data[firstIndex];
        const mask = 1 << secondIndex;
        const mask2 = 1 << (secondIndex + 1);
        if (value === '.') {
            this.data[firstIndex] = bucket & ~mask;
        } else if (value === 'x') {
            this.data[firstIndex] = bucket | mask | mask2;
        } else {
            this.data[firstIndex] = bucket | mask & ~mask2;
        }
    }

    clone() {
        const clone = new Board(this.size);
        clone.data = this.data.slice(0);
        return clone;
    }

    toCellArray() {
        return [...this.data].flatMap((bucket) => (
            [
                this.bucketToString(bucket, 0),
                this.bucketToString(bucket, 2),
                this.bucketToString(bucket, 4),
                this.bucketToString(bucket, 6),
            ]
        )).slice(0, this.length) as Cell[];
    }

    toString() {
        return this.toCellArray().join('');
    }

    toBase64() {
        return Buffer.from(this.data).toString('base64');
    }
}