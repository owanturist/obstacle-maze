import { Cmd } from 'frctl';

import * as Configurator from '../Configurator';
import * as Grid from '../Grid';
import * as Maze from '../Maze';
import * as App from './index';

const FakeMsg = {
    update: jest.fn()
};

const FakeCmd = {
    map: jest.fn()
};

beforeEach(() => {
    FakeMsg.update.mockReset();
    FakeCmd.map.mockReset();
});

describe('App.ConfiguratorMsg', () => {
    it('Ignore non ConfiguratorScreen', () => {
        const initialModel = {
            screen: App.GridScreen('Fake Grid' as any)
        };

        const [ nextModel, cmd ] = App.ConfiguratorMsg(FakeMsg).update(initialModel);

        expect(nextModel).toEqual({
            screen: App.GridScreen('Fake Grid' as any)
        });
        expect(nextModel).toBe(initialModel);
        expect(cmd).toBe(Cmd.none);
        expect(FakeMsg.update).not.toBeCalled();
    });

    it('Configurator.Updated', () => {
        const initialModel = {
            screen: App.ConfiguratorScreen('Fake Configurator' as any)
        };

        FakeMsg.update.mockReturnValueOnce(
            Configurator.Updated('Next fake Configurator' as any, FakeCmd as any)
        );
        FakeCmd.map.mockReturnValueOnce('Fake Cmd');

        expect(App.ConfiguratorMsg(FakeMsg).update(initialModel)).toEqual([
            {
                screen: App.ConfiguratorScreen('Next fake Configurator' as any)
            },
            'Fake Cmd'
        ]);

        expect(FakeMsg.update).toBeCalledTimes(1);
        expect(FakeMsg.update).toBeCalledWith('Fake Configurator');

        expect(FakeCmd.map).toBeCalledTimes(1);
        expect(FakeCmd.map).toBeCalledWith(App.ConfiguratorMsg);
    });

    it('Configurator.Configured', () => {
        const initialModel = {
            screen: App.ConfiguratorScreen('Fake Configurator' as any)
        };
        const maze = Maze.empty(20, 10);

        FakeMsg.update.mockReturnValueOnce(Configurator.Configured(maze));

        const [ nextModel, cmd ] = App.ConfiguratorMsg(FakeMsg).update(initialModel);
        expect(nextModel).toEqual({
            screen: App.GridScreen(Grid.init(maze))
        });
        expect(cmd).toBe(Cmd.none);

        expect(FakeMsg.update).toBeCalledTimes(1);
        expect(FakeMsg.update).toBeCalledWith('Fake Configurator');

        expect(FakeCmd.map).not.toBeCalled();
    });
});

describe('App.GridMsg', () => {
    it('Ignore non GridScreen', () => {
        const initialModel = {
            screen: App.ConfiguratorScreen('Fake Configurator' as any)
        };

        const [ nextModel, cmd ] = App.GridMsg(FakeMsg).update(initialModel);

        expect(nextModel).toEqual({
            screen: App.ConfiguratorScreen('Fake Configurator' as any)
        });
        expect(nextModel).toBe(initialModel);
        expect(cmd).toBe(Cmd.none);
        expect(FakeMsg.update).not.toBeCalled();
    });

    it('Update GridScreen', () => {
        const initialModel = {
            screen: App.GridScreen('Fake Grid' as any)
        };

        FakeMsg.update.mockReturnValueOnce([ 'Next fake Grid', FakeCmd ]);
        FakeCmd.map.mockReturnValueOnce('Fake Cmd');

        expect(App.GridMsg(FakeMsg).update(initialModel)).toEqual([
            {
                screen: App.GridScreen('Next fake Grid' as any)
            },
            'Fake Cmd'
        ]);

        expect(FakeMsg.update).toBeCalledTimes(1);
        expect(FakeMsg.update).toBeCalledWith('Fake Grid');

        expect(FakeCmd.map).toBeCalledTimes(1);
        expect(FakeCmd.map).toBeCalledWith(App.GridMsg);
    });
});
