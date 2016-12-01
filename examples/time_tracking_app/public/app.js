var TimersDashboard = MarionetteRedux.connect()(Marionette.View.extend({
  template: function () {
    return "<div class='ui three column centered grid'>" +
      "<div class='column'>" +
      "<div id='editableTimerList'></div>" +
      "<div id='toggleableTimerForm'></div>" +
      "</div>" +
      "</div>"
  },
  getInitialState: function () {
    return {
      timers: []
    };
  },
  regions: {
    "toggleableTimerForm": "#toggleableTimerForm"
  },
  onRender: function () {
    this.showChildView('toggleableTimerForm', new ToggleableTimerForm({
      props: {
        onFormSubmit: this.handleCreateFormSubmit.bind(this)
      }
    }));
    this.loadTimersFromServer();
    // setInterval(this.loadTimersFromServer, 5000);
  },
  loadTimersFromServer: function () {
    client.getTimers(_.bind(function(serverTimers) {
      return this.setState({timers: serverTimers})
    }, this));
  },
  handleCreateFormSubmit: function (timer) {
    this.createTimer(timer);
  },
  handleEditFormSubmit: function (attrs) {
    this.updateTimer(attrs);
  },
  handleTrashClick: function (timerId) {
    this.deleteTimer(timerId);
  },
  handleStartClick: function (timerId) {
    this.startTimer(timerId);
  },
  handleStopClick: function (timerId) {
    this.stopTimer(timerId);
  },
  createTimer: function (timer) {
    const t = helpers.newTimer(timer);
    this.setState({
      timers: this.state.timers.concat(t)
    });

    client.createTimer(t);
  },
  updateTimer: function (attrs) {
    this.setState({
      timers: this.state.timers.map(function(timer) {
        if (timer.id === attrs.id) {
          return _.extend({}, timer, {
            title: attrs.title,
            project: attrs.project
          });
        } else {
          return timer;
        }
      })
    });

    client.updateTimer(attrs);
  },
  deleteTimer: function (timerId) {
    this.setState({
      timers: this.state.timers.filter(function(t) {
        return t.id !== timerId
      })
  });

    client.deleteTimer(
      { id: timerId }
    );
  },
  startTimer: function (timerId) {
    const now = Date.now();

    this.setState({
      timers: this.state.timers.map(function(timer) {
        if (timer.id === timerId) {
          return _.extend({}, timer, {
            runningSince: now
          });
        } else {
          return timer;
        }
      })
    });

    client.startTimer(
      { id: timerId, start: now }
    );
  },
  stopTimer: function (timerId) {
    const now = Date.now();

    this.setState({
      timers: this.state.timers.map(function(timer) {
        if (timer.id === timerId) {
          const lastElapsed = now - timer.runningSince;
          return _.extend({}, timer, {
            elapsed: timer.elapsed + lastElapsed,
            runningSince: null
          });
        } else {
          return timer;
        }
      })
    });

    client.stopTimer(
      { id: timerId, stop: now }
    );
  }
}));

var ToggleableTimerForm = MarionetteRedux.connect()(Marionette.View.extend({
  template: function () {
    return "<div id='form' style='display:none'></div>" +
    "<div class='ui basic content center aligned segment'>" +
    "<button id='plusButton' class='ui basic button icon'>" +
    "<i class='plus icon'></i>" +
    "</button>" +
    "</div>"
  },
  regions: {
    form: "#form"
  },
  ui: {
    "form": "#form",
    "plusButton": "#plusButton"
  },
  events: {
    "click @ui.plusButton": "handleFormOpen"
  },
  stateEvents: {
    "change:isOpen": "handleChangeIsOpen"
  },
  getInitialState: function () {
    return {
      isOpen: false
    };
  },
  handleFormOpen: function () {
    this.setState({ isOpen: true });
  },
  handleFormClose: function () {
    this.setState({ isOpen: false });
  },
  handleFormSubmit: function (timer) {
    this.props.onFormSubmit(timer);
    this.setState({ isOpen: false });
  },
  handleChangeIsOpen: function(view, isOpen) {
    if (isOpen) {
      this.ui.form.show();
      this.ui.plusButton.hide();
    } else {
      this.ui.form.hide();
      this.ui.plusButton.show();
    }

  },
  onRender: function () {
    this.showChildView('form', new TimerForm({
      props: {
        onFormSubmit: this.handleFormSubmit.bind(this),
        onFormClose: this.handleFormClose.bind(this)
      }
    }))
  }
}));

const TimerForm = MarionetteRedux.connect()(Marionette.View.extend({
  template: function () {
    const submitText = this.props.id ? 'Update' : 'Create';
    const title = this.props.title || '';
    const project = this.props.project || '';
    return "<div class='ui centered card'>" +
      "<div class='content'>" +
      "<div class='ui form'>" +
      "<div class='field'>" +
      "<label>Title</label>" +
      "<input type='text' id='title' value=" + title + ">" +
    "</div>" +
    "<div class='field'>" +
      "<label>Project</label>" +
      "<input type='text' id='project' value=" + project + ">" +
    "</div>" +
    "<div class='ui two bottom attached buttons'>" +
      "<button id='submit' class='ui basic blue button'>" + submitText + "</button>" +
      "<button id='close' class='ui basic red button'>Cancel</button>" +
    "</div>" +
    "</div>" +
    "</div>" +
    "</div>"
  },
  ui: {
    title: "#title",
    project: "#project",
    submit: "#submit",
    close: "#close"
  },
  events: function() {
    return {
      "click @ui.submit": "handleSubmit",
      "click @ui.close": this.options.props.onFormClose
    }
  },
  handleSubmit: function () {
    this.props.onFormSubmit({
      id: this.props.id,
      title: this.ui.title.val(),
      project: this.ui.project.val()
    });
  }
}));

// Marionette
// ===================
Marionette.Renderer.render = function(template, data, view) {
  if (typeof template === 'function') {
    return template.call(view, data);
  } else {
    return template;
  }
};

// Marionette Application
// ==========================
var App = Marionette.Application.extend({
  region: '#root-element',

  onStart: function() {
    this.showView(new TimersDashboard());
  }
});

var myApp = new App();
myApp.start();