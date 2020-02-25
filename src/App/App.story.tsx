import React from 'react';
import { action } from '@storybook/addon-actions';
import * as Knobs from '@storybook/addon-knobs';

import * as Maze from '../Maze';
import * as Configurator from '../Configurator';
import * as Grid from '../Grid';
import * as App from './index';

export default {
    title: 'App',
    parameters: {
        component: App.View
    },
    decorators: [ Knobs.withKnobs ]
};

export const ConfiguratorScreen = () => {
    const model = {
        screen: App.ConfiguratorScreen(Configurator.initial)
    };

    return (
        <App.View model={model} dispatch={action('Dispatch')} />
    );
};

export const GridScreen = () => {
    const model = {
        screen: App.GridScreen(Grid.init(Maze.empty(20, 20)))
    };

    return (
        <App.View model={model} dispatch={action('Dispatch')} />
    );
};
