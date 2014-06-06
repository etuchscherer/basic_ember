var App = Ember.Application.create();

App.Router.map(function() {
	this.resource('home', { path: '/' });
	this.resource('about', { path: '/about' });
	this.resource('contact', { path: '/contact' });
	this.resource('login', { path: '/login' });
	this.resource('logout', { path: '/logout' });

});

App.LoginRoute = Ember.Route.extend({
	setupController: function(controller, context) {
		controller.reset();
	}
});

App.LogoutRoute = Ember.Route.extend({
	setupController: function(controller, context) {
		controller.destroySession();
		this.controllerFor('application').set('authenticated', false);
		this.transitionTo('home');
	}
});

App.AuthenticatedRoute = Ember.Route.extend({
	beforeModel: function(transition) {
		if (!this.controllerFor('application').get('token')) {
			this.redirectToLogin(transition);
		}
	},

	getJSONWithToken: function(url) {
		return $.getJSON(url, { token: this.controllerFor('application').get('token') });
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
				console.error('something went wrong, try `sessionStorage.clear()`, and reload.');
				this.transitionTo('home');
			}
		}
	}
});

App.ContactRoute = App.AuthenticatedRoute.extend({
	model: function() {
		return this.getJSONWithToken('/data.json');
	}
});

App.ApplicationController = Ember.Controller.extend({
	authenticated: false
});

App.LogoutController = Ember.Controller.extend({
	destroySession: function() {
		sessionStorage.clear();
	}
});

App.LoginController = Ember.Controller.extend({
	needs: "application",

	reset: function() {
		this.setProperties({
			username: "",
			password: "",
			errorMessage: ""
		});
	},

	// token: sessionStorage.token,

	tokenChanged: function() {
		sessionStorage.token = this.get('controllers.application.token');
	}.observes('controllers.application.token'),

	actions: {
		login: function() {
			var self = this,
				data = this.getProperties('username', 'password');

			self.set('errorMessage', null);
			Ember.$.post('/auth.json', data).then(function(r) {

				var attemptedTransition = self.get('attemptedTransition');
				self.set('errorMessage', r.message);

				if (r.success) {

					self.set('controllers.application.token', r.token);
					self.set('controllers.application.authenticated', true);

					if (attemptedTransition) {

						attemptedTransition.retry();

						self.set('attemptedTransition', null);

					} else {	// transition to contact by default

						self.transitionToRoute('contact');	
					}
				}
			});
		}
	}
});