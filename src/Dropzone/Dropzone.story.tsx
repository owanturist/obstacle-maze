import React from 'react';
import { action } from '@storybook/addon-actions';
import * as Knobs from '@storybook/addon-knobs';

import Dropzone from './index';

export default {
    title: 'Dropzone',
    parameters: {
        component: Dropzone
    },
    decorators: [ Knobs.withKnobs ]
};

export const Default = () => {
    const content = Knobs.text('Content', 'Choose maze filr or drag and drop');

    return (
        <Dropzone onLoad={action('On Load')}>
            {content}
        </Dropzone>
    );
};
