import warning from "warning";
import invariant from "invariant";
import React from "react";
import PropTypes from "prop-types";
import matchPath from "./matchPath";

const isEmptyChildren = children => React.Children.count(children) === 0;

/**
 * The public API for matching a single path and rendering.
 */
class Route extends React.Component {
  static propTypes = {
    computedMatch: PropTypes.object, // private, from <Switch>
    path: PropTypes.string,
    // 是否精确匹配, true: path === location.pathname => true
    // case: true:  /one /one/two ===> false
    exact: PropTypes.bool, 
    // 是否匹配 '/'
    //  /one/ /one ===> false
    //  /one/ /one/ ===> true
    strict: PropTypes.bool,
    sensitive: PropTypes.bool, // 匹配字母大小写
    component: PropTypes.func,
    render: PropTypes.func,
    children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
    location: PropTypes.object
  };

  // 获取 Router 的 childContext
  static contextTypes = {
    router: PropTypes.shape({
      history: PropTypes.object.isRequired,
      route: PropTypes.object.isRequired,
      staticContext: PropTypes.object
    })
  };

  static childContextTypes = {
    router: PropTypes.object.isRequired
  };

  // react-context
  getChildContext() {
    return {
      router: {
        ...this.context.router,
        route: {
          location: this.props.location || this.context.router.route.location,
          match: this.state.match
        }
      }
    };
  }

  state = {
    // this.context.router: Router 中设置的 childContext
    match: this.computeMatch(this.props, this.context.router)
  };

  // 计算匹配路由
  computeMatch(
    { computedMatch, location, path, strict, exact, sensitive },
    router
  ) {
    // 用了 Switch, 用 Switch 去匹配路由, 其实 Switch 匹配也是根据 matchPath 来匹配的
    if (computedMatch) return computedMatch; // <Switch> already computed the match for us

    invariant(
      router,
      "You should not use <Route> or withRouter() outside a <Router>"
    );

    // route: Router 中设置的 context
    const { route } = router;
    // path: Route 自己的 path
    // route.location: react-router 路由变更时, 重新根据 history.location 对象匹配
    // path 和 route.location 匹配成功则说明该组件就是我们想要的组件
    const pathname = (location || route.location).pathname;

    return matchPath(pathname, { path, strict, exact, sensitive }, route.match);
  }

  // 一些警告, 不用管
  componentWillMount() {
    warning(
      !(this.props.component && this.props.render),
      "You should not use <Route component> and <Route render> in the same route; <Route render> will be ignored"
    );

    warning(
      !(
        this.props.component &&
        this.props.children &&
        !isEmptyChildren(this.props.children)
      ),
      "You should not use <Route component> and <Route children> in the same route; <Route children> will be ignored"
    );

    warning(
      !(
        this.props.render &&
        this.props.children &&
        !isEmptyChildren(this.props.children)
      ),
      "You should not use <Route render> and <Route children> in the same route; <Route children> will be ignored"
    );
  }

  componentWillReceiveProps(nextProps, nextContext) {
    warning(
      !(nextProps.location && !this.props.location),
      '<Route> elements should not change from uncontrolled to controlled (or vice versa). You initially used no "location" prop and then provided one on a subsequent render.'
    );

    warning(
      !(!nextProps.location && this.props.location),
      '<Route> elements should not change from controlled to uncontrolled (or vice versa). You provided a "location" prop initially but omitted it on a subsequent render.'
    );

    this.setState({
      // Route 属性变更时, 重新计算路由
      match: this.computeMatch(nextProps, nextContext.router)
    });
  }

  render() {
    const { match } = this.state;
    const { children, component, render } = this.props;
    const { history, route, staticContext } = this.context.router;
    const location = this.props.location || route.location;
    const props = { match, location, history, staticContext };

    // 渲染 Route 的 component 属性
    // match 匹配成功, 则渲染组件, 否则不渲染
    // 此处就说明了 react-router 的逻辑, 当 pathname 和 location.path 匹配成功时, 就去渲染对应的 component
    if (component) return match ? React.createElement(component, props) : null;

    // Route 的 render 属性, 实际上通过 route Object 配置路由的时候, 就是通过该属性渲染的 component
    // 见 [renderRoutes](https://github.com/ReactTraining/react-router/blob/master/packages/react-router-config/modules/renderRoutes.js)
    if (render) return match ? render(props) : null;

    // props: withRoute 中的 routeComponentProps
    // case: withRouter
    if (typeof children === "function") return children(props);

    if (children && !isEmptyChildren(children))
      // router v4 中, route 只允许有一个子组件 
      return React.Children.only(children);

    return null;
  }
}

export default Route;
