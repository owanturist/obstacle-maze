import Maybe, { Nothing, Just } from 'frctl/Maybe';
import Either, { Left, Right } from 'frctl/Either';
import Dict from 'frctl/Dict';


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
 * Represents fold step.
 */
export type Step = Readonly<{
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

    // C O N S T R U C T I O N

    setStart(id: ID): Maze;

    setTarget(id: ID): Maze;

    setObstacle(id: ID, obstacle: Obstacle): Maze;

    remove(id: ID): Maze;

    clear(): Maze;

    // D E C O N S T R U C T I O N

    fold<R>(fn: (id: ID, step: Step, acc: R) => R, acc: R): R;

    setup(): Maybe<Setup>;
}

class MazeImpl implements Maze {
    public constructor(
        private readonly colsCount: number,
        private readonly rowsCount: number,
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

    public setStart(id: ID): Maze {
        return new MazeImpl(
            this.colsCount,
            this.rowsCount,
            Just(id),
            Just(id).isEqual(this.target) ? Nothing : this.target,
            this.obstacles.remove(id)
        );
    }

    public setTarget(id: ID): Maze {
        return new MazeImpl(
            this.colsCount,
            this.rowsCount,
            Just(id).isEqual(this.start) ? Nothing : this.start,
            Just(id),
            this.obstacles.remove(id)
        );
    }

    public setObstacle(id: ID, obstacle: Obstacle): Maze {
        return new MazeImpl(
            this.colsCount,
            this.rowsCount,
            Just(id).isEqual(this.start) ? Nothing : this.start,
            Just(id).isEqual(this.target) ? Nothing : this.target,
            this.obstacles.insert(id, obstacle)
        );
    }

    public remove(id: ID): Maze {
        return new MazeImpl(
            this.colsCount,
            this.rowsCount,
            Just(id).isEqual(this.start) ? Nothing : this.start,
            Just(id).isEqual(this.target) ? Nothing : this.target,
            this.obstacles.remove(id)
        );
    }

    public clear(): Maze {
        return init(this.colsCount, this.rowsCount);
    }

    public fold<R>(fn: (id: ID, step: Step, acc: R) => R, acc: R): R {
        let result = acc;

        for (let row = 0; row < this.rowsCount; row++) {
            for (let col = 0; col < this.colsCount; col++) {
                const id = row * this.colsCount + col;

                result = fn(
                    id,
                    {
                        starting: Just(id).isEqual(this.start),
                        targeting: Just(id).isEqual(this.target),
                        obstacle: this.obstacles.get(id)
                    },
                    result
                );
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

export const init = (cols: number, rows: number): Maze => new MazeImpl(
    cols,
    rows,
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
const SYMBOL_GRAVEL = ',';
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

const stepToSymbol = (step: Step): string => {
    if (step.starting) {
        return SYMBOL_START;
    }

    if (step.targeting) {
        return SYMBOL_TARGET;
    }

    return step.obstacle.map(obstacleToSymbol).getOrElse(SYMBOL_PATH);
};

export const serialize = (maze: Maze): string => {
    const { grid, row } = maze.fold(
        (_id, step, acc: { grid: Array<string>; row: Array<string> }) => {
            if (acc.row.length < maze.cols()) {
                return {
                    grid: acc.grid,
                    row: [ ...acc.row, stepToSymbol(step) ]
                };
            }

            return {
                grid: [ ...acc.grid, acc.row.join('') ],
                row: [ stepToSymbol(step) ]
            };
        },
        { grid: [], row: [] }
    );

    return grid.join('\n') + '\n' + row.join('');
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

    if (rows.length < 2) {
        return Left(`It expects no less than 2 rows but got "${rows.length}" instead`);
    }

    const N = rows[ 0 ].length;

    if (N < 2) {
        return Left(`It expects no less than 2 cols but got "${N}" instead`);
    }

    const symbols: Array<string> = [];

    for (const row of rows) {
        if (row.length !== N) {
            return Left(`It expects rows the same size "${N}" but got "${row.length}" instead`);
        }

        symbols.push(...row.split(''));
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
            N,
            rows.length,
            Maybe.fromNullable(start[ 0 ]),
            Maybe.fromNullable(target[ 0 ]),
            obstacles
        ));
    });
};
