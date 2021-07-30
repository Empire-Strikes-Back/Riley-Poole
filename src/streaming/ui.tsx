import { AppContainer } from "react-hot-loader";
import * as React from 'react';
import * as ReactDOM from 'react-dom'
import { App } from './app'

declare var _VERSION_: string
declare var NODE_ENV: string

// import * as injectTapEventPlugin from 'react-tap-event-plugin';
// Needed for onTouchTap
// http://stackoverflow.com/a/34015469/988941
// injectTapEventPlugin();


function render(Component) {
  ReactDOM.render(
    <AppContainer>
      <Component />
    </AppContainer>
    ,
    rootEl
  )
}

const rootEl = document.getElementById("root");

render(App)

if (module.hot) {
  module.hot.accept("./app.tsx", () => {
    const NextApp = require<{ App: typeof App }>("./app.tsx").App;
    render(NextApp)
  });
}


