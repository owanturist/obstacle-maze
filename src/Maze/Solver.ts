import {
    Order,
    Comparable
} from 'frctl/Basics';
import Maybe, { Nothing, Just } from 'frctl/Maybe';

import {
    Setup,
    Obstacle
} from './index';
import {
    NonEmptyStack,
    singleton
} from '../NonEmptyStack';
import {
    PriorityQueue,
    empty as emptyPriorityQueue
} from '../PriorityQueue';


/**
 * Represent a path details with path itself.
 * *Note:* length does not count starting and portal outs locations.
 */
export type Solution = Readonly<{
    grounds: number;
    gravels: number;
    portals: number;
    weight: number;
    length: number;
    path: Array<[ number, number ]>;
}>;

/**
 * ImmutableWay representation.
 *
 * The reason why it's immutable is that each way might
 * branch several times during the find path process,
 * so they don't want to effect to each other while it's happening.
 *
 * This is a point of flexibility for path structure, for instance
 * it might analyze how many turns the equal length ways do
 * and put the most straight of them higher in priority.
 * It can do the same with amount of obstacles it goes thru or
 * any other condition.
 */
class Way implements Comparable<Way> {
    private static readonly PORTAL_WEIGHT = 0;
    private static readonly GROUND_WEIGHT = 1;
    private static readonly GRAVEL_WEIGHT = 2;

    public static start(startLocation: [ number, number ]): Way {
        return new Way(0, 0, 0, 0, 0, singleton(startLocation));
    }

    private constructor(
        private readonly turns: number,
        private readonly grounds: number,
        private readonly gravels: number,
        private readonly portals: number,
        private readonly weight: number,
        private readonly path: NonEmptyStack<[ number, number ]>
    ) {}

    public compareTo(another: Way): Order {
        if (this.weight < another.weight) {
            return Order.LT;
        }

        if (this.weight > another.weight) {
            return Order.GT;
        }

        if (this.turns < another.turns) {
            return Order.LT;
        }

        if (this.turns > another.turns) {
            return Order.GT;
        }

        return Order.EQ;
    }

    /**
     * Returns current coordinates of the way.
     * Takes constant time.
     */
    public coordinates(): [ number, number ] {
        return this.path.peek();
    }

    private inRow(row: number, col: number): boolean {
        return this.path.pop().map(([ , prev ]) => {
            const [ prevRow, prevCol ] = prev.peek();

            return (prevRow === row || prevCol === col);
        }).getOrElse(true);
    }

    /**
     * Branch a ground from the way.
     * Takes constant time.
     */
    public branchGround(row: number, col: number): Way {
        return new Way(
            this.inRow(row, col) ? this.turns : this.turns + 1,
            this.grounds + 1,
            this.gravels,
            this.portals,
            this.weight + Way.GROUND_WEIGHT,
            this.path.push([ row, col ])
        );
    }

    /**
     * Branch a gravel from the way.
     * Takes constant time.
     */
    public branchGravel(row: number, col: number): Way {
        return new Way(
            this.inRow(row, col) ? this.turns : this.turns + 1,
            this.grounds,
            this.gravels + 1,
            this.portals,
            this.weight + Way.GRAVEL_WEIGHT,
            this.path.push([ row, col ])
        );
    }

    /**
     * Branch a portal from the way.
     * Takes constant time.
     */
    public branchPortal(row: number, col: number): Way {
        return new Way(
            this.turns + 1, // treat portals as turns to reduce priority
            this.grounds - 1,
            this.gravels,
            this.portals + 1,
            this.weight + Way.PORTAL_WEIGHT,
            this.path.push([ row, col ])
        );
    }

    /**
     * Converts the way to solution.
     * Takes time proportional to `O(n)`.
     */
    public toSolution(): Solution {
        const path = this.path.toArray();

        return {
            gravels: this.gravels,
            portals: this.portals,
            grounds: this.grounds,
            weight: this.weight,
            // does not count starting and portals
            length: path.length - 1 - this.portals,
            path
        };
    }
}

/**
 * It doesn't really needed to build a graph with linked edges
 * because the grid has specific rules where each vertices
 * has exact edges. But it can use Breadth-First Search for sure.
 *
 * The reason why BFS is choosen is that it has to explore all
 * possible shortest ways to look for portals.
 * If it doesn't have portals it might use more intelligent algorithm.
 */
class BFS {
    private readonly rows: number;
    private readonly cols: number;
    private readonly visited: Array<boolean>;
    private readonly portalsOut: Array<[ number, number ]>;
    private readonly pq: PriorityQueue<Way> = emptyPriorityQueue();

    /**
     * Construction takes time proportional to `O(n)`.
     */
    public constructor(
        private readonly start: [ number, number ],
        private readonly target: [ number, number ],
        private readonly obstacles: Array<Array<Obstacle>>
    ) {
        this.rows = obstacles.length;
        this.cols = this.rows > 0 ? obstacles[ 0 ].length : 0;
        this.visited = new Array(this.rows * this.cols);
        this.portalsOut = [];

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (obstacles[ row ][ col ] === Obstacle.PortalOut) {
                    this.portalsOut.push([ row, col ]);
                }
            }
        }

        // it doesn't need to visit the starting location
        this.visit(start[ 0 ], start[ 1 ]);
    }

    /**
     * Checking if the cell has been inspected already.
     * Takes constant time.
     */
    private isVisited(row: number, col: number): boolean {
        return this.visited[ this.cols * row + col ];
    }

    /**
     * Mark the cell as inspected.
     * Takes constant time.
     */
    private visit(row: number, col: number): void {
        this.visited[ this.cols * row + col ] = true;
    }

    /**
     * Determine is the cell is target or not.
     * Takes constant time.
     */
    private isTarget(row: number, col: number): boolean {
        return this.target[ 0 ] === row && this.target[ 1 ] === col;
    }

    /**
     * Puts way into priority queue for the future inspection.
     * Out of range and inspected cells are ignored.
     * Takes time proportional to `O(log n)`
     */
    private schedule(way: Way, row: number, col: number): void {
        if (col < 0 || col >= this.cols
            || row < 0 || row >= this.rows
            || this.isVisited(row, col)
        ) {
            return;
        }

        switch (this.obstacles[ row ][ col ]) {
            case null:
            case undefined:            // Represents just a cell empty of obstacles
            case Obstacle.PortalOut: { // PortalOut might be treated like empty cell
                return this.pq.enqueue(way.branchGround(row, col));
            }

            case Obstacle.Gravel: {
                return this.pq.enqueue(way.branchGravel(row, col));
            }

            case Obstacle.PortalIn: {
                // PortalIn might be treated like empty cell
                this.pq.enqueue(way.branchGround(row, col));

                // Schedule all PortalOuts
                for (const [ portalRow, portalCol ] of this.portalsOut) {
                    this.schedule(way.branchPortal(row, col), portalRow, portalCol);
                }
            }
        }
    }

    /**
     * Schedules neighbour cells for the future inspection.
     * Takes time proportional to `O(log n)`.
     */
    private lookup(way: Way): void {
        const [ row, col ] = way.coordinates();

        this.schedule(way, row - 1, col,   );  // top
        this.schedule(way, row    , col + 1);  // right
        this.schedule(way, row + 1, col,   );  // bottom
        this.schedule(way, row    , col - 1);  // left
    }

    /**
     * Finds the sortest path between `start` and `target` locations.
     * In case there is no path returns `Nothing`.
     * Takes time proportional to `O(n*log n)`.
     */
    public findShortestPaths(): Maybe<Solution> {
        this.lookup(Way.start(this.start));

        while (!this.pq.isEmpty()) {
            const way = this.pq.dequeue();
            const [ row, col ] = way.coordinates();

            if (this.isVisited(row, col)) {
                continue;
            }

            if (this.isTarget(row, col)) {
                return Just(way.toSolution());
            }

            this.visit(row, col);
            this.lookup(way);
        }

        return Nothing;
    }
}

/**
 * We trust the Maze flow so `setup` is valid.
 */
export const solve = (setup: Setup): Maybe<Solution> => {
    const bfs = new BFS(setup.start, setup.target, setup.obstacles);

    return bfs.findShortestPaths();
};
