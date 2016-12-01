// Action Creators
// ===================
function addMessage(message) {
  return {
    type: 'ADD_MESSAGE',
    message: message
  }
}
function deleteMessage(index) {
  return {
    type: 'DELETE_MESSAGE',
    index: index
  }
}

// Redux Reducers
// ===================
var reducers = Redux.combineReducers({
  messages: function(_state, action) {

    var state = _state ? JSON.parse(JSON.stringify(_state)) : [];

    if (action.type === 'ADD_MESSAGE') {
      return state.concat({
        message: action.message
      })
    } else if (action.type === 'DELETE_MESSAGE') {
      return state.slice(0, action.index).concat(state.slice(action.index + 1, state.length))
    } else {
      return state
    }
  }
});

// Redux Store
// ===================
var compose = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ : Redux.compose;
var store = compose()(Redux.createStore)(reducers);
window.store = store;