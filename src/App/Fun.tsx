import React from 'react';
import styled from 'styled-components';
import { Cmd } from 'frctl';
import Dict from 'frctl/Dict';
import { Dispatch } from 'Provider';

import * as App from './index';
import * as Utils from 'Utils';

// M O D E L

export type Model = Readonly<{
    apps: Dict<number, App.Model>;
}>;

export const initial: Model = {
    apps: Dict.empty as Dict<number, App.Model>
};

// U P D A T E

export interface Msg extends Utils.Msg<[ Model ], [ Model, Cmd<Msg> ]> {}

const AppMsg = Utils.cons(class AppMsg$ implements Msg {
    public constructor(
        private readonly id: number,
        private readonly msg: App.Msg
    ) {}

    public update(model: Model): [ Model, Cmd<Msg> ] {
        const appModel = model.apps.get(this.id).getOrElse(App.initial);
        const [ nextAppModel, cmdOfApp ] = this.msg.update(appModel);

        return [
            {
                ...model,
                apps: model.apps.insert(this.id, nextAppModel)
            },
            cmdOfApp.map(msg => AppMsg(this.id, msg))
        ];
    }
});

// V I E W

const StyledRoot = styled.div`
    display: flex;
    flex-flow: row wrap;
    width: 100%;
    height: 100%;
`;

const StyledApp = styled.div`
    position: relative;
    flex: 1 1 50%;
    width: 50%;
    height: 50%;
    box-shadow: 0 0 0 1px #888;
`;

export class View extends React.PureComponent<{
    model: Model;
    dispatch: Dispatch<Msg>;
}> {
    private static IDS: Array<number> = [ 0, 1, 2, 3 ];

    private readonly appDispatch = Dict.fromList(
        View.IDS.map((id): [ number, Dispatch<App.Msg> ] => [
            id,
            msg => this.props.dispatch(AppMsg(id, msg))
        ])
    );

    public render() {
        return (
            <StyledRoot>
                {View.IDS.map(id => this.appDispatch.get(id).cata({
                    Nothing: () => null,

                    Just: dispatch => (
                        <StyledApp key={id}>
                            <App.View
                                model={this.props.model.apps.get(id).getOrElse(App.initial)}
                                dispatch={dispatch}
                            />
                        </StyledApp>
                    )
                }))}
            </StyledRoot>
        );
    }
}
