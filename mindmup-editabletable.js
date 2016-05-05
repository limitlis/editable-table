/*global $, window*/
$.fn.editableTableWidget = function (options) {
	'use strict';
	return $(this).each(function () {
		function bindEvents () {
			editor.blur(function () {
					setActiveText();
					editor.hide();
				}).keydown(function (e) {
					if (e.which === ENTER) {
						setActiveText();
						editor.hide();
						active.focus();
						e.preventDefault();
						e.stopPropagation();
					} else if (e.which === ESC) {
						editor.val(active.text());
						e.preventDefault();
						e.stopPropagation();
						editor.hide();
						active.focus();
					} else if (e.which === TAB) {
						active.focus();
					} else if (this.selectionEnd - this.selectionStart === this.value.length) {
						var possibleMove = movement(active, e.which);
						if (possibleMove.length > 0) {
							possibleMove.focus();
							e.preventDefault();
							e.stopPropagation();
						}
					}
				})
				.on('input paste', function () {
					var evt = $.Event('validate');
					active.trigger(evt, editor.val());
					if (evt.result === false) {
						editor.addClass('error');
					} else {
						editor.removeClass('error');
					}
				});
			}

		var buildDefaultOptions = function () {
				var opts = $.extend({}, $.fn.editableTableWidget.defaultOptions);
				opts.editorText = opts.editorText.clone();
				opts.editorSelect = opts.editorSelect.clone();
				return opts;
			},
			activeOptions = $.extend(buildDefaultOptions(), options),
			ARROW_LEFT = 37, ARROW_UP = 38, ARROW_RIGHT = 39, ARROW_DOWN = 40, ENTER = 13, ESC = 27, TAB = 9,
			element = $(this),
			editor,
			editorText = activeOptions.editorText.css('position', 'absolute').hide().appendTo(element.parent()),
			editorSelect = activeOptions.editorSelect.css('position', 'absolute').hide().appendTo(element.parent()),
			active,
			showEditor = function (select) {
				active = element.find('td:focus:not(' + activeOptions.skipClass + ')');
				if (active.length) {
					if (!active.data('type-options')) {
						editor = editorText.val(active.text())
							.removeClass('error')
							.show()
							.offset(active.offset())
							.css(active.css(activeOptions.cloneProperties))
							.width(active.width())
							.height(active.height())
							.focus();
						bindEvents();

					} else if (active.data('type-options')) {
						editorSelect.children('option').remove();

						// Create options based on data-select-options
						var tempOptions = active.data('type-options'),
							selected = false;
						if (tempOptions.length) {
							for(var i = 0; i < tempOptions.length; i++) {
								if (active.text() === tempOptions[i]) {
									selected = true;
								}
								editorSelect.append($('<option value="' + tempOptions[i] + '" ' + (selected ? 'selected' : '') +'>' + tempOptions[i] + '</option>'));
							}
							editor = editorSelect.val(active.text())
								.removeClass('error')
								.show()
								.offset(active.offset())
								.css(active.css(activeOptions.cloneProperties))
								.width(active.width())
								.height(active.outerHeight())
								.focus();
							bindEvents();
						}
					}
				} else {
					// Propogate click down to first child of td
					element.find('td:focus').children('input').click();
					// TODO: allow for different types of interactions
					// Like focus on a select component and refocus TD on blur...
				}
			},
			setActiveText = function () {
				var text = editor.val(),
					evt = $.Event('change'),
					originalContent;
				if (active.text() === text || editor.hasClass('error')) {
					return true;
				}
				originalContent = active.html();
				active.text(text).trigger(evt, text);
				if (evt.result === false) {
					active.html(originalContent);
				}
			},
			movement = function (element, keycode) {
				if (keycode === ARROW_RIGHT) {
					return element.next('td');
				} else if (keycode === ARROW_LEFT) {
					return element.prev('td');
				} else if (keycode === ARROW_UP) {
					return element.parent().prev().children().eq(element.index());
				} else if (keycode === ARROW_DOWN) {
					return element.parent().next().children().eq(element.index());
				}
				return [];
			};
		element.on('click keypress dblclick', showEditor)
		.css('cursor', 'pointer')
		.keydown(function (e) {
			var prevent = true,
				possibleMove = movement($(e.target), e.which);
			if (possibleMove.length > 0) {
				possibleMove.focus();
			} else if (e.which === ENTER) {
				showEditor(false);
			} else if (e.which === 17 || e.which === 91 || e.which === 93) {
				showEditor(true);
				prevent = false;
			} else {
				prevent = false;
			}
			if (prevent) {
				e.stopPropagation();
				e.preventDefault();
			}
		});

		element.find('td').prop('tabindex', 1);
		$(window).on('resize', function () {
			if (editor.is(':visible')) {
				editor.offset(active.offset())
				.width(active.width())
				.height(active.height());
			}
		});
	});

};
$.fn.editableTableWidget.defaultOptions = {
	cloneProperties: ['padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right',
					'text-align', 'font', 'font-size', 'font-family', 'font-weight',
					'border', 'border-top', 'border-bottom', 'border-left', 'border-right'],
	skipClass: '.noedit',
	editorText: $('<input>'),
	editorSelect: $('<select>')
};

