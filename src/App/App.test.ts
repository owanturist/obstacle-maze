import { Cmd } from 'frctl';

import * as Configurator from '../Configurator';
import * as Grid from '../Grid';
import * as Maze from '../Maze';
import * as App from './index';

const FakeMsg = {
    update: (): any => {
        throw new Error('unhandled');
    }
};

const fakeMsgUpdate = jest.spyOn(FakeMsg, 'update');

const FakeCmd = {
    map: (): any => {
        throw new Error('unhandled');
    }
};

const fakeCmdMap = jest.spyOn(FakeCmd, 'map');

beforeEach(() => {
    fakeMsgUpdate.mockReset();
    fakeCmdMap.mockReset();
});

describe('App.ConfiguratorMsg', () => {
    it('Ignore non ConfiguratorScreen', () => {
        const initialModel = {
            screen: App.GridScreen('Fake Grid')
        };

        const [ nextModel, cmd ] = App.ConfiguratorMsg(FakeMsg).update(initialModel);

        expect(nextModel).toEqual({
            screen: App.GridScreen('Fake Grid')
        });
        expect(nextModel).toBe(initialModel);
        expect(cmd).toBe(Cmd.none);
        expect(fakeMsgUpdate).not.toBeCalled();
    });

    it('Configurator.Updated', () => {
        const initialModel = {
            screen: App.ConfiguratorScreen('Fake Configurator')
        };

        fakeMsgUpdate.mockReturnValueOnce(Configurator.Updated('Next fake Configurator', FakeCmd));
        fakeCmdMap.mockReturnValueOnce('Fake Cmd');

        expect(App.ConfiguratorMsg(FakeMsg).update(initialModel)).toEqual([
            {
                screen: App.ConfiguratorScreen('Next fake Configurator')
            },
            'Fake Cmd'
        ]);

        expect(fakeMsgUpdate).toBeCalledTimes(1);
        expect(fakeMsgUpdate).toBeCalledWith('Fake Configurator');

        expect(fakeCmdMap).toBeCalledTimes(1);
        expect(fakeCmdMap).toBeCalledWith(App.ConfiguratorMsg);
    });

    it('Configurator.Configured', () => {
        const initialModel = {
            screen: App.ConfiguratorScreen('Fake Configurator')
        };
        const maze = Maze.empty(20, 10);

        fakeMsgUpdate.mockReturnValueOnce(Configurator.Configured(maze));

        const [ nextModel, cmd ] = App.ConfiguratorMsg(FakeMsg).update(initialModel);
        expect(nextModel).toEqual({
            screen: App.GridScreen(Grid.init(maze))
        });
        expect(cmd).toBe(Cmd.none);

        expect(fakeMsgUpdate).toBeCalledTimes(1);
        expect(fakeMsgUpdate).toBeCalledWith('Fake Configurator');

        expect(fakeCmdMap).not.toBeCalled();
    });
});

describe('App.GridMsg', () => {
    it('Ignore non GridScreen', () => {
        const initialModel = {
            screen: App.ConfiguratorScreen('Fake Configurator')
        };

        const [ nextModel, cmd ] = App.GridMsg(FakeMsg).update(initialModel);

        expect(nextModel).toEqual({
            screen: App.ConfiguratorScreen('Fake Configurator')
        });
        expect(nextModel).toBe(initialModel);
        expect(cmd).toBe(Cmd.none);
        expect(fakeMsgUpdate).not.toBeCalled();
    });

    it('Update GridScreen', () => {
        const initialModel = {
            screen: App.GridScreen('Fake Grid')
        };

        fakeMsgUpdate.mockReturnValueOnce([ 'Next fake Grid', FakeCmd ]);
        fakeCmdMap.mockReturnValueOnce('Fake Cmd');

        expect(App.GridMsg(FakeMsg).update(initialModel)).toEqual([
            {
                screen: App.GridScreen('Next fake Grid')
            },
            'Fake Cmd'
        ]);

        expect(fakeMsgUpdate).toBeCalledTimes(1);
        expect(fakeMsgUpdate).toBeCalledWith('Fake Grid');

        expect(fakeCmdMap).toBeCalledTimes(1);
        expect(fakeCmdMap).toBeCalledWith(App.GridMsg);
    });
});
