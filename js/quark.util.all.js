/*!
 * jQuery.upload v1.0.2
 *
 * Copyright (c) 2010 lagos
 * Dual licensed under the MIT and GPL licenses.
 *
 * http://lagoscript.org
 */
(function($) {

	var uuid = 0;

	$.fn.upload = function(url, data, callback, type) {
		var self = this, inputs, checkbox, checked,
			iframeName = 'jquery_upload' + ++uuid,
			iframe = $('<iframe name="' + iframeName + '" style="position:absolute;top:-9999px" />').appendTo('body'),
			form = '<form target="' + iframeName + '" method="post" enctype="multipart/form-data" />';

		if ($.isFunction(data)) {
			type = callback;
			callback = data;
			data = {};
		}

		checkbox = $('input:checkbox', this);
		checked = $('input:checked', this);
		form = self.wrapAll(form).parent('form').attr('action', url);

		// Make sure radios and checkboxes keep original values
		// (IE resets checkd attributes when appending)
		checkbox.removeAttr('checked');
		checked.attr('checked', true);

		inputs = createInputs(data);
		inputs = inputs ? $(inputs).appendTo(form) : null;

		form.submit(function() {
			iframe.load(function() {
				var data = handleData(this, type),
					checked = $('input:checked', self);

				form.after(self).remove();
				checkbox.removeAttr('checked');
				checked.attr('checked', true);
				if (inputs) {
					inputs.remove();
				}

				setTimeout(function() {
					iframe.remove();
					if (type === 'script') {
						$.globalEval(data);
					}
					if (callback) {
						callback.call(self, data);
					}
				}, 0);
			});
		}).submit();

		return this;
	};

	function createInputs(data) {
		return $.map(param(data), function(param) {
			return '<input type="hidden" name="' + param.name + '" value="' + param.value + '"/>';
		}).join('');
	}

	function param(data) {
		if ($.isArray(data)) {
			return data;
		}
		var params = [];

		function add(name, value) {
			params.push({name:name, value:value});
		}

		if (typeof data === 'object') {
			$.each(data, function(name) {
				if ($.isArray(this)) {
					$.each(this, function() {
						add(name, this);
					});
				} else {
					add(name, $.isFunction(this) ? this() : this);
				}
			});
		} else if (typeof data === 'string') {
			$.each(data.split('&'), function() {
				var param = $.map(this.split('='), function(v) {
					return decodeURIComponent(v.replace(/\+/g, ' '));
				});

				add(param[0], param[1]);
			});
		}

		return params;
	}

	function handleData(iframe, type) {
		var data, contents = $(iframe).contents().get(0);

		if ($.isXMLDoc(contents) || contents.XMLDocument) {
			return contents.XMLDocument || contents;
		}
		data = $(contents).find('body').text();

		switch (type) {
			case 'xml':
				data = parseXml(data);
				break;
			case 'json':
				data = window.eval('(' + data + ')');
				break;
		}
		return data;
	}

	function parseXml(text) {
		if (window.DOMParser) {
			return new DOMParser().parseFromString(text, 'application/xml');
		} else {
			var xml = new ActiveXObject('Microsoft.XMLDOM');
			xml.async = false;
			xml.loadXML(text);
			return xml;
		}
	}

})(jQuery);
/*!
 * jquery.simple.validate v1.1.1
 * http://sideroad.secret.jp/
 *
 * Simple Validation
 * 
 * Copyright (c) 2011 sideroad
 *
 * Dual licensed under the MIT or GPL licenses.
 * Date: 2011-08-20
 * 
 * @author sideroad
 * @requires jQuery
 * 
 */
(function( $ ){    
    
    $.fn.validate = function( setting ){
        var isValid = true;
        
        this.each(function(){
            var elem = $( this ),
                id = elem.attr( "id" ),
                val = elem.val(),
                elemValid = true,
                option = setting || elem.data("validate"),
                messageElem;
            
            if( !option ){
                return true;
            }
            
            // Match
            if( option.pattern && 
                    !option.pattern.test( val ) ){
                elemValid = false;
            }
            
            // Valid 
            messageElem = ( option.messageElem ) ? option.messageElem : $( "#" + id + "-validate" );
            if( elemValid ) {
                messageElem.css( "display", "none" );
                elem.removeClass( "invalid" );
            } else {
                messageElem.css( "display", "block" );
                elem.addClass( "invalid" );
                isValid = false;
            }
        });
        
        return isValid;
    };
    
})( jQuery );
/*!
 * Quark Util Core v1.0.1
 * http://sideroad.secret.jp/quark/
 *
 * Copyright 2011, sideroad
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 */
(function( $, q ){
    var qut = {};
	
    q.util = {
        
        list: [],
            
        // attach util
        attach : function( root, setting ){
            var list = qut.list,
                length = list.length,
                i,
                options,
                name;
            
            for( i = 0; i < length; i++ ){
                name = qut.list[ i ];
                options = setting[ name ];
                if( options ) qut[ name ]( root, options );
            }
        }
    };
	
	qut = q.util;
        
})( jQuery, quark );
/*!
 * Quark Util File v1.0.1
 * http://sideroad.secret.jp/quark/
 *
 * Copyright 2011, sideroad
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Depends
 *   jquery.upload.js
 */
(function( $, q ){
    var qut = q.util,
        that = this;

    // File upload
    // TODO override quark.core ajax process.
    // current  fileupload => execute => ajax => callback => rendered
    // future execute => fileupload => callback => rendered
    qut.list.push( "file" );
    qut.file = function( root ){
            var part = that.hadron,
                selector = '[data-quark-event^="file"]',
                target = root.find( selector ) || [];
            
            
            if( root.is( selector ) ){
                target.push( root );
            }
            
            target.each(function(){
                var elem = $( this ),
                    data = elem.data( "quarkEvent" ).replace(/\s/, "").match( /^file-([^\.]+)\.([^\?]+)(\?.+|)$/ ),
                    name = data[ 1 ],
                    method = data[ 2 ],
                    query = data[ 3 ],
                    callName = name+"."+method,
                    url = part.url.replace( "${quark}", name ).replace( "${method}", method );
                
                file = $('<input type="file" name="file" style="position:absolute;visibility:hidden;" >').change(function(){
                    $(this).upload( url + query, function(res) {
                        console.log( "file uploaded" );
                        q.controller.call( callName, res );
                    }, 'json');
                });
                elem.after( file );
                elem.click(function(){
                    file.click();
                });
                
            });
             
    };
    

        
})( jQuery, quark );
/*!
 * Quark Util Validate v1.0.1
 * http://sideroad.secret.jp/quark/
 *
 * Copyright 2011, sideroad
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Depends
 *   jquery.simple.validate.js
 */
(function( $, q ){
    var qut = q.util;
    
    qut.list.push( "validate" );
    qut.validate = function( root, options ){
            var id = "",
                option,
                elem;
            
            
            for( id in options ){
                option = $.extend( true, {}, {
                    pattern : options[ id ]
                } );
                elem = root.find( "#" + id + "-validate" );
                option.messageElem = elem;
                
                // Item
                root.find( "#" + id )
                    .data( "validate", option )
                    .bind( "focus keyup", function(){
                        $(this).validate();
                    });
                
                // Message
                if( !elem.hasClass("invalid-message") ) {
                    elem
                        .css( "display", "none" )
                        .addClass("invalid-message ui-state-error ui-corner-all")
                        .children()
                        .prepend('<span class="ui-icon ui-icon-alert" style="float: left; margin-right: .3em;"></span>');
                }
                
            }
    };
    

        
})( jQuery, quark );
