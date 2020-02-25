import React from 'react';
import { action } from '@storybook/addon-actions';
import * as Knobs from '@storybook/addon-knobs';
import Set from 'frctl/Set';
import Maybe from 'frctl/Maybe';

import * as Grid from './index';
import * as Maze from 'Maze';

export default {
    title: 'Grid',
    parameters: {
        component: Grid.View
    },
    decorators: [ Knobs.withKnobs ]
};

export const Initial = () => (
    <Grid.View
        model={Grid.init(Maze.empty(20, 20))}
        dispatch={action('Dispatch')}
    />
);

export const WithObstacles = () => {
    const initialModel = Grid.init(Maze.empty(20, 20));
    const maze = initialModel.history.getCurrent()
        .setStart(0)

        .setObstacle(21, Maze.Obstacle.Wall)
        .setObstacle(22, Maze.Obstacle.Wall)
        .setObstacle(23, Maze.Obstacle.Wall)
        .setObstacle(24, Maze.Obstacle.Wall)

        .setObstacle(41, Maze.Obstacle.Gravel)
        .setObstacle(42, Maze.Obstacle.Gravel)
        .setObstacle(43, Maze.Obstacle.Gravel)
        .setObstacle(44, Maze.Obstacle.Gravel)

        .setObstacle(61, Maze.Obstacle.PortalIn)
        .setObstacle(62, Maze.Obstacle.PortalIn)
        .setObstacle(63, Maze.Obstacle.PortalIn)
        .setObstacle(64, Maze.Obstacle.PortalIn)

        .setObstacle(81, Maze.Obstacle.PortalOut)
        .setObstacle(82, Maze.Obstacle.PortalOut)
        .setObstacle(83, Maze.Obstacle.PortalOut)
        .setObstacle(84, Maze.Obstacle.PortalOut)

        .setTarget(105);

    return (
        <Grid.View
            model={{
                ...initialModel,
                history: initialModel.history.push(maze)
            }}
            dispatch={action('Dispatch')}
        />
    );
};

const makeModeKnob = (): Grid.Mode => {
    const mode = Knobs.radios('Editing', {
        'Add Wall': 'add_wall',
        'Add Gravel': 'add_gravel',
        'Clear Cell': 'clear_cell'
    }, 'add_gravel');

    switch (mode) {
        case 'add_wall': return Grid.AddObstacle(Maze.Obstacle.Wall);
        case 'add_gravel': return Grid.AddObstacle(Maze.Obstacle.Gravel);
        case 'clear_cell': return Grid.ClearCell;
    }
};

export const ActiveMode = () => {
    const initialModel = Grid.init(Maze.empty(20, 20));
    const model = {
        ...initialModel,
        mode: makeModeKnob()
    };

    return (
        <Grid.View
            model={model}
            dispatch={action('Dispatch')}
        />
    );
};


export const FoundPath = () => {
    const initialModel = Maze.deserialize(`
o;###################
;;;;;;;;#...........#
#;#######.#.###.#.#.#
#.......#.#.#...#.#.#
###.#.#.#.#######.###
#...#.#.....#.......#
#.#.###.#.#########.#
#.#...#.#.*.#...#.#.#
#.#.#.#####.###.#.###
#.#.#...#......@....#
###########.###.###.#
#.......#.....#.#.#.#
#.###.#########.#.###
#...#.#.....#.....#.#
#.###.#.###.###.###.#
#.#.....#.#.........#
###.#####.###.###.###
#...#...#.....#...#.#
#.#.#.#.###.#####.#.#
#.#...#...#.....#;;;;
###################;x
    `.trim()).map(Grid.init).getOrElse(Grid.init(Maze.empty(21, 21)));

    const initialPath = [ 0, 1, 22, 43, 64, 65, 66, 67, 68, 69, 70, 91, 112, 113, 114, 135, 156, 157, 158, 179, 200, 201, 202, 203, 204, 225, 246, 267, 288, 309, 330, 331, 332, 353, 374, 395, 416, 417, 418, 419, 440 ];

    const path = Knobs.array('Path', initialPath.map(String), ' ').filter(Boolean).map(Number);

    const model = {
        ...initialModel,
        solution: path.length ? Maybe.Just(Set.fromList(path)) : Maybe.Nothing
    };

    return (
        <Grid.View
            model={model}
            dispatch={action('Dispatch')}
        />
    );
};

