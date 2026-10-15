(function () {
	var form = document.getElementById("contact-form");
	if (!form) return;

	var status = document.getElementById("form-status");

	form.addEventListener("submit", function (event) {
		event.preventDefault();
		if (!form.reportValidity()) return;

		var name = form.name.value.trim();
		var email = form.email.value.trim();
		var message = form.message.value.trim();
		var subject = "Portfolio message from " + name;
		var body = message + "\n\nFrom: " + name + " <" + email + ">";

		status.textContent = "Your email app should open with this message ready to send.";
		window.location.href = "mailto:clietinpro07@gmail.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
	});

	form.addEventListener("reset", function () {
		status.textContent = "";
	});
})();
