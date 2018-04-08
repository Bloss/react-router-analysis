import React from "react";
import PropTypes from "prop-types";
import hoistStatics from "hoist-non-react-statics";
import Route from "./Route";

/**
 * A public higher-order component to access the imperative API
 * 高阶函数, 为组件注入 Route 的 api
 */
const withRouter = Component => {
  const C = props => {
    const { wrappedComponentRef, ...remainingProps } = props;
    return (
      <Route
        // routeComponentProps: match, location, history, staticContext
        children={routeComponentProps => (
          // 为传进来的 Component 注入 match, location, history, staticContext 属性, 见 Route.js
          <Component
            {...remainingProps}
            {...routeComponentProps}
            ref={wrappedComponentRef}
          />
        )}
      />
    );
  };

  C.displayName = `withRouter(${Component.displayName || Component.name})`;
  C.WrappedComponent = Component;
  C.propTypes = {
    wrappedComponentRef: PropTypes.func
  };

  // 复制 react Component, 并覆盖 static 属性
  return hoistStatics(C, Component);
};

export default withRouter;
