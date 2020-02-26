This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).


## Available Scripts

In the project directory, you can run:

### `npm start`

Builds and runs optimised app locally at [http://localhost:3000](http://localhost:3000).

### `npm run dev`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

### `npm run build`

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />

### `npm test`

Launches the test runner in the interactive watch mode.<br />


## Features

* Hold and draw for walls, gravel and clear
* Undo / Redo history traveling
* Save / Load from file
* Custom size of a maze
* Solver is looking for the most "straight" shortest path (with less turns)
* Press "4" key 4 times
* Uniq handmade icons design


## Generate random maze

Go to [maze generator](https://www.dcode.fr/maze-generator) and follow steps:
1. Set width
1. Set height
1. Choose "USE THIS CHARACTER FOR WALLS" and set `#`
1. Choose "USE THIS CHARACTER FOR PATHS" and set `.`
1. Choose "SINGLE CHARARACTER (MORE RECTANGULAR)"
1. Generate
1. Copy the generated maze and save it into a `.txt` file

__Note__: Check out the [`samples`](./samples) folder to get generated mazes.


## Why classes?

Here is a piece of code which describes simple counter's `Action` and
way of handling them like `update`/`reducer`. Below the code you might find a lists of
pros and cons by my opinion. I didn't use `readonly` for keep the example more clean.

```ts
/**
 * Common State.
 */
export interface State {
    count: number;
}

/* REDUX WAY */

/**
 * Action definition.
 *
 * Everyone outside knows about signature of your Action
 * and might use it and violates encapsulation.
 */
export type Action
    = { type: Decrement; amount: number }
    | { type: Increment; amount: number }
    | { type: Reset }
    ;

/**
 * Action.type definition.
 *
 * Used in Action definition and Action.type shortcut.
 * Not required.
 */
type Decrement = '@Counter/Decrement';

/**
 * Action.type shortcut.
 *
 * Used in Action shortcut and reducer.
 * Not required.
 */
const Decrement: Decrement = '@Counter/Decrement';

/**
 * Action shortcut.
 *
 * Used like constructor of Action wherever and whenever you need.
 * Not required.
 */
const decrement = (amount: number): Action => ({ type: Decrement, amount });

type Increment = '@Counter/Increment';
const Increment: Increment = '@Counter/Increment';
const increment = (amount: number): Action => ({ type: Increment, amount });

type Reset = '@Counter/Reset';
const Reset: Reset = '@Counter/Reset';
const reset: Action = { type: Reset };

/**
 * Handler of Action (reducer).
 *
 * Handles a whole bunch of Action.
 * This function always uses all cases of Action, so you should keep in mind
 * which of them are really used and which are legacy and should be removed.
 * Tree shaking keeps the code in place.
 */
export const update = (state: State, action: Action): State => {
    switch (action.type) {
        case Decrement: {
            return { ...state, count: state.count + action.amount };
        }

        case Increment: {
            return { ...state, count: state.count + action.amount };
        }

        case Reset: {
            return { ...state, count: 0 };
        }

        default: {
            return state;
        }
    }
};

/* CLASS WAY */

/**
 * Action interface.
 *
 * Nobody outisde knows about signature of your Action. Even inside the module.
 */
export interface Action {
    /**
     * Handler of Action.
     *
     * Handles just the Action and nothing else.
     */
    update(state: State): State;
}

class Decrement implements Action {
    constructor(private amount: number) {}

    public update(state: State): State {
        return { ...state, count: state.count + this.amount };
    }
}

class Decrement implements Action {
    constructor(private amount: number) {}

    public update(state: State): State {
        return { ...state, count: state.count - this.amount };
    }
}

class Reset implements Action {
    public update(state: State): State {
        return { ...state, count: 0 };
    }
}
```

### Advantages

1. Encapsulation. No one parent module know anything about `Action`, it can just call `update`.
It prevents modifying and reading of a `Action` from parent module.
1. No more huge `reducer` function - whole logic is described inside the source.
It's very natural to define a `Action` and describe handling right there.
1. Easy track of unused `Action`. Otherwise you use described `type Action` at least in one place: `reducer`.
Even if you use only one of let's say ten `Action` in a module the `reducer` will always use all of them.
1. More easy refactoring. Everything (definition, handling, helpers as static methods) in a single place 
and if you've decided to get rid of one of the `Action` you just delete it.
Otherwise you should delete it at least from two places: type definition and `reducer`.

### Disadvantages

1. You should implement `update` method in every `Action`, so it looks like kind of boilerplate.
Otherwise you have single place (`reducer`) which describes the signature.
1. Creating of `Action` with `new` looks unusual and not natural.
1. Everyone does like Redux, nobody likes classes.


### Get rid of the `new`

To made the approach more "natural" the class example could be rewriten like that:

```ts
import * as Utils from 'Utils'; // see the code in src/Utils.ts

export interface State {
    count: number;
}

export interface Action {
    update(state: State): State;
}

const Increment = Utils.cons(class implements Action {
    public constructor(private amount: number) {}

    public update(state: State): State {
        return { ...state, count: state.count + this.amount };
    }
});

const Decrement = Utils.cons(class implements Action {
    public constructor(private amount: number) {}

    public update(state: State): State {
        return { ...state, count: state.count - this.amount };
    }
});

const Reset = Utils.inst(class implements Action {
    public update(state: State): State {
        return { ...state, count: 0 };
    }
});
```

With `Utils.cons` (stands for constructor, at least one argument exists) 
and `Utils.inst` (stands for instance, when no arguments exist)
you could use the action in a way `dispatch(Increment(1))` or `(dispatch(Reset))`
instead of `dispatch(new Increment(1))` and `(dispatch(new Reset()))` accordingly.
