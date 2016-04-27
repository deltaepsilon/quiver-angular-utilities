/**
@fileOverview

@toc

*/

'use strict';

angular.module('quiver.angular-utilities', ['notifications', 'ui.router', 'ngMaterial'])
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
                if (this.env.facebook && this.env.facebook.analyticsId && !window.fbq) {
                    !function (f, b, e, v, n, t, s) {
                        if (f.fbq) return; n = f.fbq = function () {
                            n.callMethod ?
                                n.callMethod.apply(n, arguments) : n.queue.push(arguments)
                        }; if (!f._fbq) f._fbq = n;
                        n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0;
                        t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s)
                    } (window,
                        document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

                    fbq('init', this.env.facebook.analyticsId);
                }
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
    .factory('braintree', function ($window) {
        return $window.braintree;
    })
    .factory('_', function ($window) {
        return $window._;
    })
    .factory('env', function (quiverUtilities) {
        return quiverUtilities.env;
    })
    .filter('moment', function (moment) {
        return function (input, format, incomingFormat) {
            return moment(input, incomingFormat).format(format);
        };
    })
    .filter('timeago', function (moment) {
        return function (input, arg) {
            return moment(input).fromNow(arg);
        };
    })
    .filter('integer', function () {
        return function (input) {
            return parseInt(input);
        };
    })
    .directive('qvScroll', function ($uiViewScroll) {
        return {
            restrict: 'A',
            link: function postLink(scope, element, attrs) {
                var target = angular.element(document.body).find('#' + attrs.qvScroll);
                element.on('click', function (e) {
                    $uiViewScroll(target);
                });
            }
        };
    })
    .directive('qvAnchorLinks', function ($timeout, $rootScope) {
        return {
            restrict: 'A',
            link: function postLink(scope, element, attrs) {
                var body = angular.element(document.body),
                    evaluate = function () {
                        $timeout(function () {
                            element.find("[href^='#']").each(function () {
                                if (body.find(this.hash).length) {
                                    angular.element(this).show();
                                } else {
                                    angular.element(this).hide();
                                }

                            });
                        });
                    };

                $rootScope.$on('$stateChangeSuccess', evaluate);

                var off = $rootScope.$on('$stateChangeRender', function () {
                    evaluate();
                    off();
                });

            }
        };
    })
    .directive('qvFalse', function ($timeout) {
        return {
            restrict: 'A',
            scope: {
                'qvFalse': '='
            },
            link: function postLink(scope, element, attrs) {
                var delay = attrs.delay ? parseInt(attrs.delay) : 300;
                scope.$watch('qvFalse', function () {
                    if (scope.qvFalse) {
                        $timeout(function () {
                            scope.qvFalse = false;
                        }, delay);
                    }
                });
            }
        };
    })
    .directive('qvKeyUp', function () {
        return {
            restrict: 'A',
            link: function postLink(scope, element, attrs) {
                if (attrs.keyCode) {
                    var keyCode = parseInt(attrs.keyCode);

                    angular.element(document.body).on('keyup', function (e) {
                        if (e.keyCode === keyCode) {
                            scope.$eval(attrs.qvKeyUp);
                        }

                    });
                }
            }
        };
    })
    .directive('qvExclusive', function ($timeout) {
        return {
            restrict: 'A',
            link: function postLink(scope, element, attrs) {
                var name = attrs.name,
                    others = angular.element('[name="' + name + '"]').not(element);

                element.on('change', function (e) {
                    if (element.prop('checked')) {
                        others.prop('checked', false);
                    }
                });
            }
        }
    })
    .directive('qvModal', function ($timeout, _, $window) {
        return {
            restrict: 'A',
            transclude: true,
            template: '<div class="qv-modal" ng-transclude></div>',
            link: function (scope, element, attrs) {
                $timeout(function () {
                    var body = angular.element(document.body),
                        modal = element.find('.qv-modal'),
                        selector = attrs.qvModal,
                        closers = body.find('[qv-modal-close]'),
                        handleKeypress = _.debounce(function (e) {
                            switch (e.keyCode) {
                                case 27:
                                    close();
                                    break;
                                default:
                                    // console.log('unhandled keypress', e.keyCode);
                                    break;
                            }

                        }, 100),
                        handleClick = function (e) {
                            if (!angular.element.contains(modal.children()[0], e.target)) {
                                close();
                            }
                        },
                        close = function (e) {
                            if (e && typeof e.stopPropagation === 'function') {
                                e.stopPropagation();
                            }
                            modal.removeClass('open');
                            body.off('click', handleClick);
                            body.off('keyup', handleKeypress);
                            closers.on('click', close);
                        },
                        open = function (e) {
                            if (e && e.stopPropagation) {
                                e.stopPropagation();
                            }

                            modal.addClass('open');
                            window.dispatchEvent(new Event('resize'));
                            body.on('click', handleClick);
                            body.on('keyup', handleKeypress);
                            closers.on('click', close);
                        };

                    body.on('click', selector, open);

                    if (attrs.open) {
                        open();
                    }

                });

            }
        }
    })
    .directive('qvHighlight', function ($timeout) {
        return {
            restrict: 'A',
            link: function postLink(scope, element, attrs) {
                var bootstrap = function () {
                    var selector = attrs.selector || attrs.href,
                        targetClass = attrs.qvHighlight,
                        delay = parseInt(attrs.delay) || 2000;

                    element.on('click', function () {
                        var target = angular.element(selector);

                        target.addClass(targetClass);
                        $timeout(function () {
                            target.removeClass(targetClass);
                        }, delay);

                    });

                };

                element.one('mouseenter', bootstrap);

            }
        }
    })
    .directive('qvLightbox', function ($timeout, _) {
        return {
            restrict: 'A',
            transclude: true,
            scope: true,
            template: '<div class="qv-lightbox"><div class="marquee"><div class="floating-button text-white0 prev show-for-medium-up"><</div><img class="next"><div class="floating-button text-white0 next show-for-medium-up">></div></div><div class="drawer" ng-transclude></div></div>',
            link: function postLink(scope, element, attrs) {
                var bootstrap = function () {
                    var body = angular.element(document.body),
                        modal = element.find('.qv-lightbox'),
                        marquee = modal.find('.marquee'),
                        image = marquee.find('img'),
                        buttons = marquee.find('.floating-button'),
                        prev = modal.find('.prev'),
                        next = modal.find('.next'),
                        drawer = modal.find('.drawer'),
                        list = drawer.children('ul, ol'),
                        items = list.children('li'),
                        selected = false,
                        open = false,
                        src,
                        selectPrev = function () {
                            selected = selected.prev();
                            if (!selected.length) {
                                selected = items.last();
                            }
                            handleSelect(selected);

                        },
                        selectNext = function () {
                            selected = selected.next();
                            if (!selected.length) {
                                selected = items.first();
                            }
                            handleSelect(selected);

                        },
                        handleKeypress = _.debounce(function (e) {
                            switch (e.keyCode) {
                                case 27:
                                    handleClose();
                                    break;
                                case 37:
                                    selectPrev();
                                    break;
                                case 39:
                                    selectNext();
                                    break;
                                default:
                                    // console.log('unhandled keypress', e.keyCode);
                                    break;
                            }

                        }, 100),
                        handleSelect = function (selected) {
                            drawer.find('.selected').removeClass('selected');
                            selected.addClass('selected');
                            image.attr('src', selected.find('img').attr('src'));

                            if (!open) {
                                modal.addClass('open');
                                body.on('keyup', handleKeypress);
                            }

                        },
                        handleClose = function () {
                            body.off('keyup', handleKeypress);
                            modal.removeClass('open');
                            selected = undefined;
                            open = false;
                            image.removeAttr('src');
                            drawer.find('.selected').removeClass('selected');

                        };

                    items.on('click tap', function (e) {
                        e.stopPropagation();
                        selected = angular.element(e.target).closest('li');
                        handleSelect(selected);

                    });

                    prev.on('click tap', function (e) {
                        e.stopPropagation();
                        selectPrev();
                    });

                    next.on('click tap', function (e) {
                        e.stopPropagation();
                        selectNext();
                    });

                    element.on('click tap', handleClose);

                };

                element.one('mouseenter tap', bootstrap);

            }
        }
    })
    .directive('qvPinned', function ($timeout, $window, _) {
        return {
            restrict: 'A',
            link: function postLink(scope, element, attrs) {
                element.css('position', 'relative');

                var target = angular.element($window),
                    parent = element.parent(),
                    rawElement = element[0],
                    initialPosition = element.css('position'),
                    fixed = false,
                    limit,
                    on = false,
                    handler = function (e) {
                        var top = rawElement.getBoundingClientRect().top,
                            offsetTop = parent.offset().top,
                            scrollTop = target.scrollTop();

                        if (top < 0) {
                            on = true;
                        } else if (top >= (scrollTop - offsetTop)) {
                            on = false;
                            element.css('top', 0);
                        }

                        if (on) {
                            element.css('top', scrollTop - offsetTop);
                        }

                    };

                target.on('scroll', handler);
                target.on('resize', handler);
                $timeout(handler);

            }
        };
    })
    .directive('qvActive', function ($timeout, $state) {
        return {
            restrict: 'A',
            link: function postLink(scope, element, attrs) {
                var evaluateClass = function () {
                    var activeClass = attrs.qvActive || 'active',
                        links = angular.element(element).find('[ui-sref]'),
                        found = false;

                    links.each(function (index, link) {
                        if (link.attributes['ui-sref'].value === $state.$current.name) {
                            found = true;
                            if (typeof attrs.qvDisabled !== 'undefined') {
                                angular.element(link).attr('disabled', true);
                            }
                        }
                    });

                    if (found) {
                        element.addClass(activeClass);
                    } else {
                        element.removeClass(activeClass);
                    }


                    // if (!sref) {
                    //   console.warn('ui-sref not found');
                    // } else if (sref === $state.$current.name) {
                    //   element.addClass(activeClass);
                    // } else {
                    //   element.removeClass(activeClass);
                    // }
                };

                $timeout(evaluateClass);
                scope.$on('$stateChangeSuccess', evaluateClass);



            }
        };
    })
    .directive('qvDisplay', function ($timeout) {
        return {
            restrict: 'A',
            scope: {
                qvDisplay: "="
            },
            link: function (scope, element, attrs) {
                if (attrs.qvDisplay) {
                    var unbind;
                    $timeout(function () {
                        unbind = scope.$watch('qvDisplay', function () {
                            if (scope.qvDisplay) {
                                element.removeAttr('style');
                                unbind();
                            }

                        });
                    });

                } else {
                    $timeout(function () {
                        element.removeAttr('style');
                    });
                }

            }
        }
    })
    .directive('qvLoading', function ($timeout) {
        return {
            restrict: 'A',
            link: function postLink(scope, element, attrs) {
                var delay = parseInt(attrs.delay) || 300,
                    target = attrs.target ? angular.element(attrs.target) : element;

                target.on('click', function () {
                    $timeout(function () {
                        element.css('visibility', 'visible');
                    }, delay);
                });

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
                            elementHeight = element.outerHeight();

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
                            handleBodyClicks();
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

                keys = Object.keys(attributes || {});
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
    .directive('qvSelectText', function ($timeout, $window) {
        return {
            restrict: 'A',
            link: function postLink(scope, element, attrs) {
                var target = element[0];

                element.on(attrs.events || 'focus click', function (e) {
                    $timeout(function () {
                        if (attrs.qvSelectText) {
                            target = document.getElementById(attrs.qvSelectText);
                        }
                        if (typeof e.target.select === 'function') {
                            e.target.select();
                        } else if (document.selection) {
                            var range = document.body.createTextRange();
                            range.moveToElementText(target);
                            range.select();
                        } else if (window.getSelection) {
                            var range = document.createRange();
                            range.selectNodeContents(target);
                            $window.getSelection().removeAllRanges();
                            $window.getSelection().addRange(range);
                        }

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
                    element.css({
                        'width': (Math.min(scope.percent, 1) * 100) + '%'
                    });
                };

                scope.$watch('percent', setStyle);
            }
        };
    })
    .directive('qvEnter', function ($timeout) {
        return {
            restrict: 'A',
            link: function postLink(scope, element, attrs) {
                var handleKeyup = function (e, force) {
                    if (e.keyCode === 13 || force) {
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

                if (scope.$eval(attrs.autoEnter)) {
                    handleKeyup(false, true);
                }

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
    .directive('qvToStatic', function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                element.on('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    location.replace(attrs.href || attrs.qvToStatic || '/');
                });

            }
        }
    })
    .service('ObjectService', function (_) {
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
            },

            cleanRestangular: function (obj) {
                return _.omit(obj, ['fromServer', 'parentResource', 'reqParams', 'restangularCollection', 'restangularEtag', 'route']);
            }
        }

    })
    .service('NotificationService', function ($notification, quiverUtilities, $mdToast) {
        if (quiverUtilities.notificationConfig.toast) {
            var getContent = function (title, content) {
                if (title && !content) {
                    return title
                } else if (title && content) {
                    return title + ': ' + content;
                } else if (content) {
                    return content;
                } else {
                    return 'Achtung! Your toast needs butter.';
                }
            },
                getPosition = function () {
                    return quiverUtilities.notificationConfig.toast.position || {
                        "bottom": false,
                        "top": true,
                        "left": false,
                        "right": true
                    };
                },
                getDelay = function () {
                    return quiverUtilities.notificationConfig.toast.hideDelay || 4000;
                };

            return {
                notify: function (title, content) {
                    return $mdToast.show(
                        $mdToast.simple().content(getContent(title, content)).position(getPosition()).hideDelay(getDelay())
                    );

                },
                error: function (title, content) {
                    return $mdToast.show(
                        $mdToast.simple().content(getContent(title, content)).position(getPosition()).hideDelay(getDelay())
                    );
                },
                success: function (title, content) {
                    return $mdToast.show(
                        $mdToast.simple().content(getContent(title, content)).position(getPosition()).hideDelay(getDelay())
                    );
                },
                warning: function (title, content) {
                    return $mdToast.show(
                        $mdToast.simple().content(getContent(title, content)).position(getPosition()).hideDelay(getDelay())
                    );
                },
                custom: function (config) {
                    return $mdToast.show(config);
                },
                action: function (content, action, highlight) {
                    return $mdToast.show(
                        $mdToast.simple().content(getContent(title, content)).action(action || 'OK').highlightAction(highlight).position(getPosition())
                    );
                }
            };

        } else {
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

        }


    })
    .service('TrackingService', function (quiverUtilities, $window) {
        var track = function (type, eventName, parameters) {
            if (quiverUtilities.env.environment === 'development' || quiverUtilities.env.environment === 'test') {
                console.log(arguments);
            } else if (fbq && quiverUtilities.env.environment === 'production') {
                fbq(type, eventName, parameters);
            }
        };
        return {
            track: function (eventName, parameters) {
                track('track', eventName, parameters);
            },
            trackCustom: function (eventName, parameters) {
                track('trackCustom', eventName, parameters);
            }
        }
    });