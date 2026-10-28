
	if (window.module) module = window.module;

	const remote = require('electron').remote;
	var currentWindow = remote.getCurrentWindow();

	console.log(currentWindow);

	function _close() {
		currentWindow.close();
	}

	function minimize() {
		currentWindow.minimize();
	}

	function maximize() {

		if (currentWindow.isMaximized()) {
			currentWindow.unmaximize();
		} else {
			currentWindow.maximize();
		}

	}

	function _reload() {
		location.reload();
	}

	function _print() {
		document.getElementById('editor-container').classList.add('printing');
		var printContents = document.getElementById('editor-container').innerHTML;
		var originalContents = document.body.innerHTML;

		document.body.innerHTML = printContents;

		window.print();

		document.body.innerHTML = originalContents;
		document.getElementById('editor-container').classList.remove('printing');
	}

	(function () {

		$(document).on('click', '.toolbar-toggler', function () {

			$('.toolbar').toggleClass('shown');

		});

		if (!currentWindow.custom.window_action_layout_to_left) {
			$('.titlebar').addClass('right');
		}

		if(currentWindow.custom.gtk_theme_path) {
			var link = document.createElement( "link" );
			link.href = "output/gtk.css";
			link.type = "text/css";
			link.rel = "stylesheet";
			link.media = "screen,print";
			document.getElementsByTagName( "head" )[0].appendChild( link );

			$('body').addClass('csd');
			$('.titlebar').addClass('csd');
			$('.close, .minimize, .maximize').html('').addClass('custom');
		}

		var editor = new Editor();

	})();
