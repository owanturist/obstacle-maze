import React from 'react';
import { action } from '@storybook/addon-actions';

import Dropzone from './index';

export default {
    title: 'Dropzone',
    parameters: {
        component: Dropzone
    }
};

export const Default = () => (
    <Dropzone
        onLoad={action('On Load')}
    />
);
