/**
 * The status of blocks.
 */
export enum EBlockStatus {

    /**
     * The blocks non-explored.
     */
    UNKNWON = -1,

    /**
     * The block has been marked as mine.
     */
    MARKED = -2,

    /**
     * The block has been marked as questioned.
     */
    QUESTION = -3,

    /**
     * The wrong marked mines (not mine but marked).
     */
    WRONG = -4,

    /**
     * The mines
     */
    MINE = -5,

    /**
     * The mine that exploded.
     */
    DEAD = -6
}

/**
 * The status of game.
 */
export enum EGameStatus {

    PLAYING,

    WIN,

    FAILED
}

/**
 * The style of marks.
 */
export enum EMarkStyle {

    UNMARKED,

    MINE,

    QUESTION
}

export interface IGameOptions {

    /**
     * The height of map.
     */
    height: number;

    /**
     * The width of map.
     */
    width: number;

    /**
     * The quantity of mines in the game.
     */
    minesQuantity: number;

    /**
     * Set to true to show only the mines instead of show statuses of all blocks.
     *
     * @default false
     */
    showMinesOnlyOnFailed?: boolean;
}

export interface IMineSweeper {

    /**
     * Start a new game.
     */
    restart(): void;

    /**
     * Get the width of map.
     */
    getWidth(): number;

    /**
     * Get the height of map.
     */
    getHeight(): number;

    /**
     * Get the total quantity of mines in the map.
     */
    getMineQuantity(): number;

    /**
     * Get the status of game.
     */
    getStatus(): EGameStatus;

    /**
     * Get the quantity of unmarked mines.
     */
    getRestMineQuantity(): number;

    /**
     * Get the status of all points.
     */
    getMap(): number[][];

    /**
     * Mark a point.
     *
     * @param x         The X offset of point.
     * @param y         The Y offset of point.
     * @param style     The mark style.
     */
    mark(x: number, y: number, style: EMarkStyle): boolean;

    /**
     * Do sweep a point.
     *
     * @param x         The X offset of point.
     * @param y         The Y offset of point.
     */
    sweep(x: number, y: number): EGameStatus;

    /**
     * Try clean the points around a point.
     *
     * @param x         The X offset of point.
     * @param y         The Y offset of point.
     */
    explore(x: number, y: number): EGameStatus;

    /**
     * Get the time used.
     */
    getUsedTime(): number;
}

interface IBlock {

    x: number;

    y: number;
}

const MINE_FLAG = -1;

interface IContext {

    /**
     * The mark status of points.
     */
    blocks: number[][];

    /**
     * The matrix of mines mapping.
     */
    mines: number[][];

    /**
     * The quantity of unmarked mines.
     */
    unmarkedMines: number;

    /**
     * The time when the game started at.
     */
    startedAt: number;

    /**
     * The status of game.
     */
    status: EGameStatus;

    /**
     * The unknown
     */
    unknowns: number;
}

interface IPrivateData {

    context: IContext;

    height: number;

    width: number;

    mineQuantity: number;

    showMinesOnlyOnFailed: boolean;
}

const SECRET_DATA = new WeakMap<IMineSweeper, IPrivateData>();

class MineSweeper implements IMineSweeper {

    public constructor(
        height: number,
        width: number,
        mineQuantity: number,
        showMinesOnlyOnFailed: boolean = false
    ) {

        if (
            !Number.isInteger(width) ||
            !Number.isInteger(height) ||
            !Number.isInteger(mineQuantity) ||
            mineQuantity < 1 ||
            height < 2 ||
            mineQuantity < 2
        ) {

            throw new Error("INVALID_GAME_MAP");
        }

        if (mineQuantity >= width * height) {

            throw new Error("TOO_MANY_MINES");
        }

        SECRET_DATA.set(this, {
            "context": null as any,
            "height": height,
            "width": width,
            "mineQuantity": mineQuantity,
            "showMinesOnlyOnFailed": showMinesOnlyOnFailed
        });

        this.restart();
    }

    public getUsedTime(): number {

        const _this = SECRET_DATA.get(this) as IPrivateData;

        return Date.now() - _this.context.startedAt;
    }

    public getRestMineQuantity(): number {

        const _this = SECRET_DATA.get(this) as IPrivateData;

        return _this.context.unmarkedMines;
    }

    public getStatus(): EGameStatus {

        const _this = SECRET_DATA.get(this) as IPrivateData;

        return _this.context.status;
    }

    public getHeight(): number {

        const _this = SECRET_DATA.get(this) as IPrivateData;

        return _this.height;
    }

    public getWidth(): number {

        const _this = SECRET_DATA.get(this) as IPrivateData;

        return _this.width;
    }

    public getMineQuantity(): number {

        const _this = SECRET_DATA.get(this) as IPrivateData;

        return _this.mineQuantity;
    }

    /**
     * Validate if a point is inside the map.
     *
     * @param x     The X offset of point.
     * @param y     The Y offset of point.
     */
    private _checkCoordinate(x: number, y: number): boolean {

        const _this = SECRET_DATA.get(this) as IPrivateData;

        return Number.isInteger(x) && x >= 0 && x < _this.width &&
               Number.isInteger(y) && y >= 0 && y < _this.height;
    }

    public mark(x: number, y: number, style: EMarkStyle): boolean {

        const _this = SECRET_DATA.get(this) as IPrivateData;

        if (_this.context.status !== EGameStatus.PLAYING) {

            return false;
        }

        const blk = this.getBlock(x, y);

        switch (blk) {

            case EBlockStatus.MARKED: {

                switch (style) {

                    case EMarkStyle.MINE: {

                        break;
                    }
                    case EMarkStyle.UNMARKED: {

                        _this.context.unmarkedMines++;
                        _this.context.unknowns++;
                        _this.context.blocks[y][x] = EBlockStatus.UNKNWON;

                        break;
                    }
                    case EMarkStyle.QUESTION: {

                        _this.context.unmarkedMines++;
                        _this.context.unknowns++;
                        _this.context.blocks[y][x] = EBlockStatus.QUESTION;

                        break;
                    }
                }

                this._checkWin();

                return true;
            }
            case EBlockStatus.QUESTION: {

                switch (style) {

                    case EMarkStyle.MINE: {

                        _this.context.unmarkedMines--;
                        _this.context.unknowns--;
                        _this.context.blocks[y][x] = EBlockStatus.MARKED;
                        break;
                    }
                    case EMarkStyle.UNMARKED: {

                        _this.context.blocks[y][x] = EBlockStatus.UNKNWON;
                        break;
                    }
                    case EMarkStyle.QUESTION: {

                        break;
                    }
                }

                this._checkWin();

                return true;
            }
            case EBlockStatus.UNKNWON: {

                switch (style) {

                    case EMarkStyle.MINE: {

                        _this.context.unmarkedMines--;
                        _this.context.unknowns--;
                        _this.context.blocks[y][x] = EBlockStatus.MARKED;
                        break;
                    }
                    case EMarkStyle.UNMARKED: {

                        break;
                    }
                    case EMarkStyle.QUESTION: {

                        _this.context.blocks[y][x] = EBlockStatus.QUESTION;
                        break;
                    }
                }

                this._checkWin();

                return true;
            }

            default: {

                return false;
            }
        }
    }

    public sweep(x: number, y: number): EGameStatus {

        const _this = SECRET_DATA.get(this) as IPrivateData;

        const blk = this.getBlock(x, y);

        if (
            _this.context.status !== EGameStatus.PLAYING ||
            blk !== EBlockStatus.UNKNWON
        ) {

            return _this.context.status;
        }

        if (_this.context.mines[y][x] === MINE_FLAG) {

            this._die(x, y);
        }
        else {

            _this.context.blocks[y][x] = _this.context.mines[y][x];

            this._cleanBlock(x, y);
            _this.context.unknowns--;

            this._checkWin();
        }

        return _this.context.status;
    }

    private _checkWin(): void {

        const _this = SECRET_DATA.get(this) as IPrivateData;

        if (
            _this.context.unknowns === _this.context.unmarkedMines
        ) {

            _this.context.status = EGameStatus.WIN;
            _this.context.unmarkedMines = 0;
            _this.context.unknowns = 0;

            for (let x = 0; x < _this.width; x++) {

                for (let y = 0; y < _this.height; y++) {

                    if (_this.context.mines[y][x] === -1) {

                        _this.context.blocks[y][x] = EBlockStatus.MARKED;
                    }
                }
            }
        }
    }

    private _findBlocksAround(x: number, y: number): IBlock[] {

        const blocks: IBlock[] = [];

        for (let cY = y - 1; cY < y + 2; cY++) {

            for (let cX = x - 1; cX < x + 2; cX++) {

                if (
                    (x === cX && y === cY) ||
                    !this._checkCoordinate(cX, cY)
                ) {

                    continue;
                }

                blocks.push({ x: cX, y: cY });
            }
        }

        return blocks;
    }

    public explore(x: number, y: number): EGameStatus {

        const _this = SECRET_DATA.get(this) as IPrivateData;

        const blk = this.getBlock(x, y);

        if (
            _this.context.status !== EGameStatus.PLAYING ||
            blk < 0
        ) {

            return _this.context.status;
        }

        const blks = this._findBlocksAround(x, y);

        const marks = blks.reduce(
            (p, b) => p + (_this.context.blocks[b.y][b.x] === EBlockStatus.MARKED ? 1 : 0),
            0
        );

        if (marks >= _this.context.mines[y][x]) {

            for (const b of blks) {

                if (_this.context.blocks[b.y][b.x] === EBlockStatus.UNKNWON) {

                    this.sweep(b.x, b.y);
                }

                if (_this.context.status !== EGameStatus.PLAYING) {

                    return _this.context.status;
                }
            }
        }

        return _this.context.status;
    }

    private _die(x: number, y: number): void {

        const _this = SECRET_DATA.get(this) as IPrivateData;

        const ctx = _this.context;

        ctx.status = EGameStatus.FAILED;

        ctx.blocks[y][x] = EBlockStatus.DEAD;

        for (y = 0; y < _this.height; y++) {

            for (x = 0; x < _this.width; x++) {

                const blk = ctx.blocks[y][x];

                switch (blk) {

                    case EBlockStatus.MARKED: {

                        if (ctx.mines[y][x] !== MINE_FLAG) {

                            ctx.blocks[y][x] = EBlockStatus.WRONG;
                        }

                        break;
                    }

                    case EBlockStatus.QUESTION:
                    case EBlockStatus.UNKNWON: {

                        if (ctx.mines[y][x] === MINE_FLAG) {

                            ctx.blocks[y][x] = EBlockStatus.MINE;
                        }
                        else if (!_this.showMinesOnlyOnFailed) {

                            ctx.blocks[y][x] = ctx.mines[y][x];
                        }

                        break;
                    }

                    default: {

                        // do nothing.
                    }
                }
            }
        }
    }

    private _cleanBlock(x: number, y: number): void {

        const _this = SECRET_DATA.get(this) as IPrivateData;

        if (!this._checkCoordinate(x, y)) {

            return;
        }

        if (_this.context.mines[y][x]) {

            return;
        }

        const blks = this._findBlocksAround(x, y);

        const nextBlks: IBlock[] = [];

        for (let b of blks) {

            if (_this.context.blocks[b.y][b.x] !== EBlockStatus.UNKNWON) {

                continue;
            }

            _this.context.blocks[b.y][b.x] = _this.context.mines[b.y][b.x];
            _this.context.unknowns--;

            if (!_this.context.mines[b.y][b.x]) {

                nextBlks.push(b);
            }
        }

        for (let b of nextBlks) {

            this._cleanBlock(b.x, b.y);
        }
    }

    public restart(): void {

        const _this = SECRET_DATA.get(this) as IPrivateData;

        const ctx = _this.context = {
            blocks: new Array(_this.height) as number[][],
            mines: new Array(_this.height) as number[][],
            unmarkedMines: _this.mineQuantity,
            startedAt: Date.now(),
            status: EGameStatus.PLAYING,
            unknowns: _this.height * _this.width
        };

        for (let y = 0; y < _this.height; y++) {

            ctx.blocks[y] = new Array(_this.width);
            ctx.mines[y] = new Array(_this.width);

            ctx.blocks[y].fill(EBlockStatus.UNKNWON);
            ctx.mines[y].fill(0);
        }

        let mines = _this.mineQuantity;

        // Put mines in the map.
        while (mines) {

            const y = Math.floor(Math.random() * _this.height);
            const x = Math.floor(Math.random() * _this.width);

            if (ctx.mines[y][x] === MINE_FLAG) {

                continue;
            }

            ctx.mines[y][x] = MINE_FLAG;

            for (let i = y - 1; i < y + 2; i++) {

                for (let j = x - 1; j < x + 2; j++) {

                    if (!this._checkCoordinate(j, i) || ctx.mines[i][j] === MINE_FLAG) {

                        continue;
                    }

                    ctx.mines[i][j]++;
                }
            }

            mines--;
        }
    }

    public getBlock(x: number, y: number): number {

        const _this = SECRET_DATA.get(this) as IPrivateData;

        if (!this._checkCoordinate(x, y)) {

            throw new Error("OUT_TO_BOUNDARY");
        }

        return _this.context.blocks[y][x];
    }

    public getMap(): number[][] {

        const _this = SECRET_DATA.get(this) as IPrivateData;

        return _this.context.blocks.map(
            (x) => [...x]
        );
    }
}

export function createMineSweeper(options: IGameOptions): IMineSweeper {

    return new MineSweeper(
        options.height,
        options.width,
        options.minesQuantity,
        options.showMinesOnlyOnFailed
    );
}
