import React from 'react';
import ReactDOM from 'react-dom';
import { Cmd, Sub } from 'frctl';
import Provider from 'Provider';
import * as App from 'App';
import * as serviceWorker from './serviceWorker';

// eslint-disable-next-line import/no-webpack-loader-syntax
import createSearchPathWorker from 'workerize-loader!./searchPath';
import * as SearchPathWorker from './searchPath';

ReactDOM.render(
    (
        <Provider
            init={[ App.initial, Cmd.none ]}
            update={(msg: App.Msg, model: App.Model) => [ msg.update(model), Cmd.none ]}
            view={App.View}
            subscription={() => Sub.none}
        />
    ),
    document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();


const searchPathInstance = createSearchPathWorker<typeof SearchPathWorker>();

searchPathInstance.addEventListener('message', event => {
    // tslint:disable-next-line:no-console
    console.log('msg', event.data);
});

searchPathInstance.addEventListener('error', event => {
    // tslint:disable-next-line:no-console
    console.error('err', event.error);
});
