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
 * Represents the grid as array of arrays with starting and targeting locations.
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

/**
 * Immutable Maze.
 * Represents a grid rows×cols dimention
 * with starting/targeting locations and obstacles around.
 */
export interface Maze {

    // Q U E R I E S

    /**
     * Gives a number of columns.
     */
    cols(): number;

    /**
     * Gives a number of rows.
     */
    rows(): number;

    /**
     * Determine does the maze have starting location or not.
     */
    hasStart(): boolean;

    /**
     * Determine does the maze have targeting location or not.
     */
    hasTarget(): boolean;

    /**
     * Determine does the maze have either obstacles, starting or targeting locations.
     */
    isEmpty(): boolean;

    // C O N S T R U C T I O N

    /**
     * Set starting location.
     * Takes time proportional to `O(log n)`.
     */
    setStart(id: ID): Maze;

    /**
     * Set targeting location.
     * Takes time proportional to `O(log n)`.
     */
    setTarget(id: ID): Maze;

    /**
     * Set obstacle at the location.
     * Takes time proportional to `O(log n)`.
     */
    setObstacle(id: ID, obstacle: Obstacle): Maze;

    /**
     * Removes either an obstacle, starting or targeting location.
     * Takes time proportional to `O(log n)`.
     */
    remove(id: ID): Maze;


    /**
     * Removes all of the obstacles, starting and targeting locations.
     * Takes constant time.
     */
    clear(): Maze;

    // D E C O N S T R U C T I O N

    /**
     * Maps cells into an array.
     * Takes time proportional to `O(n)`
     */
    map<T>(fn: (cell: Cell) => T): Array<T>;

    /**
     * Convert the maze to Setup if starting and targeting locations are exists.
     */
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
        return empty(this.rowsCount, this.colsCount);
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

export const empty = (rows: number, cols: number): Maze => new MazeImpl(
    rows,
    cols,
    Nothing,
    Nothing,
    Dict.empty as Dict<ID, Obstacle>
);

/**
 * D E C O D E  /  E N C O D E
 */

enum Figure
    { Start = 'o'
    , Target = 'x'
    , Path = '.'
    , Wall = '#'
    , Gravel = ';'
    , PortalIn = '@'
    , PortalOut = '*'
    }

const obstacleToFigure = (obstacle: Obstacle): Figure => {
    switch (obstacle) {
        case Obstacle.Wall: {
            return Figure.Wall;
        }

        case Obstacle.Gravel: {
            return Figure.Gravel;
        }

        case Obstacle.PortalIn: {
            return Figure.PortalIn;
        }

        case Obstacle.PortalOut: {
            return Figure.PortalOut;
        }
    }
};

const stepToFigure = (cell: Cell): Figure => {
    if (cell.starting) {
        return Figure.Start;
    }

    if (cell.targeting) {
        return Figure.Target;
    }

    return cell.obstacle.map(obstacleToFigure).getOrElse(Figure.Path);
};

/**
 * Turns a maze into string serialisation.
 * Useful for write the result into a file.
 */
export const serialize = (maze: Maze): string => {
    const symbols = maze.map(stepToFigure);
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

const processRepresentation = (id: ID, figure: string, acc: Representation): Either<string, Representation> => {
    switch (figure) {
        case Figure.Start: {
            return Right({
                ...acc,
                start: [ ...acc.start, id ]
            });
        }

        case Figure.Target: {
            return Right({
                ...acc,
                target: [ ...acc.target, id ]
            });
        }

        case Figure.Path: {
            return Right(acc);
        }

        case Figure.Wall: {
            return Right({
                ...acc,
                obstacles: acc.obstacles.insert(id, Obstacle.Wall)
            });
        }

        case Figure.Gravel: {
            return Right({
                ...acc,
                obstacles: acc.obstacles.insert(id, Obstacle.Gravel)
            });
        }

        case Figure.PortalIn: {
            return Right({
                ...acc,
                obstacles: acc.obstacles.insert(id, Obstacle.PortalIn)
            });
        }

        case Figure.PortalOut: {
            return Right({
                ...acc,
                obstacles: acc.obstacles.insert(id, Obstacle.PortalOut)
            });
        }

        default: {
            return Either.Left(`Unknown figure "${figure}"`);
        }
    }
};

/**
 * Converts a string representation to maze.
 * In case of failure goes back with an error message.
 */
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

    const figures: Array<string> = [];

    for (const row of rows) {
        let i = 0;

        while (i < row.length) {
            figures.push(row[ i++ ]);
        }

        while (i++ < N) {
            figures.push(Figure.Path);
        }
    }

    return figures.reduce(
        (acc, figure, id) => acc.chain(representation => processRepresentation(id, figure, representation)),
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
