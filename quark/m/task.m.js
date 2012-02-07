(function( q ){
    var m = q.model;

	m.define( "task", {
		load : {
			callback : function( res ){
				var data = this.data( "task" ) || {};
				$.extend(true, data, res.data );
				this.data( "task", data );
				return res.data;
			}
		}
	});

})( quark );
