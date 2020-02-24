import React from 'react';
import { action } from '@storybook/addon-actions';
import * as Knobs from '@storybook/addon-knobs';
import Set from 'frctl/Set';
import Maybe from 'frctl/Maybe';
import RemoteData from 'frctl/RemoteData/Optional';

import * as Grid from './index';
import { deserialize, Obstacle } from 'Maze';

export default {
    title: 'Grid',
    parameters: {
        component: Grid.View
    },
    decorators: [ Knobs.withKnobs ]
};

export const Initial = () => (
    <Grid.View
        model={Grid.initEmpty(20, 20)}
        dispatch={action('Dispatch')}
    />
);

export const WithObstacles = () => {
    const initialModel = Grid.initEmpty(20, 20);
    const maze = initialModel.history.getCurrent()
        .setStart(0)

        .setObstacle(21, Obstacle.Wall)
        .setObstacle(22, Obstacle.Wall)
        .setObstacle(23, Obstacle.Wall)
        .setObstacle(24, Obstacle.Wall)

        .setObstacle(41, Obstacle.Gravel)
        .setObstacle(42, Obstacle.Gravel)
        .setObstacle(43, Obstacle.Gravel)
        .setObstacle(44, Obstacle.Gravel)

        .setObstacle(61, Obstacle.PortalIn)
        .setObstacle(62, Obstacle.PortalIn)
        .setObstacle(63, Obstacle.PortalIn)
        .setObstacle(64, Obstacle.PortalIn)

        .setObstacle(81, Obstacle.PortalOut)
        .setObstacle(82, Obstacle.PortalOut)
        .setObstacle(83, Obstacle.PortalOut)
        .setObstacle(84, Obstacle.PortalOut)

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
        case 'add_wall': return Grid.AddObstacle(Obstacle.Wall);
        case 'add_gravel': return Grid.AddObstacle(Obstacle.Gravel);
        case 'clear_cell': return Grid.ClearCell;
    }
};

export const ActiveMode = () => {
    const initialModel = Grid.initEmpty(20, 20);
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

export const Failure = () => {
    const initialModel = Grid.initEmpty(20, 20);
    const model = {
        ...initialModel,
        solving: RemoteData.Failure(Knobs.text('Loading', 'The Maze does not have start and target locations'))
    };

    return (
        <Grid.View
            model={model}
            dispatch={action('Dispatch')}
        />
    );
};

export const NoPath = () => {
    const initialModel = Grid.initEmpty(20, 20);
    const model = {
        ...initialModel,
        solving: RemoteData.Succeed(Maybe.Nothing)
    };

    return (
        <Grid.View
            model={model}
            dispatch={action('Dispatch')}
        />
    );
};


export const FoundPath = () => {
    const initialModel = deserialize(`
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
    `.trim()).map(Grid.initWithMaze).getOrElse(Grid.initEmpty(21, 21));

    const initialPath = [ 0, 1, 22, 43, 64, 65, 66, 67, 68, 69, 70, 91, 112, 113, 114, 135, 156, 157, 158, 179, 200, 201, 202, 203, 204, 225, 246, 267, 288, 309, 330, 331, 332, 353, 374, 395, 416, 417, 418, 419, 440 ];

    const path = Knobs.array('Path', initialPath.map(String), ' ').filter(Boolean).map(Number);

    const model = {
        ...initialModel,
        solving: RemoteData.Succeed(path.length ? Maybe.Just(Set.fromList(path)) : Maybe.Nothing)
    };

    return (
        <Grid.View
            model={model}
            dispatch={action('Dispatch')}
        />
    );
};

