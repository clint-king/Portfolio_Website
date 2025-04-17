
// *** Variables  ***
const heading = document.querySelector("#banner .major h1");
const description = document.querySelector("#one .inner p");
const stack = document.querySelector("#banner .major p");
const gallerySection = document.querySelector("#two");
const linkSection = document.getElementById("three");
const projectLink = document.getElementById("projectLink");

fetch('assets/js/data.json')
  .then(response => response.json())
  .then(data => {
    console.log(data); // now you can use your JSON data
    const rank = getQueryParam('rank');
if(rank){

    if(data.length > 0){
        data.forEach((block , index)=>{

            if(parseInt(rank , 10) === index+1){
                heading.textContent = block.title;
                stack.textContent = block.stack;
    
                //description
                description.textContent = block.description;
    
                //gallery
                if(block.gallery.length > 0){
                    block.gallery.forEach((galleryBlock)=>{
                        createGalleryItem(galleryBlock.imageSrc , galleryBlock.imageAlt , galleryBlock.description);
                    })
                }
    
                //create youtube link
                createYouTubeIframe(block.youtubeLink);

                //insert appropriate github link
                projectLink.href = block.githubLink;
            }

        });
    }
}else{
    console.log("rank variable is undefined , rank : " , rank);
}
  })
  .catch(error => console.error('Error loading JSON:', error));

// *** implementations  ***


// *** Functions ***
// Function to get the query parameter from the URL
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);  // Return the value of the query parameter
}

function createGalleryItem(imageSrc, imageAlt, description) {
    const galleryDiv = document.createElement('div');
    galleryDiv.className = 'gallery';
  
    const link = document.createElement('a');
    link.href = imageSrc;
    link.target = '_blank';
  
    const image = document.createElement('img');
    image.src = imageSrc;
    image.alt = imageAlt;
    image.width = 600;
    image.height = 400;
  
    const descDiv = document.createElement('div');
    descDiv.className = 'desc';
    descDiv.textContent = description;
  
    link.appendChild(image);
    galleryDiv.appendChild(link);
    galleryDiv.appendChild(descDiv);
  
    gallerySection.appendChild(galleryDiv);
  }


function createYouTubeIframe(videoSrc) {
    
    const iframe = document.createElement('iframe');
    iframe.width = '800';
    iframe.height = '400';
    iframe.src = videoSrc;
    iframe.title = 'YouTube video player';
    iframe.frameBorder = '0';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.allowFullscreen = true;
  
    linkSection.prepend(iframe);
  }