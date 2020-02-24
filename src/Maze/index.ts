import Maybe, { Nothing, Just } from 'frctl/Maybe';
import Either, { Left, Right } from 'frctl/Either';
import Dict from 'frctl/Dict';

export const MINIMUM_SIDE = 2;
export const MAXIMUM_SIDE = 100;

/**
 * Cell's id.
 */
export type ID = number;

/**
 * Represents obstacles in Maze.
 *
 * Wall - impossible to travel thru obstacle.
 * Gravel - obstacles reduces walking speed twice.
 * PortalIn - portal entrance allows solver to instantly go out from PortalOut.
 * PortalOut - the second part of a Portal obstacle.
 */
export enum Obstacle
    { Wall
    , Gravel
    , PortalIn
    , PortalOut
    }

/**
 * Represents minimum available Maze configuration for solving.
 */
export type Setup = Readonly<{
    start: [ number, number ];
    target: [ number, number ];
    obstacles: Array<Array<Obstacle>>;
}>;

/**
 * Represents Maze cell.
 */
export type Cell = Readonly<{
    id: ID;
    starting: boolean;
    targeting: boolean;
    obstacle: Maybe<Obstacle>;
}>;

export interface Maze {

    // Q U E R I E S

    cols(): number;

    rows(): number;

    hasStart(): boolean;

    hasTarget(): boolean;

    isEmpty(): boolean;

    // C O N S T R U C T I O N

    setStart(id: ID): Maze;

    setTarget(id: ID): Maze;

    setObstacle(id: ID, obstacle: Obstacle): Maze;

    remove(id: ID): Maze;

    clear(): Maze;

    // D E C O N S T R U C T I O N

    map<T>(fn: (cell: Cell) => T): Array<T>;

    setup(): Maybe<Setup>;
}

class MazeImpl implements Maze {
    public constructor(
        private readonly rowsCount: number,
        private readonly colsCount: number,
        private readonly start: Maybe<ID>,
        private readonly target: Maybe<ID>,
        private readonly obstacles: Dict<ID, Obstacle>
    ) {}

    public cols(): number {
        return this.colsCount;
    }

    public rows(): number {
        return this.rowsCount;
    }

    public hasStart(): boolean {
        return this.start.isJust();
    }

    public hasTarget(): boolean {
        return this.target.isJust();
    }

    public isEmpty(): boolean {
        return !this.hasStart() && !this.hasTarget() && this.obstacles.isEmpty();
    }

    public setStart(id: ID): Maze {
        return new MazeImpl(
            this.rowsCount,
            this.colsCount,
            Just(id),
            Just(id).isEqual(this.target) ? Nothing : this.target,
            this.obstacles.remove(id)
        );
    }

    public setTarget(id: ID): Maze {
        return new MazeImpl(
            this.rowsCount,
            this.colsCount,
            Just(id).isEqual(this.start) ? Nothing : this.start,
            Just(id),
            this.obstacles.remove(id)
        );
    }

    public setObstacle(id: ID, obstacle: Obstacle): Maze {
        return new MazeImpl(
            this.rowsCount,
            this.colsCount,
            Just(id).isEqual(this.start) ? Nothing : this.start,
            Just(id).isEqual(this.target) ? Nothing : this.target,
            this.obstacles.insert(id, obstacle)
        );
    }

    public remove(id: ID): Maze {
        return new MazeImpl(
            this.rowsCount,
            this.colsCount,
            Just(id).isEqual(this.start) ? Nothing : this.start,
            Just(id).isEqual(this.target) ? Nothing : this.target,
            this.obstacles.remove(id)
        );
    }

    public clear(): Maze {
        return init(this.rowsCount, this.colsCount);
    }

    // The reason why nested loops are used is that in case
    // of using single loop and `Dict.get` time compexity is `O(n*log n)`.
    // But current implementation extract all entries first which takes `O(n)` time.
    // Then aditional loop to fill "gaps" takes `O(n)` time as well.
    //
    // So time complexity is `O(n)`.
    // It's crucial to map the `Maze` as fast as possible because
    // each mutation causes rerender of rows*cols amount elements which is a lot.
    public map<T>(fn: (cell: Cell) => T): Array<T> {
        const start = this.start.getOrElse(-1);
        const target = this.target.getOrElse(-1);
        const obstacles = this.obstacles.entries();

        const N = this.rowsCount * this.colsCount;
        const M = obstacles.length;
        const result = new Array(N);

        let i = 0;
        let j = 0;

        while (i < N) {
            while (i < N && (j >= M || i < obstacles[ j ][ 0 ])) {
                const cell: Cell = {
                    id: i,
                    starting: i === start,
                    targeting: i === target,
                    obstacle: Nothing
                };

                result[ i++ ] = fn(cell);
            }

            while (j < M && i >= obstacles[ j ][ 0 ]) {
                const cell: Cell = {
                    id: i,
                    starting: i === start,
                    targeting: i === target,
                    obstacle: Just(obstacles[ j++ ][ 1 ])
                };

                result[ i++ ] = fn(cell);
            }
        }

        return result;
    }

    public setup(): Maybe<Setup> {
        return Maybe.shape({
            start: this.start,
            target: this.target
        }).map(({ start, target }) => {
            const obstacles: Array<Array<Obstacle>> = new Array(this.rowsCount);

            for (let i = 0; i < this.rowsCount; i++) {
                obstacles[ i ] = new Array(this.colsCount);
            }

            const listOfObstacles = this.obstacles.entries();

            for (const [ id, obstacle ] of listOfObstacles) {
                const [ row, col ] = this.toRowCol(id);

                obstacles[ row ][ col ] = obstacle;
            }

            return {
                start: this.toRowCol(start),
                target: this.toRowCol(target),
                obstacles
            };
        });
    }

    private toRowCol(id: ID): [ number, number ] {
        return [
            Math.floor(id / this.colsCount),
            id % this.colsCount
        ];
    }
}

export const init = (rows: number, cols: number): Maze => new MazeImpl(
    rows,
    cols,
    Nothing,
    Nothing,
    Dict.empty as Dict<ID, Obstacle>
);

/**
 * D E C O D E  /  E N C O D E
 */

const SYMBOL_START = 'o';
const SYMBOL_TARGET = 'x';
const SYMBOL_PATH = '.';
const SYMBOL_WALL = '#';
const SYMBOL_GRAVEL = ';';
const SYMBOL_PORTAL_IN = '@';
const SYMBOL_PORTAL_OUT = '*';

const obstacleToSymbol = (obstacle: Obstacle): string => {
    switch (obstacle) {
        case Obstacle.Wall: {
            return SYMBOL_WALL;
        }

        case Obstacle.Gravel: {
            return SYMBOL_GRAVEL;
        }

        case Obstacle.PortalIn: {
            return SYMBOL_PORTAL_IN;
        }

        case Obstacle.PortalOut: {
            return SYMBOL_PORTAL_OUT;
        }
    }
};

const stepToSymbol = (cell: Cell): string => {
    if (cell.starting) {
        return SYMBOL_START;
    }

    if (cell.targeting) {
        return SYMBOL_TARGET;
    }

    return cell.obstacle.map(obstacleToSymbol).getOrElse(SYMBOL_PATH);
};

export const serialize = (maze: Maze): string => {
    const symbols = maze.map(stepToSymbol);
    const lines = new Array(maze.rows());
    const N = maze.cols();

    for (let i = 0; i < lines.length; i++) {
        lines[ i ] = symbols.slice(N * i, N + N * i).join('');
    }

    return lines.join('\n');
};

type Representation = Readonly<{
    start: Array<ID>;
    target: Array<ID>;
    obstacles: Dict<ID, Obstacle>;
}>;

const initialRepresentation: Representation = {
    start: [],
    target: [],
    obstacles: Dict.empty as Dict<ID, Obstacle>
};

const processRepresentation = (id: ID, symbol: string, acc: Representation): Either<string, Representation> => {
    switch (symbol) {
        case SYMBOL_START: {
            return Right({
                ...acc,
                start: [ ...acc.start, id ]
            });
        }

        case SYMBOL_TARGET: {
            return Right({
                ...acc,
                target: [ ...acc.target, id ]
            });
        }

        case SYMBOL_PATH: {
            return Right(acc);
        }

        case SYMBOL_WALL: {
            return Right({
                ...acc,
                obstacles: acc.obstacles.insert(id, Obstacle.Wall)
            });
        }

        case SYMBOL_GRAVEL: {
            return Right({
                ...acc,
                obstacles: acc.obstacles.insert(id, Obstacle.Gravel)
            });
        }

        case SYMBOL_PORTAL_IN: {
            return Right({
                ...acc,
                obstacles: acc.obstacles.insert(id, Obstacle.PortalIn)
            });
        }

        case SYMBOL_PORTAL_OUT: {
            return Right({
                ...acc,
                obstacles: acc.obstacles.insert(id, Obstacle.PortalOut)
            });
        }

        default: {
            return Either.Left(`Unknown symbol "${symbol}"`);
        }
    }
};

export const deserialize = (input: string): Either<string, Maze> => {
    const rows = input.split(/\n/);

    if (rows.length < MINIMUM_SIDE) {
        return Left(`It expects no less than ${MINIMUM_SIDE} rows but got "${rows.length}" instead`);
    }

    if (rows.length > MAXIMUM_SIDE) {
        return Left(`It expects no more than ${MAXIMUM_SIDE} rows but got "${rows.length}" instead`);
    }

    const N = rows[ 0 ].length;

    if (N < MINIMUM_SIDE) {
        return Left(`It expects no less than ${MINIMUM_SIDE} cols but got "${N}" instead`);
    }

    if (N > MAXIMUM_SIDE) {
        return Left(`It expects no more than ${MAXIMUM_SIDE} cols but got "${N}" instead`);
    }

    const symbols: Array<string> = [];

    for (const row of rows) {
        let i = 0;

        while (i < row.length) {
            symbols.push(row[ i++ ]);
        }

        while (i++ < N) {
            symbols.push(SYMBOL_PATH);
        }
    }

    return symbols.reduce(
        (acc: Either<string, Representation>, symbol, id: ID) => {
            return acc.chain(representation => processRepresentation(id, symbol, representation));
        },
        Right(initialRepresentation)
    ).chain(({ start, target, obstacles }) => {
        if (start.length > 1) {
            return Left('There might by only one start location');
        }

        if (target.length > 1) {
            return Left('There might by only one target location');
        }

        return Right(new MazeImpl(
            rows.length,
            N,
            Maybe.fromNullable(start[ 0 ]),
            Maybe.fromNullable(target[ 0 ]),
            obstacles
        ));
    });
};
