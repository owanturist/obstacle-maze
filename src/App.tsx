import React from 'react';
import styled from 'styled-components';
import { Dispatch } from 'Provider';
import { Cmd } from 'frctl';
import { Cata } from 'frctl/Basics';

import * as Configurator from 'Configurator';
import * as Grid from 'Grid';
import * as Utils from 'Utils';

// M O D E L

type ScreenPattern<R> = Cata<{
    ConfiguratorScreen(configurator: Configurator.Model): R;
    GridScreen(grid: Grid.Model): R;
}>;

interface Screen {
    cata<R>(pattern: ScreenPattern<R>): R;
}

const ConfiguratorScreen = Utils.cons(class ConfiguratorScreen implements Screen {
    public constructor(private readonly configurator: Configurator.Model) {}

    public cata<R>(pattern: ScreenPattern<R>): R {
        return pattern.ConfiguratorScreen ? pattern.ConfiguratorScreen(this.configurator) : (pattern._ as () => R)();
    }
});

const GridScreen = Utils.cons(class GridScreen implements Screen {
    public constructor(private readonly grid: Grid.Model) {}

    public cata<R>(pattern: ScreenPattern<R>): R {
        return pattern.GridScreen ? pattern.GridScreen(this.grid) : (pattern._ as () => R)();
    }
});

export type Model = {
    screen: Screen;
};

export const initial: Model = {
    screen: ConfiguratorScreen(Configurator.initial)
};

// U P D A T E

export interface Msg extends Utils.Msg<[ Model ], [ Model, Cmd<Msg> ]> {}

const ConfiguratorMsg = Utils.cons(class ConfiguratorMsg$ implements Msg {
    public constructor(private readonly msg: Configurator.Msg) {}

    public update(model: Model): [ Model, Cmd<Msg> ] {
        return model.screen.cata({
            ConfiguratorScreen: (configurator: Configurator.Model) => this.msg.update(configurator).cata<[ Model, Cmd<Msg> ]>({
                Updated: (nextConfigurator, cmdOfConfigurator) => [
                    {
                        screen: ConfiguratorScreen(nextConfigurator)
                    },
                    cmdOfConfigurator.map(ConfiguratorMsg)
                ],

                Configured: maze => [
                    {
                        screen: GridScreen(Grid.init(maze))
                    },
                    Cmd.none
                ]
            }),

            _: () => [ model, Cmd.none ]
        });
    }
});

const GridMsg = Utils.cons(class GridMsg$ implements Msg {
    public constructor(private readonly msg: Grid.Msg) {}

    public update(model: Model): [ Model, Cmd<Msg> ] {
        return model.screen.cata<[ Model, Cmd<Msg> ]>({
            GridScreen: (grid: Grid.Model) => {
                const [ nextGrid, cmdOfGrid ] = this.msg.update(grid);

                return [
                    {
                        screen: GridScreen(nextGrid)
                    },
                    cmdOfGrid.map(GridMsg)
                ];
            },

            _: () => [ model, Cmd.none ]
        });
    }
});

// V I E W

const StyledGridScreenRoot = styled.div`
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 10px;
    width: 100%;
    height: 100%;
    background: #f8f8f8;
`;

const StyledGridScreen = styled.div`
    box-sizing: border-box;
    padding: 20px;
    width: 480px;
    max-width: 100%;
    max-height: 100%;
    background: #fff;
    border-radius: 3px;
    box-shadow: 0 3px 5px rgba(0, 0, 0, 0.1);
    overflow-y: auto;
`;

export class View extends React.PureComponent<{
    model: Model;
    dispatch: Dispatch<Msg>;
}> {
    private readonly configuratorDispatch = (msg: Configurator.Msg) => {
        this.props.dispatch(ConfiguratorMsg(msg));
    }

    private readonly gridDispatch = (msg: Grid.Msg) => {
        this.props.dispatch(GridMsg(msg));
    }

    public render() {
        return this.props.model.screen.cata({
            ConfiguratorScreen: configurator => (
                <StyledGridScreenRoot>
                    <StyledGridScreen>
                        <Configurator.View
                            model={configurator}
                            dispatch={this.configuratorDispatch}
                        />
                    </StyledGridScreen>
                </StyledGridScreenRoot>
            ),

            GridScreen: grid => (
                <Grid.View
                    model={grid}
                    dispatch={this.gridDispatch}
                />
            )
        });
    }
}
