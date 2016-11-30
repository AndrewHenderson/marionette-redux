// Marionette
// ===================
Marionette.Renderer.render = function(template, data, view) {
  if (typeof template === 'function') {
    return template.call(view, data);
  } else {
    return template;
  }
};

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

// Shared Mapping
// ===================
var mapStateToProps = function(state, ownProps) {
  return {
    bar: state.bar,
    inAmerica: ownProps.currency === 'USD'
  }
};
var mapDispatchToProps = function(dispatch) {
  return {
    dispatchToggleBar: function() {
      dispatch(toggleBar())
    }
  }
};

// Backbone Models
// ===================
var Model = Backbone.Model.extend({
  store: store,
  props: {
    currency: "EUR"
  },
  componentDidReceiveProps: function(update) {
    this.set({
      bar: update.bar,
      currency: update.currency
    })
  }
});
var ConnectedModel = MarionetteRedux.connect(mapStateToProps)(Model);

// Marionette Behaviors
// ======================
var MyBehavior = Marionette.Behavior.extend({
  events: {
    'click': 'onClick'
  },
  onClick: function() {
    this.props.dispatchToggleBar()
  }
});
var ConnectedBehavior = MarionetteRedux.connect(null, mapDispatchToProps)(MyBehavior);

// Marionette Views
// ===================
var FooView = Marionette.View.extend({
  store: store,
  tagName: 'button',
  template: function(data) {
    return 'Foo: ' + data.currency
  },
  modelEvents: {
    'change:bar': 'onChangeBar'
  },
  events: {
    'click': 'onClick'
  },
  onClick: function() {
    this.props.dispatchToggleBar()
  },
  onChangeBar: function(model, attrs) {
    if (attrs.isActive) {
      this.$el.css({
        color: 'black'
      })
    } else {
      this.$el.css({
        color: 'red'
      })
    }
  }
});
var ConnectedFooView = MarionetteRedux.connect(null, mapDispatchToProps)(FooView);

var BarView = Marionette.View.extend({
  store: store,
  template: function() {
    return '<span>Bar: ' + this.props.inAmerica + '</span>'
  },
  stateEvents: {
    'change:bar': 'onChangeBar',
    'change:inAmerica': 'render'
  },
  componentDidReceiveProps: function(update) {
    this.setState({
      bar: update.bar,
      inAmerica: update.inAmerica
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
var ConnectedBarView = MarionetteRedux.connect(mapStateToProps)(BarView);

var StatusView = Marionette.View.extend({
  template: function() {
    return '<span>' + this.props.label + ': ' + this.props.isActive + '</span>'
  },
  componentDidReceiveProps: function() {
    this.render()
  }
});
var statusMapStateToProps = function(state) {
  return {
    isActive: state.bar.isActive
  }
};
var ConnectedStatusView = MarionetteRedux.connect(statusMapStateToProps)(StatusView);

var BazView = Marionette.View.extend({
  tagName: 'button',
  template: function() {
    return 'Baz'
  },
  behaviors: [ConnectedBehavior]
});

var RootView = Marionette.View.extend({
  template: function() {
    return '<div id="foo"></div><div id="bar"></div><div id="baz"></div><div id="status"></div>'
  },
  regions: {
    foo: '#foo',
    bar: '#bar',
    baz: '#baz',
    status: '#status'
  },
  onRender: function() {
    this.showChildView('foo', new ConnectedFooView({
      model:  new ConnectedModel()
    }));
    this.showChildView('bar', new ConnectedBarView({
      props: {
        currency: 'USD'
      }
    }));
    this.showChildView('baz', new BazView());
    this.showChildView('status', new ConnectedStatusView({
      props: {
        label: 'Current Status'
      }
    }));
  }
});
var ConnectedRootView = MarionetteRedux.connect(mapStateToProps)(RootView);

// Marionette Application
// ==========================
var App = Marionette.Application.extend({
  region: '#root-element',

  onStart: function() {
    this.showView(new ConnectedRootView());
  }
});

var myApp = new App();
myApp.start();