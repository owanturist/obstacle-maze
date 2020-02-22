import React from 'react';
import { action } from '@storybook/addon-actions';
import * as Grid from './index';
import { Obstacle } from 'Maze';

export default {
    title: 'Grid',
    parameters: {
        component: Grid.View
    }
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


export const ActiveTool = () => (
    <Grid.View
        model={Grid.initial(20, 20)}
        dispatch={action('Dispatch')}
    />
);
