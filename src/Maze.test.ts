import * as Maze from './Maze';
import Maybe from 'frctl/Maybe';
import Either from 'frctl/Either';
import Dict from 'frctl/Dict';

describe('Maze.deserialize()', () => {
    it('Invalid', () => {
        expect(Maze.deserialize(`
..........
        `.trim())).toEqual(
            Either.Left('It expects no less than 2 rows but got "1" instead')
        );


        expect(Maze.deserialize(`
.
.
.
        `.trim())).toEqual(
            Either.Left('It expects no less than 2 cols but got "1" instead')
        );


        expect(Maze.deserialize(`
...
...
..
        `.trim())).toEqual(
            Either.Left('It expects rows the same size "3" but got "2" instead')
        );

        expect(Maze.deserialize(`
ox.
#|@
*.!
        `.trim())).toEqual(
            Either.Left('Unknown symbol "!"')
        );


        expect(Maze.deserialize(`
..o
o..
..x
        `.trim())).toEqual(
            Either.Left('There might by only one start location')
        );


        expect(Maze.deserialize(`
..x
o..
..x
        `.trim())).toEqual(
            Either.Left('There might by only one target location')
        );
    });

    it('Valid', () => {
        const maze = Maze.deserialize(`
........#....|......
........#...*|......
........#.x..|......
........#....|......
......o.#|||||..#...
..####..#.......#...
.....#..#.......#...
...@.#..#..######...
.....#..............
.....#..............
        `.trim()).getOrElse(Maze.init(0, 0));

        expect(maze.cols()).toBe(20);
        expect(maze.rows()).toBe(10);

        const config = maze.toConfig();

        expect(config.map(({ start }) => start)).toEqual(Maybe.Just(86));
        expect(config.map(({ target }) => target)).toEqual(Maybe.Just(50));

        const obstacles = config.map(({ obstacles }) => obstacles).getOrElse(Dict.empty as Dict<number, Maze.Obstacle>);

        expect(obstacles.get(0)).toEqual(Maybe.Nothing);
        expect(obstacles.get(8)).toEqual(Maybe.Just(Maze.Obstacle.Wall));
        expect(obstacles.get(13)).toEqual(Maybe.Just(Maze.Obstacle.Gravel));
        expect(obstacles.get(32)).toEqual(Maybe.Just(Maze.Obstacle.PortalOut));
        expect(obstacles.get(143)).toEqual(Maybe.Just(Maze.Obstacle.PortalIn));
    });
});

describe('Maze.serialize()', () => {
    const txt = `
........#....|......
........#...*|......
........#.x..|......
........#....|......
......o.#|||||..#...
..####..#.......#...
.....#..#.......#...
...@.#..#..######...
.....#..............
.....#.............@
    `.trim();

    expect(Maze.deserialize(txt).map(Maze.serialize)).toEqual(Either.Right(txt));
});


it('Maze construction', () => {
    const _0 = Maze.init(20, 8);
    expect(Maze.serialize(_0)).toBe(`
....................
....................
....................
....................
....................
....................
....................
....................
    `.trim());

    const _1 = _0.setStart(30);
    expect(Maze.serialize(_1)).toBe(`
....................
..........o.........
....................
....................
....................
....................
....................
....................
    `.trim());

    const _2 = _1.setStart(50);
    expect(Maze.serialize(_2)).toBe(`
....................
....................
..........o.........
....................
....................
....................
....................
....................
    `.trim());

    const _3 = _2.setTarget(50);
    expect(Maze.serialize(_3)).toBe(`
....................
....................
..........x.........
....................
....................
....................
....................
....................
    `.trim());

    const _4 = _3.setTarget(55);
    expect(Maze.serialize(_4)).toBe(`
....................
....................
...............x....
....................
....................
....................
....................
....................
    `.trim());

    const _5 = _4.remove(55);
    expect(Maze.serialize(_5)).toBe(`
....................
....................
....................
....................
....................
....................
....................
....................
    `.trim());

    const _6 = _5.setStart(35).setTarget(125);
    expect(Maze.serialize(_6)).toBe(`
....................
...............o....
....................
....................
....................
....................
.....x..............
....................
    `.trim());

    const _7 = _6
        .setObstacle(30, Maze.Obstacle.Wall)
        .setObstacle(50, Maze.Obstacle.Wall)
        .setObstacle(51, Maze.Obstacle.Wall)
        .setObstacle(52, Maze.Obstacle.Wall)
        .setObstacle(53, Maze.Obstacle.Wall)
        .setObstacle(54, Maze.Obstacle.Wall)
        .setObstacle(55, Maze.Obstacle.Wall)
        .setObstacle(56, Maze.Obstacle.Wall)
        .setObstacle(57, Maze.Obstacle.Wall)
        .setObstacle(58, Maze.Obstacle.Wall)
        .setObstacle(59, Maze.Obstacle.Wall)
        .setObstacle(8, Maze.Obstacle.Wall)
        .setObstacle(28, Maze.Obstacle.Wall)
        .setObstacle(48, Maze.Obstacle.Wall)
        .setObstacle(68, Maze.Obstacle.Wall)
        .setObstacle(88, Maze.Obstacle.Wall)
        .setObstacle(89, Maze.Obstacle.Wall)
        .setObstacle(90, Maze.Obstacle.Wall)
        .setObstacle(91, Maze.Obstacle.Wall)
        .setObstacle(92, Maze.Obstacle.Wall)
        .setObstacle(93, Maze.Obstacle.Wall)
        .setObstacle(94, Maze.Obstacle.Wall)
        .setObstacle(95, Maze.Obstacle.Wall)
        .setObstacle(96, Maze.Obstacle.Wall)
        .setObstacle(97, Maze.Obstacle.Wall)
        .setObstacle(98, Maze.Obstacle.Wall)
        .setObstacle(99, Maze.Obstacle.Wall);
    expect(Maze.serialize(_7)).toBe(`
........#...........
........#.#....o....
........#.##########
........#...........
........############
....................
.....x..............
....................
    `.trim());

    const _8 = _7.setObstacle(35, Maze.Obstacle.Gravel);
    expect(Maze.serialize(_8)).toBe(`
........#...........
........#.#....|....
........#.##########
........#...........
........############
....................
.....x..............
....................
    `.trim());

    const _9 = _8.remove(35);
    expect(Maze.serialize(_9)).toBe(`
........#...........
........#.#.........
........#.##########
........#...........
........############
....................
.....x..............
....................
    `.trim());

    const _10 = _9
        .setObstacle(55, Maze.Obstacle.Gravel)
        .setObstacle(56, Maze.Obstacle.Gravel)
        .setObstacle(57, Maze.Obstacle.Gravel)
        .setObstacle(58, Maze.Obstacle.Gravel)
        .setObstacle(59, Maze.Obstacle.Gravel)
        .setObstacle(59, Maze.Obstacle.Gravel)
        .setObstacle(75, Maze.Obstacle.Gravel)
        .setObstacle(76, Maze.Obstacle.Gravel)
        .setObstacle(77, Maze.Obstacle.Gravel)
        .setObstacle(78, Maze.Obstacle.Gravel)
        .setObstacle(79, Maze.Obstacle.Gravel)
        .setObstacle(79, Maze.Obstacle.Gravel);
    expect(Maze.serialize(_10)).toBe(`
........#...........
........#.#.........
........#.#####|||||
........#......|||||
........############
....................
.....x..............
....................
    `.trim());

    const _11 = _10
        .setObstacle(104, Maze.Obstacle.Wall)
        .setObstacle(105, Maze.Obstacle.Wall)
        .setObstacle(106, Maze.Obstacle.Wall)
        .setObstacle(124, Maze.Obstacle.Wall)
        .setObstacle(125, Maze.Obstacle.Wall)
        .setObstacle(144, Maze.Obstacle.Wall)
        .setObstacle(72, Maze.Obstacle.PortalIn)
        .setStart(17);
    expect(Maze.serialize(_11)).toBe(`
........#........o..
........#.#.........
........#.#####|||||
........#...@..|||||
........############
....###.............
....##..............
....#...............
    `.trim());

    const _12 = _11
        .setTarget(145)
        .setObstacle(107, Maze.Obstacle.Gravel)
        .setObstacle(108, Maze.Obstacle.Gravel)
        .setObstacle(109, Maze.Obstacle.Gravel)
        .setObstacle(126, Maze.Obstacle.Gravel)
        .setObstacle(127, Maze.Obstacle.Gravel)
        .setObstacle(128, Maze.Obstacle.Gravel)
        .setObstacle(129, Maze.Obstacle.Gravel)
        .setObstacle(146, Maze.Obstacle.Gravel)
        .setObstacle(147, Maze.Obstacle.Gravel)
        .setObstacle(148, Maze.Obstacle.Gravel)
        .setObstacle(149, Maze.Obstacle.Gravel);
    expect(Maze.serialize(_12)).toBe(`
........#........o..
........#.#.........
........#.#####|||||
........#...@..|||||
........############
....###|||..........
....##||||..........
....#x||||..........
    `.trim());

    const _13 = _12
        .setObstacle(143, Maze.Obstacle.PortalOut)
        .setObstacle(149, Maze.Obstacle.PortalOut);
    expect(Maze.serialize(_13)).toBe(`
........#........o..
........#.#.........
........#.#####|||||
........#...@..|||||
........############
....###|||..........
....##||||..........
...*#x|||*..........
    `.trim());
});
