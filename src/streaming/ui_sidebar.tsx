import * as React from 'react';
import { HashRouter, BrowserRouter, Router, Route, NavLink, Link, Redirect, withRouter, Switch } from 'react-router-dom'
import { LocaleProvider, notification } from 'antd'
import { connect, Dispatch } from 'react-redux'

import { injectGlobal, ThemeProvider, THEME, withTheme } from 'src/modules/styled-components'

import { Layout, Menu, Breadcrumb, Icon } from 'antd';
const { SubMenu } = Menu;
const { Header, Content, Sider } = Layout;

import { Store } from 'src/store'
import { NavLinkStyled } from 'src/comps'

export interface Props {
  onCollapse?(collapsed): any
  collapsed?: boolean
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
export class Sidebar extends React.Component<Props, State> {

  onCollapse = (collapsed) => {
    this.props.onCollapse(collapsed)
  }

  render() {
    const { collapsed } = this.props
    return (

      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={this.onCollapse}
        style={{ overflow: 'hidden',/*  position: 'fixed',  */left: 0 }}>
      </Sider>
    )
  }

}

    //   <Menu theme="dark" mode="inline" defaultSelectedKeys={['4']}>
    //   <Menu.Item key="1">
    //     <Icon type="user" />
    //     <span className="nav-text">nav 1</span>
    //   </Menu.Item>
    //   <Menu.Item key="2">
    //     <Icon type="video-camera" />
    //     <span className="nav-text">nav 2</span>
    //   </Menu.Item>
    //   <Menu.Item key="3">
    //     <Icon type="upload" />
    //     <span className="nav-text">nav 3</span>
    //   </Menu.Item>
    //   <Menu.Item key="4">
    //     <Icon type="bar-chart" />
    //     <span className="nav-text">nav 4</span>
    //   </Menu.Item>
    //   <Menu.Item key="5">
    //     <Icon type="cloud-o" />
    //     <span className="nav-text">nav 5</span>
    //   </Menu.Item>
    //   <Menu.Item key="6">
    //     <Icon type="appstore-o" />
    //     <span className="nav-text">nav 6</span>
    //   </Menu.Item>
    //   <Menu.Item key="7">
    //     <Icon type="team" />
    //     <span className="nav-text">nav 7</span>
    //   </Menu.Item>
    //   <Menu.Item key="8">
    //     <Icon type="shop" />
    //     <span className="nav-text">nav 8</span>
    //   </Menu.Item>
    // </Menu>


