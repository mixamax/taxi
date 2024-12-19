import 'core-js/features/object/assign'
import 'core-js/features/object/values'
import React from 'react'
import ReactDOM from 'react-dom'
import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'
import { CaptureConsole } from '@sentry/integrations'
import { Router } from 'react-router-dom'
import { Provider } from 'react-redux'
import history from './tools/history'
import store from './state'
import App from './App'
import { MuiPickersUtilsProvider } from '@material-ui/pickers'
import MomentUtils from '@date-io/moment'
import { QueryClient, QueryClientProvider } from 'react-query'

//   из админки
// import dayjs from 'dayjs'
// import utc from 'dayjs/plugin/utc'

// dayjs.extend(utc)
//  /из админки


import * as serviceWorker from './serviceWorker'

if(process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: 'https://8181d1719b4f41e0b4f6c2c8c449e0f7@o1155911.ingest.sentry.io/6236737',
    integrations: [new BrowserTracing(), new CaptureConsole({
      levels: ['error'],
    })],
    tracesSampleRate: 1.0,
  })
}

const queryClient = new QueryClient()

ReactDOM.render(
  <React.StrictMode>
    <Router history={history}>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
        <MuiPickersUtilsProvider utils={MomentUtils}>
          <Sentry.ErrorBoundary>
            <App/>
          </Sentry.ErrorBoundary>
        </MuiPickersUtilsProvider>
        </QueryClientProvider>
      </Provider>
    </Router>
  </React.StrictMode>,
  document.getElementById('root'),
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.register()
