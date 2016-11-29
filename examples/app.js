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
})

// Redux Store
// ===================
var compose = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ : Redux.compose;
var store = compose()(Redux.createStore)(reducers);

// Marionette Views
// ===================
var FooView = Marionette.View.extend({
  store: store,
  template: function() {
    return '<button>Toggle</button>'
  },
  events: {
    'click button': 'onClickButton'
  },
  onClickButton: function() {
    this.props.dispatch(toggleBar())
  }
});
FooView = MarionetteRedux.connect()(FooView);

var BarView = Marionette.View.extend({
  store: store,
  template: function() {
    return '<span>Bar</span>'
  },
  stateEvents: {
    'change:bar': 'onChangeBar'
  },
  componentDidReceiveProps: function(update) {
    this.setState({
      bar: update.bar
    })
  },
  onChangeBar: function(view, state) {
    if(state.isActive) {
      this.$el.show()
    } else {
      this.$el.hide()
    }
  }
});
mapStateToProps = function(state) {
  return {
    bar: state.bar
  }
};
BarView = MarionetteRedux.connect(mapStateToProps)(BarView);

var RootView = Marionette.View.extend({
  template: function() {
    return '<div id="foo"></div><div id="bar"></div>'
  },
  regions: {
    foo: '#foo',
    bar: '#bar'
  },
  onRender: function() {
    this.showChildView('foo', new FooView());
    this.showChildView('bar', new BarView());
  }
});

// Marionette Application
// ==========================
var App = Mn.Application.extend({
  region: '#root-element',

  onStart: function() {
    this.showView(new RootView());
  }
});

var myApp = new App();
myApp.start();