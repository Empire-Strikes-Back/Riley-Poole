import * as React from 'react';
import { HashRouter, BrowserRouter, Router, Route, NavLink, Link, Redirect, withRouter, Switch } from 'react-router-dom'
import { createHashHistory, History, Location } from 'history'
import { LocaleProvider, notification } from 'antd'
import { injectGlobal, ThemeProvider, THEME, withTheme } from 'src/modules/styled-components'
// import { Provider } from 'react-redux'
import { Provider } from 'mobx-react'


import { Layout, Menu, Breadcrumb, Icon } from 'antd';
const { SubMenu } = Menu;
const { Header, Content, Sider } = Layout;

// import { TableView, ChartView , CompanyView, BuildingView} from 'src/views'
// import { AppFooter,AppHeader,AppNav,AppContent } from 'src/parts/layout'
// import { Box } from 'src/modules/grid'
// import { Sidebar } from 'src/parts/sidebar'
// import { Wizard } from 'src/parts/wizard'


import { asyncComponent } from 'src/modules/async-component'
import { AppHeader } from './parts/layout'


import { history } from './history'
import { store } from './store'


declare var System: any
declare var NODE_ENV


const StreamsView = asyncComponent(() =>
  System.import('src/parts/streams').then(module => module.Streams)
)

const ConfigView = asyncComponent(() =>
  System.import('src/parts/config').then(module => module.Config)
)
// const TableView = asyncComponent(() =>
//   System.import('src/parts/table').then(module => module.Table)
// )



export class App extends React.Component<any, any>{

  // componentDidMount() {
  //   store.dispatch(hlsStore.socketOpen())
  //   store.dispatch(appStore.fetchDatasets())
  // }
  // componentWillUnmount() {
  //   store.dispatch(hlsStore.socketClose())
  // }

  render() {
    return (
      <Provider store={store}>
        <Router history={history}>
          <Layout style={{ height: '100vh'}}>
            <AppHeader />
            {/* <Breadcrumb style={{ margin: '16px 0' }}>
                  <Breadcrumb.Item>not</Breadcrumb.Item>
                  <Breadcrumb.Item>yet</Breadcrumb.Item>
                  <Breadcrumb.Item>implemented</Breadcrumb.Item>
                </Breadcrumb> */}
            <Content style={{ background: '#fff', marginTop: 64, overflow: 'auto', flex: '1 1 0' }}>
              <Switch>
                <Route exact path={`/`} render={() => <Redirect to={'/streams'} />} />
                <Route path={`/streams`} component={StreamsView} />
                {/* <Route path={`/table`} component={TableView} /> */}
                <Route path={`/config`} component={ConfigView} />
              </Switch>
            </Content>
          </Layout>
        </Router>
      </Provider >
    )
  }
}
{/* <Sidebar /> */ }

injectGlobal`
      html {
          /* height: 100%; */
          box - sizing: border-box;
        // font-size: 10px !important;
        // line-height: 0.8em;
      }

      *, *:before, *:after {
          box - sizing: inherit;
      }

      body {
          margin: 0;
        padding: 0;
        /* height: 100%; */
      }
      body > div:first-child {
          display: flex;
        /* height: 100%; */
      }

`
