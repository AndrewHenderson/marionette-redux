// Marionette
// ===================
Marionette.Renderer.render = function(template, data, view) {
  if (typeof template === 'function') {
    return template.call(view, data);
  } else {
    return template;
  }
};

// Views
// ===================

var MessageInput = MarionetteRedux.connect()(Marionette.View.extend({
  className: 'ui input',
  template: function () {
    return "<input type='text'/>\
      <button class='ui primary button' type='submit'>Submit</button>"
  },
  ui: {
    messageInput: 'input'
  },
  events: {
    'click button': 'handleSubmit'
  },
  handleSubmit: function () {
    this.props.dispatch(addMessage(this.ui.messageInput.val()));
    this.ui.messageInput.val('');
  }
}));

var MessageView = MarionetteRedux.connect()(Marionette.View.extend({
  className: 'comment',
  template: function () {
    return this.model.get('message')
  },
  events: {
    click: 'handleClick'
  },
  handleClick: function() {
    this.props.dispatch(deleteMessage(this.model.collection.indexOf(this.model)))
  }
}));

var messagesMapStateToProps = function(state) {
  return {
    messages: state.messages
  }
};
var MessagesView = MarionetteRedux.connect(messagesMapStateToProps)(Marionette.CollectionView.extend({
  childView: MessageView,
  className: "ui comments",
  componentDidReceiveProps: function(update) {
    this.collection.set(update.messages);
  }
}));

var Root = MarionetteRedux.connect()(Marionette.View.extend({
  className: 'ui segment',
  template: function() {
    return "<div id='MessagesView'></div>\
      <div id='MessageInput'></div>"
  },
  regions: {
    MessagesView: '#MessagesView',
    MessageInput: '#MessageInput'
  },
  onRender: function () {
    this.showChildView('MessagesView', new MessagesView({
      collection: new Backbone.Collection()
    }));
    this.showChildView('MessageInput', new MessageInput());
  }
}));

// Application
// ==========================
var App = Marionette.Application.extend({
  region: '#root-element',
  onStart: function() {
    this.showView(new Root());
  }
});

var myApp = new App();
myApp.start();