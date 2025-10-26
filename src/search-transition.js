
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.querySelector('input[type="text"][placeholder*="Search"]');

  if (searchInput) {
    searchInput.addEventListener('click', (e) => {
      window.location.href = `/search`;
    });
  }
});
