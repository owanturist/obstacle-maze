import React from 'react';
import Enzyme from 'enzyme';
import Maybe from 'frctl/Maybe';
import Either from 'frctl/Either';

import * as Maze from 'Maze';
import * as Configurator from './index';

it('Configurator.SetSize', () => {
    Configurator.SetSize(false, 10).update(Configurator.initial).cata({
        Updated: nextModel => expect(nextModel).toEqual({
            rows: 20,
            cols: 10
        }),

        _: () => fail('Should return Updated')
    });

    Configurator.SetSize(true, 10).update(Configurator.initial).cata({
        Updated: nextModel => expect(nextModel).toEqual({
            rows: 10,
            cols: 20
        }),

        _: () => fail('Should return Updated')
    });
});

it('Configurator.InitEmpty', () => {
    const initialModel = {
        ...Configurator.initial,
        rows: 30
    };

    Configurator.InitEmpty.update(initialModel).cata({
        Configured: maze => expect(maze).toEqual(Maze.empty(30, 20)),

        _: () => fail('Should return Configured')
    });
});

it('Configurator.UploadFile', () => {
    const initialModel = {
        ...Configurator.initial,
        rows: 30
    };

    Configurator.UploadFile(Maybe.Nothing).update(initialModel).cata({
        Updated: nextModel => expect(nextModel).toBe(initialModel),

        _: () => fail('Should return Updated')
    });

    Configurator.UploadFile(Maybe.Just(new File([], 'name.txt'))).update(initialModel).cata({
        Updated: nextModel => expect(nextModel).toBe(initialModel),

        _: () => fail('Should return Updated')
    });
});

it('Configurator.ReadMaze', () => {
    const initialModel = {
        ...Configurator.initial,
        rows: 30
    };

    Configurator.ReadMaze(Either.Left('Error message')).update(initialModel).cata({
        Updated: nextModel => expect(nextModel).toBe(initialModel),

        _: () => fail('Should return Updated')
    });

    const initialMaze = Maze.empty(0, 0);

    Configurator.ReadMaze(Either.Right(initialMaze)).update(initialModel).cata({
        Configured: maze => expect(maze).toBe(initialMaze),

        _: () => fail('Should return Configured')
    });
});

it('Configurator.InitEmpty triggers by button', () => {
    const dispatch = jest.fn<void, [ Configurator.Msg ]>();

    const wrapper = Enzyme.shallow(
        <Configurator.View
            model={Configurator.initial}
            dispatch={dispatch}
        />
    );

    wrapper.find('StyledStartButton').simulate('click');

    expect(dispatch).toBeCalledWith(Configurator.InitEmpty);
});
