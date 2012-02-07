(function( q ){
    var m = q.model;

	m.define( "user", {
		load : {
			callback: function( res ){
                this.data( "mine", res );
		    }
		},
		register: {},
		find : {},
		login : {},
		update : {
	        href : "https://litemessage.herokuapp.com/user.update.json" // Server set a auth token.
		},
		edit : {},
		upload : {}
	});

})( quark );
