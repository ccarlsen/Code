$(document).on('ready', function() {
	if ($('#index').length) {
		$('#index input').focus();
	} else if ($('#private').length) {
		$('#private input').focus();
	} else if ($('#full').length) {

	}
});

// INDEX
$('#createProject').on('click', function(event) {
	event.preventDefault();
	$(this).attr('disabled', true);
	$(this).html('Wait a sec<img src="assets/emoji/openmouth.png">');
	$('#index input').attr('disabled', true);
	$('#joinProject').attr('disabled', true);
});
$('#index input').on('input', function() {
	var val = $(this).val();
	if(val.length == 5) {
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
	var projectExists = false;
	$('#index input').focus();
	if(projectExists) {
		$(this).attr('disabled', true);
		$(this).removeClass('error');
		$(this).html('Wait a sec<img src="assets/emoji/openmouth.png">');
		$('#createProject').attr('disabled', true);
		$('#index input').attr('disabled', true);
	} else {
		$(this).addClass('error');
		$(this).html('Wrong code<img src="assets/emoji/screaming.png">');
	}
});
$('#index small').on('click', function() {
	if ($(this).hasClass('url')) {
		$(this).removeClass('url');
		$(this).html('How do I find my project code?');
	} else {
		$(this).addClass('url');
		$(this).html('https://puhn.co/<strong>12345</strong>/');
	}
});


// PRIVATE
$('#private input').on('input', function() {
	var val = $(this).val();
	if(val.length >= 1) {
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
	var correctPassword = false;
	$('#private input').focus();
	if(correctPassword) {
		$(this).attr('disabled', true);
		$(this).removeClass('error');
		$(this).html('Wait a sec');
		$('#private input').attr('disabled', true);
	} else {
		$(this).addClass('error');
		$(this).html('Wrong password');
	}
});

// FULL
$('#tryAgain').on('click', function(event) {
	event.preventDefault();
	$(this).attr('disabled', true);
	$(this).html('Wait a sec');
});

// NOTHING
$('#goBack').on('click', function(event) {
	event.preventDefault();
});