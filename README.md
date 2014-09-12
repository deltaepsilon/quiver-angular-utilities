.# A set of useful AngularJS utilities
Greetings. This is a handy set of factories, directives and services. The directives are generally useful, and the services are useful if you're developing against Firebase.

### Factories
It's nice to wrap common libraries for dependency injection in Angular. These wrappers only work if the library is already on the page.

- moment: The awesome [Moment.js](http://momentjs.com/) library
- Stripe: I use [Stripe.js](https://stripe.com/docs/stripe.js) on lots of projects for payment integration
- _: Include [Underscore.js](http://underscorejs.org/) or [Lo-Dash](http://lodash.com/) on your page if you like

###### env

Do you ever want to manage front-end environment variables without hard-coding them into your repo? Try this:

1. Create a file named ```env.js``` or whatever you like to your project and make sure to add it to your ```.gitignore```. The entire point is to not version control these variables.
2. Use ```env.js``` to add an object to ```window``` and/or ```module.exports```.

```
envVars = {
  "environment": "development",
  "firebase": "https://dev-quiver.firebaseio.com/quiver-cms",
  "api": "https://dev-api-quiver-cms.quiver.is",
  "root": "https://dev-quiver-cms.quiver.is",
  "email": {
    "from": 'chris@quiver.is',
    "name": 'Chris Esplin'
  }
}

if (typeof module !== 'undefined') {
  module.exports = envVars;
}
```

3. Make sure to include a script tag for ```env.js`` before the rest of your Angular app.

```
<!--Environment Variables-->
<script src="env.js"></script>
```

4. Use your handy new object, in this case I've called it ```window.envVars```, to configure your environment with ```quiverUtilitiesProvider```.

```
angular.module('MyApp', ['DeltaEpsilon.quiver-angular-utilities'])
.config(function (quiverUtilitiesProvider) {

    /*
     * Configure Environment
    */
    quiverUtilitiesProvider.setEnv(window.envVars);

    /*
     * Configure Notifications
    */
    quiverUtilitiesProvider.setNotificationConfig({duration: 4000, enabled: true});



});
```

5. Inject ```env``` throughout your app!

```
app.module('MyApp').service('MyService', function MyService(env) {
  console.log('my env variables!', env);

});
```

### Directives

###### qv-full-page
```qv-full-page``` sets the ```min-height``` on any element such that it expands to fill its parent's vertical space.
It respects sibling elements, so you can do something like this...

 ```
 <body>
    <div class="clearfix" ui-view="nav"></div>
    <div class="clearfix" ui-view="body" qv-full-page="0"></div>
    <div class="clearfix" ui-view="footer"></div>
 </body>
 ```

 ... and the ```div``` with ```qv-full-page="0"``` will have a ```min-height``` such that the nav and footer divs are pinned to the top and bottom of ```<body>``` respectively.

 The argument to ```qv-full-page``` is the milliseconds that you'd like to debounce ```min-height``` adjustment. It defaults to 100ms so that ```min-height``` is set once every 100ms during window resize.

 You can also specify a target parent element that you'd like to fill: ```target="#my-target-parent"``` The ```target``` defaults to ```document.body```, so you'll need to set ```target``` if you want more detailed control.

###### qv-confirm
 Use ```qv-confirm``` just like you would ```ng-click```, but add a ```confirmations``` list to force the user to confirm the click before it can get executed.

 ```
 <a qv-confirm="deleteSomeFile(file)" confirmations="['Click to Delete', 'Are you sure?', 'DO NOT CLICK ME!!!']">{{ file.name }}</a>
 ```

 ```qv-confirm``` will change the text of the element to each confirmation message until it runs out, at which point it executes its action. Any body click off of the element will reset the confirmations and the original element text content.

###### qv-focus
Use ```qv-focus``` to redirect page focus on click to any element on the page. It's great for form submission buttons.

```
<form name="newWordForm">
  <input id="new-word-title" type="text" ng-model="newWordTitle" placeholder="New Title..." required/>
  <button ng-click="createWord(newWordTitle)" qv-focus="#new-word-title">Create</button>
</form>
```

###### qv-media
Pass a url into ```qv-media``` and you'll get the relevant media element injected into your element. Current support includes:

- img = jpg, jpeg, png, gif
- video = mp4, webm
- embed = pdf

It supports two tags, ```alt``` and ```attributes```.

The ```alt``` tag is passed through to the created element.

The ```attributes``` tag accepts a map with keys for ```embed```, ```img```, and ```video```. Each media type can have its own map of attributes that you'd like passed down to the resulting media element.

```
<a href="https://s3.amazonaws.com/{{ files.Name }}/{{ file.Key }}" target="_blank" qv-media="https://s3.amazonaws.com/{{ files.Name }}/{{ file.Key }}" alt="{{ file.Key }}" attributes="{embed: {width: '100px', height: '100px'}, img: {'max-height': '100px'}, video: {width: '120ox'}}"></a>
```

###### qv-select-text
Add ```qv-select-text``` to any element that can accept focus (usually input elements). Focusing on the element will now select all of the element's text. This great for quick copy/paste actions.

```
<input type="text" ng-model="someUrlToCopy" qv-select-text/>
```

###### qv-meter
Pass in a percentage—between 0 and 1 inclusive—and ```qv-meter``` will set the element's ```min-width``` to that percentage. Use it for progress bars like so:

```
<a class="qv-progress text-x-small success" qv-confirm="deleteFlowFile($flow, file)" confirmations="['Click to Delete']">
    <span class="meter-text text-black">{{ file.name }}</span>
    <span class="meter" qv-meter="file.percentComplete"></span>
</a>
```


### Services

###### UserService
FirebaseSimpleLogin and AngularFire need a little love for user management. This service is an opinionated take on a Firebase user system.

UserService relies on the ```env``` factory that you defined earlier using ```quiverUtilitiesProvider.setEnv(window.envVars);```. Make sure that ```env.firebase``` points to your Firebase root.

The code is quite easy to read.
The only function that does anything funky is ```UserService.getUser(userId)```,
which will return a user object if you pass in a userId or will get FirebaseSimpleLogin's ```$currentUser``` object if you omit the ```userId```.

The user object looks like this:

```
return $firebase(new Firebase(firebaseEndpoint + '/users/' + userId)).$asObject();
```

The ```$currentUser``` object looks like this:

```
return firebaseSimpleLogin.$getCurrentUser();
```

UserService currently supports email and password login only, and will optionally create matching users on your Firebase with the following data structure where each user's key matches her Firebase Simple Login id.

```
"firebaseRoot": {
  "users": {
    "1": {"email": "my-email-1@email.com"},
    "2": {"email": "my-email-2@email.com"}
  }
}
```

###### Notification Service
This is just a simple wrapper for [my fork](https://github.com/deltaepsilon/angular-notifications) of [Derek Ries' angular-notifications](https://github.com/DerekRies/angular-notifications) module.

You can still inject ```$notification``` throughout your app to use Derek's stock module, but I like to use my custom wrapper.

Configure it with ```quiverUtilitiesProvider.setNotificationConfig```. ```duration``` is millis before each alert fades. ```enabled``` enables HTML5 desktop notifications if supported.

```
/*
 * Configure Notifications
*/
quiverUtilitiesProvider.setNotificationConfig({duration: 4000, enabled: true});

```

Use is like this:

```
angular.module('MyApp').controller(function ($scope, NotificationService) {
  NotificationService.notify('Yep', "It happened");
  NotificationService.error('Oops.', "You encountered and error");
  NotificationService.success('Yay!', "You are successful");
  NotificationService.warning('Hmmmmm', "You need a warning");

});
```

You'll need to add something like the following to your html—only the ```notifications``` directive is strictly necessary:

```
<aside id="notifications-wrapper">
  <div notifications class="notifications column small-centered text-white"></div>
</aside>
```

Here's some sample CSS for making it pretty. You'll need to experiment.

```
.notifications .dr-notification-content p {
  font-size: 0.75rem;
}

.notifications .dr-notification-content h3 {
  font-size: 0.875rem;
}

#notifications-wrapper {
  position: fixed;
  width: 20rem;
  left: 50%;
  margin-left: -10rem;
  z-index: 99;
}

.notifications .notify {
  color: white;
  background-color: #076391;
}

.notifications .notify h3 {
  color: white;
}

.notifications .error {
  color: white;
  background-color: #a00934;
}

.notifications .error h3 {
  color: white;
}

.notifications .success {
  color: white;
  background-color: #4a910a;
}

.notifications .success h3 {
  color: white;
}

.notifications .warning {
  color: white;
  background-color: #fc0272;
}

.notifications .warning h3 {
  color: white;
}

.notifications .dr-notification-wrapper {
  opacity: .95;
}

.notifications .dr-notification-image {
  display: none;
}

.notifications .dr-notification-content {
  padding: 0.5rem;
}

.notifications .dr-notification-content p {
  margin: 0;
}
```
