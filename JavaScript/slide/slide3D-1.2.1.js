/**
 * slide3D 1.2.1
 * 
 * https://github.com/IronPans/slide3D
 * 
 * Copyright 2017, TG
 * 
 * Released on: January 5, 2017
 */
(function(window) {
	var Slide3D = function(container, params) {
		params = params || {};
		//初始化参数
		var options = {
			speed: 500, // 滑动速度，即slider自动滑动开始到结束的时间（单位ms）
			effect: 'slide', //切换效果 flip | turn | slide | flat | fragment
			direction: 'horizontal', // 切换方向
			distance: 30,
			pagination: false, // 分页器
			loop: false, // 是否循环
			autoplay: false, // 自动播放
			box: { // 分格
				rows: 6, // 行
				cols: 3 //列
			},
			autoplayDisableOnInteraction: true
		};
		var originParams = {};
		for(var p in params) {
			if(typeof params[p] === 'object') {
				originParams[p] = {};
				for(var dp in params[p]) {
					originParams[p][dp] = params[p][dp];
				};
			} else {
				originParams[p] = params[p];
			};
		};
		for(var d in options) {
			if(typeof params[d] === 'object') {
				for(var dp in options[d]) {
					if(typeof params[d][dp] === 'undefined') {
						params[d][dp] = options[d][dp];
					};
				};
			} else if(typeof params[d] === 'undefined') {
				params[d] = options[d];
			};
		};
		var s = this;
		s.params = params;
		s.originParams = originParams;
		s.isPressed = false;
		s.mouse = {
			x: 0,
			y: 0,
			sx: 0,
			sy: 0
		};
		s.container = container;
		s.pagination = null;
		s.rotation = 0;
		s.lock = false;
		s.currentIndex = 0;
		s.activeIndex = 0;
		s.direction = '';
		s.autoplaying = true;
		s.container = typeof s.container === 'string' ? document.querySelectorAll(s.container) : s.container;
		if(s.container.length == 0) {
			return;
		};
		if(s.container.length > 1) {
			var slides = [];
			Array.prototype.forEach.call(s.container, function(child) {
				child.length = 1;
				slides.push(new Slide3D(child, params));
			});
			return slides;
		};
		s.container = s.container[0] || s.container;
		//判断是否移动端
		s.isTouch = 'ontouchend' in document;
		s.wrapper = s.container.querySelector('.wrapper3D');
		s.slides = s.wrapper.querySelectorAll('.slide3D');
		s.totalLength = s.slides.length;
		//更新轮番尺寸
		s.updateContainerSize = function() {
			var width, height;
			if(typeof s.params.width !== 'undefined') {
				width = s.params.width;
			} else {
				width = s.container.clientWidth;
			};
			if(typeof s.params.height !== 'undefined') {
				height = s.params.height;
			} else {
				height = s.container.clientHeight;
			};
			s.params.width = width;
			s.params.height = height;
			s.container.style.width = parseFloat(s.params.width) + 'px';
			s.container.style.height = parseFloat(s.params.height) + 'px';
			Array.prototype.forEach.call(s.slides, function(slide, i) {
				slide.style.width = s.params.width + 'px';
				slide.style.height = s.params.height + 'px';
			});
			s.effects.event.init();
		};

		//判断是否加载分页器
		s.addPagination = function() {
			s.pagination = s.container.querySelector('.slide3D-pagination');
			if(s.params.pagination && s.pagination) {
				var bullets = [];
				for(var i = 0; i < s.totalLength; i++) {
					var bullet = document.createElement('span');
					bullet.setAttribute('data-index', i);
					bullet.className = 'slide3D-pagination-bullet';
					if(i == 0) {
						bullet.classList.add('slide3D-pagination-bullet-active');
					};
					if(s.params.paginationClickable) {
						addEvent(bullet, 'click', function() {
							var index = parseInt(this.getAttribute('data-index'));
							s.slideTo(index);
							s.autoplaying = false;
						});
					}
					s.pagination.appendChild(bullet);
				};
			};
		};
		// 切换动画
		s.executeAnimate = function() {
			function end() {
				if(s.params.pagination) {
					var bullets = s.pagination.querySelectorAll('.slide3D-pagination-bullet');
					Array.prototype.forEach.call(bullets, function(bullet) {
						bullet.classList.remove('slide3D-pagination-bullet-active');
					});
					bullets[s.activeIndex].classList.add('slide3D-pagination-bullet-active');
				};
				s.restartInterval();
			};
			var animation = {
				turn: {
					transitionstart: function(s) {
						s.wrapper.style.backgroundImage = 'none';
					},
					animate: function(item, fn, fnEnd, index) {
						var rotation = 0;
						var data = [];
						clearInterval(item.timer);
						item.timer = setInterval(function() {
							rotation += 10;
							data['rotation'] = rotation;
							if(fn) fn.call(item, data);
							if(rotation >= 180) {
								clearInterval(item.timer);
								if(fnEnd) fnEnd.call(item);
							}
						}, 30);
					},
					execute: function(item) {
						(function(item) {
							setTimeout(function() {
								animation[s.params.effect].animate(item, function(data) {
									if(data['rotation'] > 90 && !item.change) {
										item.style.backgroundImage = 'url(' + s.params.sources[s.activeIndex] + ')';
										item.change = true;
									};
									if(data['rotation'] > 90) {
										s.setTransform(item, 'perspective(500px) rotateY(' + data['rotation'] + 'deg) scale(-1, 1)');
									} else {
										s.setTransform(item, 'perspective(500px) rotateY(' + data['rotation'] + 'deg)');
									}
								}, function() {
									if(--total == 0) {
										s.wrapper.style.backgroundImage = 'url(' + s.params.sources[s.activeIndex] + ')';
										s.wrapper.innerHTML = '';
										s.lock = false;
										end();
									};
									item.change = false;
								});
							}, (i % c + Math.floor(i / c)) * 200);
						})(item);
					},
					transitionend: function() {

					}
				},
				flip: {
					transitionstart: function(s) {

					},
					animate: function(item, fn, fnEnd, index) {
						var rotation = 0;
						var offsetZ = 0;
						var opacity = 1;
						var data = [];
						clearInterval(item.timer);
						var ar = 5;
						item.timer = setInterval(function() {
							rotation += 5;
							offsetZ += 20;
							opacity -= 0.05;
							data['rotation'] = rotation;
							data['offsetZ'] = offsetZ;
							data['opacity'] = opacity;
							data['index'] = index;
							if(fn) fn.call(item, data);
							if(Math.abs(rotation) > 90) {
								clearInterval(item.timer);
								if(fnEnd) fnEnd.call(item);
							}
						}, 20);
					},
					execute: function(item) {
						(function(item) {
							animation[s.params.effect].animate(item, function(data) {
								s.setTransform(item, 'translate3d(0, 0, ' + data['offsetZ'] + 'px) rotateX(' +
									data['rotation'] * 0.5 + 'deg) rotateY(' + data['rotation'] + 'deg)');
								item.style.opacity = data['opacity'];
							}, function() {
								if(--total == 0) {
									s.wrapper.innerHTML = '';
									s.lock = false;
									end();
								}
							}, i);
						})(item);
					},
					transitionend: function(s) {
						s.wrapper.style.backgroundImage = 'url(' + s.params.sources[s.activeIndex] + ')';
					}
				},
				flat: {
					transitionstart: function(s) {
						s.params.box['rows'] = 1;
					},
					animate: function(item, fn, fnEnd, index) {
						var offsetY = 0;
						if(item.index % 2) {
							offsetY = -s.params.height;
						} else {
							offsetY = s.params.height;
						};
						var data = [];
						var easing = 0.5;
						var ax = 1;
						var isOver = false;
						clearInterval(item.timer);
						item.timer = setInterval(function() {
							ax += 3;
							if(item.index % 2) {
								offsetY += (10 + ax * easing);
								data['offsetY'] = (offsetY >= 0 ? 0 : offsetY);
								isOver = offsetY >= 0;
							} else {
								offsetY -= (10 + ax * easing);
								data['offsetY'] = (offsetY <= 0 ? 0 : offsetY);
								isOver = offsetY <= 0;
							};
							if(fn) fn.call(item, data);
							if(isOver) {
								clearInterval(item.timer);
								if(fnEnd) fnEnd.call(item);
							}
						}, 20);
					},
					execute: function(item) {
						if(i % 2) {
							s.setTransform(item, 'translate3d(0, -' + s.params.height + 'px, 0');
						} else {
							s.setTransform(item, 'translate3d(0, ' + s.params.height + 'px, 0');
						};
						item.index = i;
						(function(item) {
							setTimeout(function() {
								animation[s.params.effect].animate(item, function(data) {
									s.setTransform(item, 'translate3d(0, ' + data['offsetY'] + 'px, 0');
								}, function() {
									if(--total == 0) {
										s.wrapper.innerHTML = '';
										s.wrapper.style.backgroundImage = 'url(' + s.params.sources[s.activeIndex] + ')';
										s.lock = false;
										end();
									}
								}, i);
							}, 200 + (i % 2) * 50);
						})(item);
					},
					transitionend: function() {

					}
				},
				fragment: {
					transitionstart: function(s) {

					},
					animate: function(item, fn, fnEnd, index) {
						var opacity = 0;
						var data = [];
						clearInterval(item.timer);
						item.timer = setInterval(function() {
							opacity += 0.05;
							data['opacity'] = opacity;
							data['index'] = index;
							if(fn) fn.call(item, data);
							if(opacity >= 1) {
								clearInterval(item.timer);
								if(fnEnd) fnEnd.call(item);
							}
						}, 20);
					},
					execute: function(item) {
						(function(item) {
							setTimeout(function() {
								animation[s.params.effect].animate(item, function(data) {
									item.style.opacity = data['opacity'];
								}, function() {
									if(--total == 0) {
										s.wrapper.innerHTML = '';
										s.lock = false;
										end();
										s.wrapper.style.backgroundImage = 'url(' + s.params.sources[s.activeIndex] + ')';
									}
								}, i);
							}, i * 50);
						})(item);
					},
					transitionend: function() {

					}
				}
			};
			animation[s.params.effect].transitionstart && animation[s.params.effect].transitionstart(s);
			var url = '';
			switch(s.params.effect) {
				case 'flat':
				case 'fragment':
					url = s.params.sources[s.activeIndex];
					break;
				case 'flip':
				case 'turn':
					url = s.params.sources[s.currentIndex];
					break;
			};
			var r = s.params.box.rows;
			var c = s.params.box.cols;
			var width = Math.ceil(s.params.width / c);
			var height = Math.ceil(s.params.height / r);
			var length = r * c;
			var total = r * c;
			var cssText = '';
			for(var i = 0; i < length; i++) {
				var left = i % c * width;
				var top = Math.floor(i / c) * height;
				var flipItem = document.createElement('div');
				if(s.params.effect == 'fragment') {
					cssText += 'opacity:0;';
				};
				cssText += 'position:absolute;left:' + left + 'px;top:' + top + 'px;';
				cssText += 'width:' + width + 'px;height:' + height + 'px;';
				cssText += 'background-image:url(' + url + ');';
				cssText += 'background-position:-' + left + 'px -' + top + 'px;';
				cssText += 'background-size:' + s.params.width + 'px ' + s.params.height + 'px;';
				cssText += 'background-repeat:no-repeat;';
				flipItem.style.cssText = cssText;
				flipItem.change = false;
				animation[s.params.effect].execute(flipItem);
				s.wrapper.appendChild(flipItem);
			};
			animation[s.params.effect].transitionend && animation[s.params.effect].transitionend(s);
		};
		s.effects = {
			slide: {
				init: function() {
					if(s.params.direction == 'horizontal') {
						if(s.params.loop) {
							s.wrapper.style.width = s.params.width * (s.totalLength + 2) + 'px';
						} else {
							s.wrapper.style.width = s.params.width * s.totalLength + 'px';
						};
					} else if(s.params.direction == 'vertical') {
						s.container.classList.add('container3D-vertical');
						if(s.params.loop) {
							s.wrapper.style.height = s.params.height * (s.totalLength + 2) + 'px';
						} else {
							s.wrapper.style.height = s.params.height * s.totalLength + 'px';
						}
					};
					if(s.params.loop) {
						var firstChild = s.wrapper.firstElementChild.cloneNode(true);
						var lastChild = s.wrapper.lastElementChild.cloneNode(true);
						s.wrapper.appendChild(firstChild);
						s.wrapper.insertBefore(lastChild, s.wrapper.firstElementChild);
						s.setTransitionDuration(s.wrapper, 0);
						s.currentIndex = 1;
						s.moveTo(s.activeIndex + 1);
					};
				},
				touchmove: function() {
					if(s.params.direction == 'horizontal') {
						s.setTransform(s.wrapper, 'translate3d(' +
							(s.mouse.sx - s.params.width * s.currentIndex) + 'px, 0, 0)');
					} else {
						s.setTransform(s.wrapper, 'translate3d(0, ' +
							(s.mouse.sy - s.params.height * s.currentIndex) + 'px, 0)');
					}
				},
				touchend: function() {
					if(s.params.direction == 'horizontal') {
						s.effects.slide.move(s.mouse.sx);
					} else if(s.params.direction == 'vertical') {
						s.effects.slide.move(s.mouse.sy);
					};
				},
				transitionend: function() {
					if(s.params.loop) {
						if(s.currentIndex == 0) {
							s.activeIndex = s.totalLength - 1;
							s.currentIndex = s.activeIndex + 1;
							s.moveTo(s.activeIndex + 1);
						} else if(s.currentIndex == s.totalLength + 1) {
							s.activeIndex = 0;
							s.currentIndex = s.activeIndex + 1;
							s.moveTo(s.activeIndex + 1);
						} else {
							s.activeIndex = s.currentIndex - 1;
						};
					} else {
						s.currentIndex = s.activeIndex;
					};
					if(s.params.pagination) {
						var bullets = s.pagination.querySelectorAll('.slide3D-pagination-bullet');
						Array.prototype.forEach.call(bullets, function(bullet) {
							bullet.classList.remove('slide3D-pagination-bullet-active');
						});
						bullets[s.activeIndex].classList.add('slide3D-pagination-bullet-active');
					};
				},
				move: function(offset) {
					var isMove = Math.abs(offset) > s.params.distance;
					if(s.params.loop) {
						if(offset < 0 && isMove) {
							s.currentIndex++;
						} else if(offset > 0 && isMove) {
							s.currentIndex--;
						};
						s.moveTo(s.currentIndex);
					} else {
						if((s.activeIndex == 0 && offset > 0) || (s.activeIndex == s.totalLength - 1 && offset < 0)) {
							s.moveTo(s.activeIndex);
						} else if(s.activeIndex >= 0 && s.activeIndex < s.totalLength) {
							if(offset < 0 && isMove) {
								s.activeIndex++;
							} else if(offset > 0 && isMove) {
								s.activeIndex--;
							};
						};
						s.moveTo(s.activeIndex);
					};
					var isMove = (s.params.direction == 'horizontal' && s.mouse.sx != 0) ||
						(s.params.direction == 'vertical' && s.mouse.sy != 0);
					if(isMove) {
						s.lock = true;
					}
				}
			},
			event: {
				init: function() {
					if(s.params.effect != 'slide') {
						s.wrapper.innerHTML = '';
						s.wrapper.style.backgroundImage = 'url(' + s.params.sources[s.activeIndex] + ')';
						s.wrapper.style.backgroundSize = '100% 100%';
						s.wrapper.style.backgroundRepeat = 'no-repeat';
						s.totalLength = s.params.sources.length;
						var class3D = 'wrapper3D-' + s.params.effect;
						s.wrapper.classList.add(class3D);
						s.container.classList.add('container3D-horizontal');
					} else {
						s.effects[s.params.effect].init && s.effects[s.params.effect].init();
						if(s.params.direction == 'vertical') {
							s.container.classList.add('container3D-vertical');
						} else {
							s.container.classList.add('container3D-horizontal');
						}
					};
				},
				touchstart: function() {

				},
				touchmove: function() {
					if(s.params.effect == 'slide') {
						s.effects[s.params.effect].touchmove && s.effects[s.params.effect].touchmove();
					}
				},
				touchend: function() {
					if(s.params.effect != 'slide') {
						var isMove = Math.abs(s.mouse.sx) > s.params.distance;
						if(isMove) {
							s.currentIndex = s.activeIndex;
							if(s.mouse.sx > 0) {
								s.slidePrev();
							} else if(s.mouse.sx < 0) {
								s.slideNext();
							};
						}
					} else {
						s.effects[s.params.effect].touchend && s.effects[s.params.effect].touchend();
					}
				},
				transitionend: function() {
					s.effects[s.params.effect].transitionend && s.effects[s.params.effect].transitionend();
				}
			}
		};
		s.updateActiveIndex = function() {
			if(s.activeIndex < 0) {
				s.activeIndex = s.totalLength - 1;
			} else {
				s.activeIndex = s.activeIndex % s.totalLength;
			}
		};
		s.touchStartEvent = function(event) {
			if(s.lock) return;
			s.isPressed = true;
			s.autoplaying = false;
			s.setTransitionDuration(s.wrapper, 0);
			s.mouse.x = event.point.x;
			s.mouse.y = event.point.y;
			s.effects.event.touchstart();
		};
		s.touchMoveEvent = function(event) {
			if(s.isPressed && !s.lock) {
				s.mouse.sx = event.point.x - s.mouse.x;
				s.mouse.sy = event.point.y - s.mouse.y;
				s.effects.event.touchmove();
			}
		};
		s.touchEndEvent = function(event) {
			if(s.lock) return;
			s.isPressed = false;
			s.setTransitionDuration(s.wrapper, s.params.speed);
			s.effects.event.touchend();
		};
		s.setInterval = function() {
			if(s.params.autoplay) {
				clearInterval(s.intervalId);
				s.intervalId = setInterval(function() {
					if(!s.lock){
						var index = s.activeIndex + 1;
						s.slideTo(index);
						s.autoplaying = true;
					};
				}, s.params.autoplay);

			}

		};
		s.restartInterval = function() {
			if(s.params.autoplay) {
				if(s.autoplaying || !s.params.autoplayDisableOnInteraction) {
					s.autoplaying = true;
					s.setInterval();
				}
			}
		};
		s.stopInterval = function() {
			clearInterval(s.intervalId);
			s.autoplaying = false;
		};
		s.initEvnet = function() {
			s.captureMT(s.wrapper, s.touchStartEvent, s.touchMoveEvent, s.touchEndEvent);
			//监听过渡是否结束
			if(s.params.effect == 'slide') {
				transitionEnd(s.wrapper, function() {
					s.setTransitionDuration(s.wrapper, 0);
					s.effects.event.transitionend();
					s.lock = false;
					if(s.params.autoplay && !s.params.autoplayDisableOnInteraction) {
						s.setInterval();
					}
				});
			};
			var next = s.container.querySelector('.slide3D-next-button');
			var prev = s.container.querySelector('.slide3D-prev-button');
			addEvent(next, 'click', s.slideNext, false);
			addEvent(prev, 'click', s.slidePrev, false);
			s.setInterval();
		};
		//切换到某一页
		s.moveTo = function(index) {
			if(s.params.direction == 'horizontal') {
				s.setTransform(s.wrapper, 'translate3d(-' + (s.params.width * index) + 'px, 0, 0)');
			} else if(s.params.direction == 'vertical') {
				s.setTransform(s.wrapper, 'translate3d(0, -' + (s.params.height * index) + 'px, 0)');
			}
		};
		s.slideTo = function(index) {
			if(s.lock) return;
			s.lock = true;
			s.stopInterval();
			if(s.params.effect == 'slide') {
				s.setTransitionDuration(s.wrapper, s.params.speed);
				s.moveTo(index + 1);
				s.activeIndex = s.currentIndex = index + 1;
			} else {
				s.currentIndex = s.activeIndex;
				s.activeIndex = index;
				s.updateActiveIndex();
				s.executeAnimate();
			}
		};
		s.slideNext = function() {
			if(s.lock) return;
			s.lock = true;
			s.stopInterval();
			if(s.params.effect == 'slide') {
				s.setTransitionDuration(s.wrapper, s.params.speed);
				s.effects.slide.move(-40);
			} else {
				s.currentIndex = s.activeIndex;
				s.activeIndex++;
				s.updateActiveIndex();
				s.executeAnimate();
			}
		};
		s.slidePrev = function() {
			if(s.lock) return;
			s.lock = true;
			s.stopInterval();
			if(s.params.effect == 'slide') {
				s.setTransitionDuration(s.wrapper, s.params.speed);
				s.effects.slide.move(40);
			} else {
				s.currentIndex = s.activeIndex;
				s.activeIndex--;
				s.updateActiveIndex();
				s.executeAnimate();
			}
		};
		//设置transform过渡属性
		s.setTransform = function(element, animation) {
			element.style.webkitTransform = animation;
			element.style.mozTransform = animation;
			element.style.oTransform = animation;
			element.style.msTransform = animation;
			element.style.transform = animation;
		};
		//设置过渡时间
		s.setTransitionDuration = function(element, times) {
			element.style.webkitTransitionDuration = times + 'ms';
			element.style.mozTransitionDuration = times + 'ms';
			element.style.oTransitionDuration = times + 'ms';
			element.style.transitionDuration = times + 'ms';
		};
		s.captureMT = function(element, touchStartEvent, touchMoveEvent, touchEndEvent) {
			'use strict';
			var touchstart = null;
			var touchmove = null
			var touchend = null;
			if(s.isTouch) {
				touchstart = 'touchstart';
				touchmove = 'touchmove';
				touchend = 'touchend';
			} else {
				touchstart = 'mousedown';
				touchmove = 'mousemove';
				touchend = 'mouseup';
			};
			/*传入Event对象*/
			function getPoint(event) {
				/*将当前的触摸点坐标值减去元素的偏移位置，返回触摸点相对于element的坐标值*/
				var touchEvent = s.isTouch ? event.changedTouches[0] : event;
				var x = (touchEvent.pageX || touchEvent.clientX +
					document.body.scrollLeft + document.documentElement.scrollLeft);
				x -= element.parentNode.offsetLeft;
				var y = (touchEvent.pageY || touchEvent.clientY +
					document.body.scrollTop + document.documentElement.scrollTop);
				y -= element.parentNode.offsetTop;
				return {
					x: x,
					y: y
				};
			};
			if(!element) return;
			/*为element元素绑定touchstart事件*/
			element.addEventListener(touchstart, function(event) {
				event = event || window.event;
				event.point = getPoint(event);
				touchStartEvent && touchStartEvent.call(this, event);
			}, false);

			/*为element元素绑定touchmove事件*/
			element.addEventListener(touchmove, function(event) {
				event = event || window.event;
				event.point = getPoint(event);
				touchMoveEvent && touchMoveEvent.call(this, event);
			}, false);

			/*为element元素绑定touchend事件*/
			element.addEventListener(touchend, function(event) {
				event = event || window.event;
				event.point = getPoint(event);
				touchEndEvent && touchEndEvent.call(this, event);
			}, false);
		};
		//阻止图片拖动
		s.stopImageDrag = function() {
			var images = s.container.querySelectorAll('img');

			function stopDrag(event) {
				event = event || window.event;
				if(event.preventDefault) {
					event.preventDefault();
				} else {
					event.returnValue = true;
				}
			};
			for(var i = 0; i < images.length; i++) {
				addEvent(images[i], 'dragstart', stopDrag, false);
			}
		};
		//监听过渡开始
		var transitionStart = function(elem, handler) {
			elem.addEventListener('transitionstart', handler, false);
			elem.addEventListener('webkitTransitionStart', handler, false);
			elem.addEventListener('mozTransitionStart', handler, false);
			elem.addEventListener('oTransitionStart', handler, false);
		};
		//监听过渡结束
		var transitionEnd = function(elem, handler) {
			elem.addEventListener('transitionend', handler, false);
			elem.addEventListener('webkitTransitionEnd', handler, false);
			elem.addEventListener('mozTransitionEnd', handler, false);
			elem.addEventListener('oTransitionEnd', handler, false);
		};
		//绑定事件
		var addEvent = function(element, type, handler, useCapture) {
			var useCapture = useCapture || false;
			if(element.addEventListener) {
				element.addEventListener(type, handler, useCapture);
			} else if(element.attachEvent) {
				element.attachEvent("on" + type, handler);
			};
		};
		//移除事件
		var removeEvent = function(element, type, handler, useCapture) {
			var useCapture = useCapture || false;
			if(element.removeEventListener) {
				element.removeEventListener(type, handler, useCapture);
			} else if(element.detachEvent) {
				element.detachEvent(type, handler);
			};
		};
		//加载图片
		var loadImages = function(sources, callback) {
			var count = 0,
				images = {},
				imgNum = sources.length;
			for(var k = 0; k < imgNum; k++) {
				images[k] = new Image();
				images[k].src = sources[k];
				// 判断图片是否已经存在
				if(images[k].complete || images[k].width) {
					count++;
				}
				images[k].onload = function() {
					if(++count >= imgNum) {
						callback(images);
					}
				};
			};
		};
		s.pageInit = function() {
			s.updateContainerSize();
			s.addPagination();
			s.initEvnet();
			s.stopImageDrag();
		};
		s.pageInit();
		return s;
	};

	window.Slide3D = Slide3D;
})(window);