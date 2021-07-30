import * as React from 'react';
import { inject, observer } from 'mobx-react'
import { Cams } from '@streaming/types'
import * as SidebarComp from './sidebar'
import { Store, Stores } from 'src/store'
import { HashRouter, BrowserRouter, Router, Route, NavLink, Link, Redirect, withRouter, Switch } from 'react-router-dom'


export const Sidebar = withRouter(
  inject<Stores, SidebarComp.Props, SidebarComp.Props, {}>(({ store }, np, ctx) => {
    const props: SidebarComp.Props = {
      collapsed: store.siderbarCollapsed,
      onCollapse: (collapsed) => {
        store.sidebarToggle(collapsed)
      },
    }
    return props
  })(observer(SidebarComp.Sidebar)))

// import { ObjectOmit } from "typelevel-ts"; // Thanks @gcanti, we <3 you all!

// declare module "mobx-react" {
//   export function inject<D>(
//     mapStoreToProps: (store: any) => D
//   ): <A extends D>(
//       component: React.ComponentType<A>
//     ) => React.SFC<ObjectOmit<A, keyof D> & Partial<D>>;
// }

// const MyComp = ({ label, count }: { label: string; count: number }) =>
//   <p>
//     {label} x {count} times!
//     </p>;
// const MyCompConnected = inject((store: any) => ({

//   count: 1

//  }))(MyComp);

// export const el1 = <MyCompConnected label="hello" />;
// export const el2 = <MyCompConnected labels="hello" />; // error! :D
// export const el3 = <MyCompConnected label="Hello world!" count={2} />;
