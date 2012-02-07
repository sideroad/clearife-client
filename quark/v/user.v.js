(function( q ){
    var v = q.view;
        
	v.config( "user", {
		
		loginDialog : {
            button : true,
            dialog : {
                singleton : true,
                width : 500,
                close : "user.closeLoginDialog"
            },
            validate : {
                userId : /^[a-zA-Z0-9_\.]{4,32}$/,
                password : /^.{6,32}$/
            }
			
		},
        
        editDialog : {
            button : true,
            file : true,
            dialog : {
                singleton : true,
                width : 500,
                close : "user.closeEditDialog"
            },
            validate : {
                userId : /^[a-zA-Z0-9_\.]{4,32}$/,
                password : /^.{6,32}$/,
                name : /^.{4,32}$/
            }
        },
        
        registerDialog : {
            button : true,
            file : true,
            dialog : {
                singleton : true,
                width : 500,
                close : "user.closeRegisterDialog"
            },
            validate : {
                userId : /^[a-zA-Z0-9_\.]{4,32}$/,
                password : /^.{6,32}$/,
                name : /^.{4,32}$/
            }
        }
	    
	});

})( quark );
