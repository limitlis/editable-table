/*global $, window*/
$.fn.editableTableWidget = function (options) {
	'use strict';
	return $(this).each(function () {
		function bindEvents(boundOptions) {
			editor.blur(function () {
					setActiveText();
					editor.hide();
				}).keydown(function (e) {
					var arrowKeys = (e.which === ARROW_LEFT || e.which === ARROW_RIGHT || e.which === ARROW_UP ||  e.which === ARROW_DOWN)
					if (e.which === ENTER) {
						setActiveText();
						editor.hide();
						active.focus();
						$('.panel-body').removeClass(activeOptions.scrollPreventor);
						e.preventDefault();
						e.stopPropagation();
					} else if (e.which === ESC) {
						editor.val(active.text());
						e.preventDefault();
						e.stopPropagation();
						editor.hide();
						$('.panel-body').removeClass(activeOptions.scrollPreventor);
						active.focus();
					} else if (e.which === TAB) {
						editor.hide();
						active.focus();
						active.removeClass('editing');
						var whichWay;
						if (e.shiftKey) {
							whichWay = ARROW_LEFT;
						} else {
							whichWay = ARROW_RIGHT;
						}
						var possibleTabMove = movement(active, whichWay);
						if (possibleTabMove.length > 0) {
							possibleTabMove.focus();
							e.preventDefault();
							e.stopPropagation();
						}
						$('.panel-body').removeClass(activeOptions.scrollPreventor);
						e.preventDefault();
						e.stopPropagation();
					} else if (arrowKeys) {
						if (this.selectionEnd - this.selectionStart === this.value.length) {
							var possibleMove = movement(active, e.which);
							if (possibleMove.length > 0) {
								active.removeClass('editing');
								possibleMove.focus();
								e.preventDefault();
								$('.panel-body').removeClass(activeOptions.scrollPreventor);
								e.stopPropagation();
							}
						}
					} else {
						// if we are doing 'keystroke prevention' rules for decimals (rather than validation on blur)
						if (active && active.attr('data-type') === 'number' && active.attr('data-prevent-keystrokes')) {
							switch(e.key) {
								case '0':
								case '1':
								case '2':
								case '3':
								case '4':
								case '5':
								case '6':
								case '7':
								case '8':
								case '9':
								case '0':
								case '.':
								case '-':
								case 'Backspace':
									// continue to allow the keystroke
									break;
								default:
									e.preventDefault();
									e.stopPropagation();
							}
							var currentValue = $(e.currentTarget).val();
							var prescision = active.attr('data-decimal-limit') ? parseInt(active.attr('data-decimal-limit')) : 0;
							if (prescision) {
								// if it has a decimal
								if (currentValue.indexOf('.') !== -1) {
									var remainder = currentValue.split('.')[1]; 
									// if they went beyond the step, remove the last digit (unless they are deleting themselves)
									if (remainder.length >= prescision && e.key !== 'Backspace') {
										$(e.currentTarget).val(currentValue.substring(0, currentValue.length - 1));
									}
								}
							}
							currentValue = undefined;
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
			ARROW_LEFT = 37,
			ARROW_UP = 38,
			ARROW_RIGHT = 39,
			ARROW_DOWN = 40,
			ENTER = 13,
			ESC = 27,
			TAB = 9,
			element = $(this),
			editor,
			editorText = activeOptions.editorText.css('position', 'absolute').hide().appendTo(element.parent()),
			editorSelect = activeOptions.editorSelect.css('position', 'absolute').hide().appendTo(element.parent()),
			active,
			showEditor = function (e) {
				// checked for a 'locked-row' class on the TR to block this row for editing, and an actionable pass class
				if (e && $(e.target).closest('.locked-row').length && !$(e.target).hasClass('actionable-when-locked')) {
					return;
				}
				var allowEditing = true;
				// check for disallowing editing
				if (element && $(element).data() && $(element).data().hasOwnProperty('allowEditing') && $(element).data().allowEditing === false) {
					allowEditing = false;
					active = [];
				} else {
					active = element.find('td:focus:not(' + activeOptions.skipClass + ')');
				}

				if (active.length) {
					active.addClass('editing');
					if (!active.data('type-options') && active.data('type') !== 'boolean') {
						// console.warn('HAX');
						// Remove the scrollPreventor class
						element.find('td:focus').parents('.panel-body').addClass(activeOptions.scrollPreventor);
						// pass along any rules about limitations while pressing keys
						var options = {
							type: active.data('type')
						};
						// remove placeholder values
						if (active.children('.placeholder-value').length) {
							active.children('.placeholder-value').remove();
						}
						//console.log('options', options);
						editor = editorText.val(active.text().trim() || active.find('.inner-value').text().trim())
							.removeClass('error')
							.show()
							.offset(active.offset())
							.css(active.css(activeOptions.cloneProperties))
							.width(active.width())
							.height(active.height())
							.focus();
						bindEvents(options);

					} else if (active.data('type-options') && active.data('type-options') !== '0,1') {
						// Do as a checkbox if enumoptions are 0/1
						editorSelect.children('option').remove();

						// Create options based on data-select-options
						var tempOptions = active.data('type-options').split(',');
						if (tempOptions.length) {
							for (var i = 0; i < tempOptions.length; i++) {
								var selected = false;
								if (active.text().trim() === tempOptions[i]) {
									selected = true;
								}
								editorSelect.append($('<option value="' + tempOptions[i] + '" ' + (selected ? 'selected' : '') + '>' + tempOptions[i] + '</option>'));
							}
							// remove placeholder values
							if (active.children('.placeholder-value').length) {
								active.children('.placeholder-value').remove();
							}
							editor = editorSelect.val(active.find('.inner-value').text().trim() || active.text().trim())
								.removeClass('error')
								.show()
								.offset(active.offset())
								.css(active.css(activeOptions.cloneProperties))
								.width(active.outerWidth())
								.height(active.outerHeight())
								.focus();
							bindEvents();
						}
					} else {
						if ((element.find('td:focus').data('type-options') && element.find('td:focus').data('type-options') === '0,1') || element.find('td:focus').data('type') === 'boolean') {

							var isChecked = element.find('td:focus').find('input[type="checkbox"]').prop('checked');
							element.find('td:focus').find('input[type="checkbox"]').prop('checked', !isChecked);
							element.find('td:focus').trigger('change', '' + (+!isChecked));
							active.removeClass('editing');
						}
					}
				} else {
					if (allowEditing) {
						// console.warn('HAX');
						element.find('td:focus').parents('.panel-body').addClass(activeOptions.scrollPreventor);

						// handle special cases that have the skipClass
						if (element.find('td:focus').hasClass('select2')) {
							$('.return-focus').removeClass('return-focus');
							var tempEl = element.find('td:focus');
							// Add class so that we can find element later
							tempEl.addClass('return-focus');
							$(':focus').blur();
							tempEl.click();
						} else if (element.find('td:focus').hasClass('col-associatedobservations') || element.find('td:focus').hasClass('col-associated')) {
							console.log('do associate stuff');
							// let editable table directive take over
							element.find('td:focus').trigger('change');
						}
					}
				}
			},
			setActiveText = function () {
				var text = editor.val(),
					evt = $.Event('change'),
					originalContent;
				active.removeClass('editing');
				if (active.text().trim() === text || editor.hasClass('error')) {
					return true;
				}
				originalContent = active.html();
				// store previous value so that it's accessible if needed
				active.data('previousValue', originalContent);
				active.text(text).trigger(evt, text);
				if (evt.result === 'willSave') {
					if (active.find('.inner-value').length) {
						active.find('.inner-value').html(text);
					} else {
						active.html(text);
					}
				}
			},
			movement = function (element, keycode) {
				if (keycode === ARROW_RIGHT) {
					return element.nextAll('td:not(.hidden)').first();
				} else if (keycode === ARROW_LEFT) {
					return element.prevAll('td:not(.hidden)').first();
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
					if ($(e.target).closest('.locked-row').length) {
						return;
					}
					showEditor();
				} else if (e.which === 17 || e.which === 91 || e.which === 93) {
					if ($(e.target).closest('.locked-row').length) {
						return;
					}
					showEditor();
					prevent = false;
				} else {
					prevent = false;
				}
				if (prevent) {
					e.stopPropagation();
					e.preventDefault();
				}
			});

		element.find('td:not(.space-holder)').prop('tabindex', 1);

		$(window).on('resize', function () {
			if (editor && editor.is(':visible')) {
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
		'border', 'border-top', 'border-bottom', 'border-left', 'border-right'
	],
	skipClass: '.noedit',
	scrollPreventor: 'hold-position',
	editorText: $('<input class="editableTableActiveInput">'),
	editorSelect: $('<select>')
};
