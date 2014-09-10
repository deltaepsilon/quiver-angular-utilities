/**
@fileOverview

@toc

*/

'use strict';

angular.module('DeltaEpsilon.quiver-angular-utilities', ['firebase', 'notifications'])
  .provider('quiverUtilities', function () {
    return {
      env: {
        environment: 'development',
        api: 'https://api.mysite.com',
        firebase: 'https://my-firebase.firebaseio.com',
        "stripe": {
          "pk": "pk_test_1234567890"
        }
      },
      notificationConfig: {
        duration: 4000,
        enabled: true
      },
      setEnv: function (env) {
        this.env = env;
      },
      setNotificationConfig: function (notificationConfig) {
        this.notificationConfig = notificationConfig;
      },
      $get: function () {
        return {
          notificationConfig: this.notificationConfig,
          env: this.env
        };
      }
    };
  })
  .factory('moment', function ($window) {
    return $window.moment;
  }).factory('Stripe', function ($window) {
    return $window.Stripe;
  }).factory('_', function ($window) {
    return $window._;
  }).factory('env', function (quiverUtilities) {
      return quiverUtilities.env;
  }).directive('qvActive', function ($timeout, $state) {
    return {
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        var evaluateClass = function () {
          var activeClass = attrs.qvActive || 'active',
            link = angular.element(element).find('[ui-sref]'),
            sref = link && link.attr ? link.attr('ui-sref') : null;

          if (!sref) {
            console.warn('ui-sref not found');
          } else if (sref === $state.$current.name) {
            element.addClass(activeClass);
          } else {
            element.removeClass(activeClass);
          }
        };

        scope.$on('$stateChangeSuccess', evaluateClass);


      }
    };
  })
  .directive('qvFullPage', function ($timeout, $window, _) {
    return {
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        var debounceDelay = parseInt(attrs.qvFullPage),
          target = angular.element(attrs.target || document.body),
          setMinHeight = function () {
            var parentHeight = element.parent().height(),
              targetHeight = target.height(),
              elementHeight = element.height();

            element.css('min-height', targetHeight - (parentHeight - elementHeight));
          };

        $timeout(setMinHeight, parseInt(attrs.delay) || 0);


        if (!debounceDelay && debounceDelay !== 0) { // Default debounce if unspecified or invalid
          debounceDelay = 100
        }
        angular.element($window).on('resize', debounceDelay ? _.debounce(setMinHeight, debounceDelay) : setMinHeight);

      }
    };
  })
  .directive('qvConfirm', function (_) {
    return {
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        var confirmations = attrs.confirmations ? scope.$eval(attrs.confirmations) : ['Click to confirm'],
          buttonText = element.text(),
          stack = confirmations.slice(0),
          body = angular.element(document.body),
          handleBodyClicks = function (e) {
            if (e.target != element[0]) {
              stack = confirmations.slice(0);
              element.text(buttonText);
              body.off('click', handleBodyClicks);
            }
          };

        element.on('click', function () {
          body.on('click', handleBodyClicks);

          if (stack.length) {
            element.text(stack.shift());
          } else {
            body.off('click', handleBodyClicks);
            scope.$eval(attrs.qvConfirm);
          }
        });

      }
    };
  })
  .directive('qvFocus', function ($timeout) {
    return {
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        element.on('click', function () {
          $timeout(function () {
            angular.element(document.body).find(attrs.qvFocus).focus();
          });
        });
      }
    };
  })
  .directive('qvMedia', function () {
    var img = ['jpg', 'jpeg', 'png', 'gif'],
      video = ['mp4', 'webm'],
      embed = ['pdf'],
      SUFFIX_REGEX = /\.(\w+)$/;
    return {
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        var matches = attrs.qvMedia.match(SUFFIX_REGEX),
          suffix = matches && matches.length ? matches[1] : '',
          isImg = !!~img.indexOf(suffix),
          isVideo = !!~video.indexOf(suffix),
          isEmbed = !!~embed.indexOf(suffix),
          guts,
          attributesObj = attrs.attributes ? scope.$eval(attrs.attributes) : {},
          attributes,
          keys,
          i;

        if (isImg) {
          guts = angular.element('<img/>');
          attributes = attributesObj.img;
        } else if (isVideo) {
          guts = angular.element('<video/>');
          attributes = attributesObj.video;
        } else if (isEmbed) {
          guts = angular.element('<embed/>');
          attributes = attributesObj.embed;
        } else {
          console.warn('File type not identified', matches);
        }

        keys = Object.keys(attributes);
        i = keys.length;

        while (i--) {
          guts.attr(keys[i], attributes[keys[i]]);
        }

        guts.attr('src', attrs.qvMedia);
        guts.attr('alt', attrs.alt);

        element.append(guts);

      }
    };
  })
  .directive('qvSelectText', function ($timeout) {
    return {
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        element.on('focus', function (e) {
          $timeout(function () {
            e.target.select();
          });

        });
      }
    };
  })
  .service('UserService', function ($q, $firebase, $firebaseSimpleLogin, env) {
    var firebaseEndpoint = env.firebase,
      firebase = new Firebase(firebaseEndpoint),
      firebaseSimpleLogin = $firebaseSimpleLogin(firebase),
      getUser = function (userId) {
        var userObject,
          promise;

        if (userId) {
          var userObject = $firebase(new Firebase(firebaseEndpoint + '/users/' + userId)).$asObject();

          /*
           * Protect against the case where a user is logged in yet has deleted her email address.
           * This function effectively resets the user's email to the email that she used to register if the user or
           * her email were somehow deleted.
           *
           * We may want this reset function to be a bit more elaborate in the future if we determine that more user
           * attributes are essential to the application and should at least receive defaults.
           */
          userObject.$loaded().then(function (user) {
            if (!user || !user.email) {
              firebaseSimpleLogin.$getCurrentUser().then(function (currentUser) {
                userObject.email = currentUser.email;
                userObject.$save();
              });
            }
          });

        } else {
          promise = firebaseSimpleLogin.$getCurrentUser();

        }

        return userObject || promise;

      },
      getResolvedPromise = function (resolution) {
        var deferred = $q.defer();
        deferred.resolve(resolution);
        return deferred.promise;
      };

      return {
        getUser: getUser,

        logIn: function (email, password, createUserFlag) {
          var promise = firebaseSimpleLogin.$login('password', {
            email: email,
            password: password,
            rememberMe: true // Override default session length (browser session) to be 30 days.
          });

          if (createUserFlag) { // Some situations may require user creation at login.
            var deferred = $q.defer();

            promise.then(function (user) {
              var userObject = $firebase(new Firebase(firebaseEndpoint + '/users/' + user.id)).$asObject();
              userObject.email = user.email;
              userObject.$save().then(deferred.resolve, deferred.reject);
            });

            return deferred.promise;

          } else {
            return promise;

          }

        },

        register: function (email, password, createUserFlag) {
          if (!createUserFlag) {
            return firebaseSimpleLogin.$createUser(email, password);
          } else { // Only create a user object at the Firebase root if asked to do so

            var deferred = $q.defer();

            firebaseSimpleLogin.$createUser(email, password).then(function (user) {
              // Create our own custom user object to house the user's data
              var userObject = $firebase(new Firebase(firebaseEndpoint + '/users/' + user.id)).$asObject();
              userObject.email = user.email;
              userObject.$save().then(deferred.resolve, deferred.reject);

            }, deferred.reject);

            return deferred.promise
          }

        },

        logOut: function () {
          return getResolvedPromise(firebaseSimpleLogin.$logout());
        },

        resetPassword: function (email) {
          var deferred = $q.defer();

          // firebaseSimpleLogin.$resetPassword has not yet been implemented in angularfire. We're going it alone.
          var auth = new FirebaseSimpleLogin(firebase, function (err, user) {
            console.log('err, user', err, user);
          });
          auth.sendPasswordResetEmail(email, function (err, success) {
            if (err) {
              deferred.reject(err);
            } else {
              deferred.resolve(success);
            }
          });

          return deferred.promise;
        },

        changePassword: firebaseSimpleLogin.$changePassword
      };

    }).service('NotificationService', function ($notification, quiverUtilities) {
      $notification.setSetting('custom', quiverUtilities.notificationConfig);

      return {
        notify: function (title, content, userData) {
          return $notification.notify(null, title, content, userData, 'notify');
        },
        error: function (title, content, userData) {
          return $notification.notify(null, title, content, userData, 'error');
        },
        success: function (title, content, userData) {
          return $notification.notify(null, title, content, userData, 'success');
        },
        warning: function (title, content, userData) {
          return $notification.notify(null, title, content, userData, 'warning');
        }
      };

    });