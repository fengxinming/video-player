import { useRef } from 'react';
import { create } from 'zustand';

export function useScope(defineScope, props = {}) {
  const ref = useRef(null);
  let cache = ref.current;

  if (cache === null) {
    cache = {
      useStore: create((setState, getState, api) => {
        api.getProps = function () {
          return cache.props;
        };
        api.getPrevProps = function () {
          return cache.prevProps;
        };
        api.resetState = function () {
          // api.destroy();
          setState(defineScope(setState, getState, api), true);
        };
        return defineScope(setState, getState, api);
      })
    };
    ref.current = cache;
  }

  cache.prevProps = cache.props || {};
  cache.props = props;
  return ref.current.useStore();
}
