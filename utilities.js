
/**
@fileOverview

@toc

*/

'use strict';

angular.module('DeltaEpsilon.quiver-angular-utilities', ['firebase', 'notifications', 'ui.router'])
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
  })
  .factory('Stripe', function ($window) {
    return $window.Stripe;
  })
  .factory('_', function ($window) {
    return $window._;
  })
  .factory('env', function (quiverUtilities) {
      return quiverUtilities.env;
  })
  .filter('moment', function (moment) {
    return function (input, format) {
      return moment(input).format(format);
    };
  })
  .directive('qvActive', function ($timeout, $state) {
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
  .directive('qvDisplay', function ($timeout) {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        $timeout(function () {
          element.removeAttr('style');
        });
      }
    }
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
  .directive('qvConfirm', function ($timeout) {
    return {
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        $timeout(function () {
          var confirmations = attrs.confirmations ? scope.$eval(attrs.confirmations) : ['Click to confirm'],
            buttonHtml = element.html(),
            stack = confirmations.slice(0),
            body = angular.element(document.body),
            handleBodyClicks = function (e) {
              stack = confirmations.slice(0);
              element.html(buttonHtml);
              body.off('click', handleBodyClicks);
            };

          element.on('click', function (e) {
            e.stopPropagation();

            if (stack.length) {
              element.text(stack.shift());
              $timeout(function () { // Gotta skip the initial click that changed the content of the element
                body.on('click', handleBodyClicks);
              });

            } else {
              body.off('click', handleBodyClicks);
              scope.$eval(attrs.qvConfirm);
            }
          });
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
    var img = ['jpg', 'jpeg', 'png', 'gif', 'tiff', 'ico', 'svg'],
      video = ['mp4', 'mpeg', 'webm', 'ogg', 'mov'],
      embed = ['pdf'],
      SUFFIX_REGEX = /\.(\w+)$/;
    return {
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        var matches = attrs.qvMedia.match(SUFFIX_REGEX),
          suffix = matches && matches.length ? matches[1].toLowerCase() : '',
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
          guts = angular.element('<video controls/>');
          attributes = attributesObj.video;
        } else if (isEmbed) {
          guts = angular.element('<embed/>');
          attributes = attributesObj.embed;
        } else {
          console.warn('File type not identified. Defaulting to img', matches);
          guts = angular.element('<img/>');
          attributes = attributesObj.img;
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
  .directive('qvMeter', function () {
    return {
      restrict: 'A',
      scope: {
        percent: "=qvMeter"
      },
      link: function postLink(scope, element, attrs) {
        var setStyle = function () {
          element.css({'width': (Math.min(scope.percent, 1) * 100) + '%'});
        };

        scope.$watch('percent', setStyle);
      }
    };
  })
  .directive('qvEnter', function ($timeout) {
    return {
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        var handleKeyup = function (e) {
            if (e.keyCode === 13) {
              $timeout(function () {
                scope.$eval(attrs.qvEnter);
              });
            }

          },
          ignore = function () {
            element.off('keyup', handleKeyup);
            element.off('blur', ignore);
          },
          listen = function () {
            element.on('keyup', handleKeyup);
            element.on('blur', ignore);
          };

        element.on('focus', listen);

      }
    };
  })
  .directive('qvTypeAhead', function ($compile, $window, $timeout) {
    var template = "<ul class='type-ahead' style='position: fixed;' ng-show='options.length'><li ng-repeat='option in options' ng-class='{active: activeIndex==$index}' index='{{ $index }}' value='{{ option.key }}'>{{ option.value }}</li></ul><div>{{ scope.options }}</div>";

    return {
      restrict: 'A',
      require: 'ngModel',
      scope: {
        include: '=',
        exclude: '='
      },
      link: function (scope, element, attrs, ngModel) {
        // activate on focus, deactivate on blur
        var parent = element.parent(),
          filter = function (word) {
            if (attrs.noFilter) {
              return scope.include;
            }

            var i = scope.include.length,
              j,
              regex = word ? new RegExp(word, 'gi') : false,
              options = [],
              flag;

            while (i--) {
              if (!regex || scope.include[i].key.match(regex)) {

                flag = true
                j = scope.exclude ? scope.exclude.length : 0;
                while (j--) {
                  if (scope.include[i].key === scope.exclude[j].key) {
                    flag = false;
                    break;

                  }
                }

                if (flag) {
                  options.push(scope.include[i]);
                }
              }

            }

            return options;
          },
          handleKeyup = function (e) {
            scope.$apply(function () {
              switch (e.keyCode) {
                case 40: // Arrow Down
                  scope.activeIndex = typeof scope.activeIndex === 'undefined' ? 0 : Math.min(scope.options.length - 1, scope.activeIndex + 1);
                  break;

                case 38: // Arrow Up
                  if (scope.activeIndex) {
                    if (scope.activeIndex === 0) {
                      delete scope.activeIndex;
                    } else {
                      scope.activeIndex -= 1;
                    }
                  }
                  break;

                case 13: // Enter
                  if (scope.activeIndex >= 0) {
                    select(scope.activeIndex);
                    delete scope.activeIndex;
                  }
                  break;

                case 27: // Esc
                  element.blur();
                  break;

                default:
                  scope.options = filter(element.val());
                  if (scope.option && scope.options.length === 1) {
                    scope.activeIndex = 0;
                  } else {
                    delete scope.activeIndex;
                  }
                  break;

              }

            });

          },
          ul = $compile(template)(scope),
          placeUl = function () {
            var offset = element.offset(),
              topOffset = offset.top + element.outerHeight();

            if (attrs.topOffset) {
              topOffset += parseInt(attrs.topOffset)
            }

            ul.css({
              "position": 'fixed',
              "top": topOffset,
              "left": offset.left,
              "min-width": element.outerWidth(),
              "z-index": 100
            });
          },
          handleUlClick = function (e) {
//            console.log('handle ul click');
            var li = angular.element(e.target),
              index = parseInt(li.attr('index'));

            select(index);
            $timeout(function () {
              scope.option = filter(element.val());
            });

          },
          activate = function () {
//            console.log('activate');
            if (attrs.prepopulate) {
              scope.options = filter(element.val());
            }


            parent.append(ul);
            $timeout(function () {
              placeUl();
            });


            angular.element($window).on('resize', placeUl);
            element.on('keyup', handleKeyup);
            ul.on('click', handleUlClick);
          },
          deactivate = function () {
            $timeout(function () {
              angular.element($window).off('resize', placeUl);
              element.off('keyup', handleKeyup);
              ul.off('click', handleUlClick);
              ul.detach();
            }, 100);


          },
          select = function (i) {
            delete scope.activeIndex;
            if (attrs.selection) {
              if (attrs.selection === 'object') {
                ngModel.$setViewValue(scope.options[i]);
              } else {
                ngModel.$setViewValue(scope.options[i][attrs.selection]);
              }
            } else {
              ngModel.$setViewValue(scope.options[i].key);
            }

            ngModel.$render();

            $timeout(function () {
              element.focus();
            }, 300);

          };

        scope.select = select;

        element.on('focus', activate);
        element.on('blur', deactivate);

//        scope.$watch(attrs.ngModel, function () {
//          console.log('model change');
//        });

        if (scope.exclude) {
          scope.$watch('exclude', function () {
            $timeout(function () {
              placeUl();
              scope.options = filter(element.val());
            });

          });
        };

      }
    };
  })
  .directive('qvBackgroundImage', function ($state, $rootScope, $timeout) {
    return {
      restrict: 'A',
      scope: {
        url: '=qvBackgroundImage'
      },
      link: function postLink(scope, element, attrs) {
        $timeout(function () {
          var states = attrs.states ? scope.$eval(attrs.states) : false,
            stateHandler = function (e, to, from) {
              var state = to && to.name ? to.name : $state.current.name,
              background = 'initial';

              if (scope.url && (!states || ~states.indexOf(state))) {
                background = 'url(' + scope.url + ')';

              }
              element.css('background', background);
            };

          scope.$watch('url', stateHandler);
          $rootScope.$on('$stateChangeStart', stateHandler);


        });

      }
    };
  })
  .service('ObjectService', function () {
    var toDestroy = [];

    return {
      toDestroy: function (obj) {
        if (obj) {
          toDestroy.push(obj);
        }
      },

      destroy: function () {
        var i = toDestroy.length;

        while (i--) {
          toDestroy[i].$destroy();
        }
      }
    }

  })
  .service('UserService', function ($q, $firebase, $firebaseSimpleLogin, env, ObjectService) {
    var firebaseEndpoint = env.firebase.endpoint || env.firebase,
      firebase = new Firebase(firebaseEndpoint),
      firebaseSimpleLogin = $firebaseSimpleLogin(firebase),
      getUser = function (userId) {
        var userObject,
          promise;

        if (userId) {
          var userObject = $firebase(new Firebase(firebaseEndpoint + '/users/' + userId)).$asObject();
          ObjectService.toDestroy(userObject);

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
              userObject.$loaded().then(function () {
                if (!userObject.email) {
                  userObject.email = user.email;
                  userObject.$save().then(deferred.resolve, deferred.reject);
                } else {
                  deferred.resolve(user);
                }
              });


            }, deferred.reject);

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
          ObjectService.destroy();
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

    })
  .service('NotificationService', function ($notification, quiverUtilities) {
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
