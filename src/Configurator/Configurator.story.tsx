import React from 'react';
import { action } from '@storybook/addon-actions';
import * as Knobs from '@storybook/addon-knobs';

import * as Configurator from './index';

export default {
    title: 'Configurator',
    parameters: {
        component: Configurator.View
    },
    decorators: [ Knobs.withKnobs ]
};

export const Initial = () => (
    <Configurator.View
        model={Configurator.initial}
        dispatch={action('Dispatch')}
    />
);

export const Custom = () => {
    const model = {
        ...Configurator.initial,
        rows: Knobs.number('Rows', 30, { range: true, min: 0, max: 100, step: 1 }) || 0,
        cols: Knobs.number('Cols', 40, { range: true, min: 0, max: 100, step: 1 }) || 0
    };

    return (
        <Configurator.View
            model={model}
            dispatch={action('Dispatch')}
        />
    );
};
