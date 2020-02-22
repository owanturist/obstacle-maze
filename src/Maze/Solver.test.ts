import Either from 'frctl/Either';

import * as Maze from './index';
import * as Solver from './Solver';

const solve = (schema: string): string | Either<string, Solver.Path> => {
    return Maze.deserialize(schema.trim())
        .chain(maze => maze.setup().toEither('Setup if invalid'))
        .chain(setup => Solver.solve(setup).toEither('No path'));
};

it('Maze.Solver non of obstacles, next to each other in a row', () => {
    expect(solve(`
ox
..
    `)).toEqual(Either.Right([
        [ 0, 0 ],
        [ 0, 1 ]
    ]));

    expect(solve(`
o.
x.
    `)).toEqual(Either.Right([
        [ 0, 0 ],
        [ 1, 0 ]
    ]));
});

it('Maze.Solver non of obstacles, single cell between in a row', () => {
    expect(solve(`
o.x
...
...
    `)).toEqual(Either.Right([
        [ 0, 0 ],
        [ 0, 1 ],
        [ 0, 2 ]
    ]));
    expect(solve(`
o..
...
x..
    `)).toEqual(Either.Right([
        [ 0, 0 ],
        [ 1, 0 ],
        [ 2, 0 ]
    ]));
});

it('Maze.Solver non of obstacles, big gap between in a row', () => {
    expect(solve(`
...........
..o.....x..
...........
    `)).toEqual(Either.Right([
        [ 1, 2 ],
        [ 1, 3 ],
        [ 1, 4 ],
        [ 1, 5 ],
        [ 1, 6 ],
        [ 1, 7 ],
        [ 1, 8 ]
    ]));
});

it('Maze.Solver non of obstacles, next to each other in diagonal', () => {
    expect(solve(`
o.
.x
    `)).toEqual(Either.Right([
        [ 0, 0 ],
        [ 0, 1 ],
        [ 1, 1 ]
    ]));
});

it('Maze.Solver non of obstacles, gap between in diagonal', () => {
    expect(solve(`
o....
.....
....x
    `)).toEqual(Either.Right([
        [ 0, 0 ],
        [ 0, 1 ],
        [ 0, 2 ],
        [ 0, 3 ],
        [ 0, 4 ],
        [ 1, 4 ],
        [ 2, 4 ]
    ]));

    expect(solve(`
....x
.....
o....
    `)).toEqual(Either.Right([
        [ 2, 0 ],
        [ 2, 1 ],
        [ 2, 2 ],
        [ 2, 3 ],
        [ 2, 4 ],
        [ 1, 4 ],
        [ 0, 4 ]
    ]));

    expect(solve(`
x....
.....
....o
    `)).toEqual(Either.Right([
        [ 2, 4 ],
        [ 2, 3 ],
        [ 2, 2 ],
        [ 2, 1 ],
        [ 2, 0 ],
        [ 1, 0 ],
        [ 0, 0 ]
    ]));

    expect(solve(`
....o
.....
x....
    `)).toEqual(Either.Right([
        [ 0, 4 ],
        [ 0, 3 ],
        [ 0, 2 ],
        [ 0, 1 ],
        [ 0, 0 ],
        [ 1, 0 ],
        [ 2, 0 ]
    ]));
});

it('Maze.Solver walls can block the solver', () => {
    expect(solve(`
o#....
##....
.....x
    `)).toEqual(Either.Left('No path'));

    expect(solve(`
o.....
....##
....#x
    `)).toEqual(Either.Left('No path'));

    expect(solve(`
o...##
..##..
##...x
    `)).toEqual(Either.Left('No path'));
});

it('Maze.Solver gravel cannot block the solver', () => {
    expect(solve(`
o;;;;;
;;;;;;
;;;;;x
    `)).toEqual(Either.Right([
        [ 0, 0 ],
        [ 0, 1 ],
        [ 0, 2 ],
        [ 0, 3 ],
        [ 0, 4 ],
        [ 1, 4 ],
        [ 1, 5 ],
        [ 2, 5 ]
    ]));
});

it('Maze.Solver portal in cannot block the solver', () => {
    expect(solve(`
o@@@@@
@@@@@@
@@@@@x
    `)).toEqual(Either.Right([
        [ 0, 0 ],
        [ 0, 1 ],
        [ 0, 2 ],
        [ 0, 3 ],
        [ 0, 4 ],
        [ 1, 4 ],
        [ 1, 5 ],
        [ 2, 5 ]
    ]));
});

it('Maze.Solver portal out cannot block the solver', () => {
    expect(solve(`
o*****
******
*****x
    `)).toEqual(Either.Right([
        [ 0, 0 ],
        [ 0, 1 ],
        [ 0, 2 ],
        [ 0, 3 ],
        [ 0, 4 ],
        [ 1, 4 ],
        [ 1, 5 ],
        [ 2, 5 ]
    ]));
});

it('Maze.Solver gravel is slower', () => {
    expect(solve(`
.....
..#..
.o#x.
.;#;.
.;;;.
    `)).toEqual(Either.Right([
        [ 2, 1 ],
        [ 1, 1 ],
        [ 0, 1 ],
        [ 0, 2 ],
        [ 0, 3 ],
        [ 1, 3 ],
        [ 2, 3 ]
    ]));

    expect(solve(`
x;;;o
.;;;.
.;;;.
.....
    `)).toEqual(Either.Right([
        [ 0, 4 ],
        [ 0, 3 ],
        [ 0, 2 ],
        [ 0, 1 ],
        [ 0, 0 ]
    ]));

    expect(solve(`
x;;;;
.;;;o
.;;;.
.....
    `)).toEqual(Either.Right([
        [ 1, 4 ],
        [ 1, 3 ],
        [ 1, 2 ],
        [ 1, 1 ],
        [ 1, 0 ],
        [ 0, 0 ]
    ]));

    expect(solve(`
x;;;;
.;;;;
.;;;o
.....
    `)).toEqual(Either.Right([
        [ 2, 4 ],
        [ 3, 4 ],
        [ 3, 3 ],
        [ 3, 2 ],
        [ 3, 1 ],
        [ 3, 0 ],
        [ 2, 0 ],
        [ 1, 0 ],
        [ 0, 0 ]
    ]));

    expect(solve(`
x..
;#.
;#.
;#.
o..
    `)).toEqual(Either.Right([
        [ 4, 0 ],
        [ 3, 0 ],
        [ 2, 0 ],
        [ 1, 0 ],
        [ 0, 0 ]
    ]));

    expect(solve(`
x...
;##.
;#..
;o.#
    `)).toEqual(Either.Right([
        [ 3, 1 ],
        [ 3, 0 ],
        [ 2, 0 ],
        [ 1, 0 ],
        [ 0, 0 ]
    ]));

    expect(solve(`
x...
;##.
;;o.
    `)).toEqual(Either.Right([
        [ 2, 2 ],
        [ 2, 3 ],
        [ 1, 3 ],
        [ 0, 3 ],
        [ 0, 2 ],
        [ 0, 1 ],
        [ 0, 0 ]
    ]));
});


it('Maze.Solver teleport takes instant time', () => {
    expect(solve(`
ox
@*
    `)).toEqual(Either.Right([
        [ 0, 0 ],
        [ 0, 1 ]
    ]));

    expect(solve(`
o.x
@.*
    `)).toEqual(Either.Right([
        [ 0, 0 ],
        [ 1, 0 ],
        [ 1, 2 ],
        [ 0, 2 ]
    ]));

    expect(solve(`
o.....x..*
..........
@.........
    `)).toEqual(Either.Right([
        [ 0, 0 ],
        [ 1, 0 ],
        [ 2, 0 ],
        [ 0, 9 ],
        [ 0, 8 ],
        [ 0, 7 ],
        [ 0, 6 ]
    ]));

    expect(solve(`
o.@
...
...
...
...
...
x..
...
...
*..
    `)).toEqual(Either.Right([
        [ 0, 0 ],
        [ 0, 1 ],
        [ 0, 2 ],
        [ 9, 0 ],
        [ 8, 0 ],
        [ 7, 0 ],
        [ 6, 0 ]
    ]));

    expect(solve(`
o...x..*
........
@.......
    `)).toEqual(Either.Right([
        [ 0, 0 ],
        [ 0, 1 ],
        [ 0, 2 ],
        [ 0, 3 ],
        [ 0, 4 ]
    ]));

    expect(solve(`
o.@
...
...
...
x..
...
...
*..
    `)).toEqual(Either.Right([
        [ 0, 0 ],
        [ 1, 0 ],
        [ 2, 0 ],
        [ 3, 0 ],
        [ 4, 0 ]
    ]));

    expect(solve(`
o@............
##############
*;;;;x.......*
    `)).toEqual(Either.Right([
        [ 0, 0 ],
        [ 0, 1 ],
        [ 2, 13 ],
        [ 2, 12 ],
        [ 2, 11 ],
        [ 2, 10 ],
        [ 2, 9 ],
        [ 2, 8 ],
        [ 2, 7 ],
        [ 2, 6 ],
        [ 2, 5 ]
    ]));

    expect(solve(`
o@...........
#############
*;;;x.......*
    `)).toEqual(Either.Right([
        [ 0, 0 ],
        [ 0, 1 ],
        [ 2, 0 ],
        [ 2, 1 ],
        [ 2, 2 ],
        [ 2, 3 ],
        [ 2, 4 ]
    ]));

    expect(solve(`
o@...........
.............
*;;;x.......*
    `)).toEqual(Either.Right([
        [ 0, 0 ],
        [ 0, 1 ],
        [ 0, 2 ],
        [ 0, 3 ],
        [ 0, 4 ],
        [ 1, 4 ],
        [ 2, 4 ]
    ]));
});
