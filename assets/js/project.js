(function () {
	var titleEl = document.getElementById("project-title");
	var stackEl = document.getElementById("project-stack");
	var descriptionEl = document.getElementById("project-description");
	var githubLinks = [
		document.getElementById("project-github"),
		document.getElementById("project-repo")
	];
	var videosEl = document.getElementById("project-videos");
	var galleryEl = document.getElementById("project-gallery");
	var statusEl = document.getElementById("project-status");
	var contentEl = document.getElementById("project-content");
	var videosSection = document.getElementById("videos-section");
	var gallerySection = document.getElementById("gallery-section");
	var lightbox = document.getElementById("lightbox");
	var lightboxImg = document.getElementById("lightbox-img");
	var lightboxCaption = document.getElementById("lightbox-caption");

	function rankFromUrl() {
		var value = new URLSearchParams(window.location.search).get("rank");
		var rank = Number.parseInt(value, 10);
		return Number.isFinite(rank) && rank > 0 ? rank : 0;
	}

	function safeHttpUrl(url) {
		try {
			var parsed = new URL(url, window.location.href);
			if (parsed.protocol === "https:" || parsed.protocol === "http:") return parsed.href;
		} catch (error) {
			return "";
		}
		return "";
	}

	function safeImagePath(path) {
		if (typeof path !== "string") return "";
		var clean = path.trim();
		if (clean.indexOf("./images/") === 0 || clean.indexOf("images/") === 0) return clean;
		return "";
	}

	function videoId(url) {
		var value = String(url);
		var match = value.match(/\/embed\/([^?&#/]+)/) || value.match(/[?&]v=([^?&#/]+)/) || value.match(/youtu\.be\/([^?&#/]+)/);
		return match ? match[1] : "";
	}

	function showMissing(message) {
		contentEl.hidden = true;
		videosSection.hidden = true;
		gallerySection.hidden = true;
		statusEl.hidden = false;
		statusEl.textContent = message;
		document.title = "Project not found — Clietin Bambisa";
	}

	function fillStack(stack) {
		stackEl.replaceChildren();
		String(stack || "").split(",").forEach(function (part) {
			var label = part.trim();
			if (!label) return;
			var item = document.createElement("li");
			item.textContent = label;
			stackEl.appendChild(item);
		});
	}

	function fillVideos(links, title) {
		videosEl.replaceChildren();
		(Array.isArray(links) ? links : []).forEach(function (link) {
			var id = videoId(link);
			if (!id) return;

			var button = document.createElement("button");
			button.type = "button";
			button.className = "video-card";

			var img = document.createElement("img");
			img.src = "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg";
			img.alt = "";
			img.loading = "lazy";
			img.decoding = "async";
			img.width = 480;
			img.height = 270;

			var label = document.createElement("span");
			label.className = "play-label";
			label.textContent = "Play demo";

			button.append(img, label);
			button.setAttribute("aria-label", "Play demo video for " + title);
			button.addEventListener("click", function () {
				var frame = document.createElement("iframe");
				frame.className = "video-frame";
				frame.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1";
				frame.title = title + " demo";
				frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
				frame.allowFullscreen = true;
				frame.referrerPolicy = "strict-origin-when-cross-origin";
				button.replaceWith(frame);
			});
			videosEl.appendChild(button);
		});
		videosSection.hidden = videosEl.childElementCount === 0;
	}

	function fillGallery(items) {
		galleryEl.replaceChildren();
		(Array.isArray(items) ? items : []).forEach(function (item) {
			var src = safeImagePath(item.imageSrc);
			if (!src) return;

			var button = document.createElement("button");
			button.type = "button";
			button.className = "shot";

			var img = document.createElement("img");
			img.src = src;
			img.alt = item.imageAlt || item.description || "Project screenshot";
			img.loading = "lazy";
			img.decoding = "async";

			var caption = document.createElement("span");
			caption.textContent = item.description || "Open screenshot";

			button.append(img, caption);
			button.addEventListener("click", function () {
				lightboxImg.src = src;
				lightboxImg.alt = img.alt;
				lightboxCaption.textContent = caption.textContent;
				lightbox.showModal();
			});
			galleryEl.appendChild(button);
		});
		gallerySection.hidden = galleryEl.childElementCount === 0;
	}

	function closeLightbox() {
		if (lightbox.open) lightbox.close();
		lightboxImg.removeAttribute("src");
	}

	document.getElementById("lightbox-close").addEventListener("click", closeLightbox);
	lightbox.addEventListener("click", function (event) {
		if (event.target === lightbox) closeLightbox();
	});
	lightbox.addEventListener("close", function () {
		lightboxImg.removeAttribute("src");
	});

	var projectsReady = Array.isArray(window.PROJECTS)
		? Promise.resolve(window.PROJECTS)
		: fetch("assets/js/data.json").then(function (response) {
			if (!response.ok) throw new Error("Could not load projects");
			return response.json();
		});

	projectsReady.then(function (data) {
			var project = data[rankFromUrl() - 1];
			if (!project) {
				showMissing("That project could not be found.");
				return;
			}

			document.title = project.title + " — Clietin Bambisa";
			titleEl.textContent = project.title;
			descriptionEl.textContent = project.description || "";
			fillStack(project.stack);

			var repo = safeHttpUrl(project.githubLink);
			if (repo) {
				githubLinks.forEach(function (link) {
					if (!link) return;
					link.href = repo;
					link.hidden = false;
				});
			}

			fillVideos(project.youtubeLink, project.title);
			fillGallery(project.gallery);
			contentEl.hidden = false;
			statusEl.hidden = true;
		})
		.catch(function () {
			showMissing("The project details could not be loaded. Use Back to return to the portfolio.");
		});
})();
