import React from 'react';
import { action } from '@storybook/addon-actions';
import * as Knobs from '@storybook/addon-knobs';
import Set from 'frctl/Set';
import Maybe from 'frctl/Maybe';
import RemoteData from 'frctl/RemoteData/Optional';

import * as Grid from './index';
import { Obstacle } from 'Maze';

export default {
    title: 'Grid',
    parameters: {
        component: Grid.View
    },
    decorators: [ Knobs.withKnobs ]
};

export const Initial = () => (
    <Grid.View
        model={Grid.initial(20, 20)}
        dispatch={action('Dispatch')}
    />
);

export const WithObstacles = () => {
    const initialModel = Grid.initial(20, 20);
    const model = {
        ...initialModel,
        maze: initialModel.maze
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

            .setTarget(105)
    };

    return (
        <Grid.View
            model={model}
            dispatch={action('Dispatch')}
        />
    );
};

const makeModeKnob = (): Grid.Mode => {
    const mode = Knobs.radios('Editing', {
        'Add Wall': 'add_wall',
        'Add Gravel': 'add_gravel',
        'Add Portal In': 'add_portal_in',
        'Add Portal Out': 'add_portal_out',
        'Set Start': 'set_start',
        'Set Target': 'set_target',
        'Clear Cell': 'clear_cell'
    }, 'add_gravel');

    switch (mode) {
        case 'add_wall': return Grid.AddObstacle(Obstacle.Wall);
        case 'add_gravel': return Grid.AddObstacle(Obstacle.Gravel);
        case 'add_portal_in': return Grid.AddObstacle(Obstacle.PortalIn);
        case 'add_portal_out': return Grid.AddObstacle(Obstacle.PortalOut);
        case 'set_start': return Grid.SetStart;
        case 'set_target': return Grid.SetTarget;
        case 'clear_cell': return Grid.ClearCell;
    }
};

export const ActiveMode = () => {
    const initialModel = Grid.initial(20, 20);
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
    const initialModel = Grid.initial(20, 20);
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
    const initialModel = Grid.initial(20, 20);
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
    const initialModel = Grid.initial(20, 20);
    const path = Knobs.array('Path', [ '21', '22', '23', '43' ], ' ').filter(Boolean).map(Number);

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

