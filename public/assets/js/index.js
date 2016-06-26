$(document).on('ready', function() {
	if ($('#index').length) {
		$('#index input').focus();
	} else if ($('#private').length) {
		$('#private input').focus();
	}
});

// INDEX
$('#createProject').on('click', function(event) {
	event.preventDefault();
	$(this).attr('disabled', true);
	$(this).html('Wait a sec<img src="assets/emoji/openmouth.png">');
	$('#index input').attr('disabled', true);
	$('#joinProject').attr('disabled', true);
	location.href = "/new";
});
$('#index input').on('input', function() {
	var val = $(this).val();
	var regex = new RegExp(/([0-9]{3}-[0-9]{3}-[0-9]{3})/, 'g');
	var test = regex.test(val);
	if (val.length == 11 && test) {
		$('#joinProject').attr('disabled', false);
		$('#joinProject').html('Join a project<img src="assets/emoji/tongue.png">');
	} else {
		$('#joinProject').attr('disabled', true);
		$('#joinProject').removeClass('error');
		$('#joinProject').html('Join a project<img src="assets/emoji/smiling.png">');
	}
});
$('#joinProject').on('click', function(event) {
	event.preventDefault();
	var thisSelector = this;
	var projectExists = false;
	var projectId = $('#projectId').val();
	$.get( "exists/" + projectId, function( data ) {
		if(data.exists) {
			$(thisSelector).attr('disabled', true);
			$(thisSelector).removeClass('error');
			$(thisSelector).html('Wait a sec<img src="assets/emoji/openmouth.png">');
			$('#createProject').attr('disabled', true);
			$('#index input').attr('disabled', true);
			location.href = "/" + $('#projectId').val();
		} else {
			$(thisSelector).addClass('error');
			$(thisSelector).html('Wrong code<img src="assets/emoji/screaming.png">');
		}
		$('#index input').focus();
	});

});
$('#index small').on('click', function() {
	if ($(this).hasClass('url')) {
		$(this).removeClass('url');
		$(this).html('How do I find my project code?');
	} else {
		$(this).addClass('url');
		$(this).html('https://puhn.co/<strong>XXX-XXX-XXX</strong>/');
	}
});

// PRIVATE
$('#private input').on('input', function() {
	var val = $(this).val();
	if (val.length >= 1) {
		$('#joinPrivate').attr('disabled', false);
		$('#joinPrivate').html('Join project');
		$('#joinPrivate').removeClass('error');
	} else {
		$('#joinPrivate').attr('disabled', true);
		$('#joinPrivate').html('Join project');
		$('#joinPrivate').removeClass('error');
	}
});
$('#joinPrivate').on('click', function(event) {
	event.preventDefault();
	$('#private input').focus();
	var pwd = $('#private input').val();
	$.ajax({
	   url: "/check/" + room,
	   type: "post",
	   data: {room: room, pwd: pwd},
	   success: function (data) {
			 	if(data.valid){
					post('/' + room, {pwd: pwd});
				} else {
					$('#joinPrivate').addClass('error');
					$('#joinPrivate').html('Wrong password');
				}
	   }
	 });
});

// FULL
$('#tryAgain').on('click', function(event) {
	event.preventDefault();
	$(this).attr('disabled', true);
	$(this).html('Wait a sec');
	location.href = '';
});

// NOTHING
$('#goBack').on('click', function(event) {
	event.preventDefault();
	location.href = '/';
});

function post(path, params, method) {
    method = method || "post";

    var form = document.createElement("form");
    form.setAttribute("method", method);
    form.setAttribute("action", path);

    for(var key in params) {
        if(params.hasOwnProperty(key)) {
            var hiddenField = document.createElement("input");
            hiddenField.setAttribute("type", "hidden");
            hiddenField.setAttribute("name", key);
            hiddenField.setAttribute("value", params[key]);

            form.appendChild(hiddenField);
         }
    }

    document.body.appendChild(form);
    form.submit();
}
