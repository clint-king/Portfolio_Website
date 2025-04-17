
document.addEventListener("DOMContentLoaded", () => {
 
document.querySelectorAll('a[data-rank]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault(); // prevent default link behavior

      const rank = link.dataset.rank;
    
      if (rank) {
        window.location.href = `./landing.html?rank=${rank}`;
      } else {
        console.warn("No URL found for rank:");
      }
    });
  });

});



///
