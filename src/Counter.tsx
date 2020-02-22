import React from 'react';
import { Dispatch } from 'Provider';
import * as Utils from 'Utils';


// M O D E L

export interface Model {
    count: number;
}

export const initial = (count: number): Model => ({
    count
});

// U P D A T E

export interface Msg extends Utils.Msg<[ Model ], Model> {}

const Decrement = Utils.inst(class implements Msg {
    public update(model: Model): Model {
        return {
            ...model,
            count: model.count - 1
        };
    }
});

const Increment = Utils.inst(class implements Msg {
    public update(model: Model): Model {
        return {
            ...model,
            count: model.count + 1
        };
    }
});

// V I E W

export const View: React.FC<{
    model: Model;
    dispatch: Dispatch<Msg>;
}> = ({ model, dispatch }) => (
    <div>
        <button
            type="button"
            tabIndex={0}
            onClick={() => dispatch(Decrement)}
        >-</button>

        {model.count.toString()}

        <button
            type="button"
            tabIndex={0}
            onClick={() => dispatch(Increment)}
        >+</button>
    </div>
);
