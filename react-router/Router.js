import warning from "warning";
import invariant from "invariant";
import React from "react";
import PropTypes from "prop-types";

/**
 * The public API for putting history on context.
 */
class Router extends React.Component {
  static propTypes = {
    // history mode ==> browserHistory, hashHistory, memoryHistory 三种模式
    history: PropTypes.object.isRequired,
    // <Route />
    children: PropTypes.node
  };

  static contextTypes = {
    router: PropTypes.object
  };

  static childContextTypes = {
    router: PropTypes.object.isRequired
  };

  getChildContext() {
    return {
      router: {
        ...this.context.router,
        history: this.props.history,
        route: {
          // history.location, 当点击 Link 或者 push 路由的时候, location 会变化, Route 就会更新
          location: this.props.history.location,
          match: this.state.match // parent, 根路由 /
        }
      }
    };
  }

  state = {
    match: this.computeMatch(this.props.history.location.pathname)
  };

  computeMatch(pathname) {
    return {
      path: "/",
      url: "/",
      params: {},
      isExact: pathname === "/"
    };
  }

  componentWillMount() {
    const { children, history } = this.props;

    invariant(
      children == null || React.Children.count(children) === 1,
      "A <Router> may have only one child element"
    );

    // Do this here so we can setState when a <Redirect> changes the
    // location in componentWillMount. This happens e.g. when doing
    // server rendering using a <StaticRouter>.

    // 注册 history 的监听函数, 回调执行 setState({ match }), 对应的 childContext 也会更新
    this.unlisten = history.listen(() => {
      this.setState({
        match: this.computeMatch(history.location.pathname)
      });
    });
  }

  componentWillReceiveProps(nextProps) {
    warning(
      this.props.history === nextProps.history,
      "You cannot change <Router history>"
    );
  }

  componentWillUnmount() {
    this.unlisten();
  }

  render() {
    const { children } = this.props;
    return children ? React.Children.only(children) : null;
  }
}

export default Router;
