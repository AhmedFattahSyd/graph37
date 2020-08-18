import { combineReducers, createStore } from "redux";

// actions
export const loadDataAction = () => ({
  type: "LOAD_DATA",
  dataLoaded,
});

export const unloadDataAction = () => ({
  type: "UNLOAD_DATA",
});

//reducers
export const dataLoaded = (state = {}, action: any) => {
    switch (action.type) {
      case 'LOAD_DATA':
        return {dataLoaded: true};
      case 'UNLOADED_DATA':
        return {dataLoaded: false};
      default:
        return state;
    }
  };

  export const reducers = combineReducers({
    dataLoaded,
  });

  //store
  export function configureStore(initialState = {}) {
    const store = createStore(reducers, initialState);
    return store;
  };
  
  export const store = configureStore();
