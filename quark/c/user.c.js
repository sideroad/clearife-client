(function( q ){
    var c = q.controller;
        
	c.define( "user", {
		load: function(arg){
			user.load( function( res ){
				
                if( res.id == "guest" ) {
                    res["ui-unauthorized"] = true;
                    res["ui-authorized"] = false;
                } else {
                    res["ui-unauthorized"] = false;
                    res["ui-authorized"] = true;
                }
				
				arg.render( res );
				c.call( "task.postit" );
			});
		},
        loginDialog: function(arg){
            arg.render();
        },
		login : function(arg){
			user.login( arg.data, function( res ){
				var uniq = res.uniq;
				if (uniq) {
					$.cookie("uniq", res.uniq);
					c.call( "user.closeLoginDialog" );
					c.call( "user.load" );
				}
			});
		},
        closeLoginDialog : function(){
        },
		logout : function(arg){
			$.cookie("uniq", null );
			c.call( "user.load" );
		},
        editDialog: function(arg){
            user.load(function( res ){
	            arg.render( res, function( elem ){
	                elem.find("#edit_user_time_adjust").val( res.time_adjust );
	                elem.find("#edit_user_style").val( res.style );
	            });
			});
        },
        edit : function( arg ){
            user.edit( arg.data, function(){
                c.call( "user.closeEditDialog" );
                c.call( "user.load" );
            } );
        },
        closeEditDialog : function(){
        },
        registerDialog: function(arg){
            c.call( "user.closeLoginDialog" );
            arg.render();
        },
        register : function( arg ){
            user.register( arg.data, function(){
                c.call( "user.closeRegisterDialog" );
                c.call( "user.load" );
            } );
        },
        closeRegisterDialog : function(){
        }
	});

})( quark );
