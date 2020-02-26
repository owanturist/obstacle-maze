/**
 * The module made to show how that's easy to reuse components implemented with frctl.
 */

import React from 'react';
import styled from 'styled-components';
import { Cmd, Sub } from 'frctl';
import Dict from 'frctl/Dict';
import { onKeyPress } from 'frctl/Browser/Events';
import Maybe, { Nothing, Just } from 'frctl/Maybe';
import Decode from 'frctl/Json/Decode';
import { Dispatch } from 'Provider';

import * as App from './index';
import * as Toast from 'Toast';
import * as Utils from 'Utils';

// M O D E L

enum AppID { Main, First, Second, Third }

export type Model = Readonly<{
    activeApp: AppID;
    notFunFor: Maybe<number>;
    apps: Dict<AppID, App.Model>;
}>;

export const initial: Model = {
    activeApp: AppID.Main,
    notFunFor: Just(4),
    apps: Dict.empty as Dict<AppID, App.Model>
};

// U P D A T E

export interface Msg extends Utils.Msg<[ Model ], [ Model, Cmd<Msg> ]> {}

const SetActiveApp = Utils.cons(class SetActiveApp implements Msg {
    public constructor(private readonly id: AppID) {}

    public update(model: Model): [ Model, Cmd<Msg> ] {
        return [
            {
                ...model,
                activeApp: this.id
            },
            Cmd.none
        ];
    }
});

const FunKeyPress = Utils.inst(class FunKeyPress implements Msg {
    public update(model: Model): [ Model, Cmd<Msg> ] {
        return model.notFunFor.cata({
            Nothing: () => [ model, Cmd.none ],

            Just: countdown => countdown === 1 ? [
                {
                    ...model,
                    notFunFor: Nothing
                },
                Toast.success('Welcome to the Fun mode. Enjoy!').show()
            ] : [
                {
                    ...model,
                    notFunFor: Just(countdown - 1)
                },
                Toast.info(`Push it ${countdown - 1} more times...`).show()
            ]
        });
    }
});

const AppMsg = Utils.cons(class AppMsg$ implements Msg {
    public constructor(
        private readonly id: AppID,
        private readonly msg: App.Msg
    ) {}

    public update(model: Model): [ Model, Cmd<Msg> ] {
        const appModel = model.apps.get(this.id).getOrElse(App.initial);
        const [ nextAppModel, cmdOfApp ] = this.msg.update(appModel);

        return [
            {
                ...model,
                activeApp: this.id,
                apps: model.apps.insert(this.id, nextAppModel)
            },
            cmdOfApp.map(msg => AppMsg(this.id, msg))
        ];
    }
});

// S U B S C R I P T I O N S

export const subscriptions = (model: Model): Sub<Msg> => Sub.batch([
    model.notFunFor.isNothing() ? Sub.none : onKeyPress(
        Decode.field('key').string.chain(key => {
            if (key === '4') {
                return Decode.succeed(FunKeyPress);
            }

            return Decode.fail('Not funny key');
        })
    ),

    App.subscriptions(
        model.apps.get(model.activeApp).getOrElse(App.initial)
    ).map(msg => AppMsg(model.activeApp, msg))
]);

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
    public render() {
        const { model, dispatch } = this.props;

        if (model.notFunFor.isJust()) {
            return (
                <App.View
                    model={model.apps.get(AppID.Main).getOrElse(App.initial)}
                    dispatch={msg => dispatch(AppMsg(AppID.Main, msg))}
                />
            );
        }

        return (
            <StyledRoot>
                {[ AppID.Main, AppID.First, AppID.Second, AppID.Third ].map((id: AppID) => (
                    <StyledApp
                        key={id}
                        onMouseEnter={() => dispatch(SetActiveApp(id))}
                    >
                        <App.View
                            model={model.apps.get(id).getOrElse(App.initial)}
                            dispatch={msg => dispatch(AppMsg(id, msg))}
                        />
                    </StyledApp>
                ))}
            </StyledRoot>
        );
    }
}
