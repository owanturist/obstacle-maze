// tslint:disable-next-line:no-import-side-effect
import 'rc-slider/assets/index.css';

import React from 'react';
import { Dispatch } from 'Provider';
import Slider from 'rc-slider';

import * as Grid from 'Grid';
import * as Utils from 'Utils';


const MINIMUM_SIDE = 10;
const MAXIMUM_SIDE = 100;

// M O D E L

export type Model = Readonly<{
    rows: number;
    cols: number;
}>;

export const initial: Model = {
    rows: 20,
    cols: 20
};

// U P D A T E

export interface Msg extends Utils.Msg<[ Model ], Model> {}

// V I E W

export const View: React.FC<{
    model: Model;
    dispatch: Dispatch<Msg>;
}> = ({ model }) => (
    <div>
        Rows: {model.rows}
        <Slider
            value={model.rows}
            step={1}
            min={MINIMUM_SIDE}
            max={MAXIMUM_SIDE}
        />
        <br />

        Cols: {model.cols}
        <Slider
            value={model.cols}
            step={1}
            min={MINIMUM_SIDE}
            max={MAXIMUM_SIDE}
        />

        <Grid.Preview rows={model.rows} cols={model.cols} />
    </div>
);
