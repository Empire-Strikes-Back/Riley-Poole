import * as React from 'react';
import { HashRouter, BrowserRouter, Router, Route, NavLink, Link, Redirect, withRouter, Switch } from 'react-router-dom'
import { LocaleProvider, notification } from 'antd'
import { connect, Dispatch } from 'react-redux'

import { injectGlobal, ThemeProvider, THEME, withTheme } from 'src/modules/styled-components'

import { Layout, Menu, Breadcrumb, Icon, Input, Form } from 'antd';
const { SubMenu } = Menu;
const { Header, Content, Sider } = Layout;
const FormItem = Form.Item

import { Store } from 'src/store'
import { Sidebar } from './sidebar'
import * as config from 'src/config'

interface PropsState {
  store?: Store
}

interface PropsDispatch {
  dispatch?: Dispatch<any>
}

interface Props {

}

interface State {

}


// @(connect<PropsState, PropsDispatch, Props, Store>(
//   (state) => ({
//     store: state
//   }), (dispatch) => ({
//     dispatch: dispatch
//   })
// ) as any)
export class Config extends React.Component<PropsState & PropsDispatch & Props, State> {

  render() {
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 8 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 8 },
      },
    };
    return (
      <Layout style={{ height: '100%' }}>
        <Sidebar />
        <Content style={{ background: '#fff', height: '100%', padding: '24px' }}>

          <Form >
            {
              Object.keys(config).map((key) => {
                const value = config[key]
                return (
                  <FormItem
                    key={key}
                    {...formItemLayout}
                    label={key}
                  >
                    <Input disabled value={value} />
                  </FormItem>
                )
              })
            }
          </Form>
        </Content>
      </Layout>
    )
  }

}

