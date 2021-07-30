import * as React from 'react';

import { HashRouter, BrowserRouter, Router, Route, NavLink, Link, Redirect, withRouter, Switch } from 'react-router-dom'
import styled, { injectGlobal, ThemeProvider, THEME, withTheme } from 'src/modules/styled-components'

export const NavLinkStyled = styled(NavLink).attrs({
  activeClassName: 'active'
}) `
  // cursor: pointer;
  // user-select: none;
  display: block;
  // flex-direction: column;
  // align-items: center;
  // justify-content: center;
  // flex: 1 1 auto;
  // margin: 0.5em 1em;
  // font-size: 1.2em;
  color: white;
  // background-color: #8E9295;
  // fontSize: 1em;
  width: 100%;
  // padding: 0 20px;
  // &:hover {
  //   background-color: #337AB8;
  //   color: #fff;
  // }
  &.active {
    // background-color: #1890ff;
    // color: #fff;
    color: #1890ff !important;
  }
`;
