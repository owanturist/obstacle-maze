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
#%@
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
........#....%......
........#...*%......
........#.x..%......
........#....%......
......o.#%%%%%..#...
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
