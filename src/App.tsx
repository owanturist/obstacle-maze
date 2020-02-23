import React from 'react';
import { Dispatch } from 'Provider';
import * as Grid from 'Grid';
import * as Utils from 'Utils';

// M O D E L

export interface Model {
    grid: Grid.Model;
}

export const initial: Model = {
    grid: Grid.initial(10, 10)
};

// U P D A T E

export interface Msg extends Utils.Msg<[ Model ], Model> {}

const GridMsg = Utils.cons(class GridMsg implements Msg {
    public constructor(private readonly msg: Grid.Msg) {}

    public update(model: Model): Model {
        return {
            ...model,
            grid: this.msg.update(model.grid)
        };
    }
});

// V I E W

export class View extends React.PureComponent<{
    model: Model;
    dispatch: Dispatch<Msg>;
}> {
    private readonly gridDispatch = (msg: Grid.Msg) => {
        this.props.dispatch(GridMsg(msg));
    }

    public render() {
        return (
            <Grid.View
                model={this.props.model.grid}
                dispatch={this.gridDispatch}
            />
        );
    }
}
