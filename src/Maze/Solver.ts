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


const NORAML_DURATION = 1;
const GRAVEL_DURATION = NORAML_DURATION * 2;
const TELEPORT_DURATION = 0;

export type Path = Array<[ number, number ]>;


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
    public static start(startLocation: [ number, number ]): Way {
        return new Way(0, 0, singleton(startLocation));
    }

    private constructor(
        private readonly turns: number,
        private readonly time: number,
        private readonly path: NonEmptyStack<[ number, number ]>
    ) {}

    public compareTo(another: Way): Order {
        if (this.time < another.time) {
            return Order.LT;
        }

        if (this.time > another.time) {
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

    public coordinates(): [ number, number ] {
        return this.path.peek();
    }

    /**
     * Make a brunch of the way.
     * Takes constant time.
     */
    public branch(duration: number, row: number, col: number): Way {
        const inRow = this.path.pop().map(([ , prev ]) => {
            const [ prevRow, prevCol ] = prev.peek();

            return (prevRow === row || prevCol === col);
        }).getOrElse(true);

        return new Way(
            inRow ? this.turns : this.turns + 1,
            this.time + duration,
            this.path.push([ row, col ])
        );
    }

    /**
     * Get full path of the way.
     * Takes time proportional to `O(n)`.
     */
    public getPath(): Path {
        return this.path.toArray();
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

        this.visit(start[ 0 ], start[ 1 ]);
    }

    private isVisited(row: number, col: number): boolean {
        return this.visited[ this.cols * row + col ];
    }

    private visit(row: number, col: number): void {
        this.visited[ this.cols * row + col ] = true;
    }

    private isTarget(row: number, col: number): boolean {
        return this.target[ 0 ] === row && this.target[ 1 ] === col;
    }

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
                return this.pq.enqueue(way.branch(NORAML_DURATION, row, col));
            }

            case Obstacle.Gravel: {
                return this.pq.enqueue(way.branch(GRAVEL_DURATION, row, col));
            }

            case Obstacle.PortalIn: {
                // PortalIn might be treated like empty cell
                this.pq.enqueue(way.branch(NORAML_DURATION, row, col));

                // Schedule all PortalOuts
                for (const [ portalRow, portalCol ] of this.portalsOut) {
                    this.schedule(way.branch(TELEPORT_DURATION, row, col), portalRow, portalCol);
                }
            }
        }
    }

    private lookup(way: Way): void {
        const [ row, col ] = way.coordinates();

        this.schedule(way, row - 1, col,   );  // top
        this.schedule(way, row    , col + 1);  // right
        this.schedule(way, row + 1, col,   );  // bottom
        this.schedule(way, row    , col - 1);  // left
    }

    public findShortestPaths(): Maybe<Path> {
        this.lookup(Way.start(this.start));

        while (!this.pq.isEmpty()) {
            const way = this.pq.dequeue();
            const [ row, col ] = way.coordinates();

            if (this.isVisited(row, col)) {
                continue;
            }

            if (this.isTarget(row, col)) {
                return Just(way.getPath());
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
export const solve = (setup: Setup): Maybe<Path> => {
    const bfs = new BFS(
        setup.start,
        setup.target,
        setup.obstacles
    );

    return bfs.findShortestPaths();
};
