var App = Ember.Application.create();

App.Router.map(function() {
	this.resource('home', { path: '/' });
	this.resource('about', { path: '/about' });
	this.resource('contact', { path: '/contact' });
	this.resource('login', { path: '/login' });

});

App.LoginRoute = Ember.Route.extend({
	setupController: function(controller, context) {
		controller.reset();
	}
});

App.AuthenticatedRoute = Ember.Route.extend({
	beforeModel: function(transition) {
		if (!this.controllerFor('login').get('token')) {
			this.redirectToLogin(transition);
		}
	},

	getJSONWithToken: function(url) {
		return $.getJSON(url, { token: this.controllerFor('login').get('token') });
	},

	redirectToLogin: function(transition) {
		var loginController = this.controllerFor('login');
		loginController.set('attemptedTransition', transition);

		this.transitionTo('login');		
	},

	actions: {
		error: function(reason, transition) {
			if (reason.status === 403) {
				this.loginRequired();
				this.redirectToLogin(transition);
			} else {
				console.error('something went wrong');
			}
		}
	}
});

App.ContactRoute = App.AuthenticatedRoute.extend({
	model: function() {
		return this.getJSONWithToken('/data.json');
	}
});

App.LoginController = Ember.Controller.extend({

	reset: function() {
		this.setProperties({
			username: "",
			password: "",
			errorMessage: ""
		});
	},

	token: localStorage.token,

	tokenChanged: function() {
		localStorage.token = this.get('token');
	}.observes('token'),

	actions: {
		login: function() {
			var self = this,
				data = this.getProperties('username', 'password');

			self.set('errorMessage', null);
			Ember.$.post('/auth.json', data).then(function(r) {

				var attemptedTransition = self.get('attemptedTransition');
				self.set('errorMessage', r.message);

				if (r.success) {
					if (attemptedTransition) {
						attemptedTransition.retry();
						self.set('attemptedTransition', null);
					} else {	// transition to contact by default
						self.transitionToRoute('contact');	
					}
					self.set('token', r.token);

				}
			});
		}
	}
});