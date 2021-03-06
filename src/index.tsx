// tslint:disable:no-import-side-effect
import './index.css';

import React from 'react';
import ReactDOM from 'react-dom';
import { ToastContainer } from 'react-toastify';
import { Cmd } from 'frctl';
import Provider from 'Provider';
// import * as App from 'App';
import * as App from 'App/Fun'; // The Fun component show how powerfull frctl is
import * as serviceWorker from './serviceWorker';

ReactDOM.render(
    (<>
        <ToastContainer />

        <Provider
            init={[ App.initial, Cmd.none ]}
            update={(msg: App.Msg, model: App.Model) => msg.update(model)}
            subscription={App.subscriptions}
            view={App.View}
        />
    </>
    ),
    document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
