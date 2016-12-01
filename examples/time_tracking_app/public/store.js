// Action Creators
// ===================
function toggleBar() {
  return {
    type: 'TOGGLE_BAR'
  }
}

// Redux Reducers
// ===================
var reducers = Redux.combineReducers({
  bar: function(_state, action) {

    var state = _state ? _.clone(_state) : {
      isActive: true
    };

    switch (action.type) {
      case 'TOGGLE_BAR':
        state.isActive = !state.isActive;
        return state;

      default:
        return state;
    }
  }
});

// Redux Store
// ===================
var compose = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ : Redux.compose;
var store = compose()(Redux.createStore)(reducers);
window.store = store;