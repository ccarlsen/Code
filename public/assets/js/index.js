$(document).on('ready', function() {
	$('#index input').focus();
});

$('#createProject').on('click', function(event) {
	event.preventDefault();
	$(this).attr('disabled', true);
	$(this).html('Wait a sec<img src="assets/emoji/openmouth.png">');
});

$('#index input').on('input', function() {
	var val = $(this).val();
	if(val.length == 4) {
		$('#joinProject').attr('disabled', false);
		$('#joinProject').html('Join a project<img src="assets/emoji/tongue.png">');
	} else {
		$('#joinProject').attr('disabled', true);
		$('#joinProject').removeClass('invalid');
		$('#joinProject').html('Join a project<img src="assets/emoji/smiling.png">');
	}
});

$('#joinProject').on('click', function(event) {
	event.preventDefault();
	var projectExists = false;
	$('#index input').focus();
	if(projectExists) {
		$('#joinProject').attr('disabled', true);
		$(this).removeClass('invalid');
		$(this).html('Wait a sec<img src="assets/emoji/openmouth.png">');
	} else {
		$(this).addClass('invalid');
		$(this).html('Invalid code<img src="assets/emoji/screaming.png">');
	}
});