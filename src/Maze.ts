import Maybe, { Nothing, Just } from 'frctl/Maybe';
import Dict from 'frctl/Dict';

/**
 * Cell's id.
 */
export type ID = number;

/**
 * Represents Cell types in Maze.
 *
 * Start - starting location of a solver.
 * Target - target location of a slover.
 * Path - regular walking cell.
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
export type Config = Readonly<{
    cols: number;
    rows: number;
    start: ID;
    target: ID;
    obstacles: Dict<ID, Obstacle>;
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

    // C O N S T R U C T I O N

    setStart(id: ID): Maze;

    setTarget(id: ID): Maze;

    setObstacle(id: ID, obstacle: Obstacle): Maze;

    remove(id: ID): Maze;

    clear(): Maze;

    // D E C O N S T R U C T I O N

    fold<R>(fn: (id: ID, step: Step, acc: R) => R, acc: R): R;

    toConfig(): Maybe<Config>;
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

    public setStart(id: ID): Maze {
        return new MazeImpl(
            this.colsCount,
            this.rowsCount,
            Just(id),
            this.target,
            this.obstacles.remove(id)
        );
    }

    public setTarget(id: ID): Maze {
        return new MazeImpl(
            this.colsCount,
            this.rowsCount,
            this.start,
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

    public toConfig(): Maybe<Config> {
        return Maybe.shape({
            cols: Just(this.colsCount),
            rows: Just(this.rowsCount),
            start: this.start,
            target: this.target,
            obstacles: Just(this.obstacles)
        });
    }
}

export const init = (cols: number, rows: number): Maze => new MazeImpl(
    cols,
    rows,
    Nothing,
    Nothing,
    Dict.empty as Dict<ID, Obstacle>
);
