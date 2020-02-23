import React from 'react';
import ReactDOM from 'react-dom';
import { Cmd, Sub } from 'frctl';
import Provider from 'Provider';
import * as App from 'App';
import * as serviceWorker from './serviceWorker';

ReactDOM.render(
    (
        <Provider
            init={[ App.initial, Cmd.none ]}
            update={(msg: App.Msg, model: App.Model) => [ msg.update(model), Cmd.none ]}
            subscription={() => Sub.none}
            view={App.View}
        />
    ),
    document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
