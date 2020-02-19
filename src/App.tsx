import React from 'react';
import { Dispatch } from 'Provider';
import * as Counter from 'Counter';
import * as Utils from 'Utils';


// M O D E L

export interface Model {
    firstCounter: Counter.Model;
    secondCounter: Counter.Model;
}

export const initial: Model = {
    firstCounter: Counter.initial,
    secondCounter: Counter.initial
};

// U P D A T E

export interface Msg extends Utils.Msg<[ Model ], Model> {}

const FirstCounterMsg = Utils.cons(class implements Msg {
    public constructor(private readonly msg: Counter.Msg) {}

    public update(model: Model): Model {
        return {
            ...model,
            firstCounter: this.msg.update(model.firstCounter)
        };
    }
});

const SecondCounterMsg = Utils.cons(class implements Msg {
    public constructor(private readonly msg: Counter.Msg) {}

    public update(model: Model): Model {
        return {
            ...model,
            secondCounter: this.msg.update(model.secondCounter)
        };
    }
});

// V I E W

export const View: React.FC<{
    model: Model;
    dispatch: Dispatch<Msg>;
}> = ({ model, dispatch }) => (
    <div>
        <h2>Left Counter</h2>

        <Counter.View
            model={model.firstCounter}
            dispatch={msg => dispatch(FirstCounterMsg(msg))}
        />

        <h2>Right Counter</h2>

        <Counter.View
            model={model.secondCounter}
            dispatch={msg => dispatch(SecondCounterMsg(msg))}
        />
    </div>
);
