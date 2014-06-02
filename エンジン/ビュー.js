
var View

var DOM_READY = new Promise(function (ok) {
	window.addEventListener('DOMContentLoaded', ok)
})



var VIEW_READY = Promise.all([HELPER_READY, MODEL_READY, DOM_READY]).then(function () {
	'use strict'

	var EP = Element.prototype
	setDefalt(EP, 'on'               , EP.addEventListener)
	setDefalt(EP, 'requestFullscreen', EP.webkitRequestFullscreen || EP.mozRequestFullScreen)
	setDefalt(EP, 'append'           , EP.appendChild)
	setDefalt(EP, 'removeChildren'   , function () { this.innerHTML = ''; return this })
	setDefalt(EP, 'setStyles'        , function (styles) {
		styles = styles || {}
		Object.keys(styles).forEach(function (key) {
			this.style[key] = styles[key]
		}, this)
		return this
	})
	
	if (!document.onfullscreenchange) Object.defineProperty(document, 'onfullscreenchange', {
		set: function (val) {
			if ('onwebkitfullscreenchange' in document) document.onwebkitfullscreenchange = val
			else document.onmozfullscreenchange = val
		}
	})
	if (!document.fullscreenElement) Object.defineProperty(document, 'fullscreenElement', {
		get: function () { return document.webkitFullscreenElement || document.mozFullScreenElement }
	})



	function DOM(tagName, styles) {
		if (tagName == 'text') return document.createTextNode(styles)
		var el = document.createElement(tagName)
		return el.setStyles(styles)
	}


	var query    = document.querySelector.bind(document),
	    queryAll = document.querySelectorAll.bind(document)

	var el_root    = query('#playerwrapper'),
		el_wrapper = new DOM('div'),
	    el_player  = new DOM('div'),
	    el_context = new DOM('div')

		el_root.removeChildren()
		el_root.append(el_wrapper).append(el_player).append(el_context)

	var RAF = requestAnimationFrame



	function adjustScale(height, ratio, full) {

		LOG(arguments)

		if (!full) el_player.style.height = '100%'

		var ratio = ratio || 16 / 9

		var width = height * ratio

		el_player.style.fontSize = height / 20 + 'px'

		
		//width = screen.width < width ? screen.width : width

		el_wrapper.style.height = height + 'px'
		el_wrapper.style.width  = width  + 'px'
		if (full) el_player.style.height = height + 'px'
		else fitScreen = NOP 

		//RAF(styleAdjustLoop) 
	}
	


	var el_debug = new DOM('div', {
		width : '640px',
		textAlign: 'center',
	})


	;[240, 360, 480, 640, 720, 960, 1080].forEach(function (size) {

		var el = el_root.append(el_debug).append(new DOM('button'))
		el.append(new DOM('text', size + 'p'))
		el.on('click', function () { 
			adjustScale(size)
		})
	})

	var el = el_root.append(el_debug).append(new DOM('button'))
	el.append(new DOM('text', 'フルウィンドウ（横）'))
	el.on('click', function () {
		fitScreen = function () {
			var ratio = 16 / 9
			var width = document.body.clientWidth
			var height = width / ratio
			adjustScale(height, 0, true)
		}
		fitScreen()
	})

	var el = el_root.append(el_debug).append(new DOM('button'))
	el.append(new DOM('text', 'フルスクリーン（横）'))
	el.on('click', function () {
		el_player.requestFullscreen()
		fitScreen = function () {
			var ratio = 16 / 9
			var width = screen.width, height = screen.height
			if (height * ratio > width) height = width / ratio
			adjustScale(height, 0, true)
		}
		fitScreen()
	})


	function setDefalt(obj, name, value) {
		if (arguments.length !== 3) throw 'illegal arguments length'
		if (!(name in obj)) obj[name] = value
		return obj
	}

	function setDefalts(obj, props) {
		if (arguments.length !== 2) throw 'illegal arguments length'
		Object.keys(props).forEach(function (key) {
			if (!(key in obj)) obj[key] = props[key] 
		})
		return obj
	}

	var $full = false
	var $scale = 480
	var $ratio = 16 / 9

	adjustScale($scale, $ratio)

	var fitScreen = NOP
	window.onresize = function () { fitScreen() }

	document.onfullscreenchange = function () {
		var full = document.fullscreenElement == el_player
		LOG(full)
		if (!full) {
			//setTimeout(function () {
				//el_player.style.height = '100%'
				adjustScale($scale, $ratio)
			//}, 500)
		}
	}


	var METHODS = {}

	METHODS = {
		COMMON: {
			initDisplay: function (opt) {
				setDefalts(opt, {
					background		: 'black',
					margin			: 'auto',
					position		: 'relative',
					hidth			: '100%',
					height			: '100%',
				//	$height			: 360,
				//	$raito			: 16 / 9,
				})
				var height = opt.HEIGHT || 480

				opt.height = opt.width = '100%'

				el_context = new DOM('div')
				el_player.removeChildren()
				el_player.append(el_context)
				el_wrapper.setStyles({ maxHeight: '100%', maxWidth: '100%' })
				if (!document.fullscreenElement) el_player.setStyles({ height: '100%', width: '100%' })
				el_context.setStyles(opt)
			},
			adjustScale: adjustScale,
		},
	}

	METHODS = {
		TEST: { __proto__: METHODS.COMMON,
			initDisplay: function (opt) {
				setDefalts(opt, {
					fontSize		:　'calc(100% * 2 / 3)',
					color			: 'white',
				})
				this.__proto__.initDisplay(opt)
				var el = new DOM('div', {
					padding: '10px',
				})
				var el_body = new DOM('pre')
				this.el_test = el_body
				el_context.append(el).append(el_body)
			},
			print: function (text, opt) {
				this.el_test.textContent = text
			},
		},

		NOVEL: { __proto__: METHODS.COMMON,
			initDisplay: function (opt) {
				setDefalts(opt, {
					color			: 'rgba(255,255,255,0.9)',
				//	fontSize		: 'calc(480px / 20)',

					textShadow		: 'rgba(0,0,0,0.9) 0.1em 0.1em 0.1em',
					overflow		: 'hidden',
				})
				this.__proto__.initDisplay(opt)

				this.mainMessageWindow = this.addMessageWindow({z:10})
				this.imageFrame = this.addImageFrame({z:20})

			},

			messageWindowProto: {
				nextPage: function (name, opt) {
					name = !name || name.match(/^\s+$/) ? '' : '【' +name+ '】' 
					this.el_title.textContent = name
					this.el_body.removeChildren()

				},
				addSentence: function (text, opt) {
					var el = DOM('text', text + '\n')
					this.el_body.append(el)
				},
			},

			addMessageWindow: function (opt) {
				setDefalts(opt, {
					background		: 'rgba(0,0,100,0.5)',
					boxShadow		: 'rgba(0,0,100,0.5) 0px 0px 5px 5px',
					borderRadius	: '1% / 1%',
					width			: 'calc(100% - 10px - (2% + 2%))',
					height			: 'calc( 30% - 10px - (4% + 2%))',
					fontSize		: '100%',
					lineHeight		: '1.3em',
					fontWeight		: 'bold',
					padding			: '4% 2% 2% 2%',
					position		: 'absolute',
					bottom			: '5px',
					left			: '5px',
					zIndex			: opt.z || 10,

				})
				var el = new DOM('div', opt)
				el_context.append(el)

				var el_title = el.append(new DOM('div', {
					display			: 'inline-block',
					marginRight		: '5%',
				//	color			: 'blue',
					textAlign		: 'right',
					verticalAlign	: 'top',
					width			: '20%',
					height			: '100%',
				//	background		: 'rgba(255,100,200,0.5)',
				//	padding			: '5px',
				}))
				var el_body = el.append(new DOM('div', {
					display			: 'inline-block',
					width			: 'auto',
					height			: '100%',
				//	padding			: '15px',
				})).append(new DOM('pre', {
					margin			: '0',
				}))

				var mw = { __proto__: this.messageWindowProto,
					el				: el,
					el_title		: el_title,
					el_body			: el_body,
				}

				return mw
			},

			addImageFrame: function (opt) {

				var fr = new DOM('div', {
					height			: '100%',
					width			: '100%',
					zIndex			: opt.z || 10,
				})

				el_context.append(fr)
				return fr

			},

			setChoiceWindow: function (opts) {

				var defer = Promise.defer()

				var cw = new DOM('div', {
					position		: 'absolute',
					left			: 'calc((100% - 60%) / 2 - 10%)',
					width			: '60%',
					top				: '10%', 
					boxShadow		: 'rgba(100, 100, 255, 0.5) 0 0 2em',
					borderRadius	: '3% / 5%',
					background		: 'rgba(100, 100, 255, 0.3)',
					padding			: '5% 10%',

				})

				opts.forEach(function (opt) {
					var bt = new DOM('button', {
						display			: 'block',
						fontSize		: '100%',
						boxShadow		: 'inset 0 1px 3px #F1F1F1, inset 0 -15px rgba(0,0,223,0.2), 1px 1px 2px #E7E7E7',
						background		: 'rgba(0,0,100,0.8)',
						color			: 'white',
						borderRadius	: '5% / 50%',
						width			: '100%',
						height			: '2.5em',
						margin			: '5% 0%',
					})
					bt.append(new DOM('text', opt.name))
					bt.onclick = function () {
						defer.resolve(opt.value)
						cw.remove()
					}
					cw.append(bt)
				})

				el_context.append(cw)

				return defer.promise

			},

			setBGImage: function (opt) {
				el_context.style.backgroundImage = opt.url
				el_context.style.backgroundSize = 'cover'
			},

			setFDImages: function (opts) {
				var el = this.imageFrame
				el.removeChildren()
				opts.forEach(function (opt) {
					var img = new DOM('img', {
						position		: 'absolute',
						left			: opt.left  || '',
						right			: opt.right || '',
						maxWidth		: '50%',
						height			: '100%',
					})
					img.src = opt.url
					el.append(img)
				})
			},

			nextPage: function (name, opt) {
				this.mainMessageWindow.nextPage(name, opt)
			},

			addSentence: function (text, opt) {
				this.mainMessageWindow.addSentence(text, opt)
			},
		},

	}





	var ViewProto = { __proto__: METHODS.COMMON,
		fresh: function () {
			View = { __proto__: ViewProto }
		},
		init: function (opt) {
			this.initDisplay(opt.style || {})
		},
		initDisplay: function (opt) {
			this.__proto__.initDisplay(opt)
		},
		changeMode: function (type, opt) {
			var type = type.toUpperCase()
			opt = opt || {}

			if (!type in METHODS) throw 'illegal ViewContext mode type'

			ViewProto.__proto__ = METHODS[type]
			View.init(opt)

		},
		on: function (type, onFulfilled, onRejected) {

			 return new Promise(function (resolve) {
				
				switch (type) {

					case 'go':
						hookInput(['Lclick', 'enter', 'space'], resolve)
					break

					default: throw 'illegal hook event type'		
				}
			}).then(onFulfilled).catch(onRejected)

		},
	}

	ViewProto.fresh()



	var hookInput = function () {

		var keyboardTable = {
			13: 'enter',
			32: 'space',
		}

		var hooks = []

		document.addEventListener('keydown', function (evt) {
			var type = keyboardTable[evt.keyCode]
			if (type) onEvent(type, evt)
		})

		el_wrapper.addEventListener('mousedown', function (evt) {
			var type = 'LMR'[evt.button]
			if (type) onEvent(type + 'click', evt)
		})

		function onEvent(type, evt) {
			evt.preventDefault()
			hooks.forEach(function (hook, i) {
				if (hook.indexOf(type) === -1) return
				hooks.splice(i, 1)
				hook.resolve()
			})
		}

		return function hookInput(hook, resolve) {
			hook.resolve = resolve
			hooks.push(hook)
		}
	}()


})